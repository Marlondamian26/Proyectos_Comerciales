import type { Preview } from "@storybook/react";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import React, { useEffect } from "react";
import "../src/app/globals.css";

function ThemeDecorator({
  storyFn,
  globals,
}: {
  storyFn: (props: Record<string, unknown>) => React.ReactElement;
  globals: { theme: "light" | "dark" | "system" };
}) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (globals.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.setAttribute("data-theme", systemTheme);
      root.style.colorScheme = systemTheme;
    } else {
      root.setAttribute("data-theme", globals.theme);
      root.style.colorScheme = globals.theme;
    }
  }, [globals.theme, resolvedTheme]);

  return (
    <ThemeProvider>
      <div className="min-w-[320px]">
        {storyFn()}
      </div>
    </ThemeProvider>
  );
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#FFFFFF" },
        { name: "dark", value: "#0B1220" },
        { name: "primary", value: "#0B6E4F" },
      ],
    },
    layout: "centered",
  },
  decorators: [ThemeDecorator],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark", "system"],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;