import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Shield, User, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage("Error sending reset email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="max-w-md w-full p-8 space-y-8">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display text-royal-blue font-bold tracking-tighter"
          >
            ASTRA ANALYTICS
          </motion.h1>
          <p className="mt-2 text-slate-500 uppercase tracking-widest text-xs font-semibold">
            Luxury Marketing Intelligence
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-2xl hover:border-royal-blue transition-all group bg-white shadow-sm"
            >
              <Shield className="w-8 h-8 text-royal-blue mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-royal-blue">Admin Login</span>
            </button>
            <button
              onClick={handleGoogleLogin}
              className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-2xl hover:border-royal-blue transition-all group bg-white shadow-sm"
            >
              <User className="w-8 h-8 text-royal-blue mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-royal-blue">Member Login</span>
            </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or manage account</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20 transition-all"
              />
            </div>
            
            <button
              onClick={handleForgotPassword}
              className="w-full py-3 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl shadow-lg shadow-gold/20 transition-all transform active:scale-95"
            >
              Forgot Password
            </button>
          </div>

          {message && (
            <p className="text-center text-sm text-royal-blue font-medium animate-pulse">
              {message}
            </p>
          )}
        </div>

        <div className="text-center pt-8">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2026 Astra Analytics. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
