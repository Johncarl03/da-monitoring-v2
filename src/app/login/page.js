"use client";
import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DALogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' }); 
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMsg({ type: 'success', text: 'Access Granted! Redirecting...' });
      setTimeout(() => router.push('/admin/matcher'), 1500);
    } catch (error) {
      setMsg({ type: 'error', text: 'Invalid Email or Passcode.' });
      setLoading(false);
    }
  };

  // FIXED RESET LOGIC
  const handleForgotPassword = async () => {
    if (!email) { 
      setMsg({ type: 'error', text: 'Please enter your Authorized Email first.' }); 
      return; 
    }
    
    // Set loading indicator specifically for reset
    setMsg({ type: 'success', text: `Attempting to send reset link...` });
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg({ type: 'success', text: 'Reset link sent! Check your Inbox or Spam.' });
    } catch (error) { 
      // Handle common Firebase errors like user-not-found
      const errorMessage = error.code === 'auth/user-not-found' 
        ? 'Error: Email not registered.' 
        : 'Error: Could not send reset email.';
      setMsg({ type: 'error', text: errorMessage }); 
    }
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>

      <div style={centerWrapper}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={glassCardStyle}
        >
          {/* UPDATED LOGO WRAPPER TO CIRCLE */}
          <div style={logoWrapper}>
             <img src="/da-logo.png" alt="DA Logo" style={logoStyle} />
          </div>

          <header style={{ marginBottom: '10px' }}>
            <h1 style={titleStyle}>ADMIN PORTAL</h1>
            <p style={subtitleStyle}>LOGIN AS ADMINISTRATOR</p> 
          </header>

          <AnimatePresence mode="wait">
            {msg.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                style={notificationStyle(msg.type)}
              >
                {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span style={{ marginLeft: '5px' }}>{msg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} style={formStyle}>
            <div style={inputWrapper}>
              <Mail size={16} style={inputIcon} />
              <input 
                type="email" 
                placeholder="Authorized Email" 
                style={transparentInputStyle} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div style={inputWrapper}>
              <Lock size={16} style={inputIcon} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Passcode" 
                style={{ ...transparentInputStyle, paddingRight: '40px' }} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeButtonStyle}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
              <button type="button" onClick={handleForgotPassword} style={forgotButtonStyle}>
                Forgot Passcode?
              </button>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              style={{ 
                ...loginButtonStyle, 
                backgroundColor: loading ? '#033a2a' : '#065f46',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }} 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "LOGIN"}
            </motion.button>
          </form>

          <div style={footerLinkContainer}>
            <p style={footerText}>
              Don't have access? <Link href="/register" style={registerLink}>Register Admin</Link>
            </p>
          </div>
        </motion.div>

        <div style={bottomSecureStyle}>
          <ShieldCheck size={12} />
          <span>SECURED GOVERNMENT PORTAL • 2026</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
      `}</style>
    </div>
  );
}

// --- UPDATED CSS STYLES ---
const containerStyle = { 
  height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
  backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000")', 
  backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'Inter, sans-serif', position: 'relative'
};

const overlayStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 20, 0, 0.75)', zIndex: 0 };
const centerWrapper = { zIndex: 1, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

const glassCardStyle = { 
  width: '90%', maxWidth: '350px', backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '30px 25px', 
  borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.15)', 
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', textAlign: 'center' 
};

const logoWrapper = { 
  width: '75px', height: '75px', backgroundColor: '#fff', 
  borderRadius: '50%', display: 'flex', justifyContent: 'center', 
  alignItems: 'center', margin: '0 auto 15px', padding: '8px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
};

const logoStyle = { width: '100%', height: 'auto', objectFit: 'contain' };
const titleStyle = { color: '#ffffff', fontSize: '20px', fontWeight: '900', margin: '0', letterSpacing: '1px' };
const subtitleStyle = { color: '#4ade80', fontSize: '9px', fontWeight: '800', letterSpacing: '2px', marginTop: '2px' };

const notificationStyle = (type) => ({
  padding: '10px', borderRadius: '10px', fontSize: '11px', marginBottom: '10px',
  display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
  backgroundColor: type === 'error' ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.1)',
  color: type === 'error' ? '#ff8080' : '#4ade80',
  border: `1px solid ${type === 'error' ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)'}`
});

const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIcon = { position: 'absolute', left: '12px', color: '#4ade80' };
const transparentInputStyle = { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '10px 10px 10px 38px', borderRadius: '10px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const eyeButtonStyle = { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' };
const forgotButtonStyle = { background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: '700', fontSize: '10px' };
const loginButtonStyle = { width: '100%', color: 'white', fontWeight: '800', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '13px', cursor: 'pointer', marginTop: '5px' };
const footerLinkContainer = { marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' };
const footerText = { color: '#d1d5db', fontSize: '12px', margin: 0 };
const registerLink = { color: '#4ade80', textDecoration: 'none', fontWeight: '800' };
const bottomSecureStyle = { marginTop: '20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' };