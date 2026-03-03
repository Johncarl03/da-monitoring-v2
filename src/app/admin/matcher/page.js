"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, where 
} from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function DAGreenMatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [masterlist, setMasterlist] = useState([]);
  const [hasStub, setHasStub] = useState([]);
  const [missingStub, setMissingStub] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // --- DYNAMIC YEAR GENERATOR ---
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 1 + i).toString());

  useEffect(() => {
    const unsubFarmers = onSnapshot(query(collection(db, "farmers")), (snapshot) => {
      setMasterlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubFarmers();
  }, []);

  const getCleanWordSet = (str) => {
    if (!str) return new Set();
    const cleaned = str.toLowerCase().replace(/^\d+[\s\.\-\)]+/, '').replace(/[^\w\s]/gi, '').split(/\s+/).filter(word => word.length > 1);
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

  const handleLogout = async () => {
    if (confirm("Logout from system?")) { await signOut(auth); router.push('/login'); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsScanning(true);
    const uploadedFileNames = files.map(file => file.name.split('.').slice(0, -1).join('.'));
    let detectedFolderName = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : "";
    const currentFA = detectedFolderName.toUpperCase() || "UNASSIGNED FA";
    
    try {
      const historyRef = collection(db, "distribution_history");
      const q = query(historyRef, where("month", "==", selectedMonth), where("year", "==", selectedYear));
      const existingSnap = await getDocs(q);
      const existingNames = existingSnap.docs.map(doc => doc.data().name);

      const matchedFarmers = masterlist.filter(farmer => 
        uploadedFileNames.some(fName => isSmartMatch(farmer.name, fName)) &&
        !existingNames.some(extName => isSmartMatch(extName, farmer.name))
      ).map(f => ({ ...f, forcedFA: f.association || f.fa || currentFA }));

      const activeLocations = new Set(matchedFarmers.map(f => `${f.municipality}-${f.barangay}`));
      
      const missingFarmers = masterlist.filter(f => 
        !matchedFarmers.some(m => m.id === f.id) && 
        !existingNames.some(extName => isSmartMatch(extName, f.name)) &&
        activeLocations.has(`${f.municipality}-${f.barangay}`)
      ).map(f => ({ ...f, forcedFA: f.association || f.fa || currentFA }));

      for (const farmer of matchedFarmers) {
          await addDoc(collection(db, "distribution_history"), {
            farmerId: farmer.id, name: farmer.name, municipality: farmer.municipality, barangay: farmer.barangay,
            association: farmer.forcedFA, month: selectedMonth, year: selectedYear, dateProcessed: serverTimestamp(), source: "Auto-Scan"
          });
      }
      
      setHasStub(matchedFarmers); 
      setMissingStub(missingFarmers); 
      setHasData(true);
    } catch (err) { console.error(err); } finally { setIsScanning(false); }
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

  const navLinkStyle = (path) => ({
    color: pathname === path ? '#1b5e20' : '#81c784',
    textDecoration: 'none', fontWeight: 'bold', fontSize: '11px', borderBottom: pathname === path ? '2px solid #1b5e20' : 'none', padding: '23px 0', transition: '0.3s'
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', backgroundColor: '#e8f5e9', color: '#333', fontFamily: 'sans-serif', fontSize: '11px' }}>
      
      <AnimatePresence>
        {isScanning && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(232, 245, 233, 0.9)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ color: '#1b5e20', fontWeight: '900' }}>🔍 CHECKING RECORDS...</h2>
            <p>Filtering out existing entries in history.</p>
          </div>
        )}
      </AnimatePresence>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #c8e6c9', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/da-logo.png" alt="DA Logo" style={{ width: '35px' }} />
          <span style={{ fontWeight: '900', fontSize: '14px', color: '#1b5e20' }}>DA MONITORING</span>
        </div>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <a href="/admin/matcher" style={navLinkStyle('/admin/matcher')}>STUB MATCHER</a>
          <a href="/admin/importer" style={navLinkStyle('/admin/importer')}>MASTERLIST</a>
          <a href="/admin/history" style={navLinkStyle('/admin/history')}>HISTORY</a>
          <button onClick={handleLogout} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ padding: '25px 40px' }}>
        {!hasData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1b5e20' }}>STUB MATCHER</h1>
            <div style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div onClick={() => !isScanning && fileInputRef.current.click()} style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', border: '2px dashed #81c784', borderRadius: '25px', padding: '60px', textAlign: 'center', cursor: 'pointer' }}>
              <input type="file" ref={fileInputRef} webkitdirectory="true" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ fontSize: '40px' }}>📂</div>
              <h3>UPLOAD FOLDER</h3>
              <p style={{ opacity: 0.5 }}>New scans will be added to {selectedMonth} {selectedYear}</p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: '#fff', 
                padding: '12px 25px', 
                borderRadius: '12px', 
                border: '1px solid #c8e6c9', 
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                  <h3 style={{ color: '#1b5e20', margin: 0, fontSize: '15px', fontWeight: '900' }}>NEWLY ADDED</h3>
                  <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>{selectedMonth.toUpperCase()} {selectedYear}</span>
                </div>
                <div style={{ height: '30px', width: '1px', backgroundColor: '#eee' }}></div>
                <div style={{ display: 'flex', gap: '15px', fontSize: '11px' }}>
                   <span style={{ color: '#2e7d32' }}>Added: <b>{hasStub.length}</b></span>
                   <span style={{ color: '#c62828' }}>Missing: <b>{missingStub.length}</b></span>
                </div>
              </div>
              <button onClick={() => setHasData(false)} style={{ backgroundColor: '#1b5e20', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>RE-SCAN FOLDER</button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #c8e6c9' }}>
                <h4 style={{ color: '#1b5e20', marginTop: 0 }}>✅ NEWLY MATCHED</h4>
                {hasStub.length === 0 ? <p style={{ opacity: 0.5 }}>No new farmers found (already in history or no match).</p> : 
                  Object.entries(groupData(hasStub)).map(([muni, brgys]) => (
                    <div key={muni} style={{ marginBottom: '15px' }}>
                      <p style={{ fontWeight: '900', color: '#1b5e20', borderBottom: '1px solid #f0f0f0', paddingBottom: '3px' }}>📍 {muni}</p>
                      {Object.entries(brgys).map(([brgy, content]) => (
                        <div key={brgy} style={{ marginBottom: '10px', paddingLeft: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>{brgy}</span>
                            <span style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>FA: {content.fa}</span>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            {content.farmers.map(f => (
                              <div key={f.id} style={{ padding: '4px 8px', background: '#f9fdf9', borderLeft: '3px solid #4caf50', marginBottom: '2px', borderRadius: '0 4px 4px 0' }}>{f.name}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                }
              </div>

              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #ffcdd2' }}>
                <h4 style={{ color: '#c62828', marginTop: 0 }}>⚠️ STILL MISSING</h4>
                {missingStub.length === 0 ? <p style={{ opacity: 0.5 }}>All expected farmers for these locations are now recorded.</p> :
                  Object.entries(groupData(missingStub)).map(([muni, brgys]) => (
                    <div key={muni} style={{ marginBottom: '15px' }}>
                      <p style={{ fontWeight: '900', color: '#c62828', borderBottom: '1px solid #fff0f0', paddingBottom: '3px' }}>📍 {muni}</p>
                      {Object.entries(brgys).map(([brgy, content]) => (
                        <div key={brgy} style={{ marginBottom: '10px', paddingLeft: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>{brgy}</span>
                            <span style={{ color: '#c62828', backgroundColor: '#ffebee', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>FA: {content.fa}</span>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            {content.farmers.map(f => (
                              <div key={f.id} style={{ padding: '4px 8px', background: '#fff9f9', borderLeft: '3px solid #e57373', marginBottom: '2px', borderRadius: '0 4px 4px 0' }}>{f.name}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}