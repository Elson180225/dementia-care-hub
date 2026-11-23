import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/theme.css";
import App from "./App.jsx";
import "./styles/responsive.css";
import "./styles/public-refresh.css";
import "./styles/cinematic.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
