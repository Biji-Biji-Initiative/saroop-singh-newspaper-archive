import { requireArchiveAdmin } from "@/lib/archive-auth";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";
import {
  createRestorationDerivative,
  RestorationRequestError,
  validRestorationModel,
  validRestorationRecipe,
} from "@/lib/restoration-service";

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const body = await request.json() as { imageId?: string; model?: unknown; recipe?: unknown; notes?: unknown };
  const requestedModel = typeof body.model === "string" ? body.model : "gpt-image-2";
  if (!body.imageId || !validRestorationModel(requestedModel)) {
    return Response.json({ error: "Unsupported restoration model." }, { status: 400 });
  }
  const model = requestedModel;
  const recipe = validRestorationRecipe(body.recipe) ? body.recipe : "conservative";
  try {
    const result = await createRestorationDerivative({
      imageId: body.imageId,
      model,
      recipe,
      notes: typeof body.notes === "string" ? body.notes : "",
      createdBy: user.email,
    });
    return Response.json({ id: result.id, outputUrl: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restoration failed.";
    return Response.json({ error: message }, { status: error instanceof RestorationRequestError ? error.status : 502 });
  }
}
