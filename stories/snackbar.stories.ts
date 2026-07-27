import type { Meta, StoryObj } from "@storybook/html";
import { cornbar } from "../src/core";
import "../src/styles.css";

type Controls = {
  title: string;
  description: string;
  variant: "success" | "error" | "info" | "warning";
  theme: "auto" | "light" | "dark";
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  animation: "slide" | "fade" | "scale";
  direction: "auto" | "ltr" | "rtl";
  duration: number;
  pauseOnHover: boolean;
  actionLabel: string;
  showAction: boolean;
  dismissOnAction: boolean;
  closeOnSwipe: boolean;
  mobileBackdrop: boolean;
  width: string;
  offsetX: string;
  offsetY: string;
  maxVisible: number;
};

const meta: Meta<Controls> = {
  title: "Cornbar/Snackbar",
  parameters: {
    layout: "fullscreen"
  },
  args: {
    title: "Saved successfully",
    description: "Your profile changes are live now.",
    variant: "success",
    theme: "auto",
    position: "bottom-right",
    animation: "slide",
    direction: "auto",
    duration: 4500,
    pauseOnHover: true,
    actionLabel: "Undo",
    showAction: true,
    dismissOnAction: true,
    closeOnSwipe: true,
    mobileBackdrop: false,
    width: "",
    offsetX: "0",
    offsetY: "0",
    maxVisible: 4
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "info", "warning"]
    },
    theme: {
      control: "select",
      options: ["auto", "light", "dark"]
    },
    position: {
      control: "select",
      options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]
    },
    animation: {
      control: "inline-radio",
      options: ["slide", "fade", "scale"]
    },
    direction: {
      control: "inline-radio",
      options: ["auto", "ltr", "rtl"]
    },
    duration: {
      control: { type: "number", min: 0, max: 20000, step: 250 }
    },
    width: {
      control: "text"
    },
    offsetX: {
      control: "text"
    },
    offsetY: {
      control: "text"
    },
    maxVisible: {
      control: { type: "number", min: 1, max: 8, step: 1 }
    }
  }
};

export default meta;
type Story = StoryObj<Controls>;

export const Playground: Story = {
  render: (args) => {
    cornbar.configure({
      closeOnSwipe: args.closeOnSwipe,
      maxVisible: args.maxVisible,
      duration: args.duration,
      pauseOnHover: args.pauseOnHover,
      position: args.position,
      animation: args.animation,
      direction: args.direction,
      theme: args.theme,
      mobileBackdrop: args.mobileBackdrop,
      width: args.width.trim() === "" ? undefined : args.width,
      offset: {
        x: args.offsetX.trim() === "" ? 0 : args.offsetX,
        y: args.offsetY.trim() === "" ? 0 : args.offsetY
      }
    });

    const root = document.createElement("div");
    root.style.maxWidth = "620px";
    root.style.padding = "28px";
    root.innerHTML = `
      <section style="border:1px solid #dbe2ea;border-radius:16px;padding:18px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);box-shadow:0 10px 30px rgba(2,6,23,0.07);">
        <h3 style="margin:0;font-size:18px;color:#0f172a;">Cornbar Snackbar Controls</h3>
        <p style="margin:8px 0 0;color:#475569;line-height:1.6;">Change props from the Storybook controls panel, then click the button to preview that exact toast.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">variant: ${args.variant}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">theme: ${args.theme}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">position: ${args.position}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">animation: ${args.animation}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">direction: ${args.direction}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">width: ${args.width.trim() === "" ? "content (auto)" : args.width}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">offsetX: ${args.offsetX}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">offsetY: ${args.offsetY}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">mobileBackdrop: ${args.mobileBackdrop ? "on" : "off"}</span>
          <span style="font-size:12px;color:#0f172a;background:#e2e8f0;border-radius:999px;padding:4px 10px;">pauseOnHover: ${args.pauseOnHover ? "on" : "off"}</span>
        </div>
        <button data-id="show-toast" style="margin-top:14px;border:0;background:#4f46e5;color:#fff;border-radius:12px;padding:10px 14px;font-weight:600;cursor:pointer;transition:all .2s ease;">Show Toast</button>
      </section>
    `;

    const button = root.querySelector<HTMLButtonElement>('[data-id="show-toast"]');
    button?.addEventListener("click", () => {
      cornbar.show({
        title: args.title,
        description: args.description,
        variant: args.variant,
        theme: args.theme,
        position: args.position,
        animation: args.animation,
        direction: args.direction,
        duration: args.duration,
        pauseOnHover: args.pauseOnHover,
        actions: args.showAction
          ? [
              {
                label: args.actionLabel,
                dismissOnClick: args.dismissOnAction,
                onClick: () => {
                  cornbar.info({
                    title: "Action clicked",
                    description: `You clicked "${args.actionLabel}".`,
                    position: args.position
                  });
                }
              }
            ]
          : []
      });
    });

    return root;
  }
};
