import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { HelpCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simply navigate to the main app
    onLogin();
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          className="absolute min-w-full min-h-full object-cover"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onLoadedData={(e) => {
            // Ensure video starts playing immediately
            const video = e.currentTarget;
            video.play().catch(() => {
              // Fallback if autoplay is blocked
              console.log('Autoplay was prevented');
            });
          }}
        >
          <source src="https://res.cloudinary.com/dqetulhuq/video/upload/v1764609933/Login_page_video_be6gud.mov" type="video/mp4" />
          {/* Fallback for older browsers */}
          Your browser does not support the video tag.
        </video>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
        
        {/* Fallback gradient background if video fails to load */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #8b5a5a 100%)'
          }}
        ></div>
      </div>

      {/* UIP Logo - appears before panel */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          animation: 'logoFadeOut 0.2s ease-out 0.6s forwards'
        }}
      >
        <div className="flex items-center" style={{ letterSpacing: '-0.05em' }}>
          {/* U - Blue */}
          <span
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              background: `linear-gradient(rgba(19, 41, 75, 0.8), rgba(19, 41, 75, 0.8)), url('https://res.cloudinary.com/dqetulhuq/image/upload/v1733182771/pngtree-asphalt-road-texture-background-image_464253_ndc9vw.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            U
          </span>
          {/* I - Orange */}
          <span
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              background: `linear-gradient(rgba(232, 74, 39, 0.8), rgba(232, 74, 39, 0.8)), url('https://res.cloudinary.com/dqetulhuq/image/upload/v1733182771/pngtree-asphalt-road-texture-background-image_464253_ndc9vw.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            I
          </span>
          {/* P - Blue */}
          <span
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              background: `linear-gradient(rgba(19, 41, 75, 0.8), rgba(19, 41, 75, 0.8)), url('https://res.cloudinary.com/dqetulhuq/image/upload/v1733182771/pngtree-asphalt-road-texture-background-image_464253_ndc9vw.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            P
          </span>
        </div>
      </div>

      {/* Help Button */}
      <button
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gray-900/80 backdrop-blur-sm text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg z-10"
        onClick={() => alert('Need help? Contact support at support@uipathfinder.edu')}
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md px-4 relative z-10">
        {/* Title */}
        <div 
          className="text-center mb-8"
          style={{
            animation: 'titleFadeIn 0.3s ease-out 0.6s backwards'
          }}
        >
          <h1 className="text-white text-4xl mb-4 drop-shadow-lg">Welcome to UIPathFinder</h1>
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
            animation: 'scaleIn 0.2s ease-in-out 0.6s backwards'
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
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@illinois.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            {/* Forgot Password */}
            <div>
              <button
                type="button"
                className="text-gray-700 text-sm hover:underline"
                onClick={() => alert('Password reset functionality would be implemented here')}
              >
                Forgot password?
              </button>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-lg transition-colors"
              >
                Log In
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-50 py-6 rounded-lg transition-colors"
                onClick={() => alert('Create account functionality would be implemented here')}
              >
                Create Account
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white drop-shadow-lg">
          <p className="flex items-center justify-center gap-2">
            Illini Pride 🟦🟧
          </p>
        </div>
      </div>
    </div>
  );
}