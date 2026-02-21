export function Avatar({ name, size = "md", photoURL }) {
  const sizes = { xs: 24, sm: 36, md: 44, lg: 72 };
  const fonts = { xs: 10, sm: 13, md: 16, lg: 26 };
  const s = sizes[size];
  if (photoURL) return (
    <div style={{ width: s, height: s, borderRadius: 0, overflow: "hidden", border: "2px solid var(--border-hard)", flexShrink: 0 }}>
      <img src={photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={name} />
    </div>
  );
  return (
    <div style={{ width: s, height: s, borderRadius: 0, background: "var(--yellow)", border: "2px solid var(--yellow)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: fonts[size], color: "var(--on-accent)", flexShrink: 0, letterSpacing: -1 }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export function Button({ children, variant = "primary", onClick, disabled, style = {} }) {
  const base = { width: "100%", padding: "14px 20px", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, border: "none", opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.5px", textTransform: "uppercase", ...style };
  const variants = {
    primary:   { background: "var(--yellow)", color: "var(--on-accent)", outline: "2px solid var(--yellow)", outlineOffset: "2px" },
    secondary: { background: "transparent", color: "var(--text)", border: "2px solid var(--border-hard)" },
    danger:    { background: "transparent", color: "var(--red)", border: "2px solid var(--red)" },
    ghost:     { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" },
  };
  return <button className="btn-press" style={{ ...base, ...variants[variant] }} onClick={!disabled ? onClick : undefined} disabled={disabled}>{children}</button>;
}

export function Panel({ children, style = {}, accent }) {
  return <div style={{ background: "var(--surface)", border: `2px solid ${accent ? "var(--yellow)" : "var(--border-hard)"}`, padding: 0, ...style }}>{children}</div>;
}

export function PanelHeader({ children, style = {} }) {
  return <div style={{ padding: "8px 14px", borderBottom: "2px solid var(--border-hard)", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "2px", display: "flex", alignItems: "center", justifyContent: "space-between", ...style }}>{children}</div>;
}

export function Mono({ children, size = 13, color, style = {} }) {
  return <span style={{ fontFamily: "'Space Mono', monospace", fontSize: size, color: color || "inherit", ...style }}>{children}</span>;
}

export function Label({ children }) {
  return <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 6 }}>{children}</div>;
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        style={{ width: "100%", padding: "12px 14px", background: "var(--bg-hard)", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 14, outline: "none", borderRadius: 0, transition: "border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor = "var(--yellow)"}
        onBlur={e => e.target.style.borderColor = "var(--border-hard)"}
        {...props}
      />
    </div>
  );
}

export function NavBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "2px solid var(--border-hard)", flexShrink: 0, background: "var(--bg)" }}>
      <div style={{ width: 40 }}>
        {onBack && <button className="btn-press" onClick={onBack} style={{ background: "none", border: "none", color: "var(--yellow)", fontFamily: "'Space Mono', monospace", fontSize: 18, padding: 0, cursor: "pointer" }}>←</button>}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "3px", color: "var(--text)" }}>{title}</div>
      <div style={{ width: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

export function Tag({ children, color }) {
  return (
    <div style={{ display: "inline-block", padding: "2px 8px", background: color === "yellow" ? "var(--yellow)" : color === "red" ? "var(--red)" : color === "green" ? "var(--green)" : "var(--surface2)", color: color === "yellow" ? "var(--on-accent)" : color === "green" ? "var(--bg)" : color === "red" ? "#fff" : "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", border: `1px solid ${color === "yellow" ? "var(--yellow)" : color === "red" ? "var(--red)" : color === "green" ? "var(--green)" : "var(--border-hard)"}` }}>
      {children}
    </div>
  );
}

export function Ticker({ items }) {
  const repeated = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--border-hard)", borderBottom: "1px solid var(--border-hard)", background: "var(--ticker-bg)", padding: "6px 0" }}>
      <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", animation: "marquee 20s linear infinite", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--ticker-text)", letterSpacing: "2px" }}>
        {repeated.map((item, i) => <span key={i}>{item}</span>)}
      </div>
    </div>
  );
}
