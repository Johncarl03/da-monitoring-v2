"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, addDoc, serverTimestamp, 
  getDocs, where, limit, orderBy, writeBatch, doc 
} from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Database, Users, History, LogOut, 
  UploadCloud, Search, Calendar, CheckCircle2, 
  AlertCircle, FolderOpen, Loader2, RefreshCcw, Info, BarChart3, Clock, TrendingUp, X
} from 'lucide-react';

export default function DAGreenMatcher() {
  const router = useRouter();
  const pathname = usePathname();
  
  // --- Data States ---
  const [masterlist, setMasterlist] = useState([]);
  const [lastScans, setLastScans] = useState([]);
  const [hasStub, setHasStub] = useState([]);
  const [missingStub, setMissingStub] = useState([]);
  const [alreadyExists, setAlreadyExists] = useState([]); 
  const [isScanning, setIsScanning] = useState(false);
  const [hasData, setHasData] = useState(false);
  
  // --- UI States ---
  const [showLogoutModal, setShowLogoutModal] = useState(false); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const fileInputRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 1 + i).toString());

  const totalInCurrentView = hasStub.length + missingStub.length + alreadyExists.length;
  const matchRate = totalInCurrentView > 0 ? Math.round(((hasStub.length + alreadyExists.length) / totalInCurrentView) * 100) : 0;

  useEffect(() => {
    const unsubFarmers = onSnapshot(collection(db, "farmers"), (snap) => {
      setMasterlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qRecent = query(collection(db, "distribution_history"), orderBy("dateProcessed", "desc"), limit(5));
    const unsubRecent = onSnapshot(qRecent, (snap) => {
      setLastScans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubFarmers(); unsubRecent(); };
  }, []);

  const getCleanWordSet = (str) => {
    if (!str) return new Set();
    const cleaned = str.toLowerCase()
      .replace(/^\d+[\s\.\-\)]+/, '') 
      .replace(/[^\w\s]/gi, '')      
      .split(/\s+/)
      .filter(word => word.length > 1);
    return new Set(cleaned);
  };

  const isSmartMatch = (nameA, nameB) => {
    const setA = getCleanWordSet(nameA);
    const setB = getCleanWordSet(nameB);
    if (setA.size === 0 || setB.size === 0) return false;
    const arrA = Array.from(setA);
    const arrB = Array.from(setB);
    return arrA.every(word => setB.has(word)) || arrB.every(word => setA.has(word));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (masterlist.length === 0) {
      setErrorMsg("Masterlist is still loading or empty. Please wait.");
      return;
    }
    setIsScanning(true);
    const uploadedFileNames = files.map(file => file.name.split('.').slice(0, -1).join('.'));
    let detectedFolderName = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : "";
    const currentFA = detectedFolderName.toUpperCase() || "UNASSIGNED FA";
    
    try {
      const historyRef = collection(db, "distribution_history");
      const q = query(historyRef, where("month", "==", selectedMonth), where("year", "==", selectedYear));
      const existingSnap = await getDocs(q);
      const existingNames = existingSnap.docs.map(doc => doc.data().name);

      const duplicates = masterlist.filter(farmer => 
        uploadedFileNames.some(fName => isSmartMatch(farmer.name, fName)) &&
        existingNames.some(extName => isSmartMatch(extName, farmer.name))
      ).map(f => ({ ...f, forcedFA: f.association || f.fa || currentFA }));

      const matchedFarmers = masterlist.filter(farmer => 
        uploadedFileNames.some(fName => isSmartMatch(farmer.name, fName)) &&
        !existingNames.some(extName => isSmartMatch(extName, farmer.name))
      ).map(f => ({ ...f, forcedFA: f.association || f.fa || currentFA }));

      const activeLocations = new Set([...matchedFarmers, ...duplicates].map(f => `${f.municipality}-${f.barangay}`));
      const missingFarmers = masterlist.filter(f => 
        !uploadedFileNames.some(fName => isSmartMatch(f.name, fName)) && 
        !existingNames.some(extName => isSmartMatch(extName, f.name)) &&
        activeLocations.has(`${f.municipality}-${f.barangay}`)
      ).map(f => ({ ...f, forcedFA: f.association || f.fa || currentFA }));

      if (matchedFarmers.length > 0) {
        const batch = writeBatch(db);
        matchedFarmers.forEach((farmer) => {
          const newDocRef = doc(collection(db, "distribution_history"));
          batch.set(newDocRef, {
            farmerId: farmer.id, name: farmer.name, municipality: farmer.municipality,
            barangay: farmer.barangay, association: farmer.forcedFA,
            month: selectedMonth, year: selectedYear, dateProcessed: serverTimestamp(),
            source: "Auto-Scan"
          });
        });
        await batch.commit();
        setShowSuccess(true);
      }
      setHasStub(matchedFarmers); setMissingStub(missingFarmers); setAlreadyExists(duplicates); setHasData(true);
    } catch (err) { setErrorMsg("An error occurred during scanning."); } finally { setIsScanning(false); }
  };

  const groupData = (data) => {
    const grouped = {};
    data.forEach(item => {
      const muni = item.municipality || "UNKNOWN";
      const brgy = item.barangay || "UNKNOWN";
      if (!grouped[muni]) grouped[muni] = {};
      if (!grouped[muni][brgy]) grouped[muni][brgy] = { fa: item.forcedFA || "NO FA", farmers: [] };
      grouped[muni][brgy].farmers.push(item);
    });
    return grouped;
  };

  const handleLogout = () => { signOut(auth).then(() => router.push('/login')); };

  return (
    <div style={styles.container}>
      {/* Modals - Plain Divs only, no motion */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIconBoxRed}><LogOut size={24}/></div>
            <h3 style={styles.modalTitle}>Confirm Logout</h3>
            <p style={styles.modalBody}>Are you sure you want to log out your account?</p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowLogoutModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleLogout} style={styles.confirmLogoutBtn}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIconBoxGreen}><CheckCircle2 size={24}/></div>
            <h3 style={styles.modalTitle}>Sync Complete</h3>
            <p style={styles.modalBody}>Successfully matched {hasStub.length} farmers and saved to history logs.</p>
            <button onClick={() => setShowSuccess(false)} style={styles.primaryBtn}>Done</button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIconBoxAmber}><AlertCircle size={24}/></div>
            <h3 style={styles.modalTitle}>System Alert</h3>
            <p style={styles.modalBody}>{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} style={styles.primaryBtn}>Dismiss</button>
          </div>
        </div>
      )}

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

        {hasData && (
          <div style={styles.sidebarWidget}>
            <p style={styles.widgetLabel}><TrendingUp size={14}/> LIVE PROGRESS</p>
            <div style={styles.progressTrack}>
              <div style={{...styles.progressFill, width: `${matchRate}%`}}></div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px'}}>
              <span style={styles.widgetStat}>{matchRate}% Matched</span>
              <span style={styles.widgetStat}>{hasStub.length + alreadyExists.length}/{totalInCurrentView}</span>
            </div>
          </div>
        )}

        <button onClick={() => setShowLogoutModal(true)} style={styles.logoutBtn}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>Stub Matcher</h1>
            <p style={styles.subtitle}>Upload distribution folder to sync with archives</p>
          </div>
          {hasData && (
            <button onClick={() => {setHasData(false); setAlreadyExists([]);}} style={styles.reScanBtn}>
              <RefreshCcw size={16} /> RE-SCAN FOLDER
            </button>
          )}
        </div>

        {!hasData ? (
          <div style={styles.contentGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Database size={18} /> Matching Configuration</h3>
              <div style={styles.formGroup}>
                <div style={styles.field}>
                  <label style={styles.label}>DISTRIBUTION MONTH</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.select}>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>TARGET YEAR</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={styles.select}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                
                <div 
                  onClick={() => !isScanning && masterlist.length > 0 && fileInputRef.current.click()} 
                  style={{...styles.uploadArea, opacity: masterlist.length === 0 ? 0.5 : 1, cursor: masterlist.length === 0 ? 'not-allowed' : 'pointer'}}
                >
                  {isScanning ? <Loader2 size={32} className="spin" color="#81c784" /> : <UploadCloud size={32} color="#81c784" />}
                  <span style={{fontSize: '14px', fontWeight: '800', color: '#143d16', marginTop: '10px'}}>
                    {masterlist.length === 0 ? "Loading Masterlist..." : isScanning ? "Syncing to Cloud..." : "Select Folder"}
                  </span>
                  <p style={{fontSize: '11px', color: '#4a614a', textAlign: 'center', margin: '4px 0 0 0'}}>System matches file names against the Stub</p>
                  <input type="file" ref={fileInputRef} webkitdirectory="true" directory="true" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                </div>
              </div>
            </div>

            <div style={styles.infoColumn}>
              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}><BarChart3 size={18}/> System Readiness</h3>
                <div style={styles.statsRow}>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Total Farmers</span>
                    <span style={styles.statValue}>{masterlist.length}</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Database</span>
                    <span style={{...styles.statValue, color: '#143d16'}}>{masterlist.length > 0 ? "Ready" : "Syncing"}</span>
                  </div>
                </div>
                
                <h3 style={{...styles.infoCardTitle, marginTop: '10px'}}><Clock size={18}/> Recent Activity</h3>
                <div style={styles.activityList}>
                  {lastScans.length > 0 ? lastScans.map(scan => (
                    <div key={scan.id} style={styles.activityItem}>
                      <div style={styles.activityDot}></div>
                      <div style={{flex: 1}}>
                        <p style={styles.activityText}><strong>{scan.name}</strong> was matched</p>
                        <p style={styles.activitySub}>{scan.barangay}, {scan.month} {scan.year}</p>
                      </div>
                    </div>
                  )) : <p style={{fontSize: '12px', color: '#4a614a', textAlign: 'center', padding: '10px'}}>No recent activity found.</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.resultGridThreeCol}>
            <ResultCol title={`NEW (${hasStub.length})`} icon={<CheckCircle2 size={18}/>} color="#1b5e20" bg="#c8e6c9" data={hasStub} type="matched" groupFn={groupData} />
            <ResultCol title={`MISSING (${missingStub.length})`} icon={<AlertCircle size={18}/>} color="#991b1b" bg="#fecaca" data={missingStub} type="missing" groupFn={groupData} />
            <ResultCol title={`ISSUED (${alreadyExists.length})`} icon={<Info size={18}/>} color="#92400e" bg="#fde68a" data={alreadyExists} type="duplicate" groupFn={groupData} />
          </div>
        )}
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #8ba88b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- Sub-Components ---
const SidebarBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
    backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#ffffff' : '#81c784',
    border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%', textAlign: 'left', transition: '0.2s'
  }}>{icon} <span>{label}</span></button>
);

const ResultCol = ({ title, icon, color, bg, data, type, groupFn }) => (
  <div style={{...styles.resultColumn, borderColor: color}}>
    <div style={{...styles.columnHeader, background: bg, borderBottomColor: color}}>
      <h2 style={{...styles.columnTitle, color: color}}>{icon} {title}</h2>
    </div>
    <div style={styles.scrollArea}>
      {data.length === 0 ? <EmptyState msg="No records." /> : 
        Object.entries(groupFn(data)).map(([muni, brgys]) => (
          <div key={muni} style={styles.townGroup}>
            <h3 style={styles.muniTitle}> {muni}</h3>
            {Object.entries(brgys).map(([brgy, content]) => (
              <div key={brgy} style={styles.brgyBox}>
                <div style={styles.brgyHeader}>
                  <span style={styles.brgyName}>{brgy}</span>
                  <span style={{...styles.faBadge, background: bg}}>FA: {content.fa}</span>
                </div>
                <div style={styles.farmerList}>
                  {content.farmers.map(f => (
                    <div key={f.id} style={{...styles.farmerItem, borderLeftColor: color}}>{f.name}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  </div>
);

const EmptyState = ({ msg }) => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#4a614a' }}>
    <Database size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
    <p style={{fontSize: '11px'}}>{msg}</p>
  </div>
);

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#d1dbd1', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  sidebar: { width: '260px', backgroundColor: '#143d16', borderRight: '1px solid #0d290f', padding: '30px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  logoImg: { width: '38px', height: '38px' },
  logoText: { fontSize: '16px', fontWeight: '900', color: '#ffffff', margin: 0 },
  logoTag: { fontSize: '9px', fontWeight: '700', color: '#a3b8a3', margin: 0 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20, 61, 22, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  modalCard: { background: '#f1f5f1', width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid #acc2ac' },
  modalIconBoxRed: { width: '50px', height: '50px', background: '#fee2e2', color: '#991b1b', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  modalIconBoxGreen: { width: '50px', height: '50px', background: '#dcfce7', color: '#166534', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  modalIconBoxAmber: { width: '50px', height: '50px', background: '#fef3c7', color: '#92400e', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  modalTitle: { margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: '#143d16' },
  modalBody: { margin: '0 0 25px 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' },
  modalActions: { display: 'flex', gap: '12px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #acc2ac', background: 'none', fontWeight: '700', cursor: 'pointer', color: '#4b5563' },
  confirmLogoutBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#991b1b', color: '#fff', fontWeight: '700', cursor: 'pointer' },
  primaryBtn: { width: '100%', padding: '12px', background: '#143d16', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },

  sidebarWidget: { padding: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
  widgetLabel: { fontSize: '10px', fontWeight: '800', color: '#81c784', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' },
  progressTrack: { height: '8px', background: '#0d290f', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#81c784', borderRadius: '4px', transition: 'width 0.5s ease' },
  widgetStat: { fontSize: '10px', fontWeight: '700', color: '#ffffff' },

  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: 'none', background: '#2d0a0a', color: '#ff8a8a', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  main: { flex: 1, padding: '24px 40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerInfo: { display: 'flex', flexDirection: 'column' },
  title: { fontSize: '28px', fontWeight: '900', color: '#0d290f', margin: 0 },
  subtitle: { color: '#4a614a', fontSize: '14px', margin: 0 },
  reScanBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#143d16', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  contentGrid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', alignItems: 'start' },
  card: { background: '#e2ede2', padding: '24px', borderRadius: '24px', border: '1px solid #acc2ac' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800', color: '#143d16', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#4a614a', letterSpacing: '0.8px' },
  select: { padding: '10px', background: '#f0f4f0', border: '1px solid #acc2ac', borderRadius: '10px', fontSize: '13px', fontWeight: '600', outline: 'none', color: '#143d16' },
  uploadArea: { border: '2px dashed #8ba88b', borderRadius: '16px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#d8e4d8' },
  infoColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoCard: { background: '#e2ede2', padding: '24px', borderRadius: '24px', border: '1px solid #acc2ac' },
  infoCardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#143d16', marginBottom: '16px' },
  statsRow: { display: 'flex', gap: '16px', marginBottom: '24px' },
  statBox: { flex: 1, padding: '16px', background: '#d8e4d8', borderRadius: '16px', border: '1px solid #acc2ac', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#4a614a', textTransform: 'uppercase' },
  statValue: { fontSize: '18px', fontWeight: '900', color: '#143d16' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  activityItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  activityDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#143d16', marginTop: '5px' },
  activityText: { fontSize: '12px', margin: 0, color: '#143d16' },
  activitySub: { fontSize: '10px', color: '#4a614a', margin: 0 },
  resultGridThreeCol: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '400px' },
  resultColumn: { background: '#f0f4f0', borderRadius: '20px', border: '1px solid #acc2ac', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  columnHeader: { padding: '16px 20px', borderBottom: '2px solid' },
  columnTitle: { margin: 0, fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '16px' },
  townGroup: { marginBottom: '24px' },
  muniTitle: { fontSize: '13px', fontWeight: '800', color: '#143d16', marginBottom: '12px', borderBottom: '1px solid #acc2ac', paddingBottom: '4px' },
  brgyBox: { marginBottom: '16px', paddingLeft: '12px' },
  brgyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  brgyName: { fontSize: '11px', fontWeight: '700', color: '#143d16' },
  faBadge: { fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', color: '#143d16' },
  farmerList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  farmerItem: { padding: '6px 12px', background: '#e2ede2', fontSize: '11px', borderRadius: '0 6px 6px 0', borderLeft: '3px solid', color: '#2d3b2d' }
};