import { useLayoutEffect } from "react";
import {
  getCornbar,
  type SnackbarManagerConfig,
  type SnackbarOptions
} from "./core";
import { CornbarProvider, type CornbarProviderProps } from "./provider";

export function useSnackbar(config?: SnackbarManagerConfig) {
  useLayoutEffect(() => {
    if (!config) return;
    getCornbar().configure(config);
  }, [config]);

  return getCornbar();
}

export function createReactSnackbar(config?: SnackbarManagerConfig) {
  const manager = getCornbar();
  if (config) {
    manager.configure(config);
  }
  return manager;
}

export function reactToast(input: string | Omit<SnackbarOptions, "id">) {
  if (typeof input === "string") {
    return getCornbar().show({ description: input });
  }
  return getCornbar().show(input);
}

export { CornbarProvider };
export type { CornbarProviderProps };
