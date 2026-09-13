import { cookies } from "next/headers";

const THEME_COOKIE_KEY = "mi-pyme-theme";

export async function getServerTheme(): Promise<"light" | "dark"> {
  try {
    const cookieStore = await cookies();
    const stored = cookieStore.get(THEME_COOKIE_KEY)?.value;
    if (stored === "light" || stored === "dark") return stored;
    if (stored === "system") {
      // On server, we can't detect system preference, default to light
      return "light";
    }
  } catch {
    // If cookies() fails (e.g., during static generation), default to light
  }
  return "light";
}