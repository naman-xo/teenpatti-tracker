import { useState } from "react";
import { NavBar } from "../components/UI";
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
  const [auraOpen, setAuraOpen] = useState(false);
  const { themeKey, setTheme } = useTheme();

  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  const handleSave = async () => {
    if (!name.trim()) { sounds.error(); return alert("Name cannot be empty"); }
    sounds.confirm(); setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await setDoc(doc(db, "players", user.uid), { uid: user.uid, name: name.trim(), photoURL: user.photoURL || "" }, { merge: true });
      setSaved(true);
      onUpdated?.({ ...user, displayName: name.trim() });
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { sounds.error(); alert("Failed: " + e.message); }
    setSaving(false);
  };

  const handleTheme = (key) => {
    sounds.click();
    setTheme(key);
    setTimeout(() => setAuraOpen(false), 350);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", ...enterStyle }}>
      <NavBar title="PROFILE" onBack={() => { sounds.nav(); onBack(); }} />

      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>

        {/* Avatar hero — always dark bg, always light text */}
        <div className="anim-scaleIn" style={{ padding: "28px 16px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 90, height: 90, border: "3px solid var(--yellow)", overflow: "hidden", background: user.photoURL ? undefined : "var(--yellow)", backgroundImage: user.photoURL ? `url(${user.photoURL})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: "var(--on-accent)" }}>
            {!user.photoURL && initials}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "3px", color: "var(--hero-text)" }}>{(user.displayName || "PLAYER").toUpperCase()}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--hero-muted)" }}>{user.email}</div>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16, background: "var(--bg)" }}>

          {/* Name */}
          <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "60ms" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// DISPLAY NAME</div>
            <div style={{ padding: "14px" }}>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
                style={{ width: "100%", background: "var(--bg-hard)", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 14, padding: "12px", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "var(--yellow)"}
                onBlur={e => e.target.style.borderColor = "var(--border-hard)"} />
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 6 }}>HOW OTHER PLAYERS SEE YOU IN GAMES</div>
            </div>
          </div>

          {/* ─── AURA DROPDOWN ─────────────────────────────────────── */}
          <div className="anim-fadeUp" style={{ border: `2px solid ${auraOpen ? "var(--yellow)" : "var(--border-hard)"}`, background: "var(--surface)", animationDelay: "80ms", transition: "border-color 0.2s" }}>

            {/* Trigger */}
            <div onClick={() => { sounds.click(); setAuraOpen(o => !o); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer", userSelect: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", flexShrink: 0 }}>
                  <div style={{ width: 14, height: 28, background: THEMES[themeKey]?.swatch[0], border: "1px solid rgba(128,128,128,0.3)" }} />
                  <div style={{ width: 14, height: 28, background: THEMES[themeKey]?.swatch[1], border: "1px solid rgba(128,128,128,0.3)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// SELECT YOUR AURA</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, color: "var(--yellow)", marginTop: 2 }}>{themeKey}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: "var(--yellow)", display: "inline-block", transform: auraOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)" }}>▼</div>
            </div>

            {/* Dropdown list */}
            <div style={{ overflow: "hidden", maxHeight: auraOpen ? "600px" : "0px", transition: "max-height 0.38s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={{ borderTop: "2px solid var(--border-hard)" }}>
                {THEME_KEYS.map((key, i) => {
                  const theme = THEMES[key];
                  const isActive = themeKey === key;
                  return (
                    <div key={key} onClick={() => handleTheme(key)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: isActive ? "var(--surface2)" : "transparent", borderBottom: i < THEME_KEYS.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "background 0.15s" }}>
                      <div style={{ display: "flex", flexShrink: 0 }}>
                        <div style={{ width: 14, height: 32, background: theme.swatch[0], border: "1px solid rgba(128,128,128,0.2)" }} />
                        <div style={{ width: 14, height: 32, background: theme.swatch[1], border: "1px solid rgba(128,128,128,0.2)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10, color: isActive ? "var(--yellow)" : "var(--text)", transition: "color 0.15s" }}>{key}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{theme.desc.toUpperCase()}</div>
                      </div>
                      {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0, animation: "blink 2s infinite" }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "100ms" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// ACCOUNT</div>
            <div style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--text)" }}>{user.email}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 4 }}>GOOGLE ACCOUNT</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--yellow)" }}>G</div>
            </div>
          </div>

          {/* Save */}
          <button className="btn-press anim-fadeUp" onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "16px", background: saved ? "var(--green)" : "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "4px", color: "var(--on-accent)", cursor: "pointer", opacity: saving ? 0.5 : 1, transition: "background 0.25s", animationDelay: "120ms" }}>
            {saved ? "SAVED ✓" : saving ? "SAVING..." : "SAVE CHANGES"}
          </button>

          {/* Sign out */}
          <button className="btn-press anim-fadeUp" onClick={() => { sounds.pack(); logOut(); }}
            style={{ width: "100%", padding: "14px", background: "transparent", border: "2px solid var(--red)", color: "var(--red)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", animationDelay: "140ms" }}>
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}
