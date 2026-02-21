import { useEffect, useState } from "react";
import { Avatar, Panel, PanelHeader, Label, Ticker } from "../components/UI";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { sounds } from "../haptics";
import { useScreenEnter, stagger } from "../transitions";

export default function Home({ user, onCreateRoom, onJoinRoom, onLeaderboard, onProfile, onAdmin }) {
  const enterStyle = useScreenEnter("up");
  const firstName = user.displayName?.split(" ")[0]?.toUpperCase() || "PLAYER";
  const [topPlayers, setTopPlayers] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myNet, setMyNet] = useState(null);

  const go = (fn, sound = "nav") => () => { sounds[sound](); fn(); };

  // Load leaderboard snapshot for the card
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "rounds"));
        const totals = {};
        snap.forEach(doc => {
          const round = doc.data();
          Object.entries(round.results || {}).forEach(([uid, net]) => {
            const name = round.playerNames?.[uid] || "Unknown";
            if (!totals[uid]) totals[uid] = { uid, name, net: 0 };
            totals[uid].net = +(totals[uid].net + net).toFixed(2);
          });
        });
        const sorted = Object.values(totals).sort((a, b) => b.net - a.net);
        setTopPlayers(sorted.slice(0, 3));
        const myIdx = sorted.findIndex(p => p.uid === user.uid);
        if (myIdx >= 0) { setMyRank(myIdx + 1); setMyNet(sorted[myIdx].net); }
      } catch {}
    };
    load();
  }, [user.uid]);

  const rankLabel = (i) => {
    if (i === 0) return { label: "01", color: "var(--yellow)" };
    if (i === 1) return { label: "02", color: "#aaa" };
    return { label: "03", color: "#c08060" };
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", ...enterStyle }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "2px solid var(--border-hard)" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, letterSpacing: "3px", color: "var(--yellow)" }}>TEEN PATTI</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", animation: "blink 2s infinite" }} />
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px" }}>LIVE</div>
          <div className="btn-press" onClick={go(onProfile)} style={{ cursor: "pointer" }}>
            <Avatar name={user.displayName} size="sm" photoURL={user.photoURL} />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "28px 16px 20px", borderBottom: "2px solid var(--border-hard)", background: "linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40%", backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.4 }} />
        <Label>// WELCOME BACK</Label>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.9, letterSpacing: "2px", color: "var(--text)", marginTop: 8, position: "relative", zIndex: 1, animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "60ms" }}>
          HEY,<br /><span style={{ color: "var(--yellow)" }}>{firstName}</span>
        </div>
        {myRank && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "120ms" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)" }}>YOUR RANK</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--yellow)", lineHeight: 1 }}>#{myRank}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)" }}>·</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: myNet >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>{myNet >= 0 ? "+" : ""}₹{myNet}</div>
          </div>
        )}
      </div>

      <Ticker items={["CREATE ROOM", "JOIN ROOM", "TRACK BETS", "SETTLE UP", "LEADERBOARD", "◆"]} />

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Main actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--border-hard)", ...stagger(0) }}>
          <button className="btn-press" onClick={go(onCreateRoom, "confirm")} style={{ padding: "24px 16px", background: "var(--yellow)", border: "none", borderRight: "2px solid var(--border-hard)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--on-accent)", cursor: "pointer", textAlign: "left", textTransform: "uppercase", letterSpacing: "1px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>CREATE<br />ROOM
          </button>
          <button className="btn-press" onClick={go(onJoinRoom, "nav")} style={{ padding: "24px 16px", background: "var(--surface2)", border: "none", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--yellow)", cursor: "pointer", textAlign: "left", textTransform: "uppercase", letterSpacing: "1px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>→</div>JOIN<br />ROOM
          </button>
        </div>

        {/* Leaderboard card with live data */}
        <div style={stagger(1)}>
          <Panel>
            <PanelHeader>
              <span>// ALL-TIME RANKINGS</span>
              <span style={{ color: "var(--yellow)" }}>◆</span>
            </PanelHeader>

            {topPlayers.length === 0 ? (
              <div style={{ padding: "16px 14px" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", lineHeight: 1.8 }}>NO GAMES YET — PLAY A ROUND TO SEE RANKINGS</div>
                <button className="btn-press" onClick={go(onLeaderboard)} style={{ marginTop: 12, background: "none", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "8px 12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>VIEW →</button>
              </div>
            ) : (
              <>
                {topPlayers.map((p, i) => {
                  const r = rankLabel(i);
                  const isMe = p.uid === user.uid;
                  return (
                    <div key={p.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: isMe ? "rgba(212,247,0,0.04)" : "transparent" }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: r.color, width: 28, flexShrink: 0 }}>{r.label}</div>
                      <Avatar name={p.name} size="xs" />
                      <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: isMe ? "var(--yellow)" : "var(--text)" }}>
                        {p.name.toUpperCase()}{isMe ? " ★" : ""}
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: p.net >= 0 ? "var(--green)" : "var(--red)" }}>
                        {p.net >= 0 ? "+" : ""}₹{p.net}
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {myRank && myRank > 3 && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)" }}>
                      YOU: <span style={{ color: "var(--yellow)" }}>#{myRank}</span>
                    </div>
                  )}
                  <div style={{ flex: 1 }} />
                  <button className="btn-press" onClick={go(onLeaderboard)} style={{ background: "none", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "8px 12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>VIEW ALL →</button>
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* How it works */}
        <div style={stagger(2)}>
          <Panel>
            <PanelHeader><span>// HOW IT WORKS</span></PanelHeader>
            <div style={{ padding: "14px" }}>
              {[
                ["01", "Create or join a room with a 6-digit code"],
                ["02", "Host sets min bet and starts the game"],
                ["03", "Bet, Show, or Pack each round"],
                ["04", "Track wins and settle up at the end"],
              ].map(([n, txt]) => (
                <div key={n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--yellow)", lineHeight: 1, flexShrink: 0, width: 24 }}>{n}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>{txt.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: "flex", borderTop: "2px solid var(--border-hard)", background: "var(--bg)" }}>
        {[
          { label: "HOME",    icon: "⌂", fn: null,        active: true  },
          { label: "RANKS",   icon: "◈", fn: onLeaderboard              },
          { label: "PROFILE", icon: "◉", fn: onProfile                  },
          ...(onAdmin ? [{ label: "ADMIN", icon: "⚡", fn: onAdmin }] : []),
        ].map(({ label, icon, fn, active }, i, arr) => (
          <button key={i} className="btn-press" onClick={fn ? go(fn) : undefined}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 12px", background: "none", border: "none", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none", color: active ? "var(--yellow)" : label === "ADMIN" ? "var(--red)" : "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: fn ? "pointer" : "default", letterSpacing: "1px" }}>
            <span style={{ fontSize: 16 }}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
