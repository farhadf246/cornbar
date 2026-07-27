import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  framework: "@storybook/html-vite",
  stories: ["../stories/**/*.stories.@(ts|js)"],
  addons: ["@storybook/addon-essentials"],
  async viteFinal(config) {
    config.base = process.env.STORYBOOK_BASE || "/";
    return config;
  }
};

export default config;
