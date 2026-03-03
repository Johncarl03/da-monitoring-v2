"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [history, setHistory] = useState([]);
  const [masterlist, setMasterlist] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // --- DYNAMIC DATE INITIALIZATION ---
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  
  const [month, setMonth] = useState(currentMonthName);
  const [year, setYear] = useState(currentYear.toString());
  const [viewMode, setViewMode] = useState('submitted');

  // Gagawa ng listahan ng taon (Last year, Current, at next 3 years)
  const yearsOptions = Array.from({ length: 5 }, (_, i) => (currentYear - 1 + i).toString());

  useEffect(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    const savedYear = localStorage.getItem('selectedYear');
    if (savedMonth) setMonth(savedMonth);
    if (savedYear) setYear(savedYear);

    const unsubMaster = onSnapshot(collection(db, "farmers"), (snap) => {
      setMasterlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubMaster();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "distribution_history"), 
      where("month", "==", month), 
      where("year", "==", year)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = data.sort((a, b) => {
        if (a.municipality !== b.municipality) return a.municipality?.localeCompare(b.municipality);
        if (a.barangay !== b.barangay) return a.barangay?.localeCompare(b.barangay);
        return a.name?.localeCompare(b.name);
      });
      setHistory(sortedData);
    });

    localStorage.setItem('selectedMonth', month);
    localStorage.setItem('selectedYear', year);
    
    return () => unsub();
  }, [month, year]);

  const submittedNames = new Set(history.map(item => item.name?.toLowerCase().trim()));
  const missingRecords = history.length > 0 
    ? masterlist.filter(farmer => !submittedNames.has(farmer.name?.toLowerCase().trim()))
    : [];

  const filterBySearch = (dataList) => {
    if (!searchTerm.trim()) return []; 
    const s = searchTerm.toLowerCase();
    return dataList.filter(item => 
      item.municipality?.toLowerCase().includes(s) ||
      item.barangay?.toLowerCase().includes(s) ||
      item.name?.toLowerCase().includes(s) ||
      item.association?.toLowerCase().includes(s)
    ).sort((a, b) => {
      const aMuni = a.municipality?.toLowerCase() || "";
      const bMuni = b.municipality?.toLowerCase() || "";
      if (aMuni !== bMuni) return aMuni.localeCompare(bMuni);
      const aBrgy = a.barangay?.toLowerCase() || "";
      const bBrgy = b.barangay?.toLowerCase() || "";
      if (aBrgy !== bBrgy) return aBrgy.localeCompare(bBrgy);
      return (a.name || "").localeCompare(b.name || "");
    });
  };

  const searchedSubmitted = filterBySearch(history);
  const searchedMissing = filterBySearch(missingRecords);
  const filteredDisplay = viewMode === 'submitted' ? searchedSubmitted : searchedMissing;

  const handleLogout = async () => {
    if (confirm("Logout from system?")) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={containerStyle}
    >
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/da-logo.png" alt="DA Logo" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
          <span style={{ fontWeight: '900', letterSpacing: '1.5px', fontSize: '14px', color: '#1b5e20' }}>DA MONITORING</span>
        </div>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', height: '100%' }}>
          <a href="/admin/matcher" style={navLinkStyle(pathname, '/admin/matcher')}>STUB MATCHER</a>
          <a href="/admin/importer" style={navLinkStyle(pathname, '/admin/importer')}>MASTERLIST</a>
          <a href="/admin/history" style={navLinkStyle(pathname, '/admin/history')}>HISTORY</a>
          <button onClick={handleLogout} style={logoutBtn}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', fontStyle: 'italic', margin: 0, letterSpacing: '-1px', color: '#1b5e20' }}>HISTORY LOGS</h1>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '14px', color: '#1b5e20', pointerEvents: 'none', zIndex: 1 }}>🔍</span>
            <motion.input 
              whileFocus={{ scale: 1.02, boxShadow: "0 0 15px rgba(27, 94, 32, 0.1)", borderColor: "#1b5e20" }}
              type="text" 
              placeholder="Search Municipality, Barangay, Name, or Fa..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={searchInputStyle} 
            />
          </div>
        </header>

        <div style={filterBar}>
          <div style={filterGroup}>
            <label style={labelStyle}>MONTH</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={filterGroup}>
            <label style={labelStyle}>YEAR</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
              {yearsOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: '50px' }}>
          <AnimatePresence mode="wait">
            {searchTerm.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', gap: '12px', marginBottom: '25px', marginTop: '10px' }}
              >
                <button onClick={() => setViewMode('submitted')} style={viewMode === 'submitted' ? activeTab : inactiveTab}>
                  MATCHED ({searchedSubmitted.length})
                </button>
                <button onClick={() => setViewMode('missing')} style={viewMode === 'missing' ? activeTabRed : inactiveTab}>
                  MISSING ({searchedMissing.length})
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div layout style={tableWrapper}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#f9fdf9' }}>
              <tr>
                <th style={thStyle}>FARMER NAME</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>FA</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>MUNICIPALITY</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>BARANGAY</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredDisplay.length > 0 ? filteredDisplay.map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.id} 
                    style={trStyle}
                    whileHover={{ backgroundColor: '#f1f8e9' }}
                  >
                    <td style={{ padding: '16px 20px', fontWeight: '900', textTransform: 'uppercase', color: '#1b5e20' }}>{item.name}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={faBadgeStyle}>{item.association || item.fa || '---'}</span>
                    </td>
                    <td style={{ padding: '16px 20px', opacity: 0.8, textAlign: 'center', color: '#333' }}>{item.municipality}</td>
                    <td style={{ padding: '16px 20px', opacity: 0.8, textAlign: 'center', color: '#333' }}>{item.barangay}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {viewMode === 'submitted' ? (
                        <button 
                          onClick={() => { if(confirm("Delete record?")) deleteDoc(doc(db, "distribution_history", item.id)) }} 
                          style={deleteBtn}
                        >DELETE</button>
                      ) : (
                        <span style={{ color: '#c62828', fontWeight: 'bold', fontSize: '10px' }}>❌ MISSING</span>
                      )}
                    </td>
                  </motion.tr>
                )) : (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan="5" style={emptyState}>
                      {searchTerm.trim() 
                             ? "No records found." 
                             : "Search by Name, Municipality, or Barangay to display results."}
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      </div>
    </motion.div>
  );
}

// THEMED STYLES (Keep existing)
const containerStyle = { minHeight: '100vh', backgroundColor: '#e8f5e9', color: '#333', fontFamily: 'sans-serif' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #c8e6c9', position: 'sticky', top: 0, zIndex: 1000 };
const logoutBtn = { backgroundColor: '#c62828', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', marginLeft: '10px' };

const searchInputStyle = { 
  padding: '12px 20px 12px 45px',
  width: '400px',
  borderRadius: '50px', 
  border: '1px solid #c8e6c9', 
  backgroundColor: '#ffffff', 
  color: '#333', 
  outline: 'none', 
  fontSize: '13px',
  transition: '0.3s'
};

const faBadgeStyle = {
  backgroundColor: '#c8e6c9',
  color: '#1b5e20',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '10px',
  fontWeight: 'bold',
  textTransform: 'uppercase'
};

const filterBar = { display: 'flex', gap: '15px', marginBottom: '25px' };
const filterGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '9px', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', color: '#1b5e20' };
const selectStyle = { padding: '8px 15px', borderRadius: '6px', backgroundColor: '#ffffff', color: '#333', border: '1px solid #c8e6c9', outline: 'none', fontSize: '12px', cursor: 'pointer' };
const tableWrapper = { backgroundColor: '#ffffff', borderRadius: '15px', border: '1px solid #c8e6c9', overflow: 'hidden' };
const thStyle = { padding: '18px 20px', textAlign: 'left', fontSize: '10px', letterSpacing: '1px', opacity: 0.6, fontWeight: '900', color: '#1b5e20' };
const trStyle = { borderBottom: '1px solid #f1f8e9', transition: '0.2s' };
const deleteBtn = { color: '#c62828', background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.2)', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' };
const activeTab = { background: '#1b5e20', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '25px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' };
const activeTabRed = { background: '#c62828', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '25px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' };
const inactiveTab = { background: '#ffffff', color: '#81c784', border: '1px solid #c8e6c9', padding: '10px 22px', borderRadius: '25px', cursor: 'pointer', fontSize: '11px' };
const emptyState = { padding: '100px', textAlign: 'center', opacity: 0.4, fontSize: '13px', color: '#1b5e20' };

const navLinkStyle = (current, path) => ({
  color: current === path ? '#1b5e20' : '#81c784',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '11px',
  borderBottom: current === path ? '2px solid #1b5e20' : 'none',
  padding: '23px 0',
  display: 'inline-block',
  transition: '0.3s'
});