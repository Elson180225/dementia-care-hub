import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/theme.css";
import App from "./App.jsx";

// Global styles used across the whole website
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);