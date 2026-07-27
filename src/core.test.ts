import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarManager } from "./core";

const flush = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("SnackbarManager", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.getElementById("cornbar-style")?.remove();
    document.documentElement.dir = "ltr";
    vi.useRealTimers();
    const scope = globalThis as typeof globalThis & {
      __cornbar_manager__?: unknown;
      __cornbar_config__?: unknown;
    };
    delete scope.__cornbar_manager__;
    delete scope.__cornbar_config__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders title/description and closes with close button", async () => {
    const manager = new SnackbarManager();
    manager.show({
      title: "Saved",
      description: "Changes are live",
      variant: "success"
    });
    await flush();

    const toast = document.querySelector<HTMLElement>(".cornbar-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Saved");
    expect(toast?.textContent).toContain("Changes are live");

    const closeButton = toast?.querySelector<HTMLButtonElement>(".cornbar-close");
    closeButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 240));

    expect(document.querySelector(".cornbar-toast")).toBeNull();
  });

  it("keeps toast open when dismissOnClick is false", async () => {
    const manager = new SnackbarManager();
    const onClick = vi.fn();
    manager.show({
      title: "Sync",
      actions: [{ label: "Details", onClick, dismissOnClick: false }]
    });
    await flush();

    const action = document.querySelector<HTMLButtonElement>(".cornbar-action");
    action?.click();
    await flush();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".cornbar-toast")).not.toBeNull();
  });

  it("shows loading state for async action and dismisses after resolve", async () => {
    const manager = new SnackbarManager({ duration: 0 });

    let resolveAction: VoidFunction = () => {};
    manager.show({
      title: "Uploading",
      actions: [
        {
          label: "Retry",
          loadingLabel: "Retrying...",
          onClick: () =>
            new Promise<void>((resolve) => {
              resolveAction = resolve;
            })
        }
      ]
    });
    await flush();

    const action = document.querySelector<HTMLButtonElement>(".cornbar-action");
    expect(action).not.toBeNull();
    action?.click();
    await flush();

    expect(action?.disabled).toBe(true);
    expect(action?.textContent).toBe("Retrying...");
    expect(action?.dataset.loading).toBe("true");

    resolveAction();
    await flush();
    await new Promise((resolve) => setTimeout(resolve, 260));

    expect(document.querySelector(".cornbar-toast")).toBeNull();
  });

  it("resolves auto direction from document dir", async () => {
    document.documentElement.dir = "rtl";
    const manager = new SnackbarManager({ direction: "auto", duration: 0 });
    manager.show({ title: "RTL auto" });
    await flush();

    const toast = document.querySelector<HTMLElement>(".cornbar-toast");
    expect(toast?.getAttribute("dir")).toBe("rtl");
  });

  it("resolves auto theme from prefers-color-scheme", async () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-color-scheme: dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      configurable: true
    });

    const manager = new SnackbarManager({ theme: "auto", duration: 0 });
    manager.show({ title: "Auto theme" });
    await flush();

    const toast = document.querySelector<HTMLElement>(".cornbar-toast");
    expect(toast?.dataset.theme).toBe("dark");
  });

  it("applies fixed width number and string values", async () => {
    const manager = new SnackbarManager({ width: 520, duration: 0 });
    manager.show({ description: "Fixed width" });
    await flush();

    let host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.widthMode).toBe("fixed");
    expect(host?.style.getPropertyValue("--cornbar-width-desktop")).toBe("520px");
    expect(host?.style.getPropertyValue("--cornbar-width")).toBe("min(520px, calc(100vw - 28px))");

    manager.configure({ width: "32rem" });
    host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.widthMode).toBe("fixed");
    expect(host?.style.getPropertyValue("--cornbar-width-desktop")).toBe("32rem");
    expect(host?.style.getPropertyValue("--cornbar-width")).toBe("min(32rem, calc(100vw - 28px))");
  });

  it("uses content width mode by default when width is not provided", async () => {
    const manager = new SnackbarManager({ duration: 0 });
    manager.show({ description: "Short content" });
    await flush();

    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.widthMode).toBe("content");
    expect(host?.style.getPropertyValue("--cornbar-width")).toBe("fit-content");
  });

  it("falls back to content width when width is cleared", async () => {
    const manager = new SnackbarManager({ width: 400, duration: 0 });
    manager.show({ description: "Clear width" });
    await flush();

    manager.configure({ width: undefined });
    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.widthMode).toBe("content");
    expect(host?.style.getPropertyValue("--cornbar-width")).toBe("fit-content");
  });

  it("enables mobile backdrop and creates backdrop element", async () => {
    const manager = new SnackbarManager({ mobileBackdrop: true, duration: 0 });
    manager.show({ description: "Backdrop on" });
    await flush();

    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    const backdrop = host?.querySelector(".cornbar-backdrop");
    expect(host?.dataset.mobileBackdrop).toBe("true");
    expect(host?.dataset.hasToasts).toBe("true");
    expect(backdrop).not.toBeNull();
  });

  it("keeps mobile backdrop disabled by default and updates via configure", async () => {
    const manager = new SnackbarManager({ duration: 0 });
    manager.show({ description: "Backdrop off" });
    await flush();

    let host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.mobileBackdrop).toBe("false");

    manager.configure({ mobileBackdrop: true });
    host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.mobileBackdrop).toBe("true");
  });

  it("clears hasToasts after dismiss for backdrop state", async () => {
    const manager = new SnackbarManager({ mobileBackdrop: true, duration: 0 });
    const id = manager.show({ description: "Will dismiss" });
    await flush();

    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.dataset.hasToasts).toBe("true");

    manager.dismiss(id, true);
    await flush();
    expect(host?.dataset.hasToasts).toBe("false");
  });

  it("applies uniform offset to both axes", async () => {
    const manager = new SnackbarManager({ offset: 18, duration: 0 });
    manager.show({ description: "Uniform offset" });
    await flush();

    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.style.getPropertyValue("--cornbar-offset-x")).toBe("18px");
    expect(host?.style.getPropertyValue("--cornbar-offset-y")).toBe("18px");
  });

  it("applies object offset with mixed number and string values", async () => {
    const manager = new SnackbarManager({
      offset: { x: 20, y: "1.5rem" },
      duration: 0
    });
    manager.show({ description: "Axis offset" });
    await flush();

    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.style.getPropertyValue("--cornbar-offset-x")).toBe("20px");
    expect(host?.style.getPropertyValue("--cornbar-offset-y")).toBe("1.5rem");
  });

  it("updates offset through configure", async () => {
    const manager = new SnackbarManager({ offset: 0, duration: 0 });
    manager.show({ description: "Offset update" });
    await flush();

    manager.configure({ offset: { x: "12", y: 24 } });
    const host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    expect(host?.style.getPropertyValue("--cornbar-offset-x")).toBe("12px");
    expect(host?.style.getPropertyValue("--cornbar-offset-y")).toBe("24px");
  });

  it("shares configure defaults across separate manager instances", async () => {
    const layoutManager = new SnackbarManager();
    layoutManager.configure({
      direction: "rtl",
      position: "bottom-center",
      theme: "dark",
      animation: "fade"
    });

    const pageManager = new SnackbarManager();
    pageManager.show({ title: "Shared config" });
    await flush();

    const toast = document.querySelector<HTMLElement>(".cornbar-toast");
    const stack = toast?.parentElement;
    expect(toast?.getAttribute("dir")).toBe("rtl");
    expect(toast?.dataset.theme).toBe("dark");
    expect(toast?.dataset.animation).toBe("fade");
    expect(stack?.dataset.position).toBe("bottom-center");
  });

  it("pauses auto dismiss while mouse is over toast", () => {
    vi.useFakeTimers();
    try {
      const manager = new SnackbarManager({ duration: 3000 });
      manager.show({ description: "Hover me" });

      const toast = document.querySelector<HTMLElement>(".cornbar-toast");
      expect(toast).not.toBeNull();

      vi.advanceTimersByTime(2500);
      toast?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      vi.advanceTimersByTime(5000);
      expect(document.querySelector(".cornbar-toast")).not.toBeNull();

      toast?.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      vi.advanceTimersByTime(720);
      expect(document.querySelector(".cornbar-toast")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps auto dismiss running on hover when pauseOnHover is false", () => {
    vi.useFakeTimers();
    try {
      const manager = new SnackbarManager({ duration: 1000, pauseOnHover: false });
      manager.show({ description: "No pause" });

      const toast = document.querySelector<HTMLElement>(".cornbar-toast");
      toast?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      vi.advanceTimersByTime(1220);
      expect(document.querySelector(".cornbar-toast")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("injects cornbar styles into document head on show", async () => {
    const manager = new SnackbarManager({ duration: 0 });
    manager.show({ description: "Styled" });
    await flush();

    const style = document.getElementById("cornbar-style");
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe("STYLE");
    expect(style?.textContent).toContain(".cornbar-toast");
  });
});
