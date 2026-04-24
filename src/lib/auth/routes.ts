/**
 * Routes that unauthenticated users can access.
 *
 * Kept in one place because both the server middleware and the client-side
 * AuthGuard need the same list — duplicating them caused bugs where a route
 * was allowed by one layer but blocked by the other.
 */
export const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/auth/reset-password",
  "/auth/reset-landing",
  "/privacy",
  "/terms",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}
