import { useState } from "react";
import { NavBar } from "../components/UI";
import socket from "../socket";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";

export default function JoinRoom({ user, onBack, onRoomJoined }) {
  const enterStyle = useScreenEnter("left");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleJoin = () => {
    if (code.length < 6) return;
    sounds.confirm(); setLoading(true);
    socket.emit("join-room", { roomId: code.toUpperCase(), uid: user.uid, name: user.displayName });
    socket.once("room-joined", ({ room }) => { setLoading(false); onRoomJoined(code.toUpperCase(), room); });
    socket.once("error", ({ message }) => {
      setLoading(false); sounds.error();
      setShaking(true); setTimeout(() => setShaking(false), 400);
      alert(message);
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <NavBar title="JOIN ROOM" onBack={() => { sounds.nav(); onBack(); }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px" }}>
        <div className="anim-fadeUp" style={{ padding: "20px 16px", background: "var(--bg-hard)", border: "2px solid var(--border-hard)", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "var(--yellow)", lineHeight: 1 }}>ENTER CODE</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 6, letterSpacing: "1px" }}>ASK THE HOST FOR THE 6-DIGIT ROOM CODE</div>
        </div>

        <div className={`anim-scaleIn ${shaking ? "anim-shake" : ""}`} style={{ border: `2px solid ${code.length === 6 ? "var(--yellow)" : "var(--border-hard)"}`, background: "var(--bg-hard)", marginBottom: 14, transition: "border-color 0.2s" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${code.length === 6 ? "var(--yellow)" : "var(--border)"}`, fontFamily: "'Space Mono', monospace", fontSize: 9, color: code.length === 6 ? "var(--yellow)" : "var(--muted)", letterSpacing: "2px", transition: "color 0.2s, border-color 0.2s" }}>
            // ROOM CODE
          </div>
          <input
            style={{ width: "100%", background: "transparent", border: "none", color: code.length === 6 ? "var(--yellow)" : "var(--text)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, padding: "20px 16px", outline: "none", letterSpacing: "16px", textAlign: "center", transition: "color 0.2s" }}
            value={code}
            onChange={e => { sounds.numpad(); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); }}
            maxLength={6} placeholder="· · · · · ·" autoFocus
          />
          <div style={{ display: "flex", padding: "0 16px 14px", gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, background: i < code.length ? "var(--yellow)" : "var(--border-hard)", transition: "background 0.15s" }} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <button className="btn-press" onClick={handleJoin} disabled={code.length < 6 || loading} style={{ width: "100%", padding: "18px", background: code.length < 6 || loading ? "var(--surface2)" : "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "4px", color: code.length < 6 || loading ? "var(--muted)" : "#000", cursor: code.length < 6 || loading ? "not-allowed" : "pointer", transition: "background 0.2s, color 0.2s" }}>
          {loading ? "JOINING..." : code.length < 6 ? `${6 - code.length} MORE CHARS` : "JOIN ROOM →"}
        </button>
      </div>
    </div>
  );
}
