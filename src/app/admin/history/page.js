"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Users, Database, LogOut, Search, 
  Calendar, Trash2, AlertCircle, CheckCircle2, Filter
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [history, setHistory] = useState([]);
  const [masterlist, setMasterlist] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  
  const [month, setMonth] = useState(currentMonthName);
  const [year, setYear] = useState(currentYear.toString());
  const [viewMode, setViewMode] = useState('submitted');

  const [deleteId, setDeleteId] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDoc(doc(db, "distribution_history", deleteId));
      setDeleteId(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => router.push('/login'));
  };

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
      return (a.name || "").localeCompare(b.name || "");
    });
  };

  const searchedSubmitted = filterBySearch(history);
  const searchedMissing = filterBySearch(missingRecords);
  const filteredDisplay = viewMode === 'submitted' ? searchedSubmitted : searchedMissing;

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <img src="/da-logo.png" alt="DA" style={styles.logoImg} />
          <div>
            <h2 style={styles.logoText}>RSBSA</h2>
            <p style={styles.logoTag}>ORIENTAL MINDORO</p>
          </div>
        </div>
        <nav style={styles.nav}>
          <SidebarBtn icon={<Database size={20}/>} label="Stub Matcher" active={pathname.includes('matcher')} onClick={() => router.push('/admin/matcher')} />
          <SidebarBtn icon={<Users size={20}/>} label="Masterlist" active={pathname.includes('importer')} onClick={() => router.push('/admin/importer')} />
          <SidebarBtn icon={<History size={20}/>} label="History Logs" active={pathname.includes('history')} onClick={() => router.push('/admin/history')} />
        </nav>
        <button onClick={() => setIsLogoutModalOpen(true)} style={styles.logoutBtn}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Distribution History</h1>
            <p style={styles.subtitle}>Track matched stubs and identify missing records</p>
          </div>
          
          <div style={styles.searchBox}>
            <Search size={18} color="#1b5e20" style={{ position: 'absolute', left: '15px', opacity: 0.6 }} />
            <input 
              placeholder="Type name or location..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
             <div style={styles.selectWrapper}>
                <Calendar size={14} style={{marginRight: '8px', color: '#1b5e20'}} />
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
             </div>
             <div style={styles.selectWrapper}>
                <Filter size={14} style={{marginRight: '8px', color: '#1b5e20'}} />
                <select value={year} onChange={(e) => setYear(e.target.value)} style={styles.select}>
                  {yearsOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
             </div>
          </div>

          <AnimatePresence>
            {searchTerm.trim() && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} style={styles.tabGroup}>
                <button onClick={() => setViewMode('submitted')} style={viewMode === 'submitted' ? styles.activeTab : styles.inactiveTab}>
                  <CheckCircle2 size={14} /> MATCHED ({searchedSubmitted.length})
                </button>
                <button onClick={() => setViewMode('missing')} style={viewMode === 'missing' ? styles.activeTabRed : styles.inactiveTab}>
                  <AlertCircle size={14} /> MISSING ({searchedMissing.length})
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>FARMER NAME</th>
                <th style={{...styles.th, textAlign: 'center'}}>FA</th>
                <th style={{...styles.th, textAlign: 'center'}}>MUNICIPALITY</th>
                <th style={styles.th}>BARANGAY</th>
                <th style={{...styles.th, textAlign: 'center', width: '150px'}}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisplay.length > 0 ? filteredDisplay.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.tdName}>{item.name}</td>
                  <td style={styles.tdCenter}>
                    <span style={styles.faBadge}>{item.association || item.fa || '---'}</span>
                  </td>
                  <td style={{...styles.tdCenter, color: '#64748b', fontSize: '13px'}}>{item.municipality}</td>
                  <td style={styles.tdDim}>{item.barangay}</td>
                  <td style={styles.tdCenter}>
                    {viewMode === 'submitted' ? (
                      <button 
                        onClick={() => setDeleteId(item.id)} 
                        className="delete-hover-btn" 
                        style={styles.delBtn}
                      >
                        <Trash2 size={14} /> DELETE
                      </button>
                    ) : (
                      <span style={styles.missingLabel}>UNCLAIMED</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>
                    <Search size={40} color="#c8e6c9" style={{marginBottom: '10px'}} /><br/>
                    {searchTerm.trim() ? "No results found." : "Start typing to view records."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODALS REMAIN THE SAME */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div style={styles.modalOverlay}>
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContent}>
              <div style={styles.modalIconBoxRed}><LogOut size={24} /></div>
              <h3 style={styles.modalTitle}>Confirm Logout</h3>
              <p style={styles.modalText}>Are you sure you want to logout your account?</p>
              <div style={styles.modalActions}>
                <button onClick={() => setIsLogoutModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleLogout} style={styles.confirmLogoutBtn}>Logout</button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteId && (
          <div style={styles.modalOverlay}>
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContent}>
              <div style={styles.modalIconBoxRed}><Trash2 size={24} /></div>
              <h3 style={styles.modalTitle}>Delete Record</h3>
              <p style={styles.modalText}>Are you sure you want to delete this historical record?</p>
              <div style={styles.modalActions}>
                <button onClick={() => setDeleteId(null)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={confirmDelete} style={styles.confirmLogoutBtn}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .delete-hover-btn { transition: all 0.2s ease; }
        .delete-hover-btn:hover { color: #e11d48 !important; transform: scale(1.05); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const SidebarBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
    backgroundColor: active ? '#f1f8e9' : 'transparent', color: active ? '#1b5e20' : '#81c784',
    border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%', textAlign: 'left', transition: '0.2s'
  }}>{icon} <span>{label}</span></button>
);

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#e8f5e9', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '260px', backgroundColor: '#fff', borderRight: '1px solid #c8e6c9', padding: '30px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  logoImg: { width: '38px', height: '38px' },
  logoText: { fontSize: '16px', fontWeight: '900', color: '#1b5e20', margin: 0 },
  logoTag: { fontSize: '9px', fontWeight: '700', color: '#94a3b8', margin: 0 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: 'none', background: '#fff1f2', color: '#e11d48', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  main: { flex: 1, padding: '24px 40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1b5e20', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  
  // ETO YUNG BINAGO PARA MAG-MATCH SA MASTERLIST
  searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { padding: '12px 20px 12px 45px', borderRadius: '50px', border: '1px solid #c8e6c9', width: '300px', fontSize: '14px', outline: 'none' },

  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  filterGroup: { display: 'flex', gap: '12px' },
  selectWrapper: { display: 'flex', alignItems: 'center', background: '#fff', padding: '6px 14px', borderRadius: '12px', border: '1px solid #c8e6c9' },
  select: { border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' },
  tabGroup: { display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '4px', borderRadius: '14px' },
  activeTab: { display: 'flex', alignItems: 'center', gap: '6px', background: '#1b5e20', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  activeTabRed: { display: 'flex', alignItems: 'center', gap: '6px', background: '#e11d48', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  inactiveTab: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#81c784', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  tableCard: { background: '#fff', borderRadius: '24px', border: '1px solid #c8e6c9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '18px 24px', background: '#f1f8e9', fontSize: '11px', fontWeight: '800', color: '#1b5e20', borderBottom: '1px solid #c8e6c9' },
  tr: { borderBottom: '1px solid #f1f8e9' },
  tdName: { padding: '18px 24px', fontWeight: '700', color: '#1e293b', fontSize: '13px' },
  tdDim: { padding: '18px 24px', color: '#64748b', fontSize: '13px' },
  tdCenter: { padding: '18px 24px', textAlign: 'center', verticalAlign: 'middle' },
  faBadge: { background: '#f1f8e9', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', display: 'inline-block', border: '1px solid #c8e6c9' },
  delBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: '800', fontSize: '11px', padding: '6px 12px' },
  missingLabel: { display: 'inline-flex', alignItems: 'center', color: '#e11d48', fontWeight: '800', fontSize: '11px', background: '#fff1f2', padding: '6px 12px', borderRadius: '8px' },
  emptyState: { padding: '100px', textAlign: 'center', color: '#c8e6c9' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(232, 245, 233, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #c8e6c9' },
  modalIconBoxRed: { width: '50px', height: '50px', background: '#fff1f2', color: '#e11d48', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' },
  modalText: { fontSize: '14px', color: '#64748b', margin: '0 0 25px 0', lineHeight: '1.6' },
  modalActions: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #c8e6c9', background: 'none', fontWeight: '700', cursor: 'pointer', color: '#64748b' },
  confirmLogoutBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#e11d48', color: '#fff', fontWeight: '700', cursor: 'pointer' }
};