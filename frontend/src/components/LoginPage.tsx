import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { HelpCircle } from 'lucide-react';
import loginBgImage from 'figma:asset/0f6d07a177a0f4a77a788068df4136b4ce2f2338.png';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { loginWithRedirect } = useAuth0();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and go to main page
    onLogin();
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #8b5a5a 100%)'
      }}
    >
      {/* Help Button */}
      <button
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
        onClick={() => alert('Need help? Contact support at support@uipathfinder.edu')}
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl mb-4">Welcome to UIPathFinder</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-16 bg-orange-500 rounded"></div>
            <div className="h-1 w-16 bg-white rounded"></div>
            <div className="h-1 w-16 bg-orange-500 rounded"></div>
          </div>
        </div>

        {/* Login Form + Social Login Buttons */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-[#1e3a5f] text-white px-8 py-6">
            <h2 className="text-2xl mb-2">Sign In</h2>
            <p className="text-gray-300 text-sm">
              Enter your credentials or choose a provider
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
          {/* Social Login Buttons - Modern Vertical Style */}
          <div className="px-8 pb-8 flex flex-col gap-4">
            <button
              className="w-full flex items-center gap-4 bg-white text-gray-900 font-semibold py-4 rounded-lg hover:bg-gray-900 transition-colors shadow"
              onClick={() => loginWithRedirect({ connection: "apple" } as any)}
            >
              <span className="inline-block w-7 h-7 flex items-center justify-center">
                {/* Apple SVG */}
               </span>
              <span className="text-left flex-1">Log in with Apple</span>
            </button>
            <button
              className="w-full flex items-center gap-4 bg-white text-gray-900 font-semibold py-4 rounded-lg hover:bg-gray-900 transition-colors shadow"
               onClick={() => loginWithRedirect({ connection: "google-oauth2" } as any)}
            >
              <span className="inline-block w-7 h-7 flex items-center justify-center">
                {/* Google SVG */}
                
              </span>
              <span className="text-left flex-1">Log in with Google</span>
            </button>
            <button
              className="w-full flex items-center gap-4 bg-white text-gray-900 font-semibold py-4 rounded-lg hover:bg-gray-900 transition-colors shadow"
              onClick={() => loginWithRedirect({ connection: "windowslive" } as any)}
            >
              <span className="inline-block w-7 h-7 flex items-center justify-center">
                {/* Microsoft SVG */}
                 </span>
              <span className="text-left flex-1">Log in with Microsoft</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white">
          <p className="flex items-center justify-center gap-2">
            Illini Pride 🟦🟧
          </p>
        </div>
      </div>
    </div>
  );
}
