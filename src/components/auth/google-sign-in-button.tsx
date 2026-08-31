export function GoogleSignInButton({ nextPath }: { nextPath: string }) {
  return <a href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>Continue with Google</a>;
}
