"use client";
import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DARegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Hindi magkatugma ang passcode.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      
      alert("Account created! Nagpadala kami ng verification link sa iyong email. Paki-verify muna bago mag-login.");

      await signOut(auth);
      router.push('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert("Ang email na ito ay may account na.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={sharedContainerStyle}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={sharedCardStyle}
      >
        {/* --- DA LOGO INSIDE THE CARD (60PX) --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <motion.img 
            src="/da-logo.png" 
            alt="DA Logo"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{ 
              width: '60px', 
              height: '60px', 
              objectFit: 'contain' 
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h1 style={sharedTitleStyle}>DA MONITORING</h1>
          <p style={sharedSubtitleStyle}>CREATE ADMIN ACCOUNT</p>
        </div>

        <form onSubmit={handleRegister} style={sharedFormStyle}>
          <motion.input 
            whileFocus={{ scale: 1.02, backgroundColor: '#ffffff', borderColor: '#1b5e20' }}
            type="email" 
            placeholder="Authorized Email" 
            style={sharedInputStyle} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <motion.input 
            whileFocus={{ scale: 1.02, backgroundColor: '#ffffff', borderColor: '#1b5e20' }}
            type="password" 
            placeholder="Create Passcode" 
            style={sharedInputStyle} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
          />
          <motion.input 
            whileFocus={{ scale: 1.02, backgroundColor: '#ffffff', borderColor: '#1b5e20' }}
            type="password" 
            placeholder="Confirm Passcode" 
            style={sharedInputStyle} 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#2e7d32' }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={{
              ...sharedButtonStyle,
              backgroundColor: loading ? '#003300' : '#1b5e20',
              cursor: loading ? 'not-allowed' : 'pointer'
            }} 
            disabled={loading}
          >
            {loading ? "CREATING ACCOUNT..." : "REGISTER ACCOUNT"}
          </motion.button>
        </form>

        <div style={sharedFooterLinkStyle}>
          <p style={sharedSmallTextStyle}>
            Already have an account? <Link href="/login" style={sharedLinkStyle}>Login Here</Link>
          </p>
        </div>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={sharedCopyrightStyle}
      >
        Official Monitoring System • 2026
      </motion.p>
    </motion.div>
  );
}

// --- UPDATED LIGHT SAGE THEME (MATCHING LOGIN) ---
const sharedContainerStyle = { 
  minHeight: '100vh', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  justifyContent: 'center', 
  backgroundColor: '#e8f5e9', 
  fontFamily: 'sans-serif', 
  margin: 0, 
  padding: '20px' 
};

const sharedTitleStyle = { 
  color: '#1b5e20', 
  fontSize: '28px', 
  fontStyle: 'italic', 
  fontWeight: '900', 
  margin: '0', 
  textTransform: 'uppercase', 
  letterSpacing: '-1px' 
};

const sharedSubtitleStyle = { 
  color: '#4caf50', 
  fontSize: '9px', 
  fontWeight: '900', 
  letterSpacing: '3px', 
  margin: '5px 0 0', 
  textTransform: 'uppercase' 
};

const sharedCardStyle = { 
  width: '100%', 
  maxWidth: '380px', 
  backgroundColor: '#ffffff', 
  padding: '35px', 
  borderRadius: '35px', 
  border: '1px solid #c8e6c9', 
  boxShadow: '0 15px 35px rgba(27, 94, 32, 0.1)', 
  textAlign: 'center' 
};

const sharedFormStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };

const sharedInputStyle = { 
  width: '100%', 
  backgroundColor: '#f1f8e9', 
  border: '1px solid #c8e6c9', 
  color: '#333', 
  padding: '14px', 
  borderRadius: '10px', 
  outline: 'none', 
  fontSize: '13px', 
  boxSizing: 'border-box', 
  transition: '0.3s' 
};

const sharedButtonStyle = { 
  width: '100%', 
  color: 'white', 
  fontWeight: '900', 
  padding: '14px', 
  borderRadius: '50px', 
  border: 'none', 
  textTransform: 'uppercase', 
  fontSize: '10px', 
  letterSpacing: '2px', 
  marginTop: '10px', 
  transition: '0.3s' 
};

const sharedFooterLinkStyle = { 
  marginTop: '20px', 
  borderTop: '1px solid #e8f5e9', 
  paddingTop: '15px' 
};

const sharedSmallTextStyle = { 
  color: '#666', 
  fontSize: '10px', 
  margin: '0' 
};

const sharedLinkStyle = { 
  color: '#1b5e20', 
  textDecoration: 'none', 
  fontWeight: 'bold' 
};

const sharedCopyrightStyle = { 
  marginTop: '30px', 
  color: '#81c784', 
  fontSize: '8px', 
  fontWeight: 'bold', 
  letterSpacing: '2px', 
  textTransform: 'uppercase' 
};