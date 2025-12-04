import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { HelpCircle } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { loginWithPopup, isAuthenticated, isLoading, error, user } =
    useAuth0();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    console.log("Auth state changed:", { isAuthenticated, isLoading, user });
    if (isAuthenticated) {
      console.log("User authenticated, calling onLogin()");
      onLogin();
    }
  }, [isAuthenticated, isLoading, user, onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      console.log("Starting Auth0 popup login...");
      // Use popup login to stay on the same page
      await loginWithPopup({
        authorizationParams: {
          login_hint: email,
          redirect_uri: window.location.origin,
        },
      });
      console.log("Auth0 login successful!");
      // Manually call onLogin after successful popup login
      setIsAuthenticating(false);
      onLogin();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message?.includes("popup")) {
        setLoginError(
          "Popup was blocked. Please allow popups for this site and try again.",
        );
      } else {
        setLoginError(err.message || "Login failed. Please try again.");
      }
      setIsAuthenticating(false);
    }
  };

  const handleSocialLogin = async (connection: string) => {
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      await loginWithPopup({
        authorizationParams: {
          connection,
          redirect_uri: window.location.origin,
        },
      });
      console.log("Social login successful!");
      // Manually call onLogin after successful popup login
      setIsAuthenticating(false);
      onLogin();
    } catch (err: any) {
      console.error("Social login error:", err);
      setLoginError(err.message || "Login failed. Please try again.");
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute w-full h-full object-cover z-0"
          style={{
            objectFit: "cover",
          }}
          onLoadedData={(e) => {
            // Ensure video starts playing immediately
            const video = e.currentTarget;
            console.log("Video loaded successfully");
            video.play().catch((err) => {
              // Fallback if autoplay is blocked
              console.log("Autoplay was prevented:", err);
            });
          }}
          onError={(e) => {
            console.error("Video failed to load:", e);
          }}
          onLoadStart={() => {
            console.log("Video loading started...");
          }}
        >
          <source
            src="https://res.cloudinary.com/dqetulhuq/video/upload/v1764609933/Login_page_video_be6gud.mov"
            type="video/mp4"
          />
          {/* Fallback for older browsers */}
          Your browser does not support the video tag.
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-1"></div>

        {/* Fallback gradient background if video fails to load */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #8b5a5a 100%)",
            zIndex: -1,
          }}
        ></div>
      </div>

      {/* UIP Logo - appears before panel */}
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          animation: "logoFadeOut 0.2s ease-out 0.6s forwards",
        }}
      >
        <div className="flex items-center" style={{ letterSpacing: "-0.05em" }}>
          {/* U - Blue */}
          <span
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #13294b 0%, #1e3a5f 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            U
          </span>
          {/* I - Orange */}
          <span
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #e84a27 0%, #ff6b4a 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            I
          </span>
          {/* P - Blue */}
          <span
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #13294b 0%, #1e3a5f 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            P
          </span>
        </div>
      </div>

      {/* Help Button */}
      <button
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gray-900/80 backdrop-blur-sm text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg z-10"
        onClick={() =>
          alert("Need help? Contact support at support@uipathfinder.edu")
        }
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md px-4 relative z-10 py-8">
        {/* Title */}
        <div
          className="text-center mb-6"
          style={{
            animation: "titleFadeIn 0.3s ease-out 0.6s backwards",
          }}
        >
          <h1 className="text-white text-4xl mb-4 drop-shadow-lg font-bold">
            Welcome to UIPathFinder
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-16 bg-orange-500 rounded"></div>
            <div className="h-1 w-16 bg-white rounded"></div>
            <div className="h-1 w-16 bg-orange-500 rounded"></div>
          </div>
        </div>

        {/* Login Form */}
        <div
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden"
          style={{
            animation: "scaleIn 0.2s ease-in-out 0.6s backwards",
          }}
        >
          <style>{`
            @keyframes scaleIn {
              0% {
                transform: scale(0.3);
                opacity: 0;
              }
              70% {
                transform: scale(1.05);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @keyframes logoFadeOut {
              0% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }

            @keyframes titleFadeIn {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
          `}</style>
          {/* Form Header */}
          <div className="bg-[#1e3a5f] text-white px-8 py-6">
            <h2 className="text-2xl mb-2">Sign In</h2>
            <p className="text-gray-300 text-sm">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-6">
            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email (optional)
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@illinois.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 border-gray-300 rounded-lg px-4 py-3"
                disabled={isAuthenticating}
              />
            </div>

            {/* Note: Password field removed - Auth0 handles authentication */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              ℹ️ Click "Log In" to authenticate securely through Auth0
            </div>

            {/* Forgot Password */}
            <div>
              <button
                type="button"
                className="text-gray-700 text-sm hover:underline"
                onClick={() =>
                  alert(
                    "Password reset functionality would be implemented here",
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAuthenticating || isLoading}
              >
                {isAuthenticating || isLoading
                  ? "Authenticating..."
                  : "Log In with Auth0"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-6 rounded-lg transition-colors disabled:opacity-50"
                onClick={() => handleSocialLogin("google-oauth2")}
                disabled={isAuthenticating || isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white drop-shadow-lg">
          <p className="flex items-center justify-center gap-2 text-lg font-medium">
            Illini Pride 🟦🟧
          </p>
        </div>
      </div>
    </div>
  );
}
