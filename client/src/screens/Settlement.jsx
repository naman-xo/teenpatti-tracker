import { useState } from "react";
import { Avatar, Label } from "../components/UI";
import socket from "../socket";
import { saveRound } from "../firebase";
import { sounds } from "../haptics";
import { useScreenEnter, stagger } from "../transitions";

function calcSettlement(netMap, nameMap) {
  const creditors = [], debtors = [];
  Object.entries(netMap).forEach(([uid, amount]) => {
    const r = +amount.toFixed(2);
    if (r > 0) creditors.push({ uid, name: nameMap[uid] || uid, amount: r });
    else if (r < 0) debtors.push({ uid, name: nameMap[uid] || uid, amount: Math.abs(r) });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  const txns = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = +Math.min(creditors[i].amount, debtors[j].amount).toFixed(2);
    txns.push({ from: debtors[j].name, to: creditors[i].name, amount });
    creditors[i].amount = +(creditors[i].amount - amount).toFixed(2);
    debtors[j].amount = +(debtors[j].amount - amount).toFixed(2);
    if (creditors[i].amount === 0) i++;
    if (debtors[j].amount === 0) j++;
  }
  return txns;
}

export default function Settlement({ user, roomId, room, settlementData, onEndSession, onLeaveSession, onLeaderboard }) {
  const [tab, setTab] = useState("round");
  const [editingMinBet, setEditingMinBet] = useState(false);
  const [newMinBet, setNewMinBet] = useState(room?.minBet?.toString() || "1");
  const enterStyle = useScreenEnter("up");

  const { result, settlement, playerNames, players } = settlementData;
  const isHost = room?.hostUid === user.uid;
  const winnerName = playerNames?.[result.winnerId] || "UNKNOWN";

  const sessionNetMap = {}, sessionNameMap = {};
  if (players) Object.values(players).forEach(p => { sessionNetMap[p.uid] = p.totalNet || 0; sessionNameMap[p.uid] = p.name; });
  const sessionSettlement = players ? calcSettlement(sessionNetMap, sessionNameMap) : [];

  const handleNextRound = () => {
    sounds.confirm();
    saveRound(roomId, { winnerId: result.winnerId, pot: result.pot, results: result.results, playerBets: result.playerBets, playerNames, timestamp: Date.now() }).catch(() => {});
    socket.emit("next-round", { roomId, uid: user.uid });
  };

  const handleSaveMinBet = () => {
    const val = parseFloat(newMinBet);
    if (isNaN(val) || val < 0.5) return alert("Min bet must be at least ₹0.50");
    sounds.confirm();
    socket.emit("change-min-bet", { roomId, uid: user.uid, newMinBet: val });
    setEditingMinBet(false);
  };

  const TABS = [{ key: "round", label: "ROUND" }, { key: "settle", label: "SETTLE" }, { key: "session", label: "SESSION" }];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", ...enterStyle }}>
      {/* Winner hero */}
      <div className="anim-winner" style={{ padding: "20px 16px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(212,247,0,0.03) 15px, rgba(212,247,0,0.03) 30px)" }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "3px", marginBottom: 8 }}>// ROUND OVER — WINNER</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: "var(--yellow)", lineHeight: 0.9, position: "relative", zIndex: 1, animation: "glitch 0.3s ease 0.1s" }}>
          {winnerName.toUpperCase()}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 12 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: "var(--green)", animation: "numberPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both" }}>
            +₹{result.results[result.winnerId]}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)" }}>POT ₹{result.pot}</div>
        </div>
      </div>

      {/* Min bet editor (host) */}
      {isHost && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px" }}>NEXT ROUND MIN:</div>
          {!editingMinBet ? (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--yellow)" }}>₹{room?.minBet}</div>
              <button className="btn-press" onClick={() => { sounds.click(); setEditingMinBet(true); }} style={{ background: "none", border: "1px solid var(--border-hard)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "3px 8px", cursor: "pointer" }}>EDIT</button>
            </>
          ) : (
            <>
              <input type="number" value={newMinBet} onChange={e => setNewMinBet(e.target.value)} min="0.5" step="0.5" autoFocus
                style={{ width: 80, padding: "4px 8px", background: "var(--bg-hard)", border: "2px solid var(--yellow)", color: "var(--yellow)", fontFamily: "'Space Mono', monospace", fontSize: 13, outline: "none" }} />
              <button className="btn-press" onClick={handleSaveMinBet} style={{ background: "var(--yellow)", border: "none", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "5px 10px", cursor: "pointer", fontWeight: 700 }}>OK</button>
              <button className="btn-press" onClick={() => { sounds.click(); setEditingMinBet(false); }} style={{ background: "none", border: "none", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer" }}>✕</button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} className="btn-press" onClick={() => { sounds.click(); setTab(t.key); }} style={{ flex: 1, padding: "10px", border: "none", borderRight: t.key !== "session" ? "1px solid var(--border-hard)" : "none", background: tab === t.key ? "var(--yellow)" : "transparent", color: tab === t.key ? "#000" : "var(--muted)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 9, cursor: "pointer", letterSpacing: "1.5px", transition: "background 0.15s, color 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Round Results */}
        {tab === "round" && Object.entries(result.results).sort(([,a],[,b]) => b-a).map(([uid, net], i) => (
          <div key={uid} className={`anim-rowIn ${uid === result.winnerId ? "winner-border" : ""}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `2px solid ${uid === result.winnerId ? "var(--yellow)" : "var(--border-hard)"}`, background: uid === result.winnerId ? "rgba(212,247,0,0.04)" : "var(--surface)", animationDelay: `${i * 60}ms` }}>
            <Avatar name={playerNames[uid]} size="sm" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700 }}>{playerNames[uid]?.toUpperCase()}{uid === result.winnerId ? " 👑" : ""}{uid === user.uid ? " (YOU)" : ""}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>BET ₹{result.playerBets?.[uid] || 0}</div>
            </div>
            <div className={i === 0 ? "anim-pop" : ""} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: net > 0 ? "var(--green)" : "var(--red)" }}>
              {net > 0 ? "+" : ""}₹{Math.abs(net)}
            </div>
          </div>
        ))}

        {/* This Round Settle */}
        {tab === "settle" && (
          <>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px" }}>// MINIMUM PAYMENTS THIS ROUND</div>
            {settlement.length === 0 ? (
              <div className="anim-fadeIn" style={{ padding: "24px", border: "2px dashed var(--border-hard)", textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)" }}>EVERYONE IS EVEN THIS ROUND</div>
            ) : settlement.map((s, i) => (
              <div key={i} className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "2px solid var(--border-hard)", background: "var(--surface)", animationDelay: `${i * 60}ms` }}>
                <Avatar name={s.from} size="xs" />
                <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                  <span style={{ color: "var(--red)" }}>{s.from.toUpperCase()}</span>
                  <span style={{ color: "var(--muted)" }}> PAYS </span>
                  <span style={{ color: "var(--green)" }}>{s.to.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--yellow)" }}>₹{s.amount}</div>
              </div>
            ))}
          </>
        )}

        {/* Session Settle */}
        {tab === "session" && (
          <>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px" }}>// RUNNING TOTALS — ALL ROUNDS SO FAR</div>
            {players && Object.values(players).sort((a,b) => (b.totalNet||0)-(a.totalNet||0)).map((p, i) => (
              <div key={p.uid} className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid var(--border-hard)", background: (p.totalNet||0) > 0 ? "rgba(0,230,118,0.04)" : (p.totalNet||0) < 0 ? "rgba(255,51,51,0.04)" : "var(--surface)", animationDelay: `${i * 50}ms` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--muted2)", width: 20 }}>{i+1}</div>
                <Avatar name={p.name} size="xs" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700 }}>{p.name.toUpperCase()}{p.uid === user.uid ? " (YOU)" : ""}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{p.rounds||0} RDS · {p.wins||0} WINS</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: (p.totalNet||0) >= 0 ? "var(--green)" : "var(--red)" }}>
                  {(p.totalNet||0) >= 0 ? "+" : ""}₹{p.totalNet||0}
                </div>
              </div>
            ))}
            {sessionSettlement.length > 0 && (
              <>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "1px", marginTop: 8 }}>// IF YOU STOPPED NOW — PAY</div>
                {sessionSettlement.map((s, i) => (
                  <div key={i} className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "2px solid var(--yellow)", background: "rgba(212,247,0,0.04)", animationDelay: `${i * 60}ms` }}>
                    <Avatar name={s.from} size="xs" />
                    <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                      <span style={{ color: "var(--red)" }}>{s.from.toUpperCase()}</span>
                      <span style={{ color: "var(--muted)" }}> PAYS </span>
                      <span style={{ color: "var(--green)" }}>{s.to.toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--yellow)" }}>₹{s.amount}</div>
                  </div>
                ))}
              </>
            )}
            {sessionSettlement.length === 0 && players && (
              <div className="anim-fadeIn" style={{ padding: "16px", border: "2px dashed var(--border-hard)", textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)" }}>EVERYONE IS EVEN ACROSS ALL ROUNDS</div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ borderTop: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          <button className="btn-press" onClick={() => { sounds.click(); onLeaderboard(); }} style={{ flex: 1, padding: "14px", background: "transparent", border: "none", borderRight: "1px solid var(--border-hard)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "1px" }}>LEADERS</button>
          <button className="btn-press" onClick={() => { sounds.pack(); onLeaveSession(); }} style={{ flex: 1, padding: "14px", background: "transparent", border: "none", borderRight: isHost ? "1px solid var(--border-hard)" : "none", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "1px" }}>LEAVE</button>
          {isHost && <button className="btn-press" onClick={() => { sounds.error(); onEndSession(); }} style={{ flex: 1, padding: "14px", background: "transparent", border: "none", color: "var(--red)", fontFamily: "'Space Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: "1px" }}>END SESSION</button>}
        </div>
        {isHost ? (
          <button className="btn-press" onClick={handleNextRound} style={{ width: "100%", padding: "18px", background: "var(--yellow)", border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "4px", color: "var(--on-accent)", cursor: "pointer" }}>
            NEXT ROUND →
          </button>
        ) : (
          <div style={{ padding: "16px", textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>⏳ WAITING FOR HOST...</div>
        )}
      </div>
    </div>
  );
}
