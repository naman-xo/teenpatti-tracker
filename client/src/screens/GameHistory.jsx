import { useEffect, useState } from "react";
import { Avatar, Label } from "../components/UI";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";

export default function GameHistory() {
  const enterStyle = useScreenEnter("up");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "rounds"));

        // Group rounds by roomId + date (session)
        const sessionMap = {};

        snap.forEach(doc => {
          const round = doc.data();
          // Use roomId as session grouping key; fall back to doc.id prefix
          const sessionKey = round.roomId || doc.id.split("_")[0] || "UNKNOWN";

          if (!sessionMap[sessionKey]) {
            sessionMap[sessionKey] = {
              id: sessionKey,
              roomId: round.roomId || sessionKey,
              rounds: [],
              timestamp: round.timestamp || 0,
              playerNames: {},
            };
          }

          // Update latest timestamp
          if ((round.timestamp || 0) > sessionMap[sessionKey].timestamp) {
            sessionMap[sessionKey].timestamp = round.timestamp;
          }

          // Merge playerNames
          Object.assign(sessionMap[sessionKey].playerNames, round.playerNames || {});

          sessionMap[sessionKey].rounds.push({
            winnerId: round.winnerId,
            pot: round.pot || 0,
            results: round.results || {},
            playerBets: round.playerBets || {},
            timestamp: round.timestamp || 0,
          });
        });

        // Compute per-player stats for each session
        const sessionList = Object.values(sessionMap).map(session => {
          const playerStats = {};

          session.rounds.forEach(round => {
            Object.entries(round.results || {}).forEach(([uid, net]) => {
              if (!playerStats[uid]) {
                playerStats[uid] = {
                  uid,
                  name: session.playerNames[uid] || "Unknown",
                  rounds: 0,
                  wins: 0,
                  totalNet: 0,
                  totalWon: 0,
                  totalLost: 0,
                };
              }
              const s = playerStats[uid];
              s.rounds += 1;
              s.totalNet = +(s.totalNet + net).toFixed(2);
              if (uid === round.winnerId) {
                s.wins += 1;
                s.totalWon = +(s.totalWon + net).toFixed(2);
              } else {
                s.totalLost = +(s.totalLost + Math.abs(net)).toFixed(2);
              }
            });
          });

          const playerList = Object.values(playerStats)
            .map(p => ({ ...p, winRate: p.rounds > 0 ? +((p.wins / p.rounds) * 100).toFixed(0) : 0 }))
            .sort((a, b) => b.totalNet - a.totalNet);

          const totalPot = session.rounds.reduce((sum, r) => sum + (r.pot || 0), 0);

          return {
            ...session,
            playerList,
            totalRounds: session.rounds.length,
            totalPot,
            players: playerList.length,
            date: session.timestamp ? new Date(session.timestamp) : null,
          };
        });

        // Sort by most recent first
        sessionList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setSessions(sessionList);
      } catch (e) {
        console.error("History load error:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const fmt = (date) => {
    if (!date) return "UNKNOWN DATE";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
      + " · " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", ...enterStyle }}>
      {loading && (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)", letterSpacing: "2px", animation: "blink 1.5s infinite" }}>
          LOADING HISTORY...
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "var(--muted)", marginBottom: 12 }}>NO SESSIONS</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", lineHeight: 1.8 }}>
            PLAY SOME ROUNDS AND THEY'LL SHOW UP HERE
          </div>
        </div>
      )}

      {sessions.map((session, si) => {
        const isOpen = expanded === session.id;

        return (
          <div key={session.id} style={{ borderBottom: "2px solid var(--border-hard)" }}>
            {/* Session header — clickable */}
            <div
              className="btn-press"
              onClick={() => { sounds.click(); setExpanded(isOpen ? null : session.id); }}
              style={{ padding: "14px 16px", cursor: "pointer", background: isOpen ? "rgba(var(--yellow-rgb, 212,247,0),0.04)" : "transparent", transition: "background 0.2s", borderLeft: `3px solid ${isOpen ? "var(--yellow)" : "transparent"}`, display: "flex", flexDirection: "column", gap: 8 }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: isOpen ? "var(--yellow)" : "var(--text)", transition: "color 0.2s" }}>
                    ROOM_{session.roomId}
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isOpen ? "var(--yellow)" : "var(--muted)", transition: "color 0.2s" }}>
                  {isOpen ? "▲" : "▼"}
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[
                  { label: "DATE", value: fmt(session.date) },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", letterSpacing: "1px" }}>{m.label}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text)", marginTop: 2 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Stats pills */}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: `${session.totalRounds} RDS`, color: "var(--yellow)" },
                  { label: `${session.players} PLAYERS`, color: "var(--text)" },
                  { label: `₹${session.totalPot.toFixed(0)} POT`, color: "var(--green)" },
                ].map(s => (
                  <div key={s.label} style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: s.color, padding: "2px 8px", border: `1px solid ${s.color === "var(--yellow)" ? "var(--yellow)" : "var(--border-hard)"}`, letterSpacing: "0.5px" }}>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Expanded player stats */}
            {isOpen && (
              <div className="anim-slideUp" style={{ background: "var(--bg-hard)", borderTop: "1px solid var(--border-hard)" }}>
                <div style={{ padding: "10px 16px", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", letterSpacing: "2px", borderBottom: "1px solid var(--border)" }}>
                  // PLAYER BREAKDOWN
                </div>

                {session.playerList.map((p, i) => (
                  <div key={p.uid} className="anim-rowIn" style={{ animationDelay: `${i * 50}ms`, borderBottom: i < session.playerList.length - 1 ? "1px solid var(--border)" : "none" }}>
                    {/* Player name row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 6px" }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: i === 0 ? "var(--yellow)" : "var(--muted2)", width: 20, flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <Avatar name={p.name} size="xs" />
                      <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: i === 0 ? "var(--yellow)" : "var(--text)" }}>
                        {p.name.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: p.totalNet >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
                        {p.totalNet >= 0 ? "+" : ""}₹{p.totalNet}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", paddingBottom: 10, paddingLeft: 46 }}>
                      {[
                        { label: "ROUNDS", value: p.rounds, color: "var(--text)" },
                        { label: "WINS", value: p.wins, color: "var(--yellow)" },
                        { label: "WIN%", value: `${p.winRate}%`, color: "var(--yellow)" },
                        { label: "WON", value: `₹${p.totalWon.toFixed(0)}`, color: "var(--green)" },
                        { label: "LOST", value: `₹${p.totalLost.toFixed(0)}`, color: "var(--red)" },
                      ].map(s => (
                        <div key={s.label} style={{ padding: "6px 8px 6px 0" }}>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "var(--muted)", letterSpacing: "0.5px", marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Round summary mini-list */}
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", letterSpacing: "2px", marginBottom: 8 }}>// ROUND LOG</div>
                  {session.rounds.slice(0, 10).map((r, ri) => (
                    <div key={ri} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: ri < Math.min(session.rounds.length, 10) - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", width: 24 }}>R{ri + 1}</div>
                      <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text)" }}>
                        {session.playerNames[r.winnerId]?.toUpperCase() || "?"} WON
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: "var(--green)" }}>₹{r.pot}</div>
                    </div>
                  ))}
                  {session.rounds.length > 10 && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", paddingTop: 6, textAlign: "center" }}>
                      +{session.rounds.length - 10} MORE ROUNDS
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
