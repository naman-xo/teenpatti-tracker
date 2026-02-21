import { useState } from "react";
import { NavBar, Label } from "../components/UI";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { logOut } from "../firebase";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";
import { useTheme, THEMES, THEME_KEYS } from "../theme.jsx";

export default function Profile({ user, onBack, onUpdated }) {
  const enterStyle = useScreenEnter("left");
  const [name, setName] = useState(user.displayName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { themeKey, setTheme } = useTheme();

  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  const handleSave = async () => {
    if (!name.trim()) { sounds.error(); return alert("Name cannot be empty"); }
    sounds.confirm(); setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await setDoc(doc(db, "players", user.uid), { uid: user.uid, name: name.trim(), photoURL: user.photoURL || "" }, { merge: true });
      setSaved(true); onUpdated?.({ ...user, displayName: name.trim() });
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { sounds.error(); alert("Failed: " + e.message); }
    setSaving(false);
  };

  const handleTheme = (key) => {
    sounds.click();
    setTheme(key);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <NavBar title="PROFILE" onBack={() => { sounds.nav(); onBack(); }} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Avatar hero */}
        <div className="anim-scaleIn" style={{ padding: "28px 16px", borderBottom: "2px solid var(--border-hard)", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 90, height: 90, border: "3px solid var(--yellow)", overflow: "hidden", background: user.photoURL ? undefined : "var(--yellow)", backgroundImage: user.photoURL ? `url(${user.photoURL})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: "#000" }}>
            {!user.photoURL && initials}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "3px" }}>{(user.displayName || "PLAYER").toUpperCase()}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)" }}>{user.email}</div>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name edit */}
          <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "60ms" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// DISPLAY NAME</div>
            <div style={{ padding: "14px" }}>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
                style={{ width: "100%", background: "#000", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "12px", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "var(--yellow)"}
                onBlur={e => e.target.style.borderColor = "var(--border-hard)"} />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 6 }}>HOW OTHER PLAYERS SEE YOU IN GAMES</div>
            </div>
          </div>

          {/* ─── THEME PICKER ────────────────────────────────────── */}
          <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "80ms" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>// COLOR THEME</span>
              <span style={{ color: "var(--yellow)", fontSize: 8 }}>{themeKey}</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {THEME_KEYS.map(key => {
                const theme = THEMES[key];
                const isActive = themeKey === key;

                return (
                  <button key={key} className="btn-press" onClick={() => handleTheme(key)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px",
                    background: isActive ? "rgba(212,247,0,0.06)" : "transparent",
                    border: `2px solid ${isActive ? "var(--yellow)" : "var(--border-hard)"}`,
                    cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                    width: "100%",
                  }}>
                    {/* Swatch */}
                    <div style={{ display: "flex", flexShrink: 0 }}>
                      <div style={{ width: 18, height: 36, background: theme.swatch[0], border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div style={{ width: 18, height: 36, background: theme.swatch[1], border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10, color: isActive ? "var(--yellow)" : "var(--text)", letterSpacing: "0.5px", transition: "color 0.15s" }}>
                        {key}
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 3 }}>
                        {theme.desc.toUpperCase()}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0, animation: "blink 2s infinite" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account info */}
          <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "100ms" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// ACCOUNT</div>
            <div style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{user.email}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 4 }}>GOOGLE ACCOUNT</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--yellow)" }}>G</div>
            </div>
          </div>

          {/* Save */}
          <button className="btn-press anim-fadeUp" onClick={handleSave} disabled={saving} style={{ width: "100%", padding: "16px", background: saved ? "var(--green)" : "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "4px", color: "#000", cursor: "pointer", opacity: saving ? 0.5 : 1, transition: "background 0.25s", animationDelay: "120ms" }}>
            {saved ? "SAVED ✓" : saving ? "SAVING..." : "SAVE CHANGES"}
          </button>

          {/* Sign out */}
          <button className="btn-press anim-fadeUp" onClick={() => { sounds.pack(); logOut(); }} style={{ width: "100%", padding: "14px", background: "transparent", border: "2px solid var(--red)", color: "var(--red)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", animationDelay: "140ms" }}>
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}
