// URL validation for external fetches - prevents SSRF attacks

const ALLOWED_HOSTS = [
  "transistor.fm",
  "share.transistor.fm",
  "feeds.transistor.fm",
];

/**
 * Validates that a URL is from an allowed Transistor domain.
 * Throws an error if the URL is not allowed.
 */
export function validateTransistorUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  // Block non-HTTPS (except for local development)
  if (parsed.protocol !== "https:") {
    throw new Error(`URL must use HTTPS: ${url}`);
  }

  // Check against allowlist
  const isAllowed = ALLOWED_HOSTS.some(
    (host) =>
      parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );

  if (!isAllowed) {
    throw new Error(
      `URL must be from transistor.fm, got: ${parsed.hostname}`
    );
  }
}
