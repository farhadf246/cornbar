import { ensureCornbarStyles } from "./inject-styles";

export type SnackbarVariant = "success" | "error" | "info" | "warning";
export type SnackbarPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type SnackbarAnimation = "slide" | "fade" | "scale";
export type SnackbarDirection = "ltr" | "rtl" | "auto";
export type SnackbarTheme = "light" | "dark" | "auto";
export type SnackbarOffset =
  | number
  | string
  | {
      x?: number | string;
      y?: number | string;
    };

export interface SnackbarAction {
  label: string;
  onClick?: (id: string) => void | Promise<void>;
  dismissOnClick?: boolean;
  loadingLabel?: string;
  className?: string;
}

export interface SnackbarOptions {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  pauseOnHover?: boolean;
  position?: SnackbarPosition;
  variant?: SnackbarVariant;
  animation?: SnackbarAnimation;
  direction?: SnackbarDirection;
  theme?: SnackbarTheme;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  actions?: SnackbarAction[];
  onOpen?: (id: string) => void;
  onClose?: (id: string) => void;
}

export interface SnackbarManagerConfig {
  maxVisible?: number;
  duration?: number;
  pauseOnHover?: boolean;
  position?: SnackbarPosition;
  animation?: SnackbarAnimation;
  direction?: SnackbarDirection;
  theme?: SnackbarTheme;
  closeOnSwipe?: boolean;
  mobileBackdrop?: boolean;
  width?: number | string;
  offset?: SnackbarOffset;
}

type ResolvedSnackbarManagerConfig = Omit<Required<SnackbarManagerConfig>, "width"> & {
  width?: number | string;
};

type ContainerMap = Map<SnackbarPosition, HTMLElement>;

type AutoDismissState = {
  timeoutId?: ReturnType<typeof setTimeout>;
  deadline: number;
  paused: boolean;
  remainingMs: number;
};

const POSITIONS: SnackbarPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];

const defaults: ResolvedSnackbarManagerConfig = {
  maxVisible: 4,
  duration: 4500,
  pauseOnHover: true,
  position: "bottom-right",
  animation: "slide",
  direction: "auto",
  theme: "auto",
  closeOnSwipe: true,
  mobileBackdrop: false,
  offset: 0
};

const generateId = () =>
  `cornbar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const GLOBAL_MANAGER_KEY = "__cornbar_manager__";
const GLOBAL_CONFIG_KEY = "__cornbar_config__";

type CornbarGlobalScope = typeof globalThis & {
  [GLOBAL_MANAGER_KEY]?: SnackbarManager;
  [GLOBAL_CONFIG_KEY]?: Partial<ResolvedSnackbarManagerConfig>;
};

const getGlobalScope = () => globalThis as CornbarGlobalScope;

const readGlobalConfig = (): Partial<ResolvedSnackbarManagerConfig> =>
  getGlobalScope()[GLOBAL_CONFIG_KEY] ?? {};

const writeGlobalConfig = (config: ResolvedSnackbarManagerConfig) => {
  getGlobalScope()[GLOBAL_CONFIG_KEY] = { ...config };
};

export class SnackbarManager {
  private config: ResolvedSnackbarManagerConfig;
  private host: HTMLElement | null = null;
  private containers: ContainerMap = new Map();
  private autoDismiss = new Map<string, AutoDismissState>();

  constructor(config: SnackbarManagerConfig = {}) {
    this.config = { ...defaults, ...readGlobalConfig(), ...config };
    writeGlobalConfig(this.config);
    this.initDom();
  }

  configure(config: SnackbarManagerConfig) {
    this.config = { ...defaults, ...readGlobalConfig(), ...config };
    writeGlobalConfig(this.config);
    this.applyRuntimeStyles();
  }

  show(options: SnackbarOptions = {}): string {
    this.syncConfigFromGlobal();
    const id = options.id ?? generateId();
    if (!this.initDom()) {
      return id;
    }
    const position = options.position ?? this.config.position;
    const container = this.containers.get(position);
    if (!container) {
      return id;
    }

    const visible = container.querySelectorAll(".cornbar-toast");
    if (visible.length >= this.config.maxVisible) {
      const first = visible.item(0) as HTMLElement | null;
      if (first?.dataset.id) {
        this.dismiss(first.dataset.id, true);
      }
    }

    const toast = this.buildToast(id, options);
    container.appendChild(toast);
    this.syncHostState();
    if (typeof globalThis.requestAnimationFrame === "function") {
      globalThis.requestAnimationFrame(() => {
        toast.dataset.state = "open";
        options.onOpen?.(id);
      });
    } else {
      toast.dataset.state = "open";
      options.onOpen?.(id);
    }

    const duration = options.duration ?? this.config.duration;
    if (duration > 0) {
      this.scheduleAutoDismiss(id, duration);
    }
    return id;
  }

  dismiss(id: string, immediate = false) {
    if (!this.host) {
      return;
    }
    const toast = this.host.querySelector<HTMLElement>(`.cornbar-toast[data-id="${id}"]`);
    if (!toast) {
      return;
    }

    this.clearAutoDismiss(id);

    const remove = () => {
      const onClose = (toast as HTMLElement & { __onClose?: (targetId: string) => void }).__onClose;
      toast.remove();
      this.syncHostState();
      onClose?.(id);
    };

    if (immediate) {
      remove();
      return;
    }

    toast.dataset.state = "closing";
    globalThis.setTimeout(remove, 220);
  }

  clear() {
    if (!this.host) {
      return;
    }
    const toasts = this.host.querySelectorAll<HTMLElement>(".cornbar-toast");
    toasts.forEach((node) => {
      const id = node.dataset.id;
      if (id) {
        this.dismiss(id, true);
      }
    });
  }

  success(input: Omit<SnackbarOptions, "variant"> | string) {
    return this.show(this.normalizeInput(input, "success"));
  }

  error(input: Omit<SnackbarOptions, "variant"> | string) {
    return this.show(this.normalizeInput(input, "error"));
  }

  info(input: Omit<SnackbarOptions, "variant"> | string) {
    return this.show(this.normalizeInput(input, "info"));
  }

  warning(input: Omit<SnackbarOptions, "variant"> | string) {
    return this.show(this.normalizeInput(input, "warning"));
  }

  private normalizeInput(
    input: Omit<SnackbarOptions, "variant"> | string,
    variant: SnackbarVariant
  ): SnackbarOptions {
    if (typeof input === "string") {
      return { description: input, variant };
    }
    return { ...input, variant };
  }

  private syncConfigFromGlobal() {
    this.config = { ...defaults, ...this.config, ...readGlobalConfig() };
  }

  private initDom() {
    if (!this.isBrowser()) {
      return false;
    }

    ensureCornbarStyles();

    if (!this.host || !this.host.isConnected) {
      this.host = this.ensureHost();
      this.containers.clear();
      this.ensureContainers();
    }
    this.applyRuntimeStyles();
    this.syncHostState();

    return true;
  }

  private isBrowser() {
    return typeof document !== "undefined" && typeof window !== "undefined";
  }

  private ensureHost() {
    let host = document.querySelector<HTMLElement>('[data-cornbar-host="true"]');
    if (!host) {
      host = document.createElement("div");
      host.dataset.cornbarHost = "true";
      host.className = "cornbar-host";
      const backdrop = document.createElement("div");
      backdrop.className = "cornbar-backdrop";
      host.appendChild(backdrop);
      document.body.appendChild(host);
    }
    return host;
  }

  private applyRuntimeStyles() {
    if (!this.host) return;
    this.host.dataset.mobileBackdrop = this.config.mobileBackdrop ? "true" : "false";
    const { x, y } = this.normalizeOffset(this.config.offset);
    this.host.style.setProperty("--cornbar-offset-x", x);
    this.host.style.setProperty("--cornbar-offset-y", y);
    const width = this.normalizeWidth(this.config.width);
    if (!width) {
      this.host.dataset.widthMode = "content";
      this.host.style.setProperty("--cornbar-width", "fit-content");
      this.host.style.removeProperty("--cornbar-width-desktop");
      return;
    }

    this.host.dataset.widthMode = "fixed";
    this.host.style.setProperty("--cornbar-width-desktop", width);
    this.host.style.setProperty("--cornbar-width", `min(${width}, calc(100vw - 28px))`);
  }

  private normalizeWidth(input: number | string | undefined) {
    if (input == null || input === "") {
      return undefined;
    }
    if (typeof input === "number") {
      return `${input}px`;
    }
    if (/^\d+(\.\d+)?$/.test(input.trim())) {
      return `${input.trim()}px`;
    }
    return input;
  }

  private normalizeOffset(input: SnackbarOffset | undefined) {
    if (input == null) {
      return { x: "0px", y: "0px" };
    }

    if (typeof input === "number" || typeof input === "string") {
      const value = this.normalizeLength(input);
      return { x: value, y: value };
    }

    return {
      x: this.normalizeLength(input.x ?? 0),
      y: this.normalizeLength(input.y ?? 0)
    };
  }

  private normalizeLength(input: number | string) {
    if (typeof input === "number") {
      return `${input}px`;
    }
    const trimmed = input.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }
    return trimmed;
  }

  private syncHostState() {
    if (!this.host) return;
    const hasToasts = this.host.querySelector(".cornbar-toast") !== null;
    this.host.dataset.hasToasts = hasToasts ? "true" : "false";
  }

  private ensureContainers() {
    const host = this.host;
    if (!host) {
      return;
    }
    POSITIONS.forEach((position) => {
      const existing = host.querySelector<HTMLElement>(`.cornbar-stack[data-position="${position}"]`);
      if (existing) {
        this.containers.set(position, existing);
        return;
      }
      const stack = document.createElement("div");
      stack.className = "cornbar-stack";
      stack.dataset.position = position;
      host.appendChild(stack);
      this.containers.set(position, stack);
    });
  }

  private buildToast(id: string, options: SnackbarOptions) {
    const toast = document.createElement("article");
    toast.className = `cornbar-toast ${options.className ?? ""}`.trim();
    toast.dataset.id = id;
    toast.dataset.state = "idle";
    toast.dataset.variant = options.variant ?? "info";
    toast.dataset.animation = options.animation ?? this.config.animation;
    toast.dataset.theme = this.resolveTheme(options.theme ?? this.config.theme);
    toast.dir = this.resolveDirection(options.direction ?? this.config.direction);
    (toast as HTMLElement & { __onClose?: (targetId: string) => void }).__onClose = options.onClose;

    if (options.style) {
      Object.entries(options.style).forEach(([key, value]) => {
        if (typeof value === "string") {
          toast.style.setProperty(key, value);
        }
      });
    }

    const content = document.createElement("div");
    content.className = "cornbar-content";

    if (options.title) {
      const title = document.createElement("p");
      title.className = "cornbar-title";
      title.textContent = options.title;
      content.appendChild(title);
    }

    if (options.description) {
      const description = document.createElement("p");
      description.className = "cornbar-description";
      description.textContent = options.description;
      content.appendChild(description);
    }

    const actions = options.actions ?? [];
    const actionWrap = document.createElement("div");
    actionWrap.className = "cornbar-actions";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = `cornbar-action ${action.className ?? ""}`.trim();
      button.type = "button";
      button.textContent = action.label;
      button.onclick = async () => {
        if (button.dataset.loading === "true") {
          return;
        }

        if (!action.onClick) {
          if (action.dismissOnClick !== false) {
            this.dismiss(id);
          }
          return;
        }

        const result = action.onClick(id);
        const isPromiseLike =
          typeof result === "object" &&
          result !== null &&
          "then" in result &&
          typeof (result as PromiseLike<void>).then === "function";

        if (!isPromiseLike) {
          if (action.dismissOnClick !== false) {
            this.dismiss(id);
          }
          return;
        }

        const originalLabel = action.label;
        button.dataset.loading = "true";
        button.disabled = true;
        button.ariaBusy = "true";
        button.textContent = action.loadingLabel ?? "Loading...";

        try {
          await result;
          if (action.dismissOnClick !== false) {
            this.dismiss(id);
          }
        } catch (error) {
          console.error("[cornbar] action callback failed", error);
        } finally {
          if (button.isConnected) {
            button.dataset.loading = "false";
            button.disabled = false;
            button.ariaBusy = "false";
            button.textContent = originalLabel;
          }
        }
      };
      actionWrap.appendChild(button);
    });

    const close = document.createElement("button");
    close.className = "cornbar-close";
    close.type = "button";
    close.ariaLabel = "Dismiss notification";
    close.textContent = "×";
    close.onclick = () => this.dismiss(id);

    toast.append(content, actionWrap, close);

    if (this.config.closeOnSwipe) {
      this.attachSwipeDismiss(toast, id);
    }

    const pauseOnHover = options.pauseOnHover ?? this.config.pauseOnHover;
    if (pauseOnHover) {
      toast.addEventListener("mouseenter", () => this.pauseAutoDismiss(id));
      toast.addEventListener("mouseleave", () => this.resumeAutoDismiss(id));
    }

    return toast;
  }

  private scheduleAutoDismiss(id: string, ms: number) {
    this.clearAutoDismiss(id);
    const deadline = Date.now() + ms;
    const timeoutId = globalThis.setTimeout(() => this.dismiss(id), ms);
    this.autoDismiss.set(id, { timeoutId, deadline, paused: false, remainingMs: ms });
  }

  private pauseAutoDismiss(id: string) {
    const state = this.autoDismiss.get(id);
    if (!state || state.paused) {
      return;
    }

    if (state.timeoutId) {
      globalThis.clearTimeout(state.timeoutId);
      state.timeoutId = undefined;
    }

    state.remainingMs = Math.max(0, state.deadline - Date.now());
    state.paused = true;
  }

  private resumeAutoDismiss(id: string) {
    const state = this.autoDismiss.get(id);
    if (!state || !state.paused) {
      return;
    }

    state.paused = false;
    if (state.remainingMs <= 0) {
      this.dismiss(id);
      return;
    }

    state.deadline = Date.now() + state.remainingMs;
    state.timeoutId = globalThis.setTimeout(() => this.dismiss(id), state.remainingMs);
  }

  private clearAutoDismiss(id: string) {
    const state = this.autoDismiss.get(id);
    if (state?.timeoutId) {
      globalThis.clearTimeout(state.timeoutId);
    }
    this.autoDismiss.delete(id);
  }

  private resolveDirection(input: SnackbarDirection): "ltr" | "rtl" {
    if (input === "ltr" || input === "rtl") {
      return input;
    }
    if (typeof document === "undefined") {
      return "ltr";
    }
    return document.documentElement?.dir === "rtl" ? "rtl" : "ltr";
  }

  private resolveTheme(input: SnackbarTheme): "light" | "dark" {
    if (input === "light" || input === "dark") {
      return input;
    }
    if (typeof window === "undefined") {
      return "light";
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  private attachSwipeDismiss(toast: HTMLElement, id: string) {
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;

    toast.addEventListener("pointerdown", (event) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'button, a, input, textarea, select, [role="button"], [data-cornbar-no-swipe="true"]'
        )
      ) {
        return;
      }
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastTime = event.timeStamp;
      toast.setPointerCapture(pointerId);
      toast.style.transition = "none";
    });

    toast.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        toast.style.transform = `translateX(${dx}px)`;
        toast.style.opacity = `${Math.max(0.35, 1 - Math.abs(dx) / 220)}`;
      }
      lastX = event.clientX;
      lastTime = event.timeStamp;
    });

    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dt = Math.max(1, event.timeStamp - lastTime);
      const velocity = (event.clientX - lastX) / dt;
      const shouldDismiss = Math.abs(dx) > 92 || Math.abs(velocity) > 0.7;
      toast.releasePointerCapture(pointerId);
      pointerId = -1;
      toast.style.transition = "";

      if (shouldDismiss) {
        this.dismiss(id);
      } else {
        toast.style.transform = "";
        toast.style.opacity = "";
      }
    };

    toast.addEventListener("pointerup", release);
    toast.addEventListener("pointercancel", release);
  }
}

export const getCornbar = (): SnackbarManager => {
  const scope = getGlobalScope();
  if (!scope[GLOBAL_MANAGER_KEY]) {
    scope[GLOBAL_MANAGER_KEY] = new SnackbarManager();
  }
  return scope[GLOBAL_MANAGER_KEY];
};

export const cornbar = getCornbar();
