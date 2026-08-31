import { createHash } from "node:crypto";

export type ValidatedImageUrl = { originalUrl: string; normalizedUrl: string; fingerprint: string };

export function parseImageUrl(input: string): ValidatedImageUrl {
  const originalUrl = input.trim();
  let url: URL;
  try { url = new URL(originalUrl); } catch { throw new Error("A valid HTTP image URL is required."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only HTTP(S) image URLs are supported.");
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
  const normalizedUrl = url.toString();
  return { originalUrl, normalizedUrl, fingerprint: createHash("sha256").update(normalizedUrl).digest("hex") };
}
