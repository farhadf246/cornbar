import { useLayoutEffect } from "react";
import { getCornbar, type SnackbarManagerConfig } from "./core";
import { ensureCornbarStyles } from "./inject-styles";

export type CornbarProviderProps = {
  /** Default cornbar config applied on the client. */
  config?: SnackbarManagerConfig;
};

/**
 * Client-side bootstrap for React and Next.js.
 * Injects styles and applies default config. No children required.
 */
export function CornbarProvider({ config }: CornbarProviderProps) {
  useLayoutEffect(() => {
    ensureCornbarStyles();
    if (!config) return;
    getCornbar().configure(config);
  }, [config]);

  return null;
}
