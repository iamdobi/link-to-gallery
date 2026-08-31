import { redirect } from "next/navigation";
import { GalleryShell } from "@/components/gallery/gallery-shell";
import { listFolders } from "@/features/folders";
import { listTags } from "@/features/tags";
import { createSupabaseFolderRepository } from "@/server/gallery/folder-repository";
import { getImagePage } from "@/server/gallery/query-repository";
import { createSupabaseTagRepository } from "@/server/gallery/tag-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function GalleryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/gallery");

  const [initialPage, folders, tags] = await Promise.all([
    getImagePage(supabase, user.id, {}, null),
    listFolders(createSupabaseFolderRepository(supabase), user.id),
    listTags(createSupabaseTagRepository(supabase), user.id),
  ]);

  return <GalleryShell folders={folders} initialPage={initialPage} tags={tags} />;
}
