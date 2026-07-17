import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { restorationRuns } from "@/db/schema";
import {
  base64ToBytes,
  bucket,
  buildRestorationPrompt,
  bytesToBase64,
  detectSafeRaster,
  getImage,
  MODEL_REGISTRY,
  RESTORATION_PROMPT_VERSION,
  RESTORATION_RECIPES,
  sha256Hex,
  validateRestorationAspectRatio,
  type RestorationModel,
} from "@/lib/archive-server";

const OPENAI_IMAGE_TIMEOUT_MS = 150_000;
const GEMINI_IMAGE_TIMEOUT_MS = 110_000;

export type RestorationRecipe = keyof typeof RESTORATION_RECIPES;

export class RestorationRequestError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 503) {
    super(message);
  }
}

export function validRestorationRecipe(value: unknown): value is RestorationRecipe {
  return typeof value === "string" && Object.hasOwn(RESTORATION_RECIPES, value);
}

export function validRestorationModel(value: unknown): value is RestorationModel {
  return typeof value === "string" && Object.hasOwn(MODEL_REGISTRY, value);
}

function imageEligibilityError(image: NonNullable<Awaited<ReturnType<typeof getImage>>>): string | null {
  if (
    image.createdBy === "public-family-contribution" &&
    (image.status === "submitted" || image.status === "rejected")
  ) {
    return "Accept this family contribution into private review before sending a working copy to an AI provider.";
  }
  const consentRecordedAt = Date.parse(image.aiProcessingConsentRecordedAt || "");
  if (
    image.createdBy === "public-family-contribution" &&
    (image.aiProcessingConsent !== "granted" ||
      !image.aiProcessingConsentWordingVersion ||
      !Number.isFinite(consentRecordedAt))
  ) {
    return "AI processing consent has not been affirmatively recorded for this family contribution. The original remains preserved and private.";
  }
  return null;
}

export async function createRestorationDerivative({
  imageId,
  model,
  recipe,
  notes,
  createdBy,
  familyWorkspaceHash,
}: {
  imageId: string;
  model: RestorationModel;
  recipe: RestorationRecipe;
  notes?: string;
  createdBy: string;
  familyWorkspaceHash?: string;
}) {
  const image = await getImage(imageId);
  if (!image) throw new RestorationRequestError("Photograph not found.", 404);
  const eligibilityError = imageEligibilityError(image);
  if (eligibilityError) throw new RestorationRequestError(eligibilityError, 409);

  const modelConfig = MODEL_REGISTRY[model];
  const apiKey = modelConfig.provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new RestorationRequestError(
      `${modelConfig.provider === "openai" ? "OpenAI" : "Google Gemini"} is ready but needs its API key configured in the site.`,
      503,
    );
  }

  const id = crypto.randomUUID();
  const prompt = buildRestorationPrompt(recipe, notes || "", modelConfig.apiModel);
  const interventionClass = recipe === "colourResearch"
    ? "interpretive-colourisation"
    : recipe === "structural"
      ? "interpretive-repair"
      : "conservation";
  await getDb().insert(restorationRuns).values({
    id,
    imageId: image.id,
    provider: modelConfig.provider,
    model: modelConfig.apiModel,
    recipe,
    prompt,
    interventionClass,
    promptVersion: RESTORATION_PROMPT_VERSION,
    createdBy,
    familyWorkspaceHash,
  });

  try {
    const source = await bucket().get(image.originalKey);
    if (!source) throw new Error("Original file is missing from storage.");
    const sourceBytes = new Uint8Array(await source.arrayBuffer());
    if (sourceBytes.byteLength > modelConfig.maxInputBytes) {
      throw new Error("This source is too large for restoration. Preserve it as the original and create a smaller display scan first.");
    }

    let output: Uint8Array;
    let outputType = "image/png";
    if (modelConfig.provider === "openai") {
      const form = new FormData();
      form.set("model", modelConfig.apiModel);
      form.set("prompt", prompt);
      form.set("quality", "high");
      form.set("size", "auto");
      form.set("background", "opaque");
      form.set("output_format", "png");
      form.set("n", "1");
      form.append("image[]", new File([sourceBytes], image.originalName, { type: image.originalType }));
      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(OPENAI_IMAGE_TIMEOUT_MS),
      });
      const result = await response.json() as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
      if (!response.ok || !result.data?.[0]?.b64_json) throw new Error(result.error?.message || "OpenAI did not return an image.");
      output = base64ToBytes(result.data[0].b64_json);
    } else {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          model: modelConfig.apiModel,
          store: false,
          input: [
            { type: "text", text: prompt },
            { type: "image", data: bytesToBase64(sourceBytes), mime_type: image.originalType },
          ],
          response_format: { type: "image", mime_type: "image/jpeg", image_size: "2K" },
        }),
        signal: AbortSignal.timeout(GEMINI_IMAGE_TIMEOUT_MS),
      });
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
    await bucket().put(outputKey, output, {
      httpMetadata: { contentType: outputType },
      customMetadata: {
        provider: modelConfig.provider,
        model: modelConfig.apiModel,
        recipe,
        runId: id,
        sha256: outputSha256,
        sourceDimensions: `${geometry.source.width}x${geometry.source.height}`,
        outputDimensions: `${geometry.output.width}x${geometry.output.height}`,
        aspectRatioDrift: geometry.drift.toFixed(6),
      },
    });
    await getDb().update(restorationRuns).set({ status: "ready", outputKey, outputType, outputSha256 }).where(eq(restorationRuns.id, id));
    return {
      id,
      imageId: image.id,
      url: `/api/media/${encodeURIComponent(outputKey)}`,
      type: recipe,
      provider: modelConfig.provider,
      model: modelConfig.apiModel,
      recipe,
      prompt,
      promptVersion: RESTORATION_PROMPT_VERSION,
      interventionClass,
      outputSha256,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restoration failed.";
    await getDb().update(restorationRuns).set({ status: "failed", error: message }).where(eq(restorationRuns.id, id));
    throw error;
  }
}
