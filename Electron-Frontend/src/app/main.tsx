import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import UserClientProviders from "@/context/UserClientProviders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserClientProviders>
      <App />
    </UserClientProviders>
  </StrictMode>
);
