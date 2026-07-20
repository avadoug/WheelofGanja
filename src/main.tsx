import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SiteApp from "./components/SiteApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteApp />
  </StrictMode>,
);
