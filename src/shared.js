import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";

// ── Firebase Configuration ──
const firebaseConfig = {
  apiKey: "AIzaSyBBoY91BXif2R9pi5smWyty0R-gleqmy6g",
  authDomain: "amigosconnect-fdb11.firebaseapp.com",
  projectId: "amigosconnect-fdb11",
  storageBucket: "amigosconnect-fdb11.firebasestorage.app",
  messagingSenderId: "99472736361",
  appId: "1:99472736361:web:ba0eaebb8adb1f1c2462f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cachedRetentionDays = 120;

export const storage = {
  async get(key) {
    try {
      if (key === "appSettings" || key === "ownerPass") {
        const docRef = doc(db, "amigos_store", key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data().value;
          if (key === "appSettings" && data && data.retentionDays) {
            cachedRetentionDays = data.retentionDays;
          }
          return data;
        }
        return null;
      } else {
        // --- ONE-TIME AUTO MIGRATION ---
        const oldDocRef = doc(db, "amigos_store", key);
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data().value;
          if (Array.isArray(oldData) && oldData.length > 0) {
            await Promise.all(oldData.map(item => setDoc(doc(db, key, item.id), item)));
          }
          await deleteDoc(oldDocRef); // Delete old document so migration doesn't run again
        }
        // -------------------------------

        const snapshot = await getDocs(collection(db, key));
        let data = snapshot.docs.map(d => d.data());
        // Auto-Cleanup
        if (key === "timelogs" || key === "leaves" || key === "advances") {
          const cutoffDate = new Date(Date.now() - cachedRetentionDays * 24 * 60 * 60 * 1000).toISOString();
          data = data.filter(item => (item.clockIn || item.appliedAt || item.from) > cutoffDate);
        }
        return data;
      }
    } catch (e) {
      console.error(`Firebase GET error for ${key}:`, e);
      return undefined;
    }
  },
  async set(key, val) {
    try {
      if (key === "appSettings" || key === "ownerPass") {
        if (key === "appSettings" && val && val.retentionDays) {
          cachedRetentionDays = val.retentionDays;
        }
        await setDoc(doc(db, "amigos_store", key), { value: val }, { merge: true });
      } else {
        console.warn(`storage.set called on collection ${key}. Use add/update/remove instead.`);
      }
    } catch (e) {
      console.error("Firebase SET error:", e);
    }
  },
  async add(key, item) {
    try { await setDoc(doc(db, key, item.id), item); } 
    catch (e) { console.error(`Firebase ADD error:`, e); }
  },
  async update(key, id, updates) {
    try { await setDoc(doc(db, key, id), updates, { merge: true }); } 
    catch (e) { console.error(`Firebase UPDATE error:`, e); }
  },
  async remove(key, id) {
    try { await deleteDoc(doc(db, key, id)); } 
    catch (e) { console.error(`Firebase REMOVE error:`, e); }
  },
  subscribe(key, callback) {
    if (key === "appSettings" || key === "ownerPass") {
      return onSnapshot(doc(db, "amigos_store", key), (docSnap) => {
        const data = docSnap.exists() ? docSnap.data().value : null;
        if (key === "appSettings" && data && data.retentionDays) {
          cachedRetentionDays = data.retentionDays;
        }
        callback(data);
      }, (e) => console.error(`Firebase SUBSCRIBE error for ${key}:`, e));
    } else {
      // --- ONE-TIME AUTO MIGRATION ---
      const oldDocRef = doc(db, "amigos_store", key);
      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const oldData = oldDocSnap.data().value;
        if (Array.isArray(oldData) && oldData.length > 0) {
          await Promise.all(oldData.map(item => setDoc(doc(db, key, item.id), item)));
        }
        await deleteDoc(oldDocRef);
      }
      // -------------------------------

      return onSnapshot(collection(db, key), (snapshot) => {
        let data = snapshot.docs.map(d => d.data());
        // Auto-Cleanup
        if (key === "timelogs" || key === "leaves" || key === "advances") {
          const cutoffDate = new Date(Date.now() - cachedRetentionDays * 24 * 60 * 60 * 1000).toISOString();
          data = data.filter(item => (item.clockIn || item.appliedAt || item.from) > cutoffDate);
        }
        callback(data);
      }, (e) => console.error(`Firebase SUBSCRIBE error for ${key}:`, e));
    }
  }
};

// ── Constants ──
export const SEED_EMPLOYEES = [];
export const SUPER_PASSWORD = "superadmin123";
export const getOwnerPass = async () => (await storage.get("ownerPass")) || "admin123";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DEFAULT_AUTO_CLOCK_OUT_HOUR_IST = 23;
export const DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST = 0;
export const defaultSettings = () => ({
  leavesEnabled: true,
  advancesEnabled: true,
  autoClockOutEnabled: true,
  autoClockOutHour: DEFAULT_AUTO_CLOCK_OUT_HOUR_IST,
  autoClockOutMinute: DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST,
  retentionDays: 120,
  branches: ["Mens", "Womens", "Crazo", "Warehouse"]
});

export const isWindows = typeof window !== "undefined" && /windows/i.test(window.navigator.userAgent);

// ── Global Styles ──
export const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

    :root {
      --bg:          #080b10;
      --surface:     #0f1318;
      --card:        #131820;
      --card-2:      #181e2a;
      --border:      #1e2535;
      --border-2:    #252e42;
      --gold:        #d4a843;
      --gold-light:  #f0c96a;
      --gold-dim:    #7a5e24;
      --gold-glow:   rgba(212,168,67,.18);
      --text:        #e9ecf3;
      --text-2:      #b8bdd0;
      --muted:       #5c6480;
      --danger:      #e05555;
      --danger-bg:   rgba(224,85,85,.1);
      --success:     #3ecf7a;
      --success-bg:  rgba(62,207,122,.1);
      --accent:      #5585ff;
      --accent-bg:   rgba(85,133,255,.1);
      --amber:       #f59e0b;
      --amber-bg:    rgba(245,158,11,.1);
    }

    html, body, #root { height: 100%; }

    body {
      background: var(--bg);
      color: var(--text);
    font-family: 'Inter', sans-serif;
    font-variant-numeric: tabular-nums;
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    h1,h2,h3,h4 { font-family: 'Playfair Display', serif; letter-spacing: 0.01em; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }

    input, select, textarea { font-family: 'Inter', sans-serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pulse-green {
      0%,100% { box-shadow: 0 0 0 0 rgba(62,207,122,.3); }
      50%      { box-shadow: 0 0 0 12px rgba(62,207,122,0); }
    }
    @keyframes pulse-gold {
      0%,100% { box-shadow: 0 0 0 0 rgba(212,168,67,.25); }
      50%      { box-shadow: 0 0 0 14px rgba(212,168,67,0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes dot-blink {
      0%,100% { opacity:1; } 50% { opacity:.2; }
    }

    .fade-up  { animation: fadeUp  .38s cubic-bezier(.22,.68,0,1.2) both; }
    .fade-in  { animation: fadeIn  .3s ease both; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 11px 22px; border-radius: 10px; border: none; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
      transition: all .18s ease; white-space: nowrap; letter-spacing: .01em;
    }
    .btn-gold {
      background: linear-gradient(130deg, #d4a843 0%, #b8882a 60%, #d4a843 100%);
      background-size: 200% auto;
      color: #080b10; font-weight: 600;
      box-shadow: 0 2px 16px rgba(212,168,67,.25);
    }
    .btn-gold:hover {
      background-position: right center;
      box-shadow: 0 4px 24px rgba(212,168,67,.4);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-2);
      color: var(--text-2);
    }
    .btn-outline:hover { border-color: var(--gold-dim); color: var(--gold); background: var(--gold-glow); }
    .btn-ghost {
      background: var(--card-2); color: var(--text-2); border: 1px solid var(--border);
    }
    .btn-ghost:hover { background: var(--border); color: var(--text); }
    .btn-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(224,85,85,.25); }
    .btn-danger:hover { background: rgba(224,85,85,.2); }
    .btn-success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(62,207,122,.25); }
    .btn-success:hover { background: rgba(62,207,122,.2); }
    .btn-amber { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(245,158,11,.25); }
    .btn-amber:hover { background: rgba(245,158,11,.2); }
    .btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 8px; }
    .btn-xs { padding: 5px 10px; font-size: 12px; border-radius: 6px; }
    .btn:disabled { opacity: .35; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

    /* ── Tags / Pills ── */
    .tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
    }
    .tag-gold    { background: rgba(212,168,67,.12); color: var(--gold); border: 1px solid rgba(212,168,67,.2); }
    .tag-green   { background: var(--success-bg); color: var(--success); border: 1px solid rgba(62,207,122,.2); }
    .tag-red     { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(224,85,85,.2); }
    .tag-blue    { background: var(--accent-bg); color: var(--accent); border: 1px solid rgba(85,133,255,.2); }
    .tag-amber   { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(245,158,11,.2); }
    .tag-muted   { background: rgba(92,100,128,.12); color: var(--muted); border: 1px solid rgba(92,100,128,.2); }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
    }
    .card-glow {
      background: linear-gradient(135deg, #131820, #0f1318);
      border: 1px solid var(--gold-dim);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 0 30px var(--gold-glow), inset 0 1px 0 rgba(212,168,67,.08);
    }

    /* ── Inputs ── */
    .input {
      width: 100%;
      padding: 11px 14px;
      border-radius: 9px;
      background: var(--surface);
      border: 1px solid var(--border-2);
      color: var(--text);
      font-size: 14px;
      outline: none;
      transition: border-color .18s;
    }
    .input:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px var(--gold-glow); }
    .input::placeholder { color: var(--muted); }

    /* ── Label ── */
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 6px;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 16px 0;
    }

    /* ── Active dot ── */
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--success);
      display: inline-block;
      animation: dot-blink 1.4s ease-in-out infinite;
    }

    @media (max-width: 600px) {
      .mobile-center-tag {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-left: 0 !important;
      }
    .mobile-export-btn {
      flex: 1 1 100%;
      justify-content: center;
    }
      .mobile-stack-grid {
        grid-template-columns: 1fr !important;
      }
      .mobile-full {
        width: 100%;
        flex: 1 1 100% !important;
        max-width: none !important;
      }
      .mobile-left {
        text-align: left !important;
        margin-left: 0 !important;
      }
    }
  `}</style>
);