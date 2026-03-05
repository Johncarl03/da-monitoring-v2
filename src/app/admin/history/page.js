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
            <Search size={18} color="#143d16" style={{ position: 'absolute', left: '15px', opacity: 0.6 }} />
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
                <Calendar size={14} style={{marginRight: '8px', color: '#143d16'}} />
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
             </div>
             <div style={styles.selectWrapper}>
                <Filter size={14} style={{marginRight: '8px', color: '#143d16'}} />
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
                  <td style={{...styles.tdCenter, color: '#4a614a', fontSize: '13px'}}>{item.municipality}</td>
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
                    <Search size={40} color="#acc2ac" style={{marginBottom: '10px'}} /><br/>
                    {searchTerm.trim() ? "No results found." : "Start typing to view records."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- Modals Section --- */}
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
        .delete-hover-btn:hover { color: #ef4444 !important; transform: scale(1.05); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #8ba88b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const SidebarBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
    backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#ffffff' : '#81c784',
    border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%', textAlign: 'left', transition: '0.2s'
  }}>{icon} <span>{label}</span></button>
);

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#d1dbd1', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  sidebar: { width: '260px', backgroundColor: '#143d16', borderRight: '1px solid #0d290f', padding: '30px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  logoImg: { width: '38px', height: '38px' },
  logoText: { fontSize: '16px', fontWeight: '900', color: '#ffffff', margin: 0 },
  logoTag: { fontSize: '9px', fontWeight: '700', color: '#a3b8a3', margin: 0 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: 'none', background: '#2d0a0a', color: '#ff8a8a', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  
  main: { flex: 1, padding: '24px 40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#0d290f', margin: 0 },
  subtitle: { color: '#4a614a', fontSize: '14px', margin: 0 },
  
  searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { padding: '12px 20px 12px 45px', borderRadius: '50px', border: '1px solid #acc2ac', background: '#e2ede2', width: '300px', fontSize: '14px', outline: 'none', color: '#143d16' },

  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  filterGroup: { display: 'flex', gap: '12px' },
  selectWrapper: { display: 'flex', alignItems: 'center', background: '#e2ede2', padding: '8px 14px', borderRadius: '12px', border: '1px solid #acc2ac' },
  select: { border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', color: '#143d16', cursor: 'pointer' },
  tabGroup: { display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.3)', padding: '4px', borderRadius: '14px' },
  activeTab: { display: 'flex', alignItems: 'center', gap: '6px', background: '#143d16', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  activeTabRed: { display: 'flex', alignItems: 'center', gap: '6px', background: '#991b1b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  inactiveTab: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#4a614a', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  
  tableCard: { background: '#e2ede2', borderRadius: '24px', border: '1px solid #acc2ac', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '18px 24px', background: '#d8e4d8', fontSize: '11px', fontWeight: '800', color: '#143d16', borderBottom: '1px solid #acc2ac' },
  tr: { borderBottom: '1px solid #acc2ac' },
  tdName: { padding: '18px 24px', fontWeight: '700', color: '#0d290f', fontSize: '13px' },
  tdDim: { padding: '18px 24px', color: '#4a614a', fontSize: '13px' },
  tdCenter: { padding: '18px 24px', textAlign: 'center', verticalAlign: 'middle' },
  faBadge: { background: '#f0f4f0', color: '#143d16', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', display: 'inline-block', border: '1px solid #acc2ac' },
  delBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8ba88b', cursor: 'pointer', fontWeight: '800', fontSize: '11px', padding: '6px 12px' },
  missingLabel: { display: 'inline-flex', alignItems: 'center', color: '#991b1b', fontWeight: '800', fontSize: '11px', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px' },
  emptyState: { padding: '100px', textAlign: 'center', color: '#acc2ac' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20, 61, 22, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent: { background: '#f1f5f1', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #acc2ac' },
  modalIconBoxRed: { width: '50px', height: '50px', background: '#fee2e2', color: '#991b1b', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#143d16', margin: '0 0 10px 0' },
  modalText: { fontSize: '14px', color: '#4b5563', margin: '0 0 25px 0', lineHeight: '1.6' },
  modalActions: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #acc2ac', background: 'none', fontWeight: '700', cursor: 'pointer', color: '#4b5563' },
  confirmLogoutBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#991b1b', color: '#fff', fontWeight: '700', cursor: 'pointer' }
};