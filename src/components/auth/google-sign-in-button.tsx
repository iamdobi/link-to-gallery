"use client";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
export function GoogleSignInButton({ nextPath }: { nextPath: string }) { const [loading, setLoading] = useState(false); async function signIn() { setLoading(true); const redirectTo = new URL("/auth/callback", window.location.origin); redirectTo.searchParams.set("next", nextPath); await createBrowserSupabaseClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } }); } return <button type="button" onClick={signIn} disabled={loading}>{loading ? "Redirecting..." : "Continue with Google"}</button>; }
