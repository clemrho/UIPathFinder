
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { Auth0Provider } from "@auth0/auth0-react";
  import { BrowserRouter } from "react-router-dom";

  createRoot(document.getElementById("root")!).render(
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || 'dev-x8hz2rfhh8u1hpwz.us.auth0.com'}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || '8JmkvtpqIiutVkzIrjikmQNqjWf4EaWL'}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'urn:uipathfinder-api',
        scope: 'openid profile email'
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  );
