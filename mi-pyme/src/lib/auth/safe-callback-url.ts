export function getSafeCallbackPath(
  callbackUrl: string,
  baseUrl: string
): string {
  try {
    const destination = new URL(callbackUrl, baseUrl);
    const trustedOrigin = new URL(baseUrl).origin;
    if (destination.origin === trustedOrigin) {
      return `${destination.pathname}${destination.search}${destination.hash}`;
    }
  } catch {
    return "/";
  }

  return "/";
}
