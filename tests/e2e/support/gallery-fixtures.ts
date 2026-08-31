import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type E2eSettings = {
  appUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  ownerId: string;
  storageState: string;
};

type SeedImage = { originalUrl: string; note?: string; loadStatus?: "unknown" | "available" | "broken" };

export type SeededImage = { id: string; originalUrl: string };
export type SeededFolder = { id: string; name: string };
export type SeededTag = { id: string; name: string };

function requiredEnvironment(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function isLocalSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  } catch {
    return false;
  }
}

export function getE2eSettings(): E2eSettings | null {
  const appUrl = requiredEnvironment("E2E_APP_URL");
  const supabaseUrl = requiredEnvironment("E2E_SUPABASE_URL");
  const serviceRoleKey = requiredEnvironment("E2E_SUPABASE_SERVICE_ROLE_KEY");
  const ownerId = requiredEnvironment("E2E_OWNER_ID");
  const storageState = requiredEnvironment("E2E_STORAGE_STATE");
  const allowDataReset = process.env.E2E_ALLOW_DATA_RESET === "true";
  return appUrl && supabaseUrl && serviceRoleKey && ownerId && storageState && allowDataReset && isLocalSupabaseUrl(supabaseUrl)
    ? { appUrl, supabaseUrl, serviceRoleKey, ownerId, storageState }
    : null;
}

function settingsOrThrow(): E2eSettings {
  const settings = getE2eSettings();
  if (!settings) throw new Error("E2E gallery environment is not configured.");
  return settings;
}

function adminClient(): SupabaseClient {
  const settings = settingsOrThrow();
  return createClient(settings.supabaseUrl, settings.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function fingerprint(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

async function throwIfError(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

export function galleryUrl(path = "/gallery"): string {
  return new URL(path, settingsOrThrow().appUrl).toString();
}

export async function resetOwnerGallery(): Promise<void> {
  const { ownerId } = settingsOrThrow();
  const admin = adminClient();
  await throwIfError(await admin.from("images").delete().eq("owner_id", ownerId));
  await throwIfError(await admin.from("folders").delete().eq("owner_id", ownerId));
  await throwIfError(await admin.from("tags").delete().eq("owner_id", ownerId));
}

export async function seedImages(images: SeedImage[]): Promise<SeededImage[]> {
  const { ownerId } = settingsOrThrow();
  const result = await adminClient()
    .from("images")
    .insert(images.map((image) => ({
      owner_id: ownerId,
      original_url: image.originalUrl,
      url_fingerprint: fingerprint(image.originalUrl),
      note: image.note ?? "",
      load_status: image.loadStatus ?? "unknown",
    })))
    .select("id, original_url");
  await throwIfError(result);
  return (result.data ?? []).map((image) => ({ id: image.id as string, originalUrl: image.original_url as string }));
}

export async function seedFolders(names: string[]): Promise<SeededFolder[]> {
  const { ownerId } = settingsOrThrow();
  const result = await adminClient()
    .from("folders")
    .insert(names.map((name, index) => ({ owner_id: ownerId, name, parent_id: null, sort_order: index })))
    .select("id, name");
  await throwIfError(result);
  return (result.data ?? []).map((folder) => ({ id: folder.id as string, name: folder.name as string }));
}

export async function seedTags(names: string[]): Promise<SeededTag[]> {
  const { ownerId } = settingsOrThrow();
  const result = await adminClient()
    .from("tags")
    .insert(names.map((name) => ({ owner_id: ownerId, name, name_normalized: name.toLowerCase() })))
    .select("id, name");
  await throwIfError(result);
  return (result.data ?? []).map((tag) => ({ id: tag.id as string, name: tag.name as string }));
}

export async function assignTags(imageId: string, tagIds: string[]): Promise<void> {
  await throwIfError(await adminClient().from("image_tags").insert(tagIds.map((tagId) => ({ image_id: imageId, tag_id: tagId }))));
}
