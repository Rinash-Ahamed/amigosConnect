import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { 
  CheckCircle, StopCircle, Play, Coffee, User, Briefcase, Calendar, 
  Download, Clock, Check, X, Inbox, ClipboardList, IndianRupee, 
  Users, Settings, LayoutDashboard, Timer, Phone, Mail, MapPin, 
  Edit2, Trash2, Flag, Eye, EyeOff, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react";
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

// ── Storage helpers ──
let cachedRetentionDays = 120;

const storage = {
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
      getDoc(oldDocRef).then(async (oldDocSnap) => {
        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data().value;
          if (Array.isArray(oldData) && oldData.length > 0) {
            await Promise.all(oldData.map(item => setDoc(doc(db, key, item.id), item)));
          }
          await deleteDoc(oldDocRef);
        }
      }).catch(e => console.error(`Migration error for ${key}:`, e));
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

// ── Seed data ──
const SEED_EMPLOYEES = [];
const SUPER_PASSWORD = "superadmin123";

const getOwnerPass = async () => (await storage.get("ownerPass")) || "admin123";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DEFAULT_AUTO_CLOCK_OUT_HOUR_IST = 23;
const DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST = 0;
const defaultSettings = () => ({
  leavesEnabled: true,
  autoClockOutEnabled: true,
  autoClockOutHourIst: DEFAULT_AUTO_CLOCK_OUT_HOUR_IST,
  autoClockOutMinuteIst: DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST,
});
const to12HourParts = (hour24) => ({
  hour: hour24 % 12 || 12,
  period: hour24 >= 12 ? "PM" : "AM",
});
const to24Hour = (hour12, period) => {
  const normalized = Number(hour12) % 12;
  return period === "PM" ? normalized + 12 : normalized;
};

// ── Utilities ──
const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const hoursWorked = (clockIn, clockOut, breaks = []) => {
  if (!clockIn || !clockOut) return 0;
  let totalMs = new Date(clockOut) - new Date(clockIn);
  
  if (Array.isArray(breaks)) {
    breaks.forEach(b => {
      if (b.start && b.end) {
        totalMs -= (new Date(b.end) - new Date(b.start));
      }
    });
  }
  return Math.max(0, Math.round((totalMs / 3600000) * 100) / 100);
};
const totalHours = (logs) =>
  logs.reduce((s, l) => s + hoursWorked(l.clockIn, l.clockOut, l.breaks), 0);
const uid = () => Math.random().toString(36).slice(2, 10);
const getAutoClockOutIso = (
  clockInIso,
  hourIst = DEFAULT_AUTO_CLOCK_OUT_HOUR_IST,
  minuteIst = DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST
) => {
  if (!clockInIso) return null;
  const clockIn = new Date(clockInIso);
  if (Number.isNaN(clockIn.getTime())) return null;

  const clockInIst = new Date(clockIn.getTime() + IST_OFFSET_MS);
  let autoUtcMs = Date.UTC(
    clockInIst.getUTCFullYear(),
    clockInIst.getUTCMonth(),
    clockInIst.getUTCDate(),
    hourIst,
    minuteIst,
    0,
    0
  ) - IST_OFFSET_MS;

  if (clockIn.getTime() >= autoUtcMs) autoUtcMs += 24 * 60 * 60 * 1000;
  return new Date(autoUtcMs).toISOString();
};
const closeOpenBreaksAt = (log, clockOutIso) => {
  if (!Array.isArray(log.breaks) || log.breaks.length === 0) return log.breaks;
  return log.breaks.map((br, idx) =>
    idx === log.breaks.length - 1 && !br.end ? { ...br, end: clockOutIso } : br
  );
};
const applyAutoClockOut = (logs, settings, now = new Date()) => {
  if (settings?.autoClockOutEnabled === false || !Array.isArray(logs)) {
    return { logs, changed: false, closed: [] };
  }

  const closed = [];
  const hourIst = settings?.autoClockOutHourIst ?? DEFAULT_AUTO_CLOCK_OUT_HOUR_IST;
  const minuteIst = settings?.autoClockOutMinuteIst ?? DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST;
  const updatedLogs = logs.map(log => {
    if (log.clockOut) return log;
    const autoClockOutIso = getAutoClockOutIso(log.clockIn, hourIst, minuteIst);
    if (!autoClockOutIso || new Date(autoClockOutIso) > now) return log;
    closed.push(log);
    return {
      ...log,
      clockOut: autoClockOutIso,
      breaks: closeOpenBreaksAt(log, autoClockOutIso),
      autoClockedOut: true,
      autoClockOutReason: `${String(hourIst).padStart(2, "0")}:${String(minuteIst).padStart(2, "0")} IST default close`,
    };
  });

  return { logs: updatedLogs, changed: closed.length > 0, closed };
};
const csvCell = (value) => {
  const text = value === undefined || value === null || value === "" ? "-" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const downloadCSV = (filename, rows) => {
  const csv = rows.map(row => row.map(csvCell).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = filename;
  link.click();
};
const ownerPasswordIssues = (password) => {
  const pwd = password.trim();
  const issues = [];
  if (pwd.length < 8) issues.push("at least 8 characters");
  if (!/[A-Za-z]/.test(pwd)) issues.push("at least 1 letter");
  if (!/[^A-Za-z0-9\s]/.test(pwd)) issues.push("at least 1 special character");
  return issues;
};

const isWindows = typeof window !== "undefined" && /windows/i.test(window.navigator.userAgent);

// ── Lazy Loaded Components ──
// Dynamically import Recharts so it doesn't block the initial app load
const LazyChart = lazy(async () => {
  const { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } = await import("recharts");
  return {
    default: ({ data, dataKey = "Hours" }) => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip cursor={{fill: 'var(--border-2)'}} contentStyle={{background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)'}} itemStyle={{color: 'var(--gold)', fontWeight: 600}} />
          <Bar dataKey={dataKey} fill="var(--gold)" radius={[6,6,6,6]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    )
  };
});

// ── Global Styles ──
const GlobalStyle = () => (
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

// ── PIN Pad ──
function PinPad({ value, onChange, maxLen = 4 }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div>
      <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:24 }}>
        {Array.from({length: maxLen}).map((_,i) => (
          <div key={i} style={{
            width:13, height:13, borderRadius:"50%",
            background: i < value.length ? "var(--gold)" : "var(--border-2)",
            transition: "background .15s, transform .15s",
            transform: i < value.length ? "scale(1.15)" : "scale(1)",
            boxShadow: i < value.length ? "0 0 8px rgba(212,168,67,.5)" : "none"
          }}/>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9 }}>
        {keys.map((k,i) => (
          <button key={i} className="btn btn-ghost"
            style={{
              fontSize:20, padding:"15px 0",
              opacity: k==="" ? 0 : 1,
              pointerEvents: k==="" ? "none":"auto",
              borderRadius:11,
              fontFamily:"'Inter',sans-serif",
              fontWeight: k==="⌫" ? 400 : 500,
            }}
            onClick={() => {
              if (!k) return;
              if (k === "⌫") onChange(value.slice(0,-1));
              else if (value.length < maxLen) onChange(value + k);
            }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Login Screen ──
function LoginScreen({ onLogin }) {
  const detectIOS = () => typeof window !== "undefined" && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const detectStandalone = () => typeof window !== "undefined" && ("standalone" in window.navigator) && window.navigator.standalone;
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState("");
  const [pass, setPass] = useState("");
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS] = useState(detectIOS);
  const [isStandalone] = useState(detectStandalone);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    (async () => {
      let emps = await storage.get("employees");
      if (emps === undefined) {
        setError("Could not load staff data. Check your connection and try again.");
        emps = [];
      } else if (emps === null) {
        emps = SEED_EMPLOYEES;
      }
      setEmployees(emps);
      setLoading(false);
    })();
  }, []);

  const tryEmployeePin = useCallback((p) => {
    if (p.length < 4) return;
    const emp = employees.find(e => e.pin === p);
    if (emp) { setError(""); onLogin("employee", emp); }
    else { setError("Incorrect PIN. Please try again."); setPin(""); }
  }, [employees, onLogin]);

  const handlePinChange = (nextPin) => {
    setPin(nextPin);
    if (nextPin.length === 4) tryEmployeePin(nextPin);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)"}}>
      <GlobalStyle />
      <div style={{width:28,height:28,border:"2px solid var(--border-2)",borderTopColor:"var(--gold)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:24,
      background:"radial-gradient(ellipse 80% 60% at 50% -10%, #1a120400 0%, transparent 70%), var(--bg)",
      position:"relative", overflow:"hidden"
    }}>
      <GlobalStyle />
      {/* Decorative orbs */}
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,168,67,.04) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-10%",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(85,133,255,.04) 0%,transparent 70%)",pointerEvents:"none"}}/>

      {/* Logo */}
      <div className="fade-up" style={{textAlign:"center", marginBottom:44}}>
        <div style={{
          width:76, height:76, minWidth:76, minHeight:76, flexShrink:0, borderRadius:"50%", margin:"0 auto 18px",
          display:"flex", alignItems:"center", justifyContent:"center",
          overflow:"hidden"
        }}>
          <img src="/logo.png" alt="Amigos" fetchpriority="high" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}} />
        </div>
        <h1 style={{fontSize:30, color:"var(--gold)", marginBottom:4, letterSpacing:"0.05em"}}>AMIGOS Connect</h1>
        <p style={{color:"var(--muted)", fontSize:12, letterSpacing:"0.18em", textTransform:"uppercase", fontWeight:500}}>Staff & Manager Portal</p>
      </div>

      {!mode ? (
        <div className="fade-up" style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:12}}>
          <button className="btn btn-gold" style={{padding:"17px",fontSize:15,borderRadius:13,width:"100%"}}
            onClick={() => { setMode("employee"); setError(""); }}>
            <User size={18} /> Employee Login
          </button>
          <button className="btn btn-outline" style={{padding:"17px",fontSize:15,borderRadius:13,width:"100%"}}
            onClick={() => { setMode("owner"); setError(""); }}>
            <Briefcase size={18} /> Owner / Manager
          </button>
        </div>
      ) : mode === "employee" ? (
        <div className="fade-up" style={{width:"100%",maxWidth:300,textAlign:"center"}}>
          <p style={{color:"var(--text-2)",marginBottom:28,fontSize:14}}>Enter your 4-digit PIN</p>
          <PinPad value={pin} onChange={handlePinChange} />
          {error && (
            <p style={{color:"var(--danger)",marginTop:16,fontSize:13,background:"var(--danger-bg)",padding:"9px 14px",borderRadius:8,border:"1px solid rgba(224,85,85,.2)"}}>
              {error}
            </p>
          )}
          <button className="btn btn-ghost btn-sm" style={{marginTop:20,width:"100%"}} onClick={() => { setMode(null); setPin(""); setError(""); }}>
            <ChevronLeft size={14}/> Back
          </button>
        </div>
      ) : (
        <div className="fade-up" style={{width:"100%",maxWidth:300}}>
          <p style={{color:"var(--text-2)",marginBottom:18,textAlign:"center",fontSize:14}}>Owner Password</p>
          <label className="field-label">Password</label>
          <div style={{position: "relative", marginBottom: 12}}>
            <input
              type={showPass ? "text" : "password"} placeholder="Enter password" value={pass}
              onChange={e => setPass(e.target.value)}
              className="input"
              style={{marginBottom:0, paddingRight:40}}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const real = await getOwnerPass();
                  if (pass === real || pass === SUPER_PASSWORD) { setError(""); onLogin("owner", null); }
                  else { setError("Incorrect password."); setPass(""); }
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, padding: 0
              }}
            >
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {error && <p style={{color:"var(--danger)",fontSize:13,marginBottom:12,padding:"8px 12px",background:"var(--danger-bg)",borderRadius:8}}>{error}</p>}
          <button className="btn btn-gold" style={{width:"100%",padding:14,marginBottom:8}}
            onClick={async () => {
              const real = await getOwnerPass();
              if (pass === real || pass === SUPER_PASSWORD) { setError(""); onLogin("owner", null); }
              else { setError("Incorrect password."); setPass(""); }
            }}>
            Login as Owner/Manager
          </button>
          <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={() => { setMode(null); setPass(""); setError(""); }}><ChevronLeft size={14}/> Back</button>
        </div>
      )}

      {/* Manual Install Button for Android/Mac */}
      {installPrompt && !mode && !isIOS && !isWindows && (
        <div className="fade-up" style={{position:"absolute", bottom: 30}}>
          <button className="btn btn-outline btn-sm" style={{background:"var(--card)", color:"var(--gold)", border:"1px solid var(--gold-dim)"}} onClick={handleInstall}>
            <Download size={14}/> Install Amigos App
          </button>
        </div>
      )}

      {/* iOS Install Instructions */}
      {isIOS && !isStandalone && !mode && (
        <div className="fade-up" style={{position:"absolute", bottom: 24, textAlign:"center", padding:"0 20px", width:"100%", pointerEvents:"none"}}>
          <div style={{background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 16px", display:"inline-block", color:"var(--muted)", fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>
            To install on iPhone: tap <b style={{color:"var(--text)"}}>Share</b> then <b style={{color:"var(--text)"}}>Add to Home Screen</b> <span style={{fontSize:14}}>+</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Employee View ──
function EmployeeView({ employee, onLogout, onUpdateEmployee }) {
  const [logs, setLogs] = useState([]);
  const [active, setActive] = useState(null);
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState("home");
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ from:"", to:"", type:"Casual", reason:"" });
  const [leaveErr, setLeaveErr] = useState("");
  const [leaveSent, setLeaveSent] = useState(false);
  const [settings, setSettings] = useState(defaultSettings());
  const [advances, setAdvances] = useState([]);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });
  const [advanceErr, setAdvanceErr] = useState("");
  const [advanceSent, setAdvanceSent] = useState(false);
  const [clocking, setClocking] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: employee.phone || "",
    email: employee.email || "",
    gender: employee.gender || "Select Gender",
    address: employee.address || ""
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = async () => {
    const allEmps = await storage.get("employees");
    if (!Array.isArray(allEmps)) {
      alert("Could not load staff data. Please check your connection and try again.");
      return;
    }
    if (!allEmps.some(e => e.id === employee.id)) {
      alert("Your staff profile was not found. Please ask the owner to refresh staff data.");
      return;
    }
    const updatedEmp = { ...employee, ...profileForm };
    await storage.update("employees", employee.id, updatedEmp);
    if(onUpdateEmployee) onUpdateEmployee(updatedEmp);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    (async () => {
      const st = { ...defaultSettings(), ...((await storage.get("appSettings")) || {}) };
      const all = (await storage.get("timelogs")) || [];
      const autoClosed = applyAutoClockOut(all, st);
      if (autoClosed.changed) {
        await Promise.all(autoClosed.closed.map(l => storage.update("timelogs", l.id, {
          clockOut: l.clockOut, breaks: l.breaks,
          autoClockedOut: l.autoClockedOut, autoClockOutReason: l.autoClockOutReason
        })));
      }
      const mine = autoClosed.logs.filter(l => l.employeeId === employee.id);
      setLogs(mine);
      const open = mine.find(l => !l.clockOut);
      setActive(open || null);
      const allLeaves = (await storage.get("leaves")) || [];
      setLeaves(allLeaves.filter(l => l.employeeId === employee.id));
      const allAdvances = (await storage.get("advances")) || [];
      setAdvances(allAdvances.filter(a => a.employeeId === employee.id));
      
      setSettings(st);
      if (st.leavesEnabled === false && view === "leave") setView("home");
    })();
  }, [employee.id, view]);

  const clockIn = async () => {
    if (!window.confirm("Are you sure you want to clock in?")) return;
    setClocking(true);
    try {
      const allLeaves = (await storage.get("leaves")) || [];
      const today = new Date().toISOString().split("T")[0];
      const onLeave = allLeaves.find(l =>
        l.employeeId === employee.id && l.status === "approved" &&
        today >= l.from && today <= l.to
      );
      if (onLeave) { alert("You are on approved leave today and cannot clock in."); return; }
      const log = { id: uid(), employeeId: employee.id, name: employee.name, clockIn: new Date().toISOString(), clockOut: null };
      await storage.add("timelogs", log);
      setLogs(p => [...p, log]);
      setActive(log);
    } finally {
      setClocking(false);
    }
  };

  const clockOut = async () => {
    if (!window.confirm("Are you sure you want to clock out?")) return;
    setClocking(true);
    try {
      let finalActive = { ...active };
      const clockOutIso = new Date().toISOString();
      // auto-end any open break
      if (finalActive.breaks && finalActive.breaks.length > 0) {
        const lastBreak = finalActive.breaks[finalActive.breaks.length - 1];
        if (!lastBreak.end) {
          const updatedBreaks = [...finalActive.breaks];
          updatedBreaks[updatedBreaks.length - 1] = { ...lastBreak, end: clockOutIso };
          finalActive.breaks = updatedBreaks;
        }
      }
      const updated = { ...finalActive, clockOut: clockOutIso };
      await storage.update("timelogs", active.id, { clockOut: clockOutIso, breaks: finalActive.breaks });
      setLogs(p => p.map(l => l.id === active.id ? updated : l));
      setActive(null);
    } finally {
      setClocking(false);
    }
  };

  const startBreak = async () => {
    setClocking(true);
    try {
      const updatedBreaks = [...(active.breaks || []), { start: new Date().toISOString(), end: null }];
      const updated = { ...active, breaks: updatedBreaks };
      await storage.update("timelogs", active.id, { breaks: updatedBreaks });
      setLogs(p => p.map(l => l.id === active.id ? updated : l));
      setActive(updated);
    } finally {
      setClocking(false);
    }
  };

  const endBreak = async () => {
    setClocking(true);
    try {
      const updatedBreaks = [...(active.breaks || [])];
      if (updatedBreaks.length > 0 && !updatedBreaks[updatedBreaks.length - 1].end) {
        updatedBreaks[updatedBreaks.length - 1] = { ...updatedBreaks[updatedBreaks.length - 1], end: new Date().toISOString() };
      }
      const updated = { ...active, breaks: updatedBreaks };
      await storage.update("timelogs", active.id, { breaks: updatedBreaks });
      setLogs(p => p.map(l => l.id === active.id ? updated : l));
      setActive(updated);
    } finally {
      setClocking(false);
    }
  };

  const submitLeave = async () => {
    setLeaveErr("");
    if (!leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) {
      setLeaveErr("All fields are required."); return;
    }
    if (leaveForm.from > leaveForm.to) {
      setLeaveErr("End date must be after start date."); return;
    }
    const req = {
      id: uid(),
      employeeId: employee.id,
      name: employee.name,
      ...leaveForm,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };
    await storage.add("leaves", req);
    setLeaves(p => [...p, req]);
    setLeaveForm({ from:"", to:"", type:"Casual", reason:"" });
    setLeaveSent(true);
    setTimeout(() => setLeaveSent(false), 4000);
  };

  const submitAdvance = async () => {
    setAdvanceErr("");
    if (!advanceForm.amount || !advanceForm.reason.trim()) {
      setAdvanceErr("All fields are required."); return;
    }
    if (isNaN(advanceForm.amount) || Number(advanceForm.amount) <= 0) {
      setAdvanceErr("Enter a valid advance amount."); return;
    }
    const req = {
      id: uid(),
      employeeId: employee.id,
      name: employee.name,
      amount: Number(advanceForm.amount),
      reason: advanceForm.reason,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };
    await storage.add("advances", req);
    setAdvances(p => [...p, req]);
    setAdvanceForm({ amount:"", reason:"" });
    setAdvanceSent(true);
    setTimeout(() => setAdvanceSent(false), 4000);
  };

  const weekLogs = useMemo(() => logs.filter(l => {
    const d = new Date(l.clockIn);
    const s = new Date(); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0);
    return d >= s;
  }), [logs]);

  const hrs = useMemo(() => totalHours(weekLogs.filter(l => l.clockOut)), [weekLogs]);
  const elapsed = active ? Math.floor((now - new Date(active.clockIn)) / 1000) : 0;

  const weekHoursData = useMemo(() => {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
    const data = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return {
        dateKey: day.toDateString(),
        name: day.toLocaleDateString("en-US", { weekday: "short" }),
        Hours: 0,
      };
    });
    const logsByDay = Object.fromEntries(data.map(day => [day.dateKey, day]));
    weekLogs.filter(l => l.clockOut).forEach(l => {
      const d = new Date(l.clockIn).toDateString();
      if (logsByDay[d]) logsByDay[d].Hours += hoursWorked(l.clockIn, l.clockOut, l.breaks);
    });
    data.forEach(day => {
      day.Hours = Math.round(day.Hours * 10) / 10;
    });
    return data;
  }, [weekLogs]);

  const elapsedStr = `${String(Math.floor(elapsed/3600)).padStart(2,"0")}:${String(Math.floor((elapsed%3600)/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;

  const leaveTypeColor = useCallback((t) => ({Casual:"tag-blue", Sick:"tag-red", Emergency:"tag-amber"}[t] || "tag-muted"), []);
  const leaveStatusColor = useCallback((s) => ({pending:"tag-amber", approved:"tag-green", rejected:"tag-red"}[s] || "tag-muted"), []);
  const advanceStatusColor = useCallback((s) => ({pending:"tag-amber", paid:"tag-green", rejected:"tag-red"}[s] || "tag-muted"), []);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <GlobalStyle/>

      {/* Header */}
      <div style={{
        position:"sticky",top:0,zIndex:100,
        background:"rgba(8,11,16,.88)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
        borderBottom:"1px solid var(--border)",
        padding:"14px 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap: "wrap", gap: "12px"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:11, minWidth: 0}}>
          <div style={{
            width:36,height:36,minWidth:36,minHeight:36,flexShrink:0,borderRadius:10,
            background:"var(--gold-glow)",border:"1px solid rgba(212,168,67,.25)",
            display:"flex",alignItems:"center",justifyContent:"center"
          }}>
            <User size={16} />
          </div>
          <div style={{textAlign: "left", minWidth: 0, overflow: "hidden"}}>
            <p style={{fontSize:15,fontWeight:600,lineHeight:1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{employee.name}</p>
            <span className="tag tag-blue" style={{fontSize:11,padding:"1px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", maxWidth: "100%"}}>{employee.role} {employee.branch ? `· ${employee.branch}` : ""}</span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" style={{flexShrink: 0}} onClick={onLogout}>Sign Out</button>
      </div>

      {/* Sub nav */}
      <div style={{display:"flex",gap:4,padding:"14px 20px 0",borderBottom:"1px solid var(--border)",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
        {[{id:"home",label:"Dashboard"}, ...(settings.leavesEnabled !== false ? [{id:"leave",label:"Leave Requests"}] : []), {id:"advance",label:"Advance"}, {id:"profile",label:"Profile"}].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flexShrink: 0, padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:500,fontFamily:"'Inter',sans-serif",
            background: view===t.id ? "var(--gold)" : "transparent",
            color: view===t.id ? "#080b10" : "var(--muted)",
            transition:"all .18s"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:20,maxWidth: isWindows ? "100%" : 500,margin:"0 auto"}}>

        {view === "home" && (
          <div className="fade-up">
            {/* Clock card */}
            <div style={{
              marginBottom:18,
              background:"var(--card)",
              border: active ? "1px solid rgba(62,207,122,.35)" : "1px solid var(--border)",
              borderRadius:20,padding:26,textAlign:"center",
              boxShadow: active ? "0 0 30px rgba(62,207,122,.08)" : "none",
              animation: active ? "pulse-green 2.4s infinite" : "none",
              transition:"all .3s"
            }}>
              <p style={{color:"var(--muted)",fontSize:12,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>
                {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
              </p>
              <div style={{fontSize:52,fontFamily:"'Playfair Display',serif",fontWeight:500,color:"var(--text)",marginBottom:4,letterSpacing:"-0.02em"}}>
                {now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit", hour12: true})}
              </div>
              {active && (
                <div style={{marginBottom:18}}>
                  <p style={{color:"var(--muted)",fontSize:12,marginBottom:4}}>
                    Shift started <strong style={{color:"var(--text-2)"}}>{fmtDate(active.clockIn)} {fmt(active.clockIn)}</strong>
                  </p>
                  <p style={{fontSize:30,color:"var(--success)",fontWeight:600,fontFamily:"'Playfair Display',serif",letterSpacing:"0.05em"}}>
                    {elapsedStr}
                  </p>
                </div>
              )}
              {!active ? (
                <button className="btn btn-success" disabled={clocking} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:12,marginTop:10,fontWeight:600}} onClick={clockIn}>
                  <CheckCircle size={16} />&nbsp;{clocking ? "Processing..." : "Clock In"}
                </button>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
                  {(() => {
                    const onBreak = active.breaks && active.breaks.length > 0 && !active.breaks[active.breaks.length - 1].end;
                    return onBreak ? (
                      <button className="btn btn-gold" disabled={clocking} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:12,fontWeight:600}} onClick={endBreak}>
                        <Play size={16} />&nbsp;{clocking ? "Processing..." : "Resume Work"}
                      </button>
                    ) : (
                      <button className="btn btn-amber" disabled={clocking} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:12,fontWeight:600}} onClick={startBreak}>
                        <Coffee size={16} />&nbsp;{clocking ? "Processing..." : "Take a Break"}
                      </button>
                    );
                  })()}
                  <button className="btn btn-danger" disabled={clocking} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:12,fontWeight:600}} onClick={clockOut}>
                    <StopCircle size={16} />&nbsp;{clocking ? "Processing..." : "Clock Out"}
                  </button>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="card" style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
              <div style={{color:"var(--gold)"}}><Calendar size={36} /></div>
              <div>
                <div style={{fontSize:26,fontWeight:700,color:"var(--gold)",fontFamily:"'Playfair Display',serif"}}>{hrs.toFixed(1)} hrs</div>
                <div style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Worked This Week</div>
              </div>
            </div>

            {/* Weekly Hours Bar Chart */}
            <div className="card-glow" style={{marginBottom: 18}}>
              <h3 style={{fontSize:16, marginBottom:18, color:"var(--gold)"}}>Hours Worked This Week</h3>
                <div style={{height: 180, width: "100%", marginLeft: -10}}>
                  <Suspense fallback={<div style={{height: "100%", display: "flex", alignItems:"center", justifyContent: "center", color: "var(--muted)", fontSize: 13}}>Loading chart...</div>}>
                    <LazyChart data={weekHoursData} dataKey="Hours" />
                  </Suspense>
                </div>
            </div>

            {/* Recent shifts */}
            <div className="card" style={{textAlign: "left"}}>
              <h3 style={{fontSize:16,marginBottom:14}}>Recent Shifts</h3>
              {logs.length === 0 && <p style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:"12px 0"}}>No shifts recorded yet.</p>}
              {[...logs].reverse().slice(0,6).map((l,idx) => (
                <div key={l.id} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"11px 0",
                  borderBottom: idx < 5 && idx < logs.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  <div style={{textAlign: "left"}}>
                    <p style={{fontSize:13,fontWeight:500}}>{fmtDate(l.clockIn)}</p>
                    <p style={{fontSize:12,color:"var(--muted)"}}>{fmt(l.clockIn)} → {l.clockOut ? fmt(l.clockOut) : "In Progress"}</p>
                  </div>
                  <div>
                    {l.clockOut
                      ? <span className="tag tag-green">{hoursWorked(l.clockIn,l.clockOut,l.breaks).toFixed(1)} hrs</span>
                      : <span className="tag tag-gold" style={{animation:"dot-blink 1.4s infinite"}}>● Active</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "leave" && (
          <div className="fade-up">
            {/* Apply leave form */}
            <div className="card-glow" style={{marginBottom:16}}>
              <h3 style={{fontSize:17,color:"var(--gold)",marginBottom:16}}>Apply for Leave</h3>
              <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label className="field-label">From Date</label>
                  <input type="date" className="input" value={leaveForm.from}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setLeaveForm(p=>({...p,from:e.target.value}))}/>
                </div>
                <div>
                  <label className="field-label">To Date</label>
                  <input type="date" className="input" value={leaveForm.to}
                    min={leaveForm.from || new Date().toISOString().split("T")[0]}
                    onChange={e => setLeaveForm(p=>({...p,to:e.target.value}))}/>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label className="field-label">Leave Type</label>
                <select className="input" value={leaveForm.type} onChange={e => setLeaveForm(p=>({...p,type:e.target.value}))}>
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div style={{marginBottom:14}}>
                <label className="field-label">Reason</label>
                <textarea className="input" rows={3} placeholder="Brief reason for leave..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(p=>({...p,reason:e.target.value}))}
                  style={{resize:"vertical",minHeight:70}}/>
              </div>
              {leaveErr && <p style={{color:"var(--danger)",fontSize:13,marginBottom:10,padding:"8px 12px",background:"var(--danger-bg)",borderRadius:7}}>{leaveErr}</p>}
              {leaveSent && <p style={{color:"var(--success)",fontSize:13,marginBottom:10,padding:"8px 12px",background:"var(--success-bg)",borderRadius:7}}><CheckCircle size={16} style={{display:"inline", verticalAlign:"middle", marginRight:4}} /> Leave request submitted successfully.</p>}
              <button className="btn btn-gold" style={{width:"100%"}} onClick={submitLeave}>Submit Request</button>
            </div>

            {/* Leave history */}
            <h3 style={{fontSize:16,marginBottom:12,color:"var(--text-2)"}}>My Requests</h3>
            {leaves.length === 0 && (
              <div className="card" style={{textAlign:"center",padding:"28px 20px",color:"var(--muted)",fontSize:13}}>
                No leave requests yet.
              </div>
            )}
            {[...leaves].reverse().map(l => (
              <div key={l.id} className="card" style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:600,fontSize:14}}>
                      {new Date(l.from).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                      {l.from !== l.to && ` – ${new Date(l.to).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`}
                    </p>
                    <p style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{l.reason}</p>
                  </div>
                  <div style={{display:"flex",gap:6,flexDirection:"column",alignItems:"flex-end"}}>
                    <span className={`tag ${leaveTypeColor(l.type)}`}>{l.type}</span>
                    <span className={`tag ${leaveStatusColor(l.status)}`} style={{textTransform:"capitalize"}}>{l.status}</span>
                  </div>
                </div>
                <p style={{fontSize:11,color:"var(--muted)"}}>Applied {fmtDate(l.appliedAt)}</p>
              </div>
            ))}
          </div>
        )}

        {view === "profile" && (
          <div className="fade-up">
            <div className="card-glow" style={{marginBottom:16, textAlign: "left"}}>
              <h3 style={{fontSize:17,color:"var(--gold)",marginBottom:16}}>My Profile</h3>
              <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label className="field-label">Phone Number</label>
                  <input type="tel" className="input" placeholder="e.g. 9876543210" value={profileForm.phone}
                    onChange={e => setProfileForm(p=>({...p,phone:e.target.value}))}/>
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input type="email" className="input" placeholder="e.g. me@example.com" value={profileForm.email}
                    onChange={e => setProfileForm(p=>({...p,email:e.target.value}))}/>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label className="field-label">Gender</label>
                <select className="input" value={profileForm.gender} onChange={e => setProfileForm(p=>({...p,gender:e.target.value}))}>
                  <option disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{marginBottom:14}}>
                <label className="field-label">Address</label>
                <textarea className="input" rows={2} placeholder="Full address..."
                  value={profileForm.address}
                  onChange={e => setProfileForm(p=>({...p,address:e.target.value}))}
                  style={{resize:"vertical",minHeight:60}}/>
              </div>
              {profileSaved && <p style={{color:"var(--success)",fontSize:13,marginBottom:10,padding:"8px 12px",background:"var(--success-bg)",borderRadius:7}}><CheckCircle size={16} style={{display:"inline", verticalAlign:"middle", marginRight:4}} /> Profile updated successfully.</p>}
              <button className="btn btn-gold" style={{width:"100%"}} onClick={saveProfile}>Save Profile</button>
            </div>
          </div>
        )}

        {view === "advance" && (
          <div className="fade-up">
            {/* Apply advance form */}
            <div className="card-glow" style={{marginBottom:16}}>
              <h3 style={{fontSize:17,color:"var(--gold)",marginBottom:16}}>Request Salary Advance</h3>
              <div style={{marginBottom:12}}>
                <label className="field-label">Amount (₹)</label>
                <input type="number" className="input" placeholder="e.g. 2000" value={advanceForm.amount}
                  onChange={e => setAdvanceForm(p=>({...p,amount:e.target.value}))}/>
              </div>
              <div style={{marginBottom:14}}>
                <label className="field-label">Reason</label>
                <textarea className="input" rows={2} placeholder="Brief reason for advance..."
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm(p=>({...p,reason:e.target.value}))}
                  style={{resize:"vertical",minHeight:50}}/>
              </div>
              {advanceErr && <p style={{color:"var(--danger)",fontSize:13,marginBottom:10,padding:"8px 12px",background:"var(--danger-bg)",borderRadius:7}}>{advanceErr}</p>}
              {advanceSent && <p style={{color:"var(--success)",fontSize:13,marginBottom:10,padding:"8px 12px",background:"var(--success-bg)",borderRadius:7}}><CheckCircle size={16} style={{display:"inline", verticalAlign:"middle", marginRight:4}} /> Advance request submitted successfully.</p>}
              <button className="btn btn-gold" style={{width:"100%"}} onClick={submitAdvance}>Submit Request</button>
            </div>

            {/* Advance history */}
            <h3 style={{fontSize:16,marginBottom:12,color:"var(--text-2)"}}>My Advance Requests</h3>
            {advances.length === 0 && (
              <div className="card" style={{textAlign:"center",padding:"28px 20px",color:"var(--muted)",fontSize:13}}>No advance requests yet.</div>
            )}
            {[...advances].reverse().map(a => (
              <div key={a.id} className="card" style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:18,color:"var(--gold)",fontFamily:"'Playfair Display',serif"}}>₹{a.amount}</p>
                    <p style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{a.reason}</p>
                  </div>
                  <span className={`tag ${advanceStatusColor(a.status)}`} style={{textTransform:"capitalize"}}>{a.status}</span>
                </div>
                <p style={{fontSize:11,color:"var(--muted)"}}>Requested {fmtDate(a.appliedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Owner Dashboard ──
function OwnerDashboard({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [newPass, setNewPass] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [editingBranch, setEditingBranch] = useState(null);
  const [editBranchValue, setEditBranchValue] = useState("");
  const [settings, setSettings] = useState(defaultSettings());
  const [tsMode, setTsMode] = useState("weekly");
  const [tsOffset, setTsOffset] = useState(0);
  const [timesheetSearch, setTimesheetSearch] = useState("");
  const [prMode, setPrMode] = useState("weekly");
  const [prOffset, setPrOffset] = useState(0);
  const [payrollSearch, setPayrollSearch] = useState("");
  const [overviewMode, setOverviewMode] = useState("weekly");
  const [retentionDaysInput, setRetentionDaysInput] = useState("120");
  const [showNewPass, setShowNewPass] = useState(false);
  const [liveEmpTypeFilter, setLiveEmpTypeFilter] = useState("All");
  const newPassIssues = ownerPasswordIssues(newPass);
  const canUpdateOwnerPass = newPass.trim().length > 0 && newPassIssues.length === 0;

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let currentSettings = settings;
    let loadedCount = 0;
    const checkLoaded = () => {
      if (loadedCount < 5) {
        loadedCount++;
        if (loadedCount === 5) setLoading(false);
      }
    };

    const unsubs = [
      storage.subscribe("employees", (data) => {
        setEmployees(Array.isArray(data) && data.length > 0 ? data : SEED_EMPLOYEES);
        checkLoaded();
      }),
      storage.subscribe("appSettings", (data) => {
        const st = { ...defaultSettings(), ...(data || {}) };
        if (!st.branches) st.branches = ["Mens", "Womens", "Crazo", "Warehouse"];
        currentSettings = st;
        setSettings(st);
        setRetentionDaysInput((st.retentionDays || 120).toString());
        checkLoaded();
      }),
      storage.subscribe("timelogs", async (data) => {
        const tlogs = data || [];
        const autoClosed = applyAutoClockOut(tlogs, currentSettings);
        if (autoClosed.changed) {
          await Promise.all(autoClosed.closed.map(l => storage.update("timelogs", l.id, {
            clockOut: l.clockOut, breaks: l.breaks,
            autoClockedOut: l.autoClockedOut, autoClockOutReason: l.autoClockOutReason
          })));
        }
        setLogs(autoClosed.logs);
        checkLoaded();
      }),
      storage.subscribe("leaves", (data) => {
        setLeaves(data || []);
        checkLoaded();
      }),
      storage.subscribe("advances", (data) => {
        setAdvances(data || []);
        checkLoaded();
      })
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const currentWeekStart = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
  }, []);
  const currentWeekEnd = useMemo(() => { const d = new Date(currentWeekStart); d.setDate(currentWeekStart.getDate() + 7); return d; }, [currentWeekStart]);
  const currentMonthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  }, []);
  const currentMonthEnd = useMemo(() => { const d = new Date(currentMonthStart); d.setMonth(currentMonthStart.getMonth() + 1); return d; }, [currentMonthStart]);
  
  const { tsStart, tsEnd } = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    if (tsMode === "weekly") {
      start.setDate(start.getDate() - start.getDay() + tsOffset * 7);
    } else {
      start.setDate(1);
      start.setMonth(start.getMonth() + tsOffset);
    }
    const end = new Date(start);
    if (tsMode === "weekly") end.setDate(end.getDate() + 7);
    else end.setMonth(end.getMonth() + 1);
    return { tsStart: start, tsEnd: end };
  }, [tsMode, tsOffset]);

  const { prStart, prEnd } = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    if (prMode === "weekly") {
      start.setDate(start.getDate() - start.getDay() + prOffset * 7);
    } else {
      start.setDate(1);
      start.setMonth(start.getMonth() + prOffset);
    }
    const end = new Date(start);
    if (prMode === "weekly") end.setDate(end.getDate() + 7);
    else end.setMonth(end.getMonth() + 1);
    return { prStart: start, prEnd: end };
  }, [prMode, prOffset]);

  const fEmployees = useMemo(() => selectedBranch === "All" ? employees : employees.filter(e => e.branch === selectedBranch), [employees, selectedBranch]);
  const fEmpIds = useMemo(() => new Set(fEmployees.map(e => e.id)), [fEmployees]);
  const fLogs = useMemo(() => logs.filter(l => fEmpIds.has(l.employeeId)), [logs, fEmpIds]);
  const fLeaves = useMemo(() => leaves.filter(l => fEmpIds.has(l.employeeId)), [leaves, fEmpIds]);
  const fAdvances = useMemo(() => advances.filter(a => fEmpIds.has(a.employeeId)), [advances, fEmpIds]);
  
  const timesheetEmployees = useMemo(() => timesheetSearch.trim()
    ? fEmployees.filter(emp => emp.name.toLowerCase().includes(timesheetSearch.trim().toLowerCase()))
    : fEmployees, [fEmployees, timesheetSearch]);

  const activeSessions = useMemo(() => fLogs.filter(l => !l.clockOut), [fLogs]);
  
  const filteredActiveSessions = useMemo(() => activeSessions.filter(sess => {
    if (liveEmpTypeFilter === "All") return true;
    const emp = fEmployees.find(e => e.id === sess.employeeId);
    return (emp?.employmentType || "Full-time") === liveEmpTypeFilter;
  }), [activeSessions, fEmployees, liveEmpTypeFilter]);

  const filteredTodayLogs = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return fLogs.filter(l => {
      if (!l.clockOut || new Date(l.clockIn) < today) return false;
      if (liveEmpTypeFilter === "All") return true;
      const emp = fEmployees.find(e => e.id === l.employeeId);
      return (emp?.employmentType || "Full-time") === liveEmpTypeFilter;
    });
  }, [fLogs, fEmployees, liveEmpTypeFilter]);

  const pendingLeaves = useMemo(() => fLeaves.filter(l => l.status === "pending"), [fLeaves]);
  const approvedLeaves = useMemo(() => fLeaves.filter(l => l.status === "approved"), [fLeaves]);
  const rejectedLeaves = useMemo(() => fLeaves.filter(l => l.status === "rejected"), [fLeaves]);
  
  const pendingAdvances = useMemo(() => fAdvances.filter(a => a.status === "pending"), [fAdvances]);
  const paidAdvances = useMemo(() => fAdvances.filter(a => a.status === "paid"), [fAdvances]);
  const rejectedAdvances = useMemo(() => fAdvances.filter(a => a.status === "rejected"), [fAdvances]);

  const getTsLogs = useCallback((empId) => fLogs.filter(l => {
    const d = new Date(l.clockIn);
    return l.employeeId === empId && d >= tsStart && d < tsEnd;
  }), [fLogs, tsStart, tsEnd]);

  const getPrLogs = useCallback((empId) => fLogs.filter(l => {
    const d = new Date(l.clockIn);
    return l.employeeId === empId && d >= prStart && d < prEnd;
  }), [fLogs, prStart, prEnd]);

  const currentWeekLogs = useCallback((empId) => fLogs.filter(l => {
    const d = new Date(l.clockIn);
    return l.employeeId === empId && d >= currentWeekStart && d < currentWeekEnd;
  }), [fLogs, currentWeekStart, currentWeekEnd]);

  const currentMonthLogs = useCallback((empId) => fLogs.filter(l => {
    const d = new Date(l.clockIn);
    return l.employeeId === empId && d >= currentMonthStart && d < currentMonthEnd;
  }), [fLogs, currentMonthStart, currentMonthEnd]);

  const getOverviewLogs = useCallback((empId) => overviewMode === "weekly" ? currentWeekLogs(empId) : currentMonthLogs(empId), [overviewMode, currentWeekLogs, currentMonthLogs]);

  const getPrAdvances = useCallback((empId) => fAdvances.filter(a => {
    const d = new Date(a.paidAt || a.appliedAt);
    return a.employeeId === empId && a.status === "paid" && d >= prStart && d < prEnd;
  }), [fAdvances, prStart, prEnd]);

  const deleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this timesheet record?")) return;
    const n = logs.filter(l => l.id !== id);
    await storage.remove("timelogs", id); setLogs(n);
  };

  const approveLeave = async (id) => {
    const n = leaves.map(l => l.id === id ? {...l, status:"approved"} : l);
    await storage.update("leaves", id, { status:"approved" }); setLeaves(n);
  };

  const rejectLeave = async (id) => {
    const n = leaves.map(l => l.id === id ? {...l, status:"rejected"} : l);
    await storage.update("leaves", id, { status:"rejected" }); setLeaves(n);
  };

  const markAdvancePaid = async (id) => {
    const paidAt = new Date().toISOString();
    const n = advances.map(a => a.id === id ? {...a, status:"paid", paidAt} : a);
    await storage.update("advances", id, { status:"paid", paidAt }); setAdvances(n);
  };

  const rejectAdvance = async (id) => {
    const n = advances.map(a => a.id === id ? {...a, status:"rejected"} : a);
    await storage.update("advances", id, { status:"rejected" }); setAdvances(n);
  };

  const clockOutAllActive = async () => {
    if (!window.confirm(`Are you sure you want to clock out all ${filteredActiveSessions.length} active employees?`)) return;
    const nowIso = new Date().toISOString();
    const activeIds = new Set(filteredActiveSessions.map(s => s.id));
    const updatedLogs = logs.map(l => activeIds.has(l.id) ? { ...l, clockOut: nowIso, breaks: closeOpenBreaksAt(l, nowIso) } : l);
    await Promise.all(filteredActiveSessions.map(sess => 
      storage.update("timelogs", sess.id, { clockOut: nowIso, breaks: closeOpenBreaksAt(sess, nowIso) })
    ));
    setLogs(updatedLogs);
  };

  const clockOutSingle = async (id, name) => {
    if (!window.confirm(`Are you sure you want to clock out ${name}?`)) return;
    const nowIso = new Date().toISOString();
    const updatedLogs = logs.map(l => l.id === id ? { ...l, clockOut: nowIso, breaks: closeOpenBreaksAt(l, nowIso) } : l);
    const l = logs.find(l => l.id === id);
    await storage.update("timelogs", id, { clockOut: nowIso, breaks: closeOpenBreaksAt(l, nowIso) });
    setLogs(updatedLogs);
  };

  const updateSettings = async (newSt) => {
    const updated = { ...settings, ...newSt };
    setSettings(updated);
    await storage.set("appSettings", updated);
  };

  const runImmediateCleanup = async () => {
    const days = parseInt(settings.retentionDays || 120, 10);
    if (isNaN(days) || days < 1) {
      alert("Please save a valid retention period before cleanup.");
      return;
    }
    if (!window.confirm(`Clean up records older than ${days} days now?\n\nThis will permanently remove old Timesheets, Leaves, and Advances only.\n\nEmployee/staff details, PINs, branches, salary settings, and app settings will NOT be removed.`)) return;

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const keepRecent = (items) => (Array.isArray(items) ? items : []).filter(item => (item.clockIn || item.appliedAt || item.from) > cutoffDate);
    const [allLogs, allLeaves, allAdvances] = await Promise.all([
      storage.get("timelogs"),
      storage.get("leaves"),
      storage.get("advances"),
    ]);
    if (allLogs === undefined || allLeaves === undefined || allAdvances === undefined) {
      alert("Cleanup cancelled because some records could not be loaded. Please check your connection and try again.");
      return;
    }
    const logRecords = Array.isArray(allLogs) ? allLogs : [];
    const leaveRecords = Array.isArray(allLeaves) ? allLeaves : [];
    const advanceRecords = Array.isArray(allAdvances) ? allAdvances : [];
    const cleanedLogs = keepRecent(logRecords);
    const cleanedLeaves = keepRecent(leaveRecords);
    const cleanedAdvances = keepRecent(advanceRecords);
    const deletedLogs = logRecords.filter(item => !cleanedLogs.includes(item));
    const deletedLeaves = leaveRecords.filter(item => !cleanedLeaves.includes(item));
    const deletedAdvances = advanceRecords.filter(item => !cleanedAdvances.includes(item));
    await Promise.all([
      ...deletedLogs.map(l => storage.remove("timelogs", l.id)),
      ...deletedLeaves.map(l => storage.remove("leaves", l.id)),
      ...deletedAdvances.map(a => storage.remove("advances", a.id)),
    ]);
    setLogs(cleanedLogs);
    setLeaves(cleanedLeaves);
    setAdvances(cleanedAdvances);
    alert(`Cleanup complete.\n\nRemoved ${logRecords.length - cleanedLogs.length} timesheet records, ${leaveRecords.length - cleanedLeaves.length} leave records, and ${advanceRecords.length - cleanedAdvances.length} advance records.\n\nEmployee/staff details were not removed.`);
  };

  const saveEditBranch = async (oldName) => {
    const nb = editBranchValue.trim();
    if (!nb) { setEditingBranch(null); return; }
    if (nb !== oldName && settings.branches?.includes(nb)) { alert("Branch already exists!"); return; }
    
    const latestEmployees = await storage.get("employees");
    if (!Array.isArray(latestEmployees)) { alert("Could not load staff data. Please check your connection and try again."); return; }
    const updatedBranches = settings.branches.map(b => b === oldName ? nb : b);
    const updatedEmployees = latestEmployees.map(e => e.branch === oldName ? { ...e, branch: nb } : e);
    const changedEmps = latestEmployees.filter(e => e.branch === oldName);
    await Promise.all(changedEmps.map(e => storage.update("employees", e.id, { branch: nb })));
    setEmployees(updatedEmployees);
    updateSettings({ branches: updatedBranches });
    setEditingBranch(null);
    if (selectedBranch === oldName) setSelectedBranch(nb);
  };

  const deleteBranch = async (branchName) => {
    if (!window.confirm(`Delete branch "${branchName}"?\n\nEmployees in this branch will be unassigned.`)) return;
    
    const latestEmployees = await storage.get("employees");
    if (!Array.isArray(latestEmployees)) { alert("Could not load staff data. Please check your connection and try again."); return; }
    const updatedBranches = settings.branches.filter(b => b !== branchName);
    const updatedEmployees = latestEmployees.map(e => e.branch === branchName ? { ...e, branch: "" } : e);
    const changedEmps = latestEmployees.filter(e => e.branch === branchName);
    await Promise.all(changedEmps.map(e => storage.update("employees", e.id, { branch: "" })));
    setEmployees(updatedEmployees);
    updateSettings({ branches: updatedBranches });
    if (selectedBranch === branchName) setSelectedBranch("All");
  };

  const calculatePayrollDetails = (logs, employee) => {
    const details = {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      deficitHours: 0,
      grossPay: 0,
      daysWorked: 0,
    };

    if (!employee || !logs || logs.length === 0) return details;

    const dailyHours = {};
    const workedDays = new Set();
    logs.forEach(log => {
      if (!log.clockOut) return;
      const date = new Date(log.clockIn).toDateString();
      workedDays.add(date);
      if (!dailyHours[date]) { dailyHours[date] = 0; }
      dailyHours[date] += hoursWorked(log.clockIn, log.clockOut, log.breaks);
    });

    details.daysWorked = workedDays.size;

    const standardHours = employee.standardHours || 10;
    const hourlyRate = employee.hourlyRate || 0;

    for (const date in dailyHours) {
      const hours = dailyHours[date];
      details.totalHours += hours;
      if (hours > standardHours) { details.regularHours += standardHours; details.overtimeHours += hours - standardHours; } 
      else { 
        details.regularHours += hours; 
        details.deficitHours += (standardHours - hours);
      }
    }
    details.grossPay = details.totalHours * hourlyRate;
    return details;
  };

  const exportTimesheetsCSV = () => {
    const rows = [["Employee","Branch","Date","Clock In","Clock Out","Hours"]];
    timesheetEmployees.forEach(emp => {
      getTsLogs(emp.id).forEach(l => {
        const h = hoursWorked(l.clockIn, l.clockOut, l.breaks);
        rows.push([emp.name, emp.branch || "—", fmtDate(l.clockIn), fmt(l.clockIn), l.clockOut ? fmt(l.clockOut) : "Open", h.toFixed(2)]);
      });
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, "-");
    a.download = `timesheets-${tsMode}-${timestamp}.csv`; a.click();
  };

  const prEmployees = fEmployees.filter(emp => {
    const matchCycle = (emp.paymentCycle || "Weekly").toLowerCase() === prMode;
    const matchSearch = !payrollSearch.trim() || emp.name.toLowerCase().includes(payrollSearch.trim().toLowerCase());
    return matchCycle && matchSearch;
  });

 const exportPayrollCSV = () => {
  // 13 Columns defined here
  const rows = [["Employee", "Branch", "Payment Cycle", "Days Worked", "Standard Hrs/Day", "Regular Hours", "Overtime Hours", "Deficit Hours", "Total Hours", "Hourly Rate", "Gross Pay", "Advances Paid", "Net Pay"]];
  
  prEmployees.forEach(emp => {
    const wl = getPrLogs(emp.id).filter(l => l.clockOut);
    const payroll = calculatePayrollDetails(wl, emp);
    const gross = payroll.grossPay;
    const advance = getPrAdvances(emp.id).reduce((sum, a) => sum + a.amount, 0);
    const net = gross - advance;

    rows.push([
      emp.name, 
      emp.branch || "—", 
      emp.paymentCycle || "Weekly", 
      payroll.daysWorked, 
      emp.standardHours || 10,
      payroll.regularHours.toFixed(2), 
      payroll.overtimeHours.toFixed(2), 
      payroll.deficitHours.toFixed(2),
      payroll.totalHours.toFixed(2), 
      emp.hourlyRate || 0, // Removed ₹ for better CSV compatibility
      gross.toFixed(2), 
      advance.toFixed(2), 
      net.toFixed(2)
    ]);
  });

  const csv = rows.map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, "-");
  a.download = `payroll-${prMode}-${timestamp}.csv`; 
  a.click();
};

  const exportAdvancesCSV = () => {
    const rows = [["Employee", "Branch", "Amount", "Reason", "Status", "Applied Date", "Paid Date"]];
    fAdvances.forEach(a => {
      const emp = fEmployees.find(e => e.id === a.employeeId);
      rows.push([
        emp ? emp.name : "Unknown",
        emp ? (emp.branch || "—") : "—",
        a.amount,
        `"${(a.reason || "").replace(/"/g, '""')}"`,
        a.status,
        fmtDate(a.appliedAt),
        a.paidAt ? fmtDate(a.paidAt) : (a.status === 'paid' ? fmtDate(a.appliedAt) : "—")
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, "-");
    link.download = `advances-${timestamp}.csv`; 
    link.click();
  };

  const exportStaffCSV = () => {
    const rows = [[
      "Employee ID",
      "Full Name",
      "PIN",
      "Branch",
      "Role",
      "Employment Type",
      "Payment Cycle",
      "Standard Hours/Day",
      "Daily Salary",
      "Hourly Rate",
      "Phone",
      "Email",
      "Gender",
      "Address"
    ]];

    employees
      .slice()
      .sort((a, b) => (a.branch || "").localeCompare(b.branch || "") || (a.name || "").localeCompare(b.name || ""))
      .forEach(emp => {
        rows.push([
          emp.id,
          emp.name,
          emp.pin,
          emp.branch,
          emp.role,
          emp.employmentType || "Full-time",
          emp.paymentCycle || "Weekly",
          emp.standardHours || 10,
          emp.dailySalary || 0,
          emp.hourlyRate || 0,
          emp.phone,
          emp.email,
          emp.gender,
          emp.address
        ]);
      });

    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, "-");
    downloadCSV(`staff-info-${timestamp}.csv`, rows);
  };

  const totalPrGross = prEmployees.reduce((s,emp) => s + calculatePayrollDetails(getPrLogs(emp.id).filter(l=>l.clockOut), emp).grossPay, 0);
  const totalPrAdvance = prEmployees.reduce((s,emp) => s + getPrAdvances(emp.id).reduce((sum, a) => sum + a.amount, 0), 0);
  const totalPrPay = totalPrGross - totalPrAdvance;
  const totalPrHrs = prEmployees.reduce((s,emp) => s + totalHours(getPrLogs(emp.id).filter(l=>l.clockOut)), 0);

  const tabs = [
    {id:"overview",  label:"Overview",   icon:<LayoutDashboard size={14} />},
    {id:"live",      label:"Live Clock",  icon:<Timer size={14} />},
    {id:"timesheet", label:"Timesheets",  icon:<ClipboardList size={14} />},
    {id:"payroll",   label:"Payroll",     icon:<IndianRupee size={14} />},
    {id:"requests",  label:"Requests",    icon:<Inbox size={14} />, badge: pendingLeaves.length + pendingAdvances.length},
    {id:"employees", label:"Staff",       icon:<Users size={14} />},
    {id:"settings",  label:"Settings",    icon:<Settings size={14} />},
  ];

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)"}}>
      <GlobalStyle/>
      <div style={{width:28,height:28,border:"2px solid var(--border-2)",borderTopColor:"var(--gold)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <GlobalStyle/>

      {/* Top bar */}
      <div style={{
        position:"sticky",top:0,zIndex:100,
        background:"rgba(8,11,16,.9)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
        borderBottom:"1px solid var(--border)",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"13px 20px",
        gap:"12px", overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
          <div style={{
            width:36,height:36,minWidth:36,minHeight:36,flexShrink:0,borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            overflow:"hidden"
          }}>
            <img src="/logo.png" alt="" loading="lazy" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
          <div>
            <h2 style={{fontSize:16,color:"var(--gold)",lineHeight:1.1,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>AMIGOS Connect</h2>
            <p style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>OWNER DASHBOARD</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <select className="input" style={{width:"auto", padding:"4px 10px", marginBottom:0, background:"var(--card-2)", border:"1px solid var(--border)", color:"var(--gold)", fontSize:13}} value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            <option value="All">All Branches</option>
            {settings.branches?.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {activeSessions.length > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--success-bg)",border:"1px solid rgba(62,207,122,.2)",borderRadius:20,padding:"4px 10px",whiteSpace:"nowrap"}}>
              <span className="live-dot"/>
              <span style={{fontSize:12,color:"var(--success)",fontWeight:500}}>{activeSessions.length} live</span>
            </div>
          )}
          {pendingLeaves.length > 0 && (
            <div style={{background:"var(--amber-bg)",border:"1px solid rgba(245,158,11,.2)",borderRadius:20,padding:"4px 10px",whiteSpace:"nowrap"}}>
              <span style={{fontSize:12,color:"var(--amber)",fontWeight:500}}><Flag size={12} style={{verticalAlign:"middle", marginTop:"-2px"}}/> {pendingLeaves.length} leave pending</span>
            </div>
          )}
          {pendingAdvances.length > 0 && (
            <div style={{background:"var(--amber-bg)",border:"1px solid rgba(245,158,11,.2)",borderRadius:20,padding:"4px 10px",whiteSpace:"nowrap"}}>
              <span style={{fontSize:12,color:"var(--amber)",fontWeight:500}}><IndianRupee size={12} style={{verticalAlign:"middle", marginTop:"-2px"}}/> {pendingAdvances.length} advance pending</span>
            </div>
          )}
          <button className="btn btn-outline btn-sm" style={{flexShrink:0}} onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{
        display:"flex",gap:2,padding:"12px 16px 0",
        overflowX:"auto",borderBottom:"1px solid var(--border)",
        scrollbarWidth:"none",WebkitOverflowScrolling:"touch"
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, padding:"8px 14px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",
            fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:500,whiteSpace:"nowrap",
            background: tab===t.id ? "var(--card)" : "transparent",
            color: tab===t.id ? "var(--gold)" : "var(--muted)",
            borderTop: tab===t.id ? "1px solid var(--gold-dim)" : "1px solid transparent",
            borderLeft: tab===t.id ? "1px solid var(--border)" : "1px solid transparent",
            borderRight: tab===t.id ? "1px solid var(--border)" : "1px solid transparent",
            marginBottom: tab===t.id ? -1 : 0,
            transition:"all .18s",position:"relative"
          }}>
            <span style={{marginRight:5}}>{t.icon}</span>{t.label}
            {t.badge > 0 && (
              <span style={{
                position:"absolute",top:4,right:4,
                background:"var(--amber)",color:"#000",
                borderRadius:"50%",width:16,height:16,
                fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{padding:20,maxWidth: isWindows ? "100%" : 860,margin:"0 auto"}}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fade-up">
            <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
              {[
                {label:"Total Staff", value:fEmployees.length, icon:<Users size={14} />, color:"var(--accent)"},
                {label:"Active Now",  value:activeSessions.length, icon:<Timer size={14} />, color:"var(--success)"},
                {label:"Pending Leaves", value:pendingLeaves.length, icon:<Calendar size={14} />, color:"var(--amber)"},
                {label:"Advances Req.", value:pendingAdvances.length, icon:<IndianRupee size={14} />, color:"var(--amber)"},
              ].map(s => (
                <div key={s.label} className="card" style={{flex:"1 1 145px",position:"relative",overflow:"hidden"}}>
                  <div style={{color:s.color, marginBottom:8}}>{s.icon}</div>
                  <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:"'Playfair Display',serif",marginBottom:2}}>{s.value}</div>
                  <div style={{fontSize:12,color:"var(--muted)",fontWeight:500}}>{s.label}</div>
                  <div style={{position:"absolute",bottom:-10,right:-10,opacity:.04, transform:"scale(3)"}}>{s.icon}</div>
                </div>
              ))}
            </div>

            {/* Hours Distribution Chart */}
            <div className="card-glow" style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <h3 style={{fontSize:16,color:"var(--gold)",marginBottom:0}}>Hours Distribution</h3>
                <div style={{display:"flex",gap:4,alignItems:"center", background:"var(--card)", padding:"4px", borderRadius:10, border:"1px solid var(--border)"}}>
                  <button className={`btn btn-xs ${overviewMode==="weekly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => setOverviewMode("weekly")}>Weekly</button>
                  <button className={`btn btn-xs ${overviewMode==="monthly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => setOverviewMode("monthly")}>Monthly</button>
                </div>
              </div>
              {fEmployees.length === 0 && <p style={{color:"var(--muted)",fontSize:13}}>No staff added yet.</p>}
              {fEmployees.map(emp => {
                const wh = totalHours(getOverviewLogs(emp.id).filter(l=>l.clockOut));
                const maxHrs = Math.max(...fEmployees.map(e => totalHours(getOverviewLogs(e.id).filter(l=>l.clockOut))), 1);
                const pct = (wh / maxHrs) * 100;
                return (
                  <div key={emp.id} style={{marginBottom: 14}}>
                    <div style={{display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6}}>
                      <span style={{fontWeight:500}}>{emp.name}</span>
                      <span style={{color:"var(--gold)", fontFamily:"'Playfair Display', serif", fontWeight:600}}>{wh.toFixed(1)} hrs</span>
                    </div>
                    <div style={{width:"100%", background:"var(--surface)", height:6, borderRadius:4, overflow:"hidden", border:"1px solid var(--border)"}}>
                      <div style={{width: `${pct}%`, background: "linear-gradient(90deg, var(--gold-dim), var(--gold))", height:"100%", borderRadius:4, transition:"width 1s cubic-bezier(0.22, 1, 0.36, 1)"}} />
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 style={{fontSize:18,marginBottom:14}}>Staff Status</h3>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {fEmployees.map(emp => {
                const sess = activeSessions.find(l => l.employeeId === emp.id);
                const wh = totalHours(currentWeekLogs(emp.id).filter(l=>l.clockOut));
                const elapsed = sess ? Math.floor((now - new Date(sess.clockIn)) / 1000) : 0;
                const eStr = sess ? `${String(Math.floor(elapsed/3600)).padStart(2,"0")}:${String(Math.floor((elapsed%3600)/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}` : null;
                return (
                  <div key={emp.id} style={{
                    background:"var(--card)",
                    border: sess ? "1px solid rgba(62,207,122,.3)" : "1px solid var(--border)",
                    borderRadius:14,padding:"14px 18px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,
                    boxShadow: sess ? "0 0 20px rgba(62,207,122,.06)" : "none"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{
                        width:40,height:40,borderRadius:12,
                        background: sess ? "var(--success-bg)" : "var(--card-2)",
                        border: sess ? "1px solid rgba(62,207,122,.2)" : "1px solid var(--border)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18
                      }}>
                        {sess ? <span className="live-dot" style={{width:10,height:10}}/> : <User size={18} />}
                      </div>
                      <div style={{textAlign: "left"}}>
                        <p style={{fontWeight:600,fontSize:14}}>{emp.name}</p>
                        <p style={{fontSize:12,color:"var(--muted)"}}>{emp.role} {emp.branch ? `· ${emp.branch}` : ""} · {emp.employmentType || "Full-time"} · ₹{emp.dailySalary||0}/day (₹{emp.hourlyRate||0}/hr)</p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                      {sess && <span style={{fontSize:13,fontFamily:"'Playfair Display',serif",color:"var(--success)",fontWeight:600}}>{eStr}</span>}
                      <span style={{fontSize:12,color:"var(--muted)"}}>{wh.toFixed(1)} hrs/wk</span>
                      {sess
                      ? <span className="tag tag-green">● In: {fmtDate(sess.clockIn)} {fmt(sess.clockIn)}</span>
                        : <span className="tag tag-muted">○ Off</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LIVE CLOCK ── */}
        {tab === "live" && (
          <div className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <h3 style={{fontSize:20,marginBottom:0}}>Live Clock Activity</h3>
                <select className="input" style={{width:"auto", padding:"4px 10px", marginBottom:0, background:"var(--card-2)", border:"1px solid var(--border)", color:"var(--gold)", fontSize:13}} value={liveEmpTypeFilter} onChange={e => setLiveEmpTypeFilter(e.target.value)}>
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
                {filteredActiveSessions.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={clockOutAllActive}>
                    Clock Out All
                  </button>
                )}
              </div>
              <div style={{
                fontSize:20,fontFamily:"'Playfair Display',serif",color:"var(--text-2)",
                background:"var(--card)",border:"1px solid var(--border)",
                borderRadius:10,padding:"6px 16px",letterSpacing:"0.04em"
              }}>
                {now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit", hour12: true})}
              </div>
            </div>

            {/* Active sessions */}
            <div style={{marginBottom:24}}>
              <p style={{fontSize:12,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,fontWeight:500}}>
                Not Clocked Out / Currently Clocked In ({filteredActiveSessions.length})
              </p>
              {filteredActiveSessions.length === 0 && (
                <div className="card" style={{textAlign:"center",padding:"28px",color:"var(--muted)",fontSize:13}}>
                  No staff currently clocked in
                </div>
              )}
              {filteredActiveSessions.map(sess => {
                const emp = fEmployees.find(e => e.id === sess.employeeId);
                const elapsed = Math.floor((now - new Date(sess.clockIn)) / 1000);
                const eStr = `${String(Math.floor(elapsed/3600)).padStart(2,"0")}:${String(Math.floor((elapsed%3600)/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;
                const hrs = elapsed / 3600;
                return (
                  <div key={sess.id} style={{
                    background:"var(--card)",border:"1px solid rgba(62,207,122,.3)",borderRadius:16,
                    padding:"18px 20px",marginBottom:10,
                    boxShadow:"0 0 24px rgba(62,207,122,.07)",
                    display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:"1 1 220px"}}>
                      <div style={{
                        width:44,height:44,borderRadius:13,background:"var(--success-bg)",
                        border:"1px solid rgba(62,207,122,.25)",
                        display:"flex",alignItems:"center",justifyContent:"center"
                      }}>
                        <span className="live-dot" style={{width:12,height:12}}/>
                      </div>
                      <div style={{textAlign: "left",minWidth:0}}>
                        <p style={{fontWeight:600}}>{sess.name}</p>
                        <p style={{fontSize:12,color:"var(--muted)"}}>{emp?.role} {emp?.branch ? `· ${emp.branch}` : ""} · {emp?.employmentType || "Full-time"} · Clocked in <strong style={{color:"var(--text-2)"}}>{fmtDate(sess.clockIn)} {fmt(sess.clockIn)}</strong></p>
                      </div>
                    </div>
                    <div className="mobile-left" style={{textAlign:"right",flex:"1 1 150px"}}>
                      <div style={{fontSize:26,fontFamily:"'Playfair Display',serif",color:"var(--success)",fontWeight:600,letterSpacing:"0.05em"}}>{eStr}</div>
                      <div style={{fontSize:12,color:"var(--muted)", marginBottom: 8}}>₹{((hrs) * (emp?.hourlyRate || 0)).toFixed(2)} earned</div>
                      <button className="btn btn-outline btn-xs" onClick={() => clockOutSingle(sess.id, sess.name)}>
                        <StopCircle size={12} style={{marginRight: 2}}/> Clock Out
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's completed sessions */}
            <p style={{fontSize:12,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,fontWeight:500}}>Today's Completed Sessions</p>
            {(() => {
              if (filteredTodayLogs.length === 0) return (
                <div className="card" style={{textAlign:"center",padding:"28px",color:"var(--muted)",fontSize:13}}>No completed sessions today</div>
              );
              return filteredTodayLogs.map(l => {
                const emp = fEmployees.find(e => e.id === l.employeeId);
            const h = hoursWorked(l.clockIn, l.clockOut, l.breaks);
                return (
                  <div key={l.id} className="card" style={{marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign: "left",minWidth:0,flex:"1 1 220px"}}>
                      <p style={{fontWeight:600,fontSize:14}}>{l.name}</p>
                      <p style={{fontSize:12,color:"var(--muted)"}}>
                        {fmt(l.clockIn)} → {fmt(l.clockOut)} &nbsp;·&nbsp; {emp?.role} {emp?.branch ? `· ${emp.branch}` : ""} · {emp?.employmentType || "Full-time"}
                      </p>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                      <span className="tag tag-green">{h.toFixed(1)} hrs</span>
                      <span style={{fontSize:13,color:"var(--gold)",fontWeight:600}}>₹{(h * (emp?.hourlyRate||0)).toFixed(2)}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── TIMESHEETS ── */}
        {tab === "timesheet" && (
          <div className="fade-up">
            <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:16}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10}}>
                <div style={{display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
                  <h3 style={{fontSize:20, margin:0}}>Timesheets</h3>
                  <div style={{display:"flex",gap:4,alignItems:"center", background:"var(--card-2)", padding:"4px", borderRadius:10, border:"1px solid var(--border)"}}>
                    <button className={`btn btn-sm ${tsMode==="weekly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => {setTsMode("weekly"); setTsOffset(0);}}>Weekly</button>
                    <button className={`btn btn-sm ${tsMode==="monthly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => {setTsMode("monthly"); setTsOffset(0);}}>Monthly</button>
                  </div>
                </div>
                <button className="btn btn-gold btn-sm mobile-export-btn" onClick={exportTimesheetsCSV}><Download size={14}/> Export</button>
              </div>
              <div style={{display:"flex", gap:8, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", background:"var(--card)", padding:"8px 12px", borderRadius:10, border:"1px solid var(--border)"}}>
                <button className="btn btn-outline btn-sm" onClick={() => setTsOffset(p=>p-1)}><ChevronLeft size={14}/> Prev</button>
                <span style={{fontSize:13,color:"var(--text)",fontWeight:500, textAlign:"center", flex:"1 1 auto"}}>
                  {tsStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(tsEnd-1).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setTsOffset(p=>p+1)} disabled={tsOffset===0}>Next <ChevronRight size={14}/></button>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label className="field-label">Search Staff</label>
              <input
                type="text"
                className="input"
                placeholder={`Search employee in ${selectedBranch === "All" ? "all branches" : selectedBranch}`}
                value={timesheetSearch}
                onChange={e => setTimesheetSearch(e.target.value)}
                style={{marginBottom:0}}
              />
            </div>

            {timesheetEmployees.length === 0 && (
              <div className="card" style={{textAlign:"center",padding:"28px",color:"var(--muted)",fontSize:13}}>
                No staff found for this branch and search.
              </div>
            )}

            {timesheetEmployees.map(emp => {
              const wl = getTsLogs(emp.id);
              const wh = totalHours(wl.filter(l=>l.clockOut));
              const pay = wh * (emp.hourlyRate||0);
              return (
                <div key={emp.id} className="card" style={{marginBottom:14, textAlign: "left"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:12}}>
                    <div style={{flex:"1 1 200px"}}>
                      <span style={{fontWeight:600}}>{emp.name}</span>
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{emp.role} {emp.branch ? `· ${emp.branch}` : ""}</div>
                    </div>
                    <div className="mobile-center-tag" style={{marginLeft:"auto"}}>
                      <span className="tag tag-gold" style={{whiteSpace:"nowrap"}}>{wh.toFixed(1)} hrs · ₹{pay.toFixed(2)}</span>
                    </div>
                  </div>
                  {wl.length === 0
                    ? <p style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:"10px 0"}}>No shifts this {tsMode==="weekly" ? "week" : "month"}.</p>
                    : wl.map((l,idx) => (
                      <div key={l.id} style={{
                        display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"12px 0", flexWrap:"wrap", gap:8,
                        borderBottom: idx < wl.length-1 ? "1px solid var(--border)" : "none",
                        fontSize:13
                      }}>
                        <div style={{display:"flex", flexDirection:"column", gap:4, flex:"1 1 150px", textAlign: "left"}}>
                          <span style={{color:"var(--muted)", fontSize:12}}>{fmtDate(l.clockIn)}</span>
                          <span style={{fontWeight:500}}>{fmt(l.clockIn)} → {l.clockOut ? fmt(l.clockOut) : <span style={{color:"var(--success)"}}>Active</span>}</span>
                        </div>
                        <div className="mobile-left" style={{display:"flex", alignItems:"center", gap:12, marginLeft:"auto",flexWrap:"wrap"}}>
                          <span style={{color:"var(--gold)", fontWeight:600}}>{l.clockOut ? `${hoursWorked(l.clockIn,l.clockOut,l.breaks).toFixed(1)}h` : "—"}</span>
                          <button className="btn btn-danger btn-xs" onClick={() => deleteLog(l.id)}><X size={12}/></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAYROLL ── */}
        {tab === "payroll" && (
          <div className="fade-up">
            <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:16}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10}}>
                <div style={{display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
                  <h3 style={{fontSize:20, margin:0}}>Payroll Summary</h3>
                  <div style={{display:"flex",gap:4,alignItems:"center", background:"var(--card-2)", padding:"4px", borderRadius:10, border:"1px solid var(--border)"}}>
                    <button className={`btn btn-sm ${prMode==="weekly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => {setPrMode("weekly"); setPrOffset(0);}}>Weekly</button>
                    <button className={`btn btn-sm ${prMode==="monthly" ? "btn-gold" : "btn-ghost"}`} style={{border:"none", padding:"4px 10px"}} onClick={() => {setPrMode("monthly"); setPrOffset(0);}}>Monthly</button>
                  </div>
                </div>
                <button className="btn btn-gold btn-sm mobile-export-btn" onClick={exportPayrollCSV}><Download size={14}/> Export</button>
              </div>
              <div style={{display:"flex", gap:8, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", background:"var(--card)", padding:"8px 12px", borderRadius:10, border:"1px solid var(--border)"}}>
                <button className="btn btn-outline btn-sm" onClick={() => setPrOffset(p=>p-1)}><ChevronLeft size={14}/> Prev</button>
                <span style={{fontSize:13,color:"var(--text)",fontWeight:500, textAlign:"center", flex:"1 1 auto"}}>
                  {prStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {new Date(prEnd-1).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setPrOffset(p=>p+1)} disabled={prOffset===0}>Next <ChevronRight size={14}/></button>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label className="field-label">Search Staff</label>
              <input
                type="text"
                className="input"
                placeholder={`Search employee in ${selectedBranch === "All" ? "all branches" : selectedBranch}`}
                value={payrollSearch}
                onChange={e => setPayrollSearch(e.target.value)}
                style={{marginBottom:0}}
              />
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
              {prEmployees.length === 0 && (
                <div className="card" style={{textAlign:"center",padding:"28px",color:"var(--muted)",fontSize:13}}>
                  {payrollSearch.trim() ? "No staff found matching your search." : `No staff members on a ${prMode} payment cycle for this branch.`}
                </div>
              )}
              {prEmployees.map(emp => {
                const wl = getPrLogs(emp.id).filter(l=>l.clockOut);
                const payroll = calculatePayrollDetails(wl, emp);
                const gross = payroll.grossPay;
                const advance = getPrAdvances(emp.id).reduce((sum, a) => sum + a.amount, 0);
                const net = gross - advance;
                return (
                  <div key={emp.id} className="card" style={{display:"flex", flexWrap:"wrap", gap:16}}>
                    <div style={{flex:"1 1 200px",minWidth:0}}>
                      <div style={{fontWeight:600,marginBottom:4}}>{emp.name}</div>
                      <div style={{fontSize:12,color:"var(--muted)", lineHeight:1.5}}>{emp.branch ? `${emp.branch} · ` : ""}{emp.paymentCycle || "Weekly"} · {payroll.daysWorked} days · {payroll.totalHours.toFixed(2)} hrs ({payroll.overtimeHours.toFixed(2)} OT, {payroll.deficitHours.toFixed(2)} Deficit) · ₹{emp.hourlyRate||0}/hr</div>
                    </div>
                    <div className="mobile-left" style={{flex:"0 1 auto", marginLeft:"auto", minWidth:"140px", textAlign:"right"}}>
                      <div style={{fontSize:13,color:"var(--muted)",fontWeight:500,marginBottom:4}}>Gross: ₹{gross.toFixed(2)}</div>
                      <div style={{fontSize:26,fontFamily:"'Playfair Display',serif",color:"var(--gold)",fontWeight:700,lineHeight:1}}>₹{net.toFixed(2)}</div>
                      {advance > 0 && <div style={{fontSize:12,color:"var(--danger)",fontWeight:500,marginTop:4}}>Advances: -₹{advance.toFixed(2)}</div>}
                      {payroll.totalHours === 0 && advance === 0 && <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>No shifts</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card-glow" style={{display:"flex", flexWrap:"wrap", gap:16}}>
              <div style={{flex:"1 1 180px"}}>
                <p style={{color:"var(--muted)",fontSize:13, marginBottom:4}}>Total Net {prMode==="weekly"?"Weekly":"Monthly"} Payroll</p>
                <p style={{color:"var(--text-2)",fontSize:12}}>{totalPrHrs.toFixed(2)} hrs · {prEmployees.length} staff</p>
              </div>
              <div className="mobile-left" style={{flex:"0 1 auto", marginLeft:"auto", textAlign:"right"}}>
                <div style={{fontSize:14,color:"var(--muted)",fontWeight:500,marginBottom:6}}>Gross: ₹{totalPrGross.toFixed(2)} {totalPrAdvance > 0 && <span style={{color:"var(--danger)"}}>| Adv: -₹{totalPrAdvance.toFixed(2)}</span>}</div>
                <div style={{fontSize:36,fontFamily:"'Playfair Display',serif",color:"var(--gold)",fontWeight:700,lineHeight:1}}>₹{totalPrPay.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTS ── */}
        {tab === "requests" && (
          <div className="fade-up" style={{textAlign:"left"}}>
            <h3 style={{fontSize:20,marginBottom:20,textAlign:"left"}}>Leave Requests</h3>

            {/* Pending */}
            {pendingLeaves.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--amber)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}>
                  <Clock size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> Pending Approval ({pendingLeaves.length})
                </p>
                {pendingLeaves.map(l => (
                  <div key={l.id} style={{
                    background:"var(--card)",border:"1px solid rgba(245,158,11,.25)",borderRadius:16,
                    padding:"16px 20px",marginBottom:10,
                    boxShadow:"0 0 20px rgba(245,158,11,.06)"
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:12,flexWrap:"wrap"}}>
                      <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                        <p style={{fontWeight:600,fontSize:15}}>{l.name}</p>
                        <p style={{fontSize:13,color:"var(--text-2)",marginTop:2}}>
                          {new Date(l.from).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                          {l.from !== l.to && ` – ${new Date(l.to).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`}
                        </p>
                        <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{l.reason}</p>
                      </div>
                      <span className="tag tag-amber">{l.type}</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button className="btn btn-success btn-sm" style={{flex:"1 1 120px"}} onClick={() => approveLeave(l.id)}><Check size={14}/> Approve</button>
                      <button className="btn btn-danger btn-sm" style={{flex:"1 1 120px"}} onClick={() => rejectLeave(l.id)}><X size={14}/> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approved */}
            {approvedLeaves.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--success)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}>
                  <Check size={14}/> Approved Leaves ({approvedLeaves.length})
                  </p>
                {[...approvedLeaves].reverse().map(l => (
                  <div key={l.id} className="card" style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:14}}>{l.name}</p>
                      <p style={{fontSize:12,color:"var(--muted)"}}>
                        {new Date(l.from).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                        {l.from !== l.to && ` – ${new Date(l.to).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`}
                        &nbsp;·&nbsp;{l.reason}
                      </p>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span className={`tag ${({Casual:"tag-blue",Sick:"tag-red",Emergency:"tag-amber"}[l.type]||"tag-muted")}`}>{l.type}</span>
                      <span className="tag tag-green">Approved</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Declined */}
            {rejectedLeaves.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--danger)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}>
                  <X size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> Declined Leaves ({rejectedLeaves.length})
                </p>
                {[...rejectedLeaves].reverse().map(l => (
                  <div key={l.id} className="card" style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:14}}>{l.name}</p>
                      <p style={{fontSize:12,color:"var(--muted)"}}>
                        {new Date(l.from).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                        {l.from !== l.to && ` – ${new Date(l.to).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`}
                        &nbsp;·&nbsp;{l.reason}
                      </p>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span className={`tag ${({Casual:"tag-blue",Sick:"tag-red",Emergency:"tag-amber"}[l.type]||"tag-muted")}`}>{l.type}</span>
                      <span className="tag tag-red">Declined</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingLeaves.length === 0 && approvedLeaves.length === 0 && rejectedLeaves.length === 0 && (
              <div className="card" style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13,marginBottom:28}}>No leave requests yet.</div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:20,borderTop:"1px solid var(--border)",paddingTop:28}}>
              <h3 style={{fontSize:20,marginBottom:0,textAlign:"left"}}>Salary Advances</h3>
              <button className="btn btn-gold btn-sm mobile-export-btn" onClick={exportAdvancesCSV}><Download size={14}/> Export CSV</button>
            </div>

            {/* Pending */}
            {pendingAdvances.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--amber)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}>
                  <Clock size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> Pending Advance Requests ({pendingAdvances.length})
                </p>
                {pendingAdvances.map(a => (
                  <div key={a.id} style={{
                    background:"var(--card)",border:"1px solid rgba(245,158,11,.25)",borderRadius:16,
                    padding:"16px 20px",marginBottom:10,
                    boxShadow:"0 0 20px rgba(245,158,11,.06)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, textAlign:"left"
                  }}>
                    <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:15}}>{a.name}</p>
                      <p style={{fontSize:20,color:"var(--gold)",marginTop:2, fontFamily:"'Playfair Display',serif", fontWeight:700}}>₹{a.amount}</p>
                      <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{a.reason}</p>
                      <p style={{fontSize:11,color:"var(--text-2)",marginTop:4}}>Requested {fmtDate(a.appliedAt)}</p>
                    </div>
                    <div style={{display:"flex",gap:8,flexDirection:"column",flex:"1 1 150px",minWidth:140,maxWidth:180}}>
                      <button className="btn btn-success btn-sm" style={{width:"100%"}} onClick={() => markAdvancePaid(a.id)}><Check size={14}/> Mark Paid</button>
                      <button className="btn btn-danger btn-sm" style={{width:"100%"}} onClick={() => rejectAdvance(a.id)}><X size={14}/> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paid */}
            {paidAdvances.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--success)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}><Check size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> Paid Advances ({paidAdvances.length})</p>
                {[...paidAdvances].reverse().map(a => (
                  <div key={a.id} className="card" style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:14}}>{a.name} <span style={{color:"var(--muted)",fontWeight:400}}>· ₹{a.amount}</span></p>
                      <p style={{fontSize:12,color:"var(--muted)"}}>Req: {fmtDate(a.appliedAt)}{a.paidAt ? ` · Paid: ${fmtDate(a.paidAt)}` : ""} · {a.reason}</p>
                    </div>
                    <span className="tag tag-green">Paid</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rejected */}
            {rejectedAdvances.length > 0 && (
              <div style={{marginBottom:28}}>
                <p style={{fontSize:12,color:"var(--danger)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:500,marginBottom:12}}><X size={14}/> Rejected Advances ({rejectedAdvances.length})</p>
                {[...rejectedAdvances].reverse().map(a => (
                  <div key={a.id} className="card" style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign:"left",flex:"1 1 220px",minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:14}}>{a.name} <span style={{color:"var(--muted)",fontWeight:400}}>· ₹{a.amount}</span></p>
                      <p style={{fontSize:12,color:"var(--muted)"}}>{fmtDate(a.appliedAt)} · {a.reason}</p>
                    </div>
                    <span className="tag tag-red">Rejected</span>
                  </div>
                ))}
              </div>
            )}
            {pendingAdvances.length === 0 && paidAdvances.length === 0 && rejectedAdvances.length === 0 && (
              <div className="card" style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13}}>No advance requests yet.</div>
            )}
          </div>
        )}

        {/* ── STAFF / EMPLOYEES ── */}
        {tab === "employees" && <EmployeeManager employees={employees} setEmployees={setEmployees} selectedBranch={selectedBranch} branches={settings.branches} />}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div className="fade-up" style={{ maxWidth: 400, margin: "0 auto" }}>
            <h3 style={{fontSize:20,marginBottom:20,textAlign:"center"}}>App Settings</h3>
            
            <div className="card" style={{marginBottom: 20}}>
              <h4 style={{fontSize:16, marginBottom:6}}>Employee Features</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>Enable or disable the leave request feature for all staff.</p>
              <div style={{display:"flex", gap:20}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
                  <input type="radio" checked={settings.leavesEnabled !== false} onChange={() => updateSettings({leavesEnabled: true})} style={{accentColor:"var(--gold)", width: 16, height: 16}}/>
                  Enable Leaves
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
                  <input type="radio" checked={settings.leavesEnabled === false} onChange={() => updateSettings({leavesEnabled: false})} style={{accentColor:"var(--gold)", width: 16, height: 16}}/>
                  Disable Leaves
                </label>
              </div>
            </div>
            <div className="card" style={{marginBottom: 20}}>
              <h4 style={{fontSize:16, marginBottom:6}}>Default Clock Out Time</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>
                When enabled, open shifts are automatically closed at the selected IST time to prevent accidental overtime from missed clock-outs.
                For late season shifts, set an early morning time like 5:00 AM and the app will close the shift the next morning.
              </p>
              <label className="field-label">Auto Clock Out Time (IST)</label>
              {(() => {
                const hour24 = settings.autoClockOutHourIst ?? DEFAULT_AUTO_CLOCK_OUT_HOUR_IST;
                const minute = settings.autoClockOutMinuteIst ?? DEFAULT_AUTO_CLOCK_OUT_MINUTE_IST;
                const timeParts = to12HourParts(hour24);
                return (
                  <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                    <select
                      className="input"
                      value={timeParts.hour}
                      onChange={e => updateSettings({ autoClockOutHourIst: to24Hour(e.target.value, timeParts.period) })}
                      style={{marginBottom:0}}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={minute}
                      onChange={e => updateSettings({ autoClockOutMinuteIst: Number(e.target.value) })}
                      style={{marginBottom:0}}
                    >
                      {Array.from({ length: 60 }, (_, m) => m).map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={timeParts.period}
                      onChange={e => updateSettings({ autoClockOutHourIst: to24Hour(timeParts.hour, e.target.value) })}
                      style={{marginBottom:0}}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                );
              })()}
              <div style={{display:"flex", gap:20, flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
                  <input type="radio" checked={settings.autoClockOutEnabled !== false} onChange={() => updateSettings({autoClockOutEnabled: true})} style={{accentColor:"var(--gold)", width: 16, height: 16}}/>
                  Enable Auto Clock Out
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
                  <input type="radio" checked={settings.autoClockOutEnabled === false} onChange={() => updateSettings({autoClockOutEnabled: false})} style={{accentColor:"var(--gold)", width: 16, height: 16}}/>
                  Disable for Overtime Season
                </label>
              </div>
            </div>

            <div className="card" style={{marginBottom: 20}}>
              <h4 style={{fontSize:16, marginBottom:6}}>Manage Branches</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>Add, edit, or remove store branches.</p>
              
              <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:16}}>
                {settings.branches?.map(b => (
                  <div key={b} style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--surface)", padding:"8px 12px", borderRadius:8, border:"1px solid var(--border)"}}>
                    {editingBranch === b ? (
                      <div style={{display:"flex", gap:8, width:"100%",flexWrap:"wrap"}}>
                        <input type="text" className="input" value={editBranchValue} onChange={e => setEditBranchValue(e.target.value)} style={{padding:"4px 8px", minHeight:32, marginBottom:0}} />
                        <button className="btn btn-success btn-sm" style={{padding:"4px 10px"}} onClick={() => saveEditBranch(b)}>✓</button>
                        <button className="btn btn-ghost btn-sm" style={{padding:"4px 10px"}} onClick={() => setEditingBranch(null)}><X size={12}/></button>
                      </div>
                    ) : (
                      <>
                        <span style={{fontSize:14, fontWeight:500}}>{b}</span>
                        <div style={{display:"flex", gap:4}}>
                          <button className="btn btn-ghost btn-sm" style={{padding:"4px 8px"}} onClick={() => { setEditingBranch(b); setEditBranchValue(b); }}><Edit2 size={12}/></button>
                          <button className="btn btn-danger btn-sm" style={{padding:"4px 8px"}} onClick={() => deleteBranch(b)}><Trash2 size={12}/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="e.g. Shopname" 
                value={newBranch} 
                onChange={e => setNewBranch(e.target.value)} 
                className="input" 
                style={{marginBottom: 16}} 
              />
              <button 
                className="btn btn-gold" 
                style={{width: "100%"}}
                disabled={!newBranch.trim()}
                onClick={() => {
                  const nb = newBranch.trim();
                  if (settings.branches?.includes(nb)) { alert("Branch already exists!"); return; }
                  updateSettings({ branches: [...(settings.branches || []), nb] });
                  setNewBranch("");
                }}
              >
                + Add Branch
              </button>
            </div>

            <div className="card" style={{marginBottom: 20}}>
              <h4 style={{fontSize:16, marginBottom:6}}>Data Retention (Auto-Cleanup)</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>
                Automatically remove old records to save database space. 
                <strong style={{color:"var(--text-2)"}}> Only Timesheets, Leaves, and Advances are removed. </strong> 
                Employee profiles, staff lists, and app settings are never deleted.
              </p>
              
              <label className="field-label">Retention Period (Days)</label>
              <div style={{display:"flex", gap:8,flexWrap:"wrap"}}>
                <input 
                  type="number" 
                  min="30"
                  value={retentionDaysInput} 
                  onChange={e => setRetentionDaysInput(e.target.value)} 
                  className="input" 
                  style={{marginBottom: 0,flex:"2 1 160px"}} 
                />
                <button 
                  className="btn btn-gold" 
                  style={{flex:"1 1 120px"}}
                  onClick={() => {
                    const days = parseInt(retentionDaysInput, 10);
                    if (isNaN(days) || days < 1) { alert("Please enter a valid number of days."); return; }
                    updateSettings({ retentionDays: days });
                    alert(`Retention period updated to ${days} days.`);
                  }}
                >Save</button>
              </div>
              <div style={{borderTop:"1px solid var(--border)",marginTop:16,paddingTop:16}}>
                <p style={{color:"var(--danger)", fontSize:12, marginBottom:12, lineHeight:1.5}}>
                  Warning: immediate cleanup permanently deletes old timesheets, leave requests, and salary advances only. Employee/staff details must never be deleted by this action.
                </p>
                <button
                  className="btn btn-danger"
                  style={{width:"100%"}}
                  onClick={runImmediateCleanup}
                >
                  <Trash2 size={14}/> Clean Up Old Records Now
                </button>
              </div>
            </div>

            <div className="card" style={{marginBottom: 20}}>
              <h4 style={{fontSize:16, marginBottom:6}}>Staff Export</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>
                Download a CSV file with every staff profile, including PIN, branch, payroll, and contact details.
              </p>
              <button
                className="btn btn-gold"
                style={{width: "100%"}}
                disabled={employees.length === 0}
                onClick={exportStaffCSV}
              >
                <Download size={14}/> Export All Staff CSV
              </button>
            </div>

            <div className="card">
              <h4 style={{fontSize:16, marginBottom:6}}>Change Owner Password</h4>
              <p style={{color:"var(--muted)", fontSize:13, marginBottom:16}}>Update the master password used to access the Owner Dashboard.</p>
              
              <label className="field-label">New Password</label>
              <div style={{position: "relative", marginBottom: 16}}>
                <input 
                  type={showNewPass ? "text" : "password"} 
                  placeholder="Enter new password" 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)} 
                  className="input" 
                  style={{marginBottom: 0, paddingRight: 40}} 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, padding: 0
                  }}
                >
                  {showNewPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <p style={{
                color: newPass && newPassIssues.length ? "var(--danger)" : "var(--muted)",
                fontSize: 12,
                marginBottom: 16,
                lineHeight: 1.5
              }}>
                Password must have at least 8 characters, 1 letter, and 1 special character.
              </p>
              <button 
                className="btn btn-gold" 
                style={{width: "100%"}}
                disabled={!canUpdateOwnerPass}
                onClick={async () => {
                  const issues = ownerPasswordIssues(newPass);
                  if (issues.length) {
                    alert(`Password must contain ${issues.join(", ")}.`);
                    return;
                  }
                  await storage.set("ownerPass", newPass.trim());
                  alert("Password updated successfully!");
                  setNewPass("");
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Employee Manager ──────────────────────────────────────────────────────────
function EmployeeManager({ employees, setEmployees, selectedBranch, branches = [] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({name:"",pin:"",employmentType:"Full-time",standardHours:"10",hourlyRate:"",dailySalary:"",role:"Sales Executive",branch:branches[0]||"", paymentCycle:"Weekly", phone:"", email:"", gender:"", address:""});
  const [err, setErr] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const save = async () => {
    if (!form.name || !form.pin || !form.branch) { setErr("Name, PIN, and Branch are required."); return; }
    if (form.pin.length !== 4 || !/^\d+$/.test(form.pin)) { setErr("PIN must be 4 digits."); return; }
    const latestEmployees = await storage.get("employees");
    if (latestEmployees === undefined) { setErr("Could not load staff data. Check your connection and try again."); return; }
    const currentEmployees = Array.isArray(latestEmployees) ? latestEmployees : [];
    if (currentEmployees.find(e=>e.pin===form.pin && e.id !== editingId)) { setErr("PIN already taken."); return; }
    
    let updated;
    const baseEmp = { ...form, hourlyRate: parseFloat(form.hourlyRate)||0, dailySalary: parseFloat(form.dailySalary)||0, standardHours: parseFloat(form.standardHours)||10 };
    if (editingId) {
      await storage.update("employees", editingId, baseEmp);
      updated = currentEmployees.map(e => e.id === editingId ? { ...e, ...baseEmp } : e);
    } else {
      const emp = { id: uid(), ...baseEmp };
      await storage.add("employees", emp);
      updated = [...currentEmployees, emp];
    }
    setEmployees(updated);
    setForm({name:"",pin:"",employmentType:"Full-time",standardHours:"10",hourlyRate:"",dailySalary:"",role:"Sales Executive",branch:branches[0]||"", paymentCycle:"Weekly", phone:"", email:"", gender:"", address:""});
    setAdding(false); setEditingId(null); setErr(""); setConfirmRemoveId(null);
  };

  const remove = async (id) => {
    const latestEmployees = await storage.get("employees");
    if (!Array.isArray(latestEmployees)) { alert("Could not load staff data. Please check your connection and try again."); return; }
    const updated = latestEmployees.filter(e=>e.id!==id);
    await storage.remove("employees", id);
    setEmployees(updated);
    setConfirmRemoveId(null);
    
    // Deep cleanup
    const allLogs = await storage.get("timelogs") || [];
    await Promise.all(allLogs.filter(l => l.employeeId === id).map(l => storage.remove("timelogs", l.id)));
    const allLeaves = await storage.get("leaves") || [];
    await Promise.all(allLeaves.filter(l => l.employeeId === id).map(l => storage.remove("leaves", l.id)));
    const allAdvances = await storage.get("advances") || [];
    await Promise.all(allAdvances.filter(a => a.employeeId === id).map(a => storage.remove("advances", a.id)));
  };

  const edit = (emp) => {
    setConfirmRemoveId(null);
    setForm({
      name: emp.name, pin: emp.pin, employmentType: emp.employmentType || "Full-time", hourlyRate: emp.hourlyRate || "", 
      dailySalary: emp.dailySalary || "", standardHours: emp.standardHours || "10", role: emp.role, 
      branch: emp.branch || branches[0] || "",
      paymentCycle: emp.paymentCycle || "Weekly",
      phone: emp.phone || "", email: emp.email || "",
      gender: emp.gender || "", address: emp.address || ""
    });
    setEditingId(emp.id);
    setAdding(true);
    setErr("");
  };

  let fEmployees = selectedBranch === "All" ? employees : employees.filter(e => e.branch === selectedBranch);
  if (searchTerm.trim()) {
    fEmployees = fEmployees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  return (
    <div className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20, flexWrap: "wrap", gap: "10px"}}>
        <h3 style={{fontSize:20}}>Staff Members ({fEmployees.length})</h3>
        <button className="btn btn-gold btn-sm" onClick={() => { setConfirmRemoveId(null); setAdding(p=>!p); if(adding) { setEditingId(null); setForm({name:"",pin:"",employmentType:"Full-time",standardHours:"10",hourlyRate:"",dailySalary:"",role:"Sales Executive",branch:branches[0]||"", paymentCycle:"Weekly", phone:"", email:"", gender:"", address:""}); }}}>
          {adding ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {!adding && (
        <input type="text" placeholder="Search staff by name..." className="input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{marginBottom: 16}} />
      )}

      {adding && (
        <div className="card-glow" style={{marginBottom:20, textAlign: "left"}}>
          <h3 style={{fontSize:16,marginBottom:16,color:"var(--gold)"}}>{editingId ? "Edit Employee" : "New Employee"}</h3>
          {[
            {label:"Full Name",     key:"name",       type:"text",   ph:"e.g. Jane Smith"},
            {label:"4-Digit PIN",   key:"pin",        type:"text",   ph:"e.g. 5678"},
            {label:"Employment Type", key:"employmentType", type:"select", options:["Full-time", "Part-time"]},
            {label:"Standard Hrs/Day", key:"standardHours", type:"number", ph:"e.g. 10"},
            {label:"Per Day Salary (₹)", key:"dailySalary", type:"number", ph:"e.g. 500"},
            {label:"Hourly Rate (₹)", key:"hourlyRate",type:"number", ph:"e.g. 11.50"},
            {label:"Role",          key:"role",       type:"text",   ph:"e.g. Sales Executive"},
          ].map(f => (
            <div key={f.key} style={{marginBottom:12}}>
              <label className="field-label">{f.label}</label>
              {f.type === "select" ? (
                <select className="input" value={form[f.key]} onChange={e => setForm(p=>({...p, [f.key]: e.target.value}))}>
                  {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type={f.type} placeholder={f.ph} value={form[f.key]}
                  onChange={e => {
                    const val = e.target.value;
                    if (f.key === "dailySalary") setForm(p => ({...p, dailySalary: val, hourlyRate: val && p.standardHours ? (parseFloat(val)/parseFloat(p.standardHours)).toFixed(2) : p.hourlyRate}));
                    else if (f.key === "standardHours") setForm(p => ({...p, standardHours: val, hourlyRate: val && p.dailySalary ? (parseFloat(p.dailySalary)/parseFloat(val)).toFixed(2) : p.hourlyRate}));
                    else setForm(p => ({...p, [f.key]: val}));
                  }}
                  className="input"/>
              )}
            </div>
          ))}
          <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label className="field-label">Branch</label>
              <select className="input" value={form.branch} onChange={e => setForm(p=>({...p,branch:e.target.value}))}>
                {!form.branch && <option value="">Select Branch</option>}
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Payment Cycle</label>
              <select className="input" value={form.paymentCycle} onChange={e => setForm(p=>({...p,paymentCycle:e.target.value}))}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div style={{borderTop:"1px solid var(--border)", margin:"16px 0", paddingTop:16}}>
            <h4 style={{fontSize:14,color:"var(--text-2)",marginBottom:12}}>Profile Details (Optional)</h4>
            <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <label className="field-label">Phone</label>
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} className="input"/>
              </div>
              <div>
                <label className="field-label">Email</label>
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className="input"/>
              </div>
            </div>
            <div className="mobile-stack-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <label className="field-label">Gender</label>
                <select className="input" value={form.gender} onChange={e => setForm(p=>({...p,gender:e.target.value}))}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Address</label>
                <input type="text" placeholder="Address" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} className="input"/>
              </div>
            </div>
          </div>
          {err && <p style={{color:"var(--danger)",fontSize:13,marginBottom:12,padding:"8px 12px",background:"var(--danger-bg)",borderRadius:7}}>{err}</p>}
          <button className="btn btn-gold" style={{width:"100%"}} onClick={save}>Save Employee</button>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {fEmployees.map(emp => (
          <div key={emp.id} className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8, textAlign: "left"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:"1 1 220px"}}>
              <div style={{
                width:38,height:38,borderRadius:11,background:"var(--card-2)",
                border:"1px solid var(--border-2)",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16, overflow:"hidden"
              }}><User size={20} /></div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:600}}>{emp.name}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>{emp.role} {emp.branch ? `· ${emp.branch}` : ""} · {emp.employmentType || "Full-time"} · {emp.paymentCycle || "Weekly"} · PIN: {emp.pin} · ₹{emp.dailySalary||0}/day (₹{emp.hourlyRate||0}/hr)</div>
                {(emp.phone || emp.email || emp.gender || emp.address) && (
                  <div style={{fontSize:11,color:"var(--text-2)",marginTop:4,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {emp.phone && <span><Phone size={12}/> {emp.phone}</span>}
                    {emp.email && <span><Mail size={12}/> {emp.email}</span>}
                    {emp.gender && emp.gender !== "Select Gender" && <span><Users size={12}/> {emp.gender}</span>}
                    {emp.address && <span><MapPin size={12}/> {emp.address}</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="mobile-full" style={{display:"flex", gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
              <button className="btn btn-outline btn-sm" onClick={() => edit(emp)}>Edit</button>
              {confirmRemoveId === emp.id ? (
                <>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(emp.id)}>Confirm Remove</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRemoveId(null)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmRemoveId(emp.id)}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ──
export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("amigos_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (role, emp) => {
    const s = { role, employee: emp };
    setSession(s);
    localStorage.setItem("amigos_session", JSON.stringify(s));
  };

  const handleLogout = useCallback(() => {
    setSession(null); // Clear the user session
    localStorage.removeItem("amigos_session"); // Remove session from local storage
  }, []);

  useEffect(() => {
    if (!session) return;
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, 5 * 60 * 1000); // 5 minutes
    };

    resetTimer();
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [session, handleLogout]);

  const handleUpdateEmployee = (updatedEmp) => {
    const s = { ...session, employee: updatedEmp };
    setSession(s);
    localStorage.setItem("amigos_session", JSON.stringify(s));
  };

  return !session
    ? <LoginScreen onLogin={handleLogin} />
    : session.role === "employee"
      ? <EmployeeView employee={session.employee} onLogout={handleLogout} onUpdateEmployee={handleUpdateEmployee} />
      : <OwnerDashboard onLogout={handleLogout} />;
}
