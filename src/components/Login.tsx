import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Shield, User, Mail, Lock } from 'lucide-react';

type LoginMode = 'admin' | 'member';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<LoginMode>('admin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage(`${mode === 'admin' ? 'Admin' : 'Member'} login successful.`);
    } catch (error: any) {
      setMessage(error?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Please enter your email first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
    } catch (error: any) {
      setMessage(error?.message || 'Error sending reset email.');
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
              onClick={() => {
                setMode('admin');
                setMessage('Admin mode selected.');
              }}
              className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all group bg-white shadow-sm ${
                mode === 'admin'
                  ? 'border-royal-blue'
                  : 'border-slate-100 hover:border-royal-blue'
              }`}
            >
              <Shield className="w-8 h-8 text-royal-blue mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-royal-blue">Admin Login</span>
            </button>

            <button
              onClick={() => {
                setMode('member');
                setMessage('Member mode selected.');
              }}
              className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all group bg-white shadow-sm ${
                mode === 'member'
                  ? 'border-royal-blue'
                  : 'border-slate-100 hover:border-royal-blue'
              }`}
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

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20 transition-all"
              />
            </div>

            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full py-3 bg-royal-blue hover:opacity-90 text-white font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : `Sign In as ${mode === 'admin' ? 'Admin' : 'Member'}`}
            </button>

            <button
              onClick={handleForgotPassword}
              className="w-full py-3 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl shadow-lg shadow-gold/20 transition-all transform active:scale-95"
            >
              Forgot Password
            </button>
          </div>

          {message && (
            <p className="text-center text-sm text-royal-blue font-medium">
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
