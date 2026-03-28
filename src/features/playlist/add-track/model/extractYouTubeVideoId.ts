function parseUrl(input: string) {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return null;
  }

  try {
    return new URL(trimmedInput);
  } catch {
    try {
      return new URL(`https://${trimmedInput}`);
    } catch {
      return null;
    }
  }
}

export function extractYouTubeVideoId(input: string): string | null {
  const parsedUrl = parseUrl(input);
  if (!parsedUrl) {
    return null;
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, "");

  if (hostname === "youtube.com" && parsedUrl.pathname === "/watch") {
    const videoId = parsedUrl.searchParams.get("v")?.trim();
    return videoId || null;
  }

  if (hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0]?.trim();
    return videoId || null;
  }

  return null;
}
