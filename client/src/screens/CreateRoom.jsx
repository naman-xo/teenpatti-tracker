import { useState } from "react";
import { NavBar, Label } from "../components/UI";
import socket from "../socket";
import { saveRoom } from "../firebase";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";

export default function CreateRoom({ user, onBack, onRoomCreated }) {
  const enterStyle = useScreenEnter("left");
  const [minBet, setMinBet] = useState("1");
  const [maxBet, setMaxBet] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    const min = parseFloat(minBet);
    if (!min || min < 0.5) { sounds.error(); return alert("Min bet: ₹0.50 minimum"); }
    sounds.confirm(); setLoading(true);
    socket.emit("create-room", { uid: user.uid, name: user.displayName, minBet: min, maxBet: unlimited ? null : parseFloat(maxBet) || null });
    socket.once("room-created", async ({ roomId, room }) => {
      await saveRoom(roomId, { roomId, hostUid: user.uid, minBet: min, maxBet: unlimited ? null : parseFloat(maxBet) || null, createdAt: Date.now() }).catch(() => {});
      setLoading(false); onRoomCreated(roomId, room);
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <NavBar title="CREATE ROOM" onBack={() => { sounds.nav(); onBack(); }} />
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div className="anim-fadeUp" style={{ padding: "20px 16px", background: "var(--bg-hard)", border: "2px solid var(--border-hard)" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "var(--yellow)", lineHeight: 1 }}>NEW ROOM</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 6, letterSpacing: "1px" }}>SET YOUR BET LIMITS AND HOST A GAME</div>
        </div>
        <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "60ms" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>// MIN BET (₹)</div>
          <div style={{ padding: "14px" }}>
            <input type="number" value={minBet} onChange={e => setMinBet(e.target.value)} placeholder="1.00" min="0.5" step="0.5" style={{ width: "100%", background: "var(--bg-hard)", border: "2px solid var(--border-hard)", color: "var(--yellow)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, padding: "10px 14px", outline: "none", letterSpacing: "2px", transition: "border-color 0.15s" }} onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border-hard)"} />
          </div>
        </div>
        <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "100ms" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>// MAX BET (₹)</span>
            <button className="btn-press" onClick={() => { sounds.click(); setUnlimited(!unlimited); }} style={{ background: unlimited ? "var(--yellow)" : "transparent", border: `1px solid ${unlimited ? "var(--yellow)" : "var(--border-hard)"}`, color: unlimited ? "#000" : "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 8, padding: "2px 8px", cursor: "pointer", letterSpacing: "1px", transition: "all 0.15s" }}>{unlimited ? "✓ UNLIMITED" : "UNLIMITED"}</button>
          </div>
          <div style={{ padding: "14px" }}>
            <input type="number" value={unlimited ? "" : maxBet} onChange={e => setMaxBet(e.target.value)} placeholder={unlimited ? "∞" : "ENTER MAX..."} disabled={unlimited} style={{ width: "100%", background: "var(--bg-hard)", border: "2px solid var(--border-hard)", color: unlimited ? "var(--muted2)" : "var(--text)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, padding: "10px 14px", outline: "none", letterSpacing: "2px", opacity: unlimited ? 0.4 : 1, transition: "opacity 0.2s" }} />
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-press anim-fadeUp" onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: "18px", background: loading ? "var(--surface2)" : "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "4px", color: loading ? "var(--muted)" : "#000", cursor: loading ? "not-allowed" : "pointer", animationDelay: "140ms" }}>
          {loading ? "CREATING..." : "CREATE ROOM →"}
        </button>
      </div>
    </div>
  );
}
