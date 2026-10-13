import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./Common/main.scss";
import App from "./App";

const container = document.getElementById("app");
if (!container) {
  throw new Error("Failed to find the #app element");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
