import { useEffect, useState } from "react";
import { NavBar, Avatar, Label } from "../components/UI";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";
import GameHistory from "./GameHistory.jsx";

export default function Leaderboard({ onBack }) {
  const enterStyle = useScreenEnter("up");
  const [tab, setTab] = useState("rankings");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "rounds"));
      const totals = {};
      const seenRoundIds = new Set();
      snap.forEach(doc => {
        const round = doc.data();
        const rid = round.roundId || doc.id;
        if (seenRoundIds.has(rid)) return;
        seenRoundIds.add(rid);
        Object.entries(round.results || {}).forEach(([uid, net]) => {
          const name = round.playerNames?.[uid] || "Unknown";
          if (!totals[uid]) totals[uid] = { uid, name, net: 0, rounds: 0, wins: 0, totalWon: 0, totalLost: 0 };
          totals[uid].net = +(totals[uid].net + net).toFixed(2);
          totals[uid].rounds += 1;
          if (uid === round.winnerId) { totals[uid].wins += 1; totals[uid].totalWon = +(totals[uid].totalWon + net).toFixed(2); }
          else totals[uid].totalLost = +(totals[uid].totalLost + Math.abs(net)).toFixed(2);
        });
      });
      const sorted = Object.values(totals)
        .map(p => ({ ...p, winRate: p.rounds > 0 ? +((p.wins / p.rounds) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.net - a.net);
      setPlayers(sorted);
      setLoading(false);
    };
    load();
  }, []);

  const TABS = [
    { key: "rankings", label: "RANKINGS" },
    { key: "history", label: "HISTORY" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      <NavBar title="LEADERBOARD" onBack={() => { sounds.nav(); onBack(); }} />

      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)", display: "flex", gap: 16, alignItems: "flex-end" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "var(--yellow)", lineHeight: 1 }}>
          {tab === "rankings" ? "ALL TIME" : "SESSIONS"}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", paddingBottom: 6 }}>
          {tab === "rankings"
            ? (loading ? "LOADING..." : `${players.length} PLAYERS`)
            : "TAP A SESSION TO EXPAND"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border-hard)", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} className="btn-press" onClick={() => { sounds.click(); setTab(t.key); }} style={{
            flex: 1, padding: "11px", border: "none",
            borderRight: t.key === "rankings" ? "2px solid var(--border-hard)" : "none",
            background: tab === t.key ? "var(--yellow)" : "transparent",
            color: tab === t.key ? "var(--on-accent)" : "var(--muted)",
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            fontSize: 10, cursor: "pointer", letterSpacing: "1.5px",
            transition: "background 0.15s, color 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rankings Tab */}
      {tab === "rankings" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && <div style={{ padding: 40, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)", letterSpacing: "2px", animation: "blink 1.5s infinite" }}>LOADING...</div>}
          {!loading && players.length === 0 && <div style={{ padding: 40, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)" }}>NO GAMES RECORDED YET</div>}

          {players.map((p, i) => (
            <div key={p.uid}>
              <div className="anim-rowIn" onClick={() => { sounds.click(); setSelected(selected === p.uid ? null : p.uid); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)", background: selected === p.uid ? "rgba(212,247,0,0.04)" : "transparent", cursor: "pointer", borderLeft: `3px solid ${i === 0 ? "var(--yellow)" : i === 1 ? "#888" : i === 2 ? "#8B6914" : "transparent"}`, transition: "background 0.2s", animationDelay: `${i * 40}ms` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, width: 36, color: i === 0 ? "var(--yellow)" : i === 1 ? "#aaa" : i === 2 ? "#c08060" : "var(--muted2)", textAlign: "center", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <Avatar name={p.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--yellow)" : "var(--text)" }}>{p.name.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 3 }}>{p.rounds} RDS · {p.wins} WINS · {p.winRate}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: p.net >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
                    {p.net >= 0 ? "+" : ""}₹{p.net}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)" }}>{selected === p.uid ? "▲" : "▼"}</div>
                </div>
              </div>

              {selected === p.uid && (
                <div className="anim-slideUp" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg-hard)" }}>
                  {[
                    { label: "WON", value: `₹${p.totalWon}`, color: "var(--green)" },
                    { label: "LOST", value: `₹${p.totalLost}`, color: "var(--red)" },
                    { label: "WIN%", value: `${p.winRate}%`, color: "var(--yellow)" },
                    { label: "ROUNDS", value: p.rounds, color: "var(--text)" },
                  ].map((s, si) => (
                    <div key={s.label} style={{ padding: "14px 12px", borderRight: si < 3 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", letterSpacing: "1px", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && <GameHistory />}
    </div>
  );
}
