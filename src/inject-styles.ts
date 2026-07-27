import { CORNBAR_CSS } from "./styles.generated";

const STYLE_ELEMENT_ID = "cornbar-style";

export function ensureCornbarStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.setAttribute("data-cornbar-style", "true");
  style.textContent = CORNBAR_CSS;
  document.head.appendChild(style);
}
