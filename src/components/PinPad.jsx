export default function PinPad({ value, onChange, maxLen = 4 }) {
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