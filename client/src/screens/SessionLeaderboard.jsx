import { Avatar, Label } from "../components/UI";
import { sounds } from "../haptics";
import { useScreenEnter, stagger } from "../transitions";

export default function SessionLeaderboard({ sessionData, onDone }) {
  const enterStyle = useScreenEnter("up");
  const { playerStats, totalRounds, roomId } = sessionData;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <div style={{ padding: "24px 16px 20px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "3px", marginBottom: 8 }}>// SESSION COMPLETE — ROOM_{roomId}</div>
        <div className="anim-winner" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: "var(--yellow)", lineHeight: 0.9 }}>FINAL<br />STANDINGS</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 12, letterSpacing: "1px" }}>{totalRounds} ROUNDS PLAYED</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {playerStats.map((p, i) => (
          <div key={p.uid}>
            <div className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderBottom: "1px solid var(--border)", background: i === 0 ? "rgba(212,247,0,0.04)" : "transparent", borderLeft: `4px solid ${i === 0 ? "var(--yellow)" : i === 1 ? "#888" : i === 2 ? "#8B6914" : "transparent"}`, animationDelay: `${i * 80}ms` }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: i === 0 ? "var(--yellow)" : i === 1 ? "#aaa" : i === 2 ? "#c08060" : "var(--muted2)", width: 40, flexShrink: 0, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
              <Avatar name={p.name} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--yellow)" : "var(--text)" }}>{p.name.toUpperCase()}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 3 }}>{p.rounds} RDS · {p.wins} WINS · {p.winRate}%</div>
              </div>
              <div className={i === 0 ? "anim-pop" : ""} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: p.totalNet >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>{p.totalNet >= 0 ? "+" : ""}₹{p.totalNet}</div>
              </div>
            </div>
            <div className="anim-fadeIn" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)", animationDelay: `${i * 80 + 40}ms` }}>
              {[{ label: "WON", value: `₹${p.totalWon.toFixed(0)}`, color: "var(--green)" }, { label: "LOST", value: `₹${p.totalLost.toFixed(0)}`, color: "var(--red)" }, { label: "WINS", value: p.wins, color: "var(--yellow)" }, { label: "WIN%", value: `${p.winRate}%`, color: "var(--blue)" }].map((s, si) => (
                <div key={s.label} style={{ padding: "10px 8px", borderRight: si < 3 ? "1px solid var(--border)" : "none", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "var(--muted)", letterSpacing: "0.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="btn-press" onClick={() => { sounds.nav(); onDone(); }} style={{ width: "100%", padding: "18px", background: "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "4px", color: "var(--on-accent)", cursor: "pointer", flexShrink: 0 }}>
        BACK TO HOME →
      </button>
    </div>
  );
}
