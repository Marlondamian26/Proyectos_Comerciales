import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme, getInitialTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import * as React from "react";
import "@testing-library/jest-dom";
import type { Mock } from "vitest";

describe("ThemeProvider", () => {
  const originalLocalStorage = global.localStorage;
  const originalMatchMedia = global.matchMedia;

  beforeEach(() => {
    global.localStorage = {
      ...originalLocalStorage,
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    global.matchMedia = originalMatchMedia;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("provides theme context to children", () => {
    const TestComponent = () => {
      const { theme, resolvedTheme, ready, setTheme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolvedTheme">{resolvedTheme}</span>
          <span data-testid="ready">{String(ready)}</span>
          <button onClick={() => setTheme("dark")} data-testid="setDark">
            Set Dark
          </button>
          <button onClick={toggleTheme} data-testid="toggle">
            Toggle
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("light");
    expect(screen.getByTestId("ready")).toHaveTextContent("true");
  });

  it("setTheme updates theme and persists to localStorage", () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme("dark")} data-testid="setDark">
            Set Dark
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("setDark"));

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(localStorage.setItem).toHaveBeenCalledWith("mi-pyme-theme", "dark");
  });

  it("toggleTheme switches between light and dark", () => {
    const TestComponent = () => {
      const { resolvedTheme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="resolvedTheme">{resolvedTheme}</span>
          <button onClick={toggleTheme} data-testid="toggle">
            Toggle
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("light");

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("dark");

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("light");
  });

  it("applies data-theme attribute to document.documentElement", () => {
    const TestComponent = () => {
      const { setTheme } = useTheme();
      return (
        <button onClick={() => setTheme("dark")} data-testid="setDark">
          Set Dark
        </button>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    fireEvent.click(screen.getByTestId("setDark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("reads stored theme from localStorage on init", () => {
    (localStorage.getItem as Mock).mockReturnValue("dark");

    const TestComponent = () => {
      const { theme, resolvedTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolvedTheme">{resolvedTheme}</span>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("dark");
  });

  it("falls back to system preference when no stored theme", () => {
    (localStorage.getItem as Mock).mockReturnValue(null);
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const TestComponent = () => {
      const { resolvedTheme } = useTheme();
      return <span data-testid="resolvedTheme">{resolvedTheme}</span>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("resolvedTheme")).toHaveTextContent("dark");
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    global.localStorage = {
      ...global.localStorage,
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders toggle button with current theme label", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /Cambiar a modo oscuro/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles theme on button click", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /Cambiar a modo oscuro/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("shows dropdown with three options on second button click", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const dropdownButton = screen.getByRole("button", { name: /Opciones de tema/i });
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    expect(screen.getByRole("option", { name: /Claro/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Oscuro/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Sistema/i })).toBeInTheDocument();
  });

  it("selects theme from dropdown", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const dropdownButton = screen.getByRole("button", { name: /Opciones de tema/i });
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const darkOption = screen.getByRole("option", { name: /Oscuro/i });
    fireEvent.click(darkOption);

    await waitFor(() => {
      const mainButton = screen.getByRole("button", { name: /Cambiar a modo claro/i });
      expect(mainButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("closes dropdown on Escape key", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const dropdownButton = screen.getByRole("button", { name: /Opciones de tema/i });
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("closes dropdown on outside click", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const dropdownButton = screen.getByRole("button", { name: /Opciones de tema/i });
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});

describe("getInitialTheme", () => {
  it("returns light when no cookie", () => {
    const originalCookie = document.cookie;
    document.cookie = "";
    
    const theme = getInitialTheme();
    expect(theme).toBe("light");
    
    document.cookie = originalCookie;
  });

  it("returns stored theme from cookie", () => {
    document.cookie = "mi-pyme-theme=dark";
    
    const theme = getInitialTheme();
    expect(theme).toBe("dark");
  });

  it("returns system theme when cookie is system", () => {
    document.cookie = "mi-pyme-theme=system";
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const theme = getInitialTheme();
    expect(theme).toBe("dark");
  });
});