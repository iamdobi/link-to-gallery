import { redirect } from "next/navigation";
import { CaptureConfirmation } from "@/components/capture/capture-confirmation";
import { getCapturePreviewUrl } from "@/features/capture";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CapturePage({ searchParams }: PageProps<"/capture">) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/capture");

  const params = await searchParams;
  const value = typeof params.url === "string" ? params.url : "";
  let url: string | null = null;
  let validationError: string | undefined;
  try {
    url = getCapturePreviewUrl(value);
  } catch (error) {
    validationError = error instanceof Error ? error.message : "A valid image URL is required.";
  }

  return <CaptureConfirmation validationError={validationError} url={url} />;
}
