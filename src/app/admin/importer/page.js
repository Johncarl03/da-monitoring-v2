"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, addDoc, serverTimestamp, query, onSnapshot, 
  deleteDoc, doc, where, getDocs, orderBy 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// KOMPLETONG DATA NG ORIENTAL MINDORO
const mindoroData = {
  "Baco": ["Alag", "Banyaga", "Baras", "Bayanan", "Burbuli", "Catunggan", "Lantuyang", "Malapad", "Mangangan I", "Mangangan II", "Pambisan", "Pulang-Tubig", "San Andres", "San Ignacio", "Santa Cruz", "Santa Rosa I", "Santa Rosa II", "Tabon-tabon"],
  "Bansud": ["Alcadesma", "B. Del Mundo", "Concepcion", "Maligo", "Pag-asa", "Poblacion", "Proper Bansud", "Rosacara", "Salcedo", "Sumagui", "Villa Pag-asa"],
  "Bongabong": ["Anilao", "Aplaya", "Bagong Bayan I", "Bato", "Bukal", "Camantigue", "Carmundo", "Cawayan", "Ipil", "Kaligtasan", "Labasan", "Mabuhay", "Malitbog", "Morente", "Poblacion", "San Isidro", "Sigange", "Taging"],
  "Bulalacao": ["Bagong Sikat", "Benli", "Cabugao", "Cambane", "Campababa", "Maasin", "Maujao", "Milagrosa", "Nasoke", "Poblacion", "San Francisco", "San Isidro", "San Jose", "San Roque"],
  "Calapan City": ["Balingasag", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II", "Bucayao", "Bulusan", "Calero", "Camansihan", "Camalig", "Canubing I", "Canubing II", "Comunal", "Guinobatan", "Gulod", "Gutad", "Iwahig", "Lalud", "Lazareto", "Libis", "Lumangbayan", "Maidlang", "Malitbog", "Masipit", "Nag-iba I", "Nag-iba II", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang", "Patas", "Personas", "Puting-Tubig", "San Antonio", "San Vicente Central", "San Vicente East", "San Vicente North", "San Vicente South", "San Vicente West", "Sapul", "Silonay", "Suqui", "Tawagan", "Tawiran", "Tibag", "Wawa"],
  "Gloria": ["Agos", "Alma Villa", "Balete", "Banus", "Bulaklakan", "Gumamela", "Kawit", "Malamig", "Malayong", "Mirayan", "Narra", "Papiano", "Poblacion", "Santa Maria", "Santa Theresa", "Tambong"],
  "Mansalay": ["B. Cahidiocan", "Balugo", "Bonbon", "Budburan", "Cabalwa", "Don Pedro", "Manaul", "Panaytayan", "Poblacion", "Roma", "Sta. Maria", "Villa Libertad"],
  "Naujan": ["Adriel", "Andres Bonifacio", "Antipolo", "Apisani", "Arante", "Aurora", "Bacungan", "Bagong Pook", "Balite", "Bancuro", "Barcenaga", "Bayani", "Bubog", "Buhangin", "Concepcion", "Dao", "Del Pilar", "Estrella", "Evangelista", "Inarawan", "Laguna", "Mabini", "Mag-asawang Tubig", "Malaya", "Malvar", "Masaguing", "Metolza", "Montelago", "Nag-iba I", "Nag-iba II", "Pag-asa", "Pinagsabangan I", "Pinagsabangan II", "Poblacion I", "Poblacion II", "Poblacion III", "Sampaguita", "San Agustin I", "San Agustin II", "San Antonio", "San Isidro", "San Jose", "San Luis", "San Nicolas", "San Roque", "Santa Cruz", "Santa Maria", "Santiago", "Santo Niño", "Tagumpay", "Tigkan"],
  "Pinamalayan": ["Anoling", "Bacungan", "Bangbang", "Banilad", "Buli", "Cacutud", "Del Razon", "Guinhawa", "Inclanay", "Lumambayan", "Malaya", "Maliwalo", "Nabuslot", "Pag-asa", "Palayan", "Pambisan Munti", "Pili", "Poblacion", "Quinabigan", "Ranzo", "Rosario", "Sta. Isabel", "Sta. Maria", "Sta. Rita", "Wawa"],
  "Pola": ["Bacungan", "Batuhan", "Bayanan", "Biga", "Buhay na Bato", "Calubasani", "Campis", "Casiligan", "Malibago", "Maluanluan", "Matulatula", "Paho", "Panikihan", "Poblacion", "Pula", "Tagumpay", "Tigkan"],
  "Puerto Galera": ["Aninuan", "Baclayan", "Balatero", "Dulangan", "Poblacion", "Sabang", "San Antonio", "San Isidro", "Sinandigan", "Tabinay", "Villaflor"],
  "Roxas": ["Bagumbayan", "Cantil", "Dangay", "Happy Valley", "Libertad", "Little Tanauan", "Mabuhay", "Marahisi", "Paclasan", "San Aquilino", "San Isidro", "San Jose", "San Mariano", "San Vicente", "Urdaneta", "Victoria"],
  "San Teodoro": ["Binalaba", "Caagutayan", "Calangatan", "Ilag", "Lumangbayan", "Poblacion", "Tacligan"],
  "Socorro": ["Bagsok", "Batong Dalig", "Bayuin", "Calubasani", "Catiningan", "Fortuna", "Happy Valley", "Leuteboro I", "Leuteboro II", "Mabuhay", "Maasimin", "Poblacion", "Santo Domingo", "Subaan", "Villareal"],
  "Victoria": ["Alcate", "Antonino", "Babangonan", "Bagong Silang", "Bagong Buhay", "Bambanin", "Bethel", "Canaan", "Concepcion", "Duongan", "Loyola", "Mabini", "Macatoc", "Malabo", "Maluac", "Ordovilla", "Pakyas", "Poblacion I", "Poblacion II", "Poblacion III", "Resurreccion", "San Antonio", "San Gabriel", "San Narciso", "Urdaneta", "Villa Victoria"]
};

// SHARED STYLES
const miniInputStyle = {
  width: '100%',
  backgroundColor: '#f1f8e9',
  border: '1px solid #c8e6c9',
  color: '#333',
  padding: '12px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '12px',
  boxSizing: 'border-box',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const dropdownListStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  border: '1px solid #c8e6c9',
  borderRadius: '8px',
  marginTop: '5px',
  maxHeight: '200px',
  overflowY: 'auto',
  zIndex: 1000,
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const dropdownItemStyle = {
  padding: '10px 15px',
  cursor: 'pointer',
  fontSize: '11px',
  color: '#333333',
  borderBottom: '1px solid #f1f8e9',
  transition: '0.2s'
};

const searchInputStyle = {
  width: '400px', 
  padding: '12px 20px 12px 45px',
  borderRadius: '50px',
  border: '1px solid #c8e6c9',
  backgroundColor: '#ffffff',
  color: '#333',
  outline: 'none',
  fontSize: '13px',
  transition: '0.3s'
};

export default function MasterlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [listText, setListText] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [barangay, setBarangay] = useState('');
  const [savedFarmers, setSavedFarmers] = useState([]);
  const [searchBarangay, setSearchBarangay] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showMuniDrop, setShowMuniDrop] = useState(false);
  const [showBrgyDrop, setShowBrgyDrop] = useState(false);
  const [savedFAs, setSavedFAs] = useState([]);
  const [selectedTownForFA, setSelectedTownForFA] = useState(null);
  const [newFAName, setNewFAName] = useState('');

  const handleLogout = async () => {
    if (confirm("Logout from system?")) {
      await signOut(auth);
      router.push('/login');
    }
  };

  useEffect(() => {
    const q = query(collection(db, "farmers"), orderBy("name", "asc"));
    const unsubscribeFarmers = onSnapshot(q, (snapshot) => {
      setSavedFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const faQuery = query(collection(db, "associations"), orderBy("name", "asc"));
    const unsubscribeFA = onSnapshot(faQuery, (snapshot) => {
      setSavedFAs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribeFarmers(); unsubscribeFA(); };
  }, []);

  const normalizeName = (name) => {
    if (!name) return "";
    return name.replace(/,/g, '').split(/\s+/).sort().join(' ').trim().toUpperCase();
  };

  const handleAutoSave = async () => {
    if (!listText || !municipality || !barangay) return alert("Paki-pili ang Town at Barangay.");
    setIsSaving(true);
    const existingNormalized = savedFarmers.map(f => normalizeName(f.name));
    const inputNames = listText.split(/\n/).filter(n => n.trim() !== '');
    const duplicates = [];
    const addedCount = [];
    try {
      for (const rawName of inputNames) {
        const cleanName = rawName.trim().toUpperCase();
        const normalizedInput = normalizeName(cleanName);
        if (existingNormalized.includes(normalizedInput)) {
          duplicates.push(cleanName);
        } else {
          await addDoc(collection(db, "farmers"), {
            name: cleanName, municipality, barangay, province: "Oriental Mindoro", createdAt: serverTimestamp()
          });
          existingNormalized.push(normalizedInput);
          addedCount.push(cleanName);
        }
      }
      setListText('');
      alert(duplicates.length > 0 ? `Added: ${addedCount.length}, Skipped: ${duplicates.length}` : `Success: ${addedCount.length} added.`);
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const handleAddFA = async () => {
    if (!newFAName) return;
    try {
      await addDoc(collection(db, "associations"), {
        name: newFAName.toUpperCase(),
        municipality: selectedTownForFA,
        createdAt: serverTimestamp()
      });
      setNewFAName('');
    } catch (err) { console.error(err); }
  };

  const groupedData = savedFarmers
    .filter(f => f.barangay?.toLowerCase().includes(searchBarangay.toLowerCase()) || 
                 f.municipality?.toLowerCase().includes(searchBarangay.toLowerCase()) || 
                 f.name?.toLowerCase().includes(searchBarangay.toLowerCase()))
    .reduce((acc, current) => {
      if (current.name === "_FA_HEADER_") return acc; 
      if (!acc[current.municipality]) acc[current.municipality] = {};
      if (!acc[current.municipality][current.barangay]) acc[current.municipality][current.barangay] = [];
      acc[current.municipality][current.barangay].push(current);
      return acc;
    }, {});

  const navLinkStyle = (path) => ({
    color: pathname === path ? '#1b5e20' : '#81c784',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '11px',
    borderBottom: pathname === path ? '2px solid #1b5e20' : 'none',
    padding: '23px 0',
    transition: '0.3s',
    display: 'inline-block'
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', backgroundColor: '#e8f5e9', color: '#333', fontFamily: 'sans-serif', fontSize: '11px' }}
    >
      
      {/* FA MODAL */}
      <AnimatePresence>
        {selectedTownForFA && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(232, 245, 233, 0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', width: '450px', border: '1px solid #c8e6c9', boxShadow: '0 10px 50px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', color: '#1b5e20', margin: 0, fontWeight: '900' }}>FA MANAGER</h2>
                  <p style={{ fontSize: '10px', opacity: 0.6 }}>{selectedTownForFA}, Oriental Mindoro</p>
                </div>
                <button onClick={() => setSelectedTownForFA(null)} style={{ background: '#f5f5f5', color: '#333', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <input value={newFAName} onChange={(e) => setNewFAName(e.target.value)} placeholder="Enter Association Name..." style={{ ...miniInputStyle, flex: 1, cursor: 'text' }} />
                <button onClick={handleAddFA} style={{ backgroundColor: '#1b5e20', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>ADD</button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                {savedFAs.filter(fa => fa.municipality === selectedTownForFA).map(fa => (
                  <div key={fa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f1f8e9', borderRadius: '8px', marginBottom: '8px', border: '1px solid #c8e6c9' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{fa.name}</span>
                    <button onClick={() => deleteDoc(doc(db, "associations", fa.id))} style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #c8e6c9', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/da-logo.png" alt="DA Logo" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
          <span style={{ fontWeight: '900', letterSpacing: '1.5px', fontSize: '14px', color: '#1b5e20' }}>DA MONITORING</span>
        </div>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', height: '100%' }}>
          <a href="/admin/matcher" style={navLinkStyle('/admin/matcher')}>STUB MATCHER</a>
          <a href="/admin/importer" style={navLinkStyle('/admin/importer')}>MASTERLIST</a>
          <a href="/admin/history" style={navLinkStyle('/admin/history')}>HISTORY</a>
          <button onClick={handleLogout} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', marginLeft: '10px' }}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ padding: '40px' }}> 
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', fontStyle: 'italic', margin: 0, letterSpacing: '-1px', color: '#1b5e20' }}>MASTERLIST</h1>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, color: '#1b5e20' }}>🔍</span>
              <motion.input 
                whileFocus={{ scale: 1.02, boxShadow: "0 0 15px rgba(27, 94, 32, 0.1)", borderColor: "#1b5e20" }}
                placeholder="Search Municipality, Barangay, or Name..." 
                style={searchInputStyle} 
                value={searchBarangay} 
                onChange={(e) => setSearchBarangay(e.target.value)} 
              />
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', alignItems: 'start' }}>
            {/* LEFT PANEL */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', border: '1px solid #c8e6c9', position: 'sticky', top: '84px' }}
            >
              <h3 style={{ fontSize: '9px', letterSpacing: '1px', color: '#1b5e20', marginBottom: '15px', fontWeight: 'bold' }}>DATA ENTRY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={miniInputStyle} onClick={() => { setShowMuniDrop(!showMuniDrop); setShowBrgyDrop(false); }}>
                    {municipality || "Select Municipality"}
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{showMuniDrop ? '▲' : '▼'}</span>
                  </div>
                  <AnimatePresence>
                    {showMuniDrop && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={dropdownListStyle}>
                        {Object.keys(mindoroData).sort().map(m => (
                          <div key={m} style={dropdownItemStyle} onClick={() => { setMunicipality(m); setBarangay(''); setShowMuniDrop(false); }}>{m}</div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{ ...miniInputStyle, opacity: municipality ? 1 : 0.5, cursor: municipality ? 'pointer' : 'not-allowed' }} 
                    onClick={() => municipality && setShowBrgyDrop(!showBrgyDrop)}>
                    {barangay || "Select Barangay"}
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{showBrgyDrop ? '▲' : '▼'}</span>
                  </div>
                  <AnimatePresence>
                    {showBrgyDrop && municipality && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={dropdownListStyle}>
                        {mindoroData[municipality].sort().map(b => (
                          <div key={b} style={dropdownItemStyle} onClick={() => { setBarangay(b); setShowBrgyDrop(false); }}>{b}</div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <textarea placeholder="PASTE NAMES HERE..." style={{ ...miniInputStyle, height: '150px', cursor: 'text', resize: 'none', backgroundColor: '#fff' }} value={listText} onChange={(e) => setListText(e.target.value)} />
                <button onClick={handleAutoSave} disabled={isSaving} style={{ backgroundColor: '#1b5e20', color: 'white', fontWeight: '900', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10px' }}>
                  {isSaving ? "CHECKING DUPLICATES..." : "ADD RECORDS"}
                </button>
              </div>
            </motion.div>

            {/* MAIN LISTING PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {Object.entries(groupedData).sort().map(([town, barangays], tIdx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: tIdx * 0.1 }}
                  key={town} 
                  style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', border: '1px solid #c8e6c9' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <h4 style={{ color: '#1b5e20', fontSize: '14px', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>{town.toUpperCase()}</h4>
                    <button onClick={() => setSelectedTownForFA(town)} style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>+ FA</button>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', flex: 1 }}>
                      {savedFAs.filter(fa => fa.municipality === town).map(fa => (
                        <span key={fa.id} style={{ backgroundColor: '#f1f8e9', color: '#1b5e20', border: '1px solid #c8e6c9', padding: '3px 10px', borderRadius: '20px', fontSize: '9px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                          {fa.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {Object.entries(barangays).sort().map(([brgy, farmers]) => (
                      <div key={brgy} style={{ backgroundColor: '#f9fdf9', borderRadius: '10px', border: '1px solid #c8e6c9', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#e8f5e9', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c8e6c9' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1b5e20' }}>{brgy}</span>
                          <span style={{ backgroundColor: '#1b5e20', color: 'white', fontSize: '8px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>{farmers.length}</span>
                        </div>
                        <div style={{ padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                          {farmers.map((f) => (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', padding: '6px 0', borderBottom: '1px solid #f1f8e9' }}>
                              <span style={{ opacity: 0.8, color: '#333' }}>{f.name}</span>
                              <button onClick={async () => {if(confirm("Delete?")) await deleteDoc(doc(db, "farmers", f.id))}} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}