import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
}

createRoot(document.getElementById("root")!).render(<App />);
