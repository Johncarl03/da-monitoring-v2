"use client";
import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DALogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Notification state
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
          <div style={logoWrapper}>
             <img src="/da-logo.png" alt="DA Logo" style={logoStyle} />
          </div>

          <header style={{ marginBottom: '20px' }}>
            <h1 style={titleStyle}>ADMIN PORTAL</h1>
            <p style={subtitleStyle}>PRIVATE ACCESS ONLY</p> 
          </header>

          <AnimatePresence>
            {msg.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  backgroundColor: msg.type === 'error' ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.1)',
                  color: msg.type === 'error' ? '#ff8080' : '#4ade80',
                  border: `1px solid ${msg.type === 'error' ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)'}`
                }}
              >
                {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                {msg.text}
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

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              style={{ 
                ...loginButtonStyle, 
                backgroundColor: loading ? '#033a2a' : '#065f46',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                marginTop: '10px'
              }} 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "LOGIN"}
            </motion.button>
          </form>

          <div style={footerLinkContainer}>
            <p style={footerText}>
              System monitoring is active. Unauthorized access is prohibited.
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
        body { margin: 0; padding: 0; overflow: hidden; }
      `}</style>
    </div>
  );
}

// --- CSS STYLES ---
const containerStyle = { 
  height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
  backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000")', 
  backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: 'Inter, sans-serif', position: 'relative'
};
const overlayStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 20, 0, 0.85)', zIndex: 0 };
const centerWrapper = { zIndex: 1, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const glassCardStyle = { width: '90%', maxWidth: '350px', backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '35px 25px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', textAlign: 'center' };
const logoWrapper = { width: '65px', height: '65px', backgroundColor: '#fff', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 12px' };
const logoStyle = { width: '45px', height: '45px', objectFit: 'contain' };
const titleStyle = { color: '#ffffff', fontSize: '20px', fontWeight: '900', margin: '0', letterSpacing: '1px' };
const subtitleStyle = { color: '#4ade80', fontSize: '9px', fontWeight: '800', letterSpacing: '2px', marginTop: '2px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIcon = { position: 'absolute', left: '12px', color: '#4ade80' };
const transparentInputStyle = { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '10px 10px 10px 38px', borderRadius: '10px', outline: 'none', fontSize: '14px', boxSizing: 'box-border' };
const eyeButtonStyle = { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' };
const loginButtonStyle = { width: '100%', color: 'white', fontWeight: '800', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '13px', cursor: 'pointer', marginTop: '5px' };
const footerLinkContainer = { marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' };
const footerText = { color: '#9ca3af', fontSize: '10px', margin: 0, fontStyle: 'italic' };
const bottomSecureStyle = { marginTop: '20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' };