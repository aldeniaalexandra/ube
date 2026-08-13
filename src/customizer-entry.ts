import { bootCustomizer } from "./customizer.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCustomizer, { once: true });
} else {
  bootCustomizer();
}
