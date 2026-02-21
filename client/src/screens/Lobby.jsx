import { NavBar, Avatar, Label, Tag } from "../components/UI";
import { sounds } from "../haptics";
import { useScreenEnter, stagger } from "../transitions";

export default function Lobby({ user, roomId, room, onGameStart, onBack }) {
  const enterStyle = useScreenEnter("left");
  const isHost = room?.hostUid === user.uid;
  const players = room ? Object.values(room.players) : [];

  const handleStart = () => {
    sounds.gameStart();
    import("../socket").then(({ default: socket }) => {
      socket.emit("start-game", { roomId, uid: user.uid });
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <NavBar title="LOBBY" onBack={() => { sounds.nav(); onBack(); }} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Room code */}
        <div className="anim-scaleIn" style={{ border: "2px solid var(--yellow)", background: "var(--bg-hard)", padding: "20px 16px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,247,0,0.02) 10px, rgba(212,247,0,0.02) 20px)" }} />
          <Label>// ROOM CODE — SHARE WITH FRIENDS</Label>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: "12px", color: "var(--yellow)", lineHeight: 1, marginTop: 4, position: "relative", zIndex: 1, animation: "glitch 6s infinite" }}>
            {roomId}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 8 }}>TAP TO COPY · SEND TO ALL PLAYERS</div>
        </div>

        {/* Settings */}
        <div className="anim-fadeUp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--border-hard)", animationDelay: "60ms" }}>
          <div style={{ padding: "14px", borderRight: "2px solid var(--border-hard)" }}>
            <Label>MIN BET</Label>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "var(--yellow)" }}>₹{room?.minBet}</div>
          </div>
          <div style={{ padding: "14px" }}>
            <Label>MAX BET</Label>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "var(--text)" }}>{room?.maxBet ? `₹${room.maxBet}` : "∞"}</div>
          </div>
        </div>

        {/* Players */}
        <div className="anim-fadeUp" style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: "100ms" }}>
          <div style={{ padding: "8px 14px", borderBottom: "2px solid var(--border-hard)", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "2px", display: "flex", justifyContent: "space-between" }}>
            <span>// PLAYERS</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--yellow)" }}>{players.length}/6</span>
          </div>
          <div>
            {players.map((p, i) => (
              <div key={p.uid} className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i < players.length - 1 ? "1px solid var(--border)" : "none", background: p.uid === user.uid ? "rgba(212,247,0,0.04)" : "transparent", animationDelay: `${(i + 2) * 50}ms` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--muted2)", width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</div>
                <Avatar name={p.name} size="sm" photoURL={p.photoURL} />
                <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700 }}>{p.name.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {p.uid === room.hostUid && <Tag color="yellow">HOST</Tag>}
                  {p.uid === user.uid && p.uid !== room.hostUid && <Tag color="green">YOU</Tag>}
                </div>
              </div>
            ))}
            {players.length < 2 && (
              <div style={{ padding: "12px 14px", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted2)", animation: "blink 1.5s infinite" }} />
                WAITING FOR MORE PLAYERS...
              </div>
            )}
          </div>
        </div>

        {/* Start / wait */}
        <div style={stagger(4)}>
          {isHost ? (
            <button className="btn-press" onClick={handleStart} disabled={players.length < 2} style={{ width: "100%", padding: "18px", background: players.length < 2 ? "var(--surface2)" : "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "4px", color: players.length < 2 ? "var(--muted)" : "#000", cursor: players.length < 2 ? "not-allowed" : "pointer", transition: "background 0.2s, color 0.2s" }}>
              {players.length < 2 ? "WAITING FOR PLAYERS" : "START GAME →"}
            </button>
          ) : (
            <div style={{ padding: "18px", border: "2px dashed var(--border-hard)", textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)", letterSpacing: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted2)", animation: "blink 1s infinite" }} />
              WAITING FOR HOST TO START...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
