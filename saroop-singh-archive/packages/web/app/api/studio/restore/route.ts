import { getDb } from "@/db";
import { restorationRuns } from "@/db/schema";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { base64ToBytes, bucket, buildRestorationPrompt, bytesToBase64, detectSafeRaster, getImage, MODEL_REGISTRY, RESTORATION_PROMPT_VERSION, RESTORATION_RECIPES, sha256Hex, validateRestorationAspectRatio, type RestorationModel } from "@/lib/archive-server";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

type Recipe = keyof typeof RESTORATION_RECIPES;

const OPENAI_IMAGE_TIMEOUT_MS = 150_000;
const GEMINI_IMAGE_TIMEOUT_MS = 110_000;

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const body = await request.json() as { imageId?: string; model?: string; recipe?: Recipe; notes?: string };
  const image = body.imageId ? await getImage(body.imageId) : null;
  if (!image) return Response.json({ error: "Photograph not found." }, { status: 404 });
  if (
    image.createdBy === "public-family-contribution" &&
    (image.status === "submitted" || image.status === "rejected")
  ) {
    return Response.json(
      { error: "Accept this family contribution into private review before sending a working copy to an AI provider." },
      { status: 409 },
    );
  }
  const consentRecordedAt = Date.parse(image.aiProcessingConsentRecordedAt || "");
  if (
    image.createdBy === "public-family-contribution" &&
    (image.aiProcessingConsent !== "granted" || !image.aiProcessingConsentWordingVersion || !Number.isFinite(consentRecordedAt))
  ) {
    return Response.json(
      { error: "AI processing consent has not been affirmatively recorded for this family contribution. The original remains preserved and private." },
      { status: 409 },
    );
  }
  const recipe: Recipe = typeof body.recipe === "string" && Object.hasOwn(RESTORATION_RECIPES, body.recipe) ? body.recipe : "conservative";
  const model = typeof body.model === "string" ? body.model : "gpt-image-2";
  if (!Object.hasOwn(MODEL_REGISTRY, model)) return Response.json({ error: "Unsupported restoration model." }, { status: 400 });
  const modelConfig = MODEL_REGISTRY[model as RestorationModel];
  const provider = modelConfig.provider;
  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: `${provider === "openai" ? "OpenAI" : "Google Gemini"} is ready but needs its API key configured in the site.` }, { status: 503 });
  const id = crypto.randomUUID();
  const prompt = buildRestorationPrompt(recipe, typeof body.notes === "string" ? body.notes : "", modelConfig.apiModel);
  const interventionClass = recipe === "colourResearch" ? "interpretive-colourisation" : recipe === "structural" ? "interpretive-repair" : "conservation";
  await getDb().insert(restorationRuns).values({ id, imageId: image.id, provider, model: modelConfig.apiModel, recipe, prompt, interventionClass, promptVersion: RESTORATION_PROMPT_VERSION, createdBy: user.email });
  try {
    const source = await bucket().get(image.originalKey);
    if (!source) throw new Error("Original file is missing from storage.");
    const sourceBytes = new Uint8Array(await source.arrayBuffer());
    if (sourceBytes.byteLength > modelConfig.maxInputBytes) throw new Error("This source is too large for restoration. Preserve it as the original and create a smaller display scan first.");
    let output: Uint8Array;
    let outputType = "image/png";
    if (provider === "openai") {
      const form = new FormData();
      form.set("model", modelConfig.apiModel);
      form.set("prompt", prompt);
      form.set("quality", "high");
      form.set("size", "auto");
      form.set("background", "opaque");
      form.set("output_format", "png");
      form.set("n", "1");
      form.append("image[]", new File([sourceBytes], image.originalName, { type: image.originalType }));
      const response = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(OPENAI_IMAGE_TIMEOUT_MS) });
      const result = await response.json() as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
      if (!response.ok || !result.data?.[0]?.b64_json) throw new Error(result.error?.message || "OpenAI did not return an image.");
      output = base64ToBytes(result.data[0].b64_json);
    } else {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", { method: "POST", headers: { "x-goog-api-key": key, "content-type": "application/json" }, body: JSON.stringify({ model: modelConfig.apiModel, store: false, input: [{ type: "text", text: prompt }, { type: "image", data: bytesToBase64(sourceBytes), mime_type: image.originalType }], response_format: { type: "image", mime_type: "image/jpeg", image_size: "2K" } }), signal: AbortSignal.timeout(GEMINI_IMAGE_TIMEOUT_MS) });
      const result = await response.json() as { steps?: Array<{ content?: Array<{ type?: string; data?: string; mime_type?: string }> }>; error?: { message?: string } };
      const block = result.steps?.flatMap(step => step.content || []).find(item => item.type === "image" && item.data);
      if (!response.ok || !block?.data) throw new Error(result.error?.message || "Gemini did not return an image.");
      output = base64ToBytes(block.data);
      outputType = block.mime_type || outputType;
    }
    const detectedOutput = detectSafeRaster(output);
    if (!detectedOutput) throw new Error("The provider returned an invalid or unsupported image file.");
    const geometry = validateRestorationAspectRatio(sourceBytes, output);
    outputType = detectedOutput.type;
    const outputSha256 = await sha256Hex(output);
    const outputKey = `restorations/${image.id}/${id}.${detectedOutput.extension}`;
    await bucket().put(outputKey, output, { httpMetadata: { contentType: outputType }, customMetadata: { provider, model: modelConfig.apiModel, recipe, runId: id, sha256: outputSha256, sourceDimensions: `${geometry.source.width}x${geometry.source.height}`, outputDimensions: `${geometry.output.width}x${geometry.output.height}`, aspectRatioDrift: geometry.drift.toFixed(6) } });
    await getDb().update(restorationRuns).set({ status: "ready", outputKey, outputType, outputSha256 }).where((await import("drizzle-orm")).eq(restorationRuns.id, id));
    return Response.json({ id, outputUrl: `/api/media/${encodeURIComponent(outputKey)}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restoration failed.";
    await getDb().update(restorationRuns).set({ status: "failed", error: message }).where((await import("drizzle-orm")).eq(restorationRuns.id, id));
    return Response.json({ error: message }, { status: 502 });
  }
}
