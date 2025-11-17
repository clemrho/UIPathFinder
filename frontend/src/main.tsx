
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { Auth0Provider } from "@auth0/auth0-react";

  createRoot(document.getElementById("root")!).render(
    <Auth0Provider
      domain="dev-x8hz2rfhh8u1hpwz.us.auth0.com"
      clientId="8JmkvtpqIiutVkzIrjikmQNqjWf4EaWL"
      redirectUri={window.location.origin}
    >
      <App />
    </Auth0Provider>
  );
