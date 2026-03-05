  "use client";
  import React, { useState, useEffect } from 'react';
  import { db, auth } from '@/lib/firebase';
  import { 
    collection, addDoc, serverTimestamp, query, onSnapshot, 
    deleteDoc, doc, orderBy 
  } from 'firebase/firestore';
  import { signOut } from 'firebase/auth';
  import { useRouter, usePathname } from 'next/navigation';
  import { motion, AnimatePresence } from 'framer-motion';
  import { 
    Users, Database, History, LogOut, Search, 
    PlusCircle, MapPin, Trash2, X, ChevronDown, CheckCircle2, AlertCircle
  } from 'lucide-react';

  const mindoroData = {
    "Baco": ["Alag", "Banyaga", "Baras", "Bayanan", "Burbuli", "Catunggan", "Lantuyang", "Malapad", "Mangangan I", "Mangangan II", "Pambisan", "Pulang-Tubig", "San Andres", "San Ignacio", "Santa Cruz", "Santa Rosa I", "Santa Rosa II", "Tabon-tabon"],
    "Bansud": ["Alcadesma", "B. Del Mundo", "Concepcion", "Maligo", "Pag-asa", "Poblacion", "Proper Bansud", "Rosacara", "Salcedo", "Sumagui", "Villa Pag-asa"],
    "Bongabong": ["Anilao", "Aplaya", "Bagong Bayan I", "Bato", "Bukal", "Camantigue", "Carmundo", "Cawayan", "Ipil", "Kaligtasan", "Labasan", "Mabuhay", "Malitbog", "Morente", "Poblacion", "San Isidro", "Sigange", "Taging"],
    "Bulalacao": ["Bagong Sikat", "Benli", "Cabugao", "Cambane", "Campababa", "Maasin", "Maujao", "Milagrosa", "Nasoke", "Poblacion", "San Francisco", "San Isidro", "San Jose", "San Roque"],
    "Calapan City": ["Balingasag", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II", "Bucayao", "Bulusan", "Calero", "Camansihan", "Camalig", "Canubing I", "Canubing II", "Comunal", "Guinobatan", "Gulod", "Gutad", "Iwahig", "Lalud", "Lazareto", "Libis", "Lumangbayan", "Maidlang", "Malitbog", "Masipit", "Nag-iba I", "Nag-iba II", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang", "Patas", "Personas", "Puting-Tubig", "San Antonio", "San Vicente Central", "San Vicente East", "San Vicente North", "San Vicente South", "San Vicente West", "Sapul", "Silonay", "Suqui", "Tawagan", "Tawiran", "Tibag", "Wawa"],
    "Gloria": ["Agos", "Alma Villa", "Balete", "Banus", "Bulaklakan", "Gumamela", "Kawit", "Malamig", "Malayong", "Mirayan", "Narra", "Papiano", "Poblacion", "Santa Maria", "Santa Theresa", "Tambong"],
    "Mansalay": ["B. Cahidiocan", "Balugo", "Bonbon", "Budburan", "Cabalwa", "Don Pedro", "Manaul", "Panaytayan", "Poblacion", "Roma", "Sta. Maria", "Villa Libertad"],
    "Naujan": ["Adriel", "Andres Bonifacio", "Antipolo", "Apisani", "Arante", "Aurora", "Bacungan", "Bagong Pook", "Balite", "Bancuro", "Barcenaga", "Bayani", "Bubog", "Buhangin", "Concepcion", "Dao", "Del Pilar", "Estrella", "Evangelista", "Inarawan", "Laguna", "Mabini", "Mag-asawang Tubig", "Malaya", "Malvar", "Masaguing", "Metolza", "Nag-iba I", "Nag-iba II", "Pag-asa", "Pinagsabangan I", "Pinagsabangan II", "Poblacion I", "Poblacion II", "Poblacion III", "Sampaguita", "San Agustin I", "San Agustin II", "San Antonio", "San Isidro", "San Jose", "San Luis", "San Nicolas", "San Roque", "Santa Cruz", "Santa Maria", "Santiago", "Santo Niño", "Tagumpay", "Tigkan"],
    "Pinamalayan": ["Anoling", "Bacungan", "Bangbang", "Banilad", "Buli", "Cacutud", "Del Razon", "Guinhawa", "Inclanay", "Lumambayan", "Malaya", "Maliwalo", "Nabuslot", "Pag-asa", "Palayan", "Pambisan Munti", "Pili", "Poblacion", "Quinabigan", "Ranzo", "Rosario", "Sta. Isabel", "Sta. Maria", "Sta. Rita", "Wawa"],
    "Pola": ["Bacungan", "Batuhan", "Bayanan", "Biga", "Buhay na Bato", "Calubasani", "Campis", "Casiligan", "Malibago", "Maluanluan", "Matulatula", "Paho", "Panikihan", "Poblacion", "Pula", "Tagumpay", "Tigkan"],
    "Puerto Galera": ["Aninuan", "Baclayan", "Balatero", "Dulangan", "Poblacion", "Sabang", "San Antonio", "San Isidro", "Sinandigan", "Tabinay", "Villaflor"],
    "Roxas": ["Bagumbayan", "Cantil", "Dangay", "Happy Valley", "Libertad", "Little Tanauan", "Mabuhay", "Marahisi", "Paclasan", "San Aquilino", "San Isidro", "San Jose", "San Mariano", "San Vicente", "Urdaneta", "Victoria"],
    "San Teodoro": ["Binalaba", "Caagutayan", "Calangatan", "Ilag", "Lumangbayan", "Poblacion", "Tacligan"],
    "Socorro": ["Bagsok", "Batong Dalig", "Bayuin", "Calubasani", "Catiningan", "Fortuna", "Happy Valley", "Leuteboro I", "Leuteboro II", "Mabuhay", "Maasimin", "Poblacion", "Santo Domingo", "Subaan", "Villareal"],
    "Victoria": ["Alcate", "Antonino", "Babangonan", "Bagong Silang", "Bagong Buhay", "Bambanin", "Bethel", "Canaan", "Concepcion", "Duongan", "Loyola", "Mabini", "Macatoc", "Malabo", "Maluac", "Ordovilla", "Pakyas", "Poblacion I", "Poblacion II", "Poblacion III", "Resurreccion", "San Antonio", "San Gabriel", "San Narciso", "Urdaneta", "Villa Victoria"]
  };

  const ValidationTooltip = ({ message }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={styles.tooltipContainer}
    >
      <div style={styles.tooltipArrow} />
      <div style={styles.tooltipContent}>
        <div style={styles.tooltipIcon}><AlertCircle size={14} fill="#f59e0b" color="#fff" /></div>
        <span>{message}</span>
      </div>
    </motion.div>
  );

  export default function MasterlistPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [listText, setListText] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [barangay, setBarangay] = useState('');
    const [savedFarmers, setSavedFarmers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showMuniDrop, setShowMuniDrop] = useState(false);
    const [showBrgyDrop, setShowBrgyDrop] = useState(false);
    const [savedFAs, setSavedFAs] = useState([]);
    const [selectedTownForFA, setSelectedTownForFA] = useState(null);
    const [newFAName, setNewFAName] = useState('');

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [farmerToDelete, setFarmerToDelete] = useState(null);
    const [faToDelete, setFaToDelete] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationError, setValidationError] = useState({ field: null, message: "" });
    const [addedCount, setAddedCount] = useState(0);

    useEffect(() => {
      const q = query(collection(db, "farmers"), orderBy("name", "asc"));
      const unsubFarmers = onSnapshot(q, (snap) => {
        setSavedFarmers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const faQuery = query(collection(db, "associations"), orderBy("name", "asc"));
      const unsubFA = onSnapshot(faQuery, (snap) => {
        setSavedFAs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => { unsubFarmers(); unsubFA(); };
    }, []);

    const handleLogout = () => {
      signOut(auth).then(() => router.push('/login'));
    };

    const normalizeName = (name) => {
      if (!name) return "";
      return name.replace(/,/g, '').split(/\s+/).sort().join(' ').trim().toUpperCase();
    };

    const handleAutoSave = async () => {
      setValidationError({ field: null, message: "" });

      if (!municipality) {
          setValidationError({ field: 'municipality', message: 'Please select a Municipality.' });
          return;
      }
      if (!barangay) {
          setValidationError({ field: 'barangay', message: 'Please select a Barangay.' });
          return;
      }
      if (!listText.trim()) {
          setValidationError({ field: 'list', message: 'Please enter at least one name.' });
          return;
      }

      setIsSaving(true);
      const existingNormalized = savedFarmers.map(f => normalizeName(f.name));
      const inputNames = listText.split(/\n/).filter(n => n.trim() !== '');
      let count = 0;
      
      try {
        for (const rawName of inputNames) {
          const cleanName = rawName.trim().toUpperCase();
          const normalizedInput = normalizeName(cleanName);
          if (!existingNormalized.includes(normalizedInput)) {
            await addDoc(collection(db, "farmers"), {
              name: cleanName, municipality, barangay, province: "Oriental Mindoro", createdAt: serverTimestamp()
            });
            count++;
          }
        }
        setAddedCount(count);
        setListText('');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setAddedCount(0);
        }, 3000);
      } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleAddFA = async () => {
      if (!newFAName.trim()) return;
      try {
        await addDoc(collection(db, "associations"), {
          name: newFAName.toUpperCase(), municipality: selectedTownForFA, createdAt: serverTimestamp()
        });
        setNewFAName('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (err) { console.error(err); }
    };

    const confirmDeleteFarmer = async () => {
      if (farmerToDelete) {
        await deleteDoc(doc(db, "farmers", farmerToDelete.id));
        setFarmerToDelete(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    };

    const confirmDeleteFA = async () => {
      if (faToDelete) {
        await deleteDoc(doc(db, "associations", faToDelete.id));
        setFaToDelete(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    };

    const groupedData = savedFarmers
      .filter(f => 
          f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          f.municipality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.barangay?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .reduce((acc, current) => {
        if (!acc[current.municipality]) acc[current.municipality] = {};
        if (!acc[current.municipality][current.barangay]) acc[current.municipality][current.barangay] = [];
        acc[current.municipality][current.barangay].push(current);
        return acc;
      }, {});

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
              <h1 style={styles.title}>Farmer Masterlist</h1>
              <p style={styles.subtitle}>Data of registered farmers per municipality</p>
            </div>
            <div style={styles.searchBox}>
              <Search size={18} color="#1b5e20" style={{ position: 'absolute', left: '15px', opacity: 0.6 }} />
              <input 
                  placeholder="Type name or location..." 
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              /> 
            </div>
          </div>

          <div style={styles.contentGrid}>
            <div style={{ position: 'relative' }}>
              <div style={styles.card}>
                  <h3 style={styles.cardTitle}><PlusCircle size={18} /> Batch Import</h3>
                  <div style={styles.formGroup}>
                      <div style={styles.field}>
                          <label style={styles.label}>MUNICIPALITY</label>
                          <div 
                              style={{
                                  ...styles.selectTrigger, 
                                  borderColor: validationError.field === 'municipality' ? '#f59e0b' : '#c8e6c9'
                              }} 
                              onClick={() => {
                                  setShowMuniDrop(!showMuniDrop); 
                                  setShowBrgyDrop(false);
                                  setValidationError({ field: null, message: "" });
                              }}
                          >
                              {municipality || "Select Municipality"} <ChevronDown size={14} />
                          </div>
                          {validationError.field === 'municipality' && <ValidationTooltip message={validationError.message} />}
                          <AnimatePresence>
                              {showMuniDrop && (
                                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={styles.dropdown}>
                                      {Object.keys(mindoroData).sort().map(m => (
                                          <div key={m} style={styles.dropItem} onClick={() => {setMunicipality(m); setBarangay(''); setShowMuniDrop(false)}}>{m}</div>
                                      ))}
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>

                      <div style={styles.field}>
                          <label style={styles.label}>BARANGAY</label>
                          <div 
                              style={{
                                  ...styles.selectTrigger, 
                                  opacity: municipality ? 1 : 0.5,
                                  borderColor: validationError.field === 'barangay' ? '#f59e0b' : '#c8e6c9'
                              }} 
                              onClick={() => {
                                  if(municipality) {
                                      setShowBrgyDrop(!showBrgyDrop);
                                      setValidationError({ field: null, message: "" });
                                  }
                              }}
                          >
                              {barangay || "Select Barangay"} <ChevronDown size={14} />
                          </div>
                          {validationError.field === 'barangay' && <ValidationTooltip message={validationError.message} />}
                          <AnimatePresence>
                              {showBrgyDrop && municipality && (
                                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={styles.dropdown}>
                                      {mindoroData[municipality].sort().map(b => (
                                          <div key={b} style={styles.dropItem} onClick={() => {setBarangay(b); setShowBrgyDrop(false)}}>{b}</div>
                                      ))}
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>

                      <div style={styles.field}>
                          <label style={styles.label}>NAME LIST (One per line)</label>
                          <textarea 
                              style={{
                                  ...styles.textarea,
                                  borderColor: validationError.field === 'list' ? '#f59e0b' : '#c8e6c9'
                              }} 
                              placeholder
                              value={listText} 
                              onFocus={() => { 
                                  setShowMuniDrop(false); 
                                  setShowBrgyDrop(false); 
                                  setValidationError({ field: null, message: "" });
                              }}
                              onChange={(e) => setListText(e.target.value)} 
                          />
                          {validationError.field === 'list' && <ValidationTooltip message={validationError.message} />}
                      </div>

                      <button onClick={handleAutoSave} disabled={isSaving} style={styles.primaryBtn}>
                          {isSaving ? "Processing..." : "ADD TO MASTERLIST"}
                      </button>
                  </div>
              </div>
            </div>

            <div style={styles.scrollColumn}>
              {Object.entries(groupedData).sort().map(([town, brgys]) => (
                <div key={town} style={styles.townSection}>
                  <div style={styles.townHeader}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <MapPin size={18} color="#1b5e20" />
                        <h2 style={styles.townTitle}>{town.toUpperCase()}</h2>
                      </div>
                      <button onClick={() => setSelectedTownForFA(town)} style={styles.addFaBtn}>+ FA</button>
                  </div>
                  
                  <div style={styles.faContainer}>
                    {savedFAs.filter(fa => fa.municipality === town).map(fa => (
                      <div key={fa.id} style={styles.faBadge}>{fa.name}</div>
                    ))}
                  </div>

                  <div style={styles.brgyGrid}>
                    {Object.entries(brgys).sort().map(([brgy, farmers]) => (
                      <div key={brgy} style={styles.brgyCard}>
                        <div style={styles.brgyTitleBar}>
                          <span>{brgy}</span>
                          <span style={styles.countBadge}>{farmers.length}</span>
                        </div>
                        <div style={styles.farmerList}>
                          {farmers.map(f => (
                            <div key={f.id} style={styles.farmerRow}>
                              <span>{f.name}</span>
                              <button onClick={() => setFarmerToDelete(f)} style={styles.delBtn}><Trash2 size={12}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

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

          {farmerToDelete && (
            <div style={styles.modalOverlay}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContent}>
                <div style={styles.modalIconBoxRed}><Trash2 size={24} /></div>
                <h3 style={styles.modalTitle}>Remove Farmer</h3>
                <p style={styles.modalText}>Delete <strong>{farmerToDelete.name}</strong> from the masterlist? This cannot be undone.</p>
                <div style={styles.modalActions}>
                  <button onClick={() => setFarmerToDelete(null)} style={styles.cancelBtn}>Cancel</button>
                  <button onClick={confirmDeleteFarmer} style={styles.confirmLogoutBtn}>Delete</button>
                </div>
              </motion.div>
            </div>
          )}

          {selectedTownForFA && (
            <div style={styles.modalOverlay}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContentWide}>
                <div style={styles.modalHeader}>
                  <h3 style={{margin:0, fontSize:'16px', fontWeight:900}}>FA Manager: {selectedTownForFA}</h3>
                  <button onClick={() => setSelectedTownForFA(null)} style={{background:'none', border:'none', cursor:'pointer', color:'#94a3b8'}}><X size={18}/></button>
                </div>
                <div style={{display:'flex', gap:'10px', marginBottom:'20px', marginTop:'20px'}}>
                    <input value={newFAName} onChange={(e) => setNewFAName(e.target.value)} placeholder="New Association Name..." style={styles.modalInput} />
                    <button onClick={handleAddFA} style={styles.modalAddBtn}>ADD</button>
                </div>
                <div style={styles.modalList}>
                  {savedFAs.filter(fa => fa.municipality === selectedTownForFA).map(fa => (
                    <div key={fa.id} style={styles.modalItem}>
                      <span style={{fontSize:'13px', fontWeight:600}}>{fa.name}</span>
                      <button onClick={() => setFaToDelete(fa)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer', padding: '5px'}}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {faToDelete && (
            <div style={styles.modalOverlay}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContent}>
                <div style={styles.modalIconBoxRed}><Trash2 size={24} /></div>
                <h3 style={styles.modalTitle}>Remove Association</h3>
                <p style={styles.modalText}>Delete <strong>{faToDelete.name}</strong> from the association list? This cannot be undone.</p>
                <div style={styles.modalActions}>
                  <button onClick={() => setFaToDelete(null)} style={styles.cancelBtn}>Cancel</button>
                  <button onClick={confirmDeleteFA} style={styles.confirmLogoutBtn}>Delete</button>
                </div>
              </motion.div>
            </div>
          )}

          {showSuccess && (
            <div style={styles.modalOverlay}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} style={styles.modalContent}>
                <div style={styles.modalIconBoxGreen}><CheckCircle2 size={24} /></div>
                <h3 style={styles.modalTitle}>Success!</h3>
                <p style={styles.modalText}>
                  {addedCount > 0 
                    ? `Successfully added ${addedCount} farmer(s) to the data.` 
                    : "Data has been updated successfully."}
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
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
    container: { display: 'flex', height: '100vh', backgroundColor: '#e8f5e9', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
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
    
    searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
    searchInput: { padding: '12px 20px 12px 45px', borderRadius: '50px', border: '1px solid #c8e6c9', width: '300px', fontSize: '14px', outline: 'none' },

    contentGrid: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' },
    card: { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #c8e6c9', position: 'sticky', top: '0' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800', color: '#1b5e20', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' },
    label: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.8px' },
    selectTrigger: { padding: '12px', background: '#f8fafc', border: '1px solid #c8e6c9', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #c8e6c9', borderRadius: '12px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '5px' },
    dropItem: { padding: '10px 15px', fontSize: '13px', cursor: 'pointer', transition: '0.2s' },
    textarea: { padding: '12px', background: '#f8fafc', border: '1px solid #c8e6c9', borderRadius: '10px', fontSize: '13px', height: '120px', resize: 'none', outline: 'none', transition: 'border-color 0.2s' },
    primaryBtn: { background: '#1b5e20', color: '#fff', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', width: '100%' },

    tooltipContainer: { position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '10px', zIndex: 50, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' },
    tooltipContent: { background: '#fff', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', color: '#1e293b', border: '1px solid #c8e6c9', whiteSpace: 'nowrap' },
    tooltipIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tooltipArrow: { position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '10px', height: '10px', background: '#fff', borderBottom: '1px solid #c8e6c9', borderRight: '1px solid #c8e6c9' },

    scrollColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
    townSection: { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #c8e6c9' },
    townHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    townTitle: { fontSize: '18px', fontWeight: '900', color: '#1b5e20', margin: 0 },
    addFaBtn: { padding: '6px 12px', background: '#f1f8e9', color: '#166534', border: '1px solid #c8e6c9', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
    faContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' },
    faBadge: { padding: '4px 12px', background: '#f1f8e9', border: '1px solid #c8e6c9', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#166534' },
    
    brgyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
    brgyCard: { border: '1px solid #f1f8e9', borderRadius: '16px', overflow: 'hidden' },
    brgyTitleBar: { padding: '10px 15px', background: '#f1f8e9', borderBottom: '1px solid #c8e6c9', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '12px', color: '#1b5e20' },
    countBadge: { background: '#1b5e20', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '10px' },
    farmerList: { padding: '10px', maxHeight: '180px', overflowY: 'auto' },
    farmerRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#475569', borderBottom: '1px solid #f1f8e9' },
    delBtn: { color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(232, 245, 233, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    modalContent: { background: '#fff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #c8e6c9' },
    modalContentWide: { background: '#fff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', border: '1px solid #c8e6c9' },
    modalIconBoxRed: { width: '50px', height: '50px', background: '#fff1f2', color: '#e11d48', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
    modalIconBoxGreen: { width: '50px', height: '50px', background: '#f1f8e9', color: '#166534', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
    modalTitle: { fontSize: '18px', fontWeight: '800', color: '#1b5e20', margin: '0 0 10px 0' },
    modalText: { fontSize: '14px', color: '#64748b', margin: '0 0 25px 0', lineHeight: '1.6' },
    modalActions: { display: 'flex', gap: '10px' },
    cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #c8e6c9', background: 'none', fontWeight: '700', cursor: 'pointer', color: '#64748b' },
    confirmLogoutBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#e11d48', color: '#fff', fontWeight: '700', cursor: 'pointer' },
    modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f8e9', paddingBottom:'15px'},
    modalInput: { flex: 1, padding: '12px', border: '1px solid #c8e6c9', borderRadius: '10px', fontSize: '14px', outline: 'none' },
    modalAddBtn: { background: '#1b5e20', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    modalList: { maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    modalItem: { padding: '12px', background: '#f1f8e9', borderRadius: '12px', border: '1px solid #c8e6c9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  };