import { localStorage } from "@/server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ico: "image/x-icon",
  jpg: "image/jpeg",
  mp4: "video/mp4",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const file = await localStorage.read(path);
    const extension = path.at(-1)?.split(".").at(-1)?.toLowerCase() ?? "";

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Media not found." }, { status: 404 });
  }
}
