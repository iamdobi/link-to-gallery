import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getSafeNextPath } from "@/lib/supabase/proxy";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(typeof params.next === "string" ? params.next : null);
  return <main><h1>Link Gallery</h1><p>This is a private gallery.</p><GoogleSignInButton nextPath={nextPath} /></main>;
}
