"use client";
import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DALogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorShake(false);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        alert("Paki-verify muna ang iyong email.");
        await signOut(auth);
        setLoading(false);
        return;
      }
      router.push('/admin/matcher'); 
    } catch (error) {
      setErrorShake(true);
      alert("Invalid Email o Passcode.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { alert("Pakisulat muna ang iyong Authorized Email."); return; }
    if (confirm(`Magpapadala kami ng password reset link sa ${email}.`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Reset link sent!");
      } catch (error) { alert("Error: Hindi mahanap ang email."); }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={sharedContainerStyle}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, opacity: 1 }}
        transition={errorShake ? { duration: 0.4 } : { delay: 0.2 }}
        style={sharedCardStyle}
      >
        {/* --- DA LOGO BACK TO 60PX --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <motion.img 
            src="/da-logo.png" 
            alt="DA Logo"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{ 
              width: '60px', // Original size restored
              height: '60px', 
              objectFit: 'contain' 
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h1 style={sharedTitleStyle}>DA MONITORING</h1>
          <p style={sharedSubtitleStyle}>ADMIN PORTAL</p>
        </div>

        <form onSubmit={handleLogin} style={sharedFormStyle}>
          <motion.input 
            whileFocus={{ scale: 1.02, backgroundColor: '#ffffff', borderColor: '#1b5e20' }}
            type="email" placeholder="Authorized Email" style={sharedInputStyle} 
            value={email} onChange={(e) => setEmail(e.target.value)} required 
          />
          <motion.input 
            whileFocus={{ scale: 1.02, backgroundColor: '#ffffff', borderColor: '#1b5e20' }}
            type="password" placeholder="Passcode" style={sharedInputStyle} 
            value={password} onChange={(e) => setPassword(e.target.value)} required 
          />
          
          <div style={{ textAlign: 'right', marginTop: '-5px' }}>
            <button type="button" onClick={handleForgotPassword} style={forgotButtonStyle}>
              Forgot Passcode?
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#2e7d32' }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={{ ...sharedButtonStyle, backgroundColor: loading ? '#003300' : '#1b5e20' }} 
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </motion.button>
        </form>

        <div style={sharedFooterLinkStyle}>
          <p style={sharedSmallTextStyle}>
            No access yet? <Link href="/register" style={sharedLinkStyle}>Create Account</Link>
          </p>
        </div>
      </motion.div>

      <p style={sharedCopyrightStyle}>Official Monitoring System • 2026</p>
    </motion.div>
  );
}

// --- STYLES (Light Green Theme) ---
const sharedContainerStyle = { 
  minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', 
  justifyContent: 'center', backgroundColor: '#e8f5e9', fontFamily: 'sans-serif', margin: 0, padding: '20px' 
};

const sharedTitleStyle = { 
  color: '#1b5e20', fontSize: '28px', fontStyle: 'italic', fontWeight: '900', margin: '0', 
  textTransform: 'uppercase', letterSpacing: '-1px' 
};

const sharedSubtitleStyle = { 
  color: '#4caf50', fontSize: '9px', fontWeight: '900', letterSpacing: '3px', margin: '5px 0 0', textTransform: 'uppercase' 
};

const sharedCardStyle = { 
  width: '100%', maxWidth: '380px', backgroundColor: '#ffffff', padding: '35px', 
  borderRadius: '35px', border: '1px solid #c8e6c9', boxShadow: '0 15px 35px rgba(27, 94, 32, 0.1)', textAlign: 'center' 
};

const sharedFormStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };

const sharedInputStyle = { 
  width: '100%', backgroundColor: '#f1f8e9', border: '1px solid #c8e6c9', color: '#333', 
  padding: '14px', borderRadius: '10px', outline: 'none', fontSize: '13px', boxSizing: 'border-box', transition: '0.3s' 
};

const sharedButtonStyle = { 
  width: '100%', color: 'white', fontWeight: '900', padding: '14px', borderRadius: '50px', 
  border: 'none', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px', marginTop: '10px', transition: '0.3s' 
};

const forgotButtonStyle = { background: 'none', border: 'none', color: '#1b5e20', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' };
const sharedFooterLinkStyle = { marginTop: '20px', borderTop: '1px solid #e8f5e9', paddingTop: '15px' };
const sharedSmallTextStyle = { color: '#666', fontSize: '10px', margin: '0' };
const sharedLinkStyle = { color: '#1b5e20', textDecoration: 'none', fontWeight: 'bold' };
const sharedCopyrightStyle = { marginTop: '30px', color: '#81c784', fontSize: '8px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' };