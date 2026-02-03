import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";

registerSW({
  onNeedRefresh() {
    console.log("New content available, refresh required");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
        <App />
    </AuthProvider>    
  </StrictMode>
);