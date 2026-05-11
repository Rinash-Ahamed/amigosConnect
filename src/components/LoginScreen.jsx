import { useState, useEffect, useCallback } from "react";
import { User, Briefcase, Download, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { storage, SEED_EMPLOYEES, SUPER_PASSWORD, getOwnerPass, isWindows, GlobalStyle } from "./shared.js";
import PinPad from "./components/PinPad.jsx";

export default function LoginScreen({ onLogin }) {
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