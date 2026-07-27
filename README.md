# cornbar

`cornbar` is a lightweight, framework-friendly toast/snackbar library for JavaScript apps.  
It works in vanilla projects and ships a React-friendly entry as well.

[**Live Demo (Storybook)**](https://farhadf246.github.io/cornbar/)

## Features

- Multi-position toasts: `top/bottom` + `left/center/right`
- Variants: `success`, `error`, `info`, `warning`
- Themes: `light`, `dark`, `auto` (follows system)
- Direction: `ltr`, `rtl`, `auto`
- Animations: `slide`, `fade`, `scale`
- Async actions with built-in loading state
- Swipe to dismiss
- Optional mobile-only backdrop (`mobileBackdrop`)
- Configurable desktop width (`width`)
- Configurable edge spacing (`offset`)
- Easy style overrides with CSS variables, `className`, and inline `style`

## Install

```bash
npm i cornbar
yarn add cornbar
pnpm add cornbar
```

## Quick Start (Vanilla)

```ts
import { cornbar } from "cornbar";

cornbar.show({
  title: "Saved",
  description: "Your changes were saved.",
  variant: "success"
});
```

## Framework Usage

### React + Next.js Provider (recommended)

`CornbarProvider` injects styles automatically and applies default config on the client.  
No children needed — place it once in your layout:

```tsx
import { CornbarProvider, cornbar } from "cornbar";

export function App() {
  return (
    <>
      <CornbarProvider
        config={{
          direction: "rtl",
          position: "bottom-center",
          theme: "auto",
          animation: "slide"
        }}
      />
      {/* rest of app */}
    </>
  );
}
```

**Next.js (`app/layout.tsx`):**

```tsx
import { CornbarProvider } from "cornbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <CornbarProvider
          config={{
            direction: "rtl",
            position: "bottom-center",
            theme: "auto",
            animation: "slide"
          }}
        />
        {children}
      </body>
    </html>
  );
}
```

> Note: in App Router, put this usage inside a Client Component file (or mark the provider usage with `"use client"`), because `CornbarProvider` runs on the client.

**`app/providers.tsx` (recommended for App Router):**

```tsx
"use client";

import { CornbarProvider } from "cornbar";

export function Providers() {
  return (
    <CornbarProvider
      config={{
        direction: "rtl",
        position: "bottom-center",
        theme: "auto",
        animation: "slide"
      }}
    />
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers />
        {children}
      </body>
    </html>
  );
}
```

Then anywhere:

```ts
import { cornbar } from "cornbar";

cornbar.show({
  title: "Saved",
  description: "Your changes were saved."
});
```

### React (without provider)

```tsx
import { cornbar } from "cornbar";

function App() {
  return (
    <button
      onClick={() =>
        cornbar.show({
          title: "Welcome",
          description: "React is ready.",
          variant: "info"
        })
      }
    >
      Show Toast
    </button>
  );
}
```

## Async Action Example

```ts
cornbar.show({
  title: "Uploading",
  description: "Waiting for server...",
  actions: [
    {
      label: "Retry",
      loadingLabel: "Retrying...",
      dismissOnClick: true,
      onClick: async () => {
        await fetch("/api/retry", { method: "POST" });
      }
    }
  ]
});
```

## Layout Config Example

```ts
cornbar.configure({
  width: 420,
  offset: { x: 16, y: 20 }, // left/right + top/bottom extra spacing
  mobileBackdrop: true
});
```

## API

### Main Methods

- `cornbar.show(options)`
- `cornbar.dismiss(id, immediate?)`
- `cornbar.clear()`
- `cornbar.configure(config)`
- `cornbar.success(input)`
- `cornbar.error(input)`
- `cornbar.info(input)`
- `cornbar.warning(input)`

### `SnackbarOptions` (for `cornbar.show`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Custom toast id |
| `title` | `string` | `undefined` | Toast title text |
| `description` | `string` | `undefined` | Toast body text |
| `duration` | `number` | `4500` | Auto close time in ms (`0` disables auto close) |
| `pauseOnHover` | `boolean` | `true` | Pause auto close while the pointer is over the toast |
| `position` | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `"bottom-right"` | Toast stack position |
| `variant` | `"success" \| "error" \| "info" \| "warning"` | `"info"` | Visual status style |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Color theme (`auto` reads system) |
| `animation` | `"slide" \| "fade" \| "scale"` | `"slide"` | Entrance/exit animation style |
| `direction` | `"ltr" \| "rtl" \| "auto"` | `"auto"` | Text/layout direction |
| `className` | `string` | `undefined` | Extra CSS class on toast root |
| `style` | `Partial<CSSStyleDeclaration>` | `undefined` | Inline style overrides |
| `actions` | `SnackbarAction[]` | `[]` | Action buttons |
| `onOpen` | `(id: string) => void` | `undefined` | Called when toast opens |
| `onClose` | `(id: string) => void` | `undefined` | Called when toast closes |

### `SnackbarAction`

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Action button label |
| `onClick` | `(id: string) => void \| Promise<void>` | `undefined` | Sync/async callback |
| `dismissOnClick` | `boolean` | `true` | Close toast after action |
| `loadingLabel` | `string` | `"Loading..."` (for async) | Button text while promise is pending |
| `className` | `string` | `undefined` | Extra class for action button |

### `SnackbarManagerConfig` (for `cornbar.configure`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxVisible` | `number` | `4` | Maximum visible toasts per position |
| `duration` | `number` | `4500` | Global auto close duration |
| `pauseOnHover` | `boolean` | `true` | Pause auto close while the pointer is over a toast |
| `position` | `SnackbarPosition` | `"bottom-right"` | Global default position |
| `animation` | `SnackbarAnimation` | `"slide"` | Global default animation |
| `direction` | `SnackbarDirection` | `"auto"` | Global default direction |
| `theme` | `SnackbarTheme` | `"auto"` | Global default theme |
| `closeOnSwipe` | `boolean` | `true` | Enable swipe-to-dismiss |
| `mobileBackdrop` | `boolean` | `false` | Shows a visual backdrop on mobile only while toasts exist |
| `width` | `number \| string` | `undefined` | Optional stack width. If omitted, width follows content size. If set, uses your value (`420`, `"32rem"`, `"480px"`) |
| `offset` | `number \| string \| { x?: number \| string; y?: number \| string }` | `0` | Extra distance from viewport edges. Single value applies to both axes, or use `{x,y}` |

## Styling

`cornbar` is token-driven, so you can customize the look without fighting selector overrides.

### Core CSS Variables

| Variable | Purpose | Default |
|---|---|---|
| `--cornbar-font-family` | Global toast font family | `Inter, ui-sans-serif, ...` |
| `--cornbar-z-index` | Toast layer order | `9999` |
| `--cornbar-width-desktop` | Desktop stack width | `420px` |
| `--cornbar-mobile-gutter` | Mobile side spacing | `12px` |
| `--cornbar-offset-x` | Extra horizontal edge offset | `0px` |
| `--cornbar-offset-y` | Extra vertical edge offset | `0px` |
| `--cornbar-width` | Active stack width token | `fit-content` |
| `--cornbar-radius` | Toast border radius | `10px` |
| `--cornbar-shadow` | Toast shadow | `0 16px 36px rgba(10, 10, 40, 0.18)` |
| `--cornbar-padding` | Inner spacing | `12px` |
| `--cornbar-gap` | Internal item gap | `10px` |
| `--cornbar-bg` | Surface background | `#ffffff` |
| `--cornbar-text` | Primary text color | `#111827` |
| `--cornbar-text-secondary` | Secondary text color | `#4b5563` |
| `--cornbar-border` | Surface border color | `#e5e7eb` |
| `--cornbar-action-bg` | Action button background | `transparent` |
| `--cornbar-action-fg` | Action button text | `#374151` |
| `--cornbar-action-border` | Action button border | `#d1d5db` |
| `--cornbar-accent` | Variant accent color | `#3b82f6` |
| `--cornbar-accent-soft` | Variant glow color | `rgba(59, 130, 246, 0.16)` |

### Global Theme Override

```css
:root {
  --cornbar-font-family: "Vazirmatn", Inter, sans-serif;
  --cornbar-width-desktop: 440px;
  --cornbar-mobile-gutter: 14px;
  --cornbar-radius: 10px;
  --cornbar-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  --cornbar-bg: #ffffff;
  --cornbar-text: #0f172a;
  --cornbar-text-secondary: #475569;
}
```

### Dark Theme Override

```css
[data-theme="dark"] {
  --cornbar-bg: #0f172a;
  --cornbar-text: #f8fafc;
  --cornbar-text-secondary: #cbd5e1;
  --cornbar-border: #334155;
  --cornbar-action-fg: #e2e8f0;
  --cornbar-action-border: #475569;
}
```

### Per-Toast Override

```ts
cornbar.show({
  description: "Custom look",
  className: "my-cornbar",
  style: {
    background: "#111827",
    color: "#f8fafc"
  } as Partial<CSSStyleDeclaration>
});
```

### Custom Variant Style Example

```css
.cornbar-toast[data-variant="success"] {
  --cornbar-accent: #22c55e;
  --cornbar-accent-soft: rgba(34, 197, 94, 0.2);
}

.cornbar-toast[data-variant="error"] {
  --cornbar-accent: #ef4444;
  --cornbar-accent-soft: rgba(239, 68, 68, 0.2);
}
```

## Storybook

```bash
npm run dev
```

Static build:

```bash
npm run build-storybook
```
