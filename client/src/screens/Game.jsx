import { useEffect, useRef, useState } from "react";
import { Avatar, Label, Tag } from "../components/UI";
import socket from "../socket";
import { sounds } from "../haptics";
import { useCountUp } from "../transitions";

export default function Game({ user, roomId, room, roundState, onRoundEnd, onEndSession }) {
  const [showBetModal, setShowBetModal] = useState(false);
  const [betInput, setBetInput] = useState("");
  const [showCalledByUid, setShowCalledByUid] = useState(roundState?.showCalledBy || null);
  const [spectating, setSpectating] = useState(!roundState?.playerStatus?.[user.uid]);
  const [reordering, setReordering] = useState(false);
  const [reorderList, setReorderList] = useState([]);
  const [localRound, setLocalRound] = useState(roundState);
  const [potPop, setPotPop] = useState(false);

  const isHost = room?.hostUid === user.uid;

  useEffect(() => {
    setLocalRound(roundState);
    setShowCalledByUid(roundState?.showCalledBy || null);
    setSpectating(!roundState?.playerStatus?.[user.uid]);
    setShowBetModal(false); setBetInput(""); setReordering(false);
  }, [roundState]);

  const refs = useRef({});
  refs.current = {
    onRoundUpdated: ({ roundState: rs }) => {
      setLocalRound(prev => {
        if (prev && rs.pot !== prev.pot) { setPotPop(true); setTimeout(() => setPotPop(false), 400); }
        return rs;
      });
      if (rs.showCalledBy) setShowCalledByUid(rs.showCalledBy);
    },
    onShowCalled: ({ byUid }) => { setShowCalledByUid(byUid); sounds.show(); },
    onRoundEnded: (data) => { sounds.win(); onRoundEnd(data); },
  };

  useEffect(() => {
    const h1 = (d) => refs.current.onRoundUpdated(d);
    const h2 = (d) => refs.current.onShowCalled(d);
    const h3 = (d) => refs.current.onRoundEnded(d);
    const h4 = () => setSpectating(true);
    socket.on("round-updated", h1); socket.on("show-called", h2);
    socket.on("round-ended", h3); socket.on("spectating", h4);
    return () => {
      socket.off("round-updated", h1); socket.off("show-called", h2);
      socket.off("round-ended", h3); socket.off("spectating", h4);
    };
  }, []);

  const didMount = useRef(false);
  useEffect(() => { if (!didMount.current) { sounds.gameStart(); didMount.current = true; } }, []);

  const rs = localRound;
  const pot = rs?.pot || 0;
  const animatedPot = useCountUp(pot, 500);
  const myStatus = rs?.playerStatus?.[user.uid];
  const myBet = rs?.playerBets?.[user.uid] || 0;
  const currentMin = rs?.currentMinBet || 0;
  const players = room ? Object.values(room.players) : [];
  const activePlayers = players.filter(p => rs?.playerStatus?.[p.uid] === "active");
  const showWasCalled = !!showCalledByUid;
  const turnOrder = rs?.turnOrder || [];
  const activeTurnOrder = turnOrder.filter(uid => rs?.playerStatus?.[uid] === "active");
  const currentTurnUid = activeTurnOrder.length > 0 ? activeTurnOrder[(rs?.currentTurnIndex ?? 0) % activeTurnOrder.length] : null;
  const isMyTurn = currentTurnUid === user.uid && myStatus === "active";

  const handleBet = () => {
    const amount = parseFloat(betInput);
    if (isNaN(amount) || amount < currentMin) { sounds.error(); return alert(`Min: ₹${currentMin}`); }
    sounds.bet(); socket.emit("place-bet", { roomId, uid: user.uid, amount });
    setShowBetModal(false); setBetInput("");
  };
  const handlePack = () => { if (!window.confirm("Pack and fold?")) return; sounds.pack(); socket.emit("pack", { roomId, uid: user.uid }); };
  const handleShow = () => {
    const cost = +(currentMin * (activePlayers.length - 1)).toFixed(2);
    if (!window.confirm(`Show costs ₹${cost}. Confirm?`)) return;
    sounds.show(); socket.emit("show", { roomId, uid: user.uid });
  };
  const handleDeclareWinner = (winnerUid) => {
    const name = room?.players?.[winnerUid]?.name || "player";
    if (!window.confirm(`Declare ${name} as winner?`)) return;
    sounds.confirm(); socket.emit("declare-winner", { roomId, uid: user.uid, winnerUid });
  };
  const handleNumpad = (val) => {
    sounds.numpad();
    if (val === "⌫") setBetInput(p => p.slice(0, -1));
    else if (val === ".") { if (!betInput.includes(".")) setBetInput(p => p + "."); }
    else setBetInput(p => p + val);
  };

  if (spectating) return (
    <div className="anim-fadeIn" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: "var(--muted)", letterSpacing: 4, animation: "glitch 4s infinite" }}>WATCHING</div>
      <div style={{ border: "2px solid var(--border-hard)", padding: "20px 24px", textAlign: "center", width: "100%" }}>
        <Label>// LIVE POT</Label>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: "var(--yellow)", lineHeight: 1 }}>₹{animatedPot}</div>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", textAlign: "center", lineHeight: 1.8, letterSpacing: "1px" }}>YOU JOINED MID-ROUND.<br />YOU'LL JOIN THE NEXT ROUND AUTOMATICALLY.</div>
    </div>
  );

  return (
    <div className="anim-fadeIn" style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", animation: "blink 1.5s infinite" }} />
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "2px", color: "var(--muted)" }}>ROOM_{roomId}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)" }}>MIN <span style={{ color: "var(--yellow)" }}>₹{currentMin}</span></div>
          {isHost && <button className="btn-press" onClick={() => { sounds.click(); onEndSession(); }} style={{ background: "none", border: "1px solid var(--red)", color: "var(--red)", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" }}>END</button>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Pot */}
        <div style={{ padding: "20px 16px", borderBottom: "2px solid var(--border-hard)", background: "var(--bg-hard)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(212,247,0,0.02) 20px, rgba(212,247,0,0.02) 40px)" }} />
          <Label>// TOTAL POT</Label>
          <div className={potPop ? "pot-pop" : ""} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, lineHeight: 0.9, letterSpacing: "2px", color: "var(--yellow)", position: "relative", zIndex: 1 }}>
            ₹{animatedPot}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 10, letterSpacing: "1px" }}>{activePlayers.length} ACTIVE PLAYERS</div>
        </div>

        {showWasCalled && (
          <div className="show-banner" style={{ padding: "12px 16px", background: "var(--yellow)", borderBottom: "2px solid var(--border-hard)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--on-accent)", letterSpacing: "1px" }}>⚡ {room?.players?.[showCalledByUid]?.name?.toUpperCase()} CALLED SHOW</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#333" }}>{isHost ? "DECLARE WINNER ↓" : "WAITING..."}</div>
          </div>
        )}

        {!showWasCalled && currentTurnUid && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: isMyTurn ? "rgba(212,247,0,0.06)" : "transparent", display: "flex", alignItems: "center", gap: 10, transition: "background 0.4s" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isMyTurn ? "var(--yellow)" : "var(--muted2)", animation: isMyTurn ? "blink 1s infinite" : "none" }} />
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: isMyTurn ? "var(--yellow)" : "var(--muted)", letterSpacing: "1px", flex: 1, transition: "color 0.3s" }}>
              {isMyTurn ? "YOUR TURN" : `${room?.players?.[currentTurnUid]?.name?.toUpperCase()}'S TURN`}
            </div>
            {isHost && <button className="btn-press" onClick={() => { sounds.click(); setReorderList(turnOrder.filter(uid => rs?.playerStatus?.[uid] === "active")); setReordering(true); }} style={{ background: "none", border: "1px solid var(--border-hard)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "3px 8px", cursor: "pointer" }}>↕ ORDER</button>}
          </div>
        )}

        {/* Players */}
        <div style={{ padding: "12px 16px", borderBottom: "2px solid var(--border-hard)" }}>
          <Label>// PLAYERS</Label>
          <div style={{ marginTop: 8, border: "2px solid var(--border-hard)" }}>
            {players.map((p, i) => {
              const status = rs?.playerStatus?.[p.uid];
              const bet = rs?.playerBets?.[p.uid] || 0;
              const isYou = p.uid === user.uid;
              const isPacked = status === "packed";
              const isActive = status === "active";
              const isTheirTurn = currentTurnUid === p.uid && isActive && !showWasCalled;
              const isShowPlayer = status === "show";
              return (
                <div key={p.uid} className="anim-rowIn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: i < players.length - 1 ? "1px solid var(--border)" : "none", background: isTheirTurn ? "rgba(212,247,0,0.05)" : isYou ? "rgba(212,247,0,0.02)" : "transparent", opacity: isPacked ? 0.4 : 1, transition: "background 0.3s, opacity 0.4s", animationDelay: `${i * 40}ms` }}>
                  <Avatar name={p.name} size="xs" photoURL={p.photoURL} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: isTheirTurn || isYou ? "var(--yellow)" : "var(--text)", transition: "color 0.3s" }}>{p.name.toUpperCase()}{isYou ? " (YOU)" : ""}</span>
                      {p.uid === room?.hostUid && <Tag>HOST</Tag>}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{isPacked ? "FOLDED" : isActive || isShowPlayer ? `BET ₹${bet}` : ""}</div>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, padding: "2px 6px", letterSpacing: "1px", textTransform: "uppercase", border: `1px solid ${isPacked ? "var(--border)" : isShowPlayer ? "var(--purple)" : isTheirTurn ? "var(--yellow)" : isActive ? "var(--green)" : "transparent"}`, color: isPacked ? "var(--muted)" : isShowPlayer ? "var(--purple)" : isTheirTurn ? "var(--yellow)" : isActive ? "var(--green)" : "transparent", transition: "all 0.3s" }}>
                    {isPacked ? "PACK" : isShowPlayer ? "SHOW" : isTheirTurn ? "TURN" : isActive ? "IN" : ""}
                  </div>
                  {isHost && showWasCalled && (status === "show" || isActive) && (
                    <button className="btn-press" onClick={() => handleDeclareWinner(p.uid)} style={{ background: "var(--yellow)", border: "none", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer", fontWeight: 700, letterSpacing: "1px" }}>WIN</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* P&L */}
        {myStatus && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border-hard)" }}>
              <Label>// YOUR BET</Label>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "var(--red)" }}>-₹{myBet}</div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <Label>// IF YOU WIN</Label>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "var(--green)" }}>+₹{(pot - myBet).toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      {myStatus === "active" && !showWasCalled && (
        <div style={{ padding: "12px 16px", borderTop: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0 }}>
          {!isMyTurn && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", textAlign: "center", marginBottom: 10, letterSpacing: "1px" }}>⏳ WAIT FOR {room?.players?.[currentTurnUid]?.name?.toUpperCase()}</div>}
          <div style={{ display: "flex", opacity: isMyTurn ? 1 : 0.3, pointerEvents: isMyTurn ? "all" : "none", transition: "opacity 0.4s" }}>
            <button className="btn-press" onClick={handlePack} style={{ flex: 1, padding: "14px 8px", background: "transparent", border: "2px solid var(--border-hard)", borderRight: "none", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>PACK</button>
            <button className="btn-press" onClick={handleShow} style={{ flex: 1, padding: "14px 8px", background: "transparent", border: "2px solid var(--purple)", borderRight: "none", color: "var(--purple)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>SHOW</button>
            <button className="btn-press" onClick={() => { sounds.click(); setShowBetModal(true); }} style={{ flex: 1, padding: "14px 8px", background: "var(--yellow)", border: "2px solid var(--yellow)", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>RAISE ↑</button>
          </div>
        </div>
      )}
      {myStatus === "active" && showWasCalled && !isHost && <div style={{ padding: "14px 16px", borderTop: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", textAlign: "center", letterSpacing: "2px" }}>⏳ WAITING FOR HOST TO DECLARE WINNER...</div>}
      {myStatus === "packed" && <div style={{ padding: "14px", borderTop: "2px solid var(--border-hard)", background: "var(--bg)", flexShrink: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", textAlign: "center", letterSpacing: "2px" }}>YOU FOLDED — WATCHING 👁</div>}

      {/* Bet modal */}
      {showBetModal && (
        <div className="anim-fadeIn" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
          <div className="anim-slideUp" style={{ width: "100%", background: "var(--surface)", border: "2px solid var(--yellow)", borderBottom: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "2px solid var(--border-hard)" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, letterSpacing: "2px" }}>RAISE BET</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted)" }}>MIN ₹{currentMin}</div>
            </div>
            <div style={{ padding: "16px", background: "var(--bg-hard)", textAlign: "right", borderBottom: "2px solid var(--border-hard)" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: betInput ? "var(--yellow)" : "var(--muted2)", letterSpacing: "2px", transition: "color 0.15s" }}>₹{betInput || "0"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
                <button key={k} className="btn-press" onClick={() => handleNumpad(k)} style={{ padding: "18px", border: "1px solid var(--border)", background: k === "⌫" ? "#1a0000" : "var(--surface2)", color: k === "⌫" ? "var(--red)" : "var(--text)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{k}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button className="btn-press" onClick={() => { sounds.click(); setShowBetModal(false); setBetInput(""); }} style={{ padding: "16px", background: "transparent", border: "2px solid var(--border-hard)", borderLeft: "none", borderBottom: "none", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
              <button className="btn-press" onClick={handleBet} style={{ padding: "16px", background: "var(--yellow)", border: "none", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "1px" }}>CONFIRM ₹{betInput || "0"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder modal */}
      {reordering && (
        <div className="anim-fadeIn" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
          <div className="anim-slideUp" style={{ width: "100%", background: "var(--surface)", border: "2px solid var(--border-hard)", borderBottom: "none" }}>
            <div style={{ padding: "14px 16px", borderBottom: "2px solid var(--border-hard)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, letterSpacing: "2px" }}>TURN ORDER</div>
            {reorderList.map((uid, i) => (
              <div key={uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "var(--yellow)", width: 24 }}>{i + 1}</div>
                <Avatar name={room?.players?.[uid]?.name} size="xs" />
                <div style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>{room?.players?.[uid]?.name?.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-press" onClick={() => { sounds.click(); const l=[...reorderList];[l[i],l[i-1]]=[l[i-1],l[i]];setReorderList(l); }} disabled={i===0} style={{ padding:"6px 10px",background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--text)",cursor:"pointer",opacity:i===0?0.3:1 }}>↑</button>
                  <button className="btn-press" onClick={() => { sounds.click(); const l=[...reorderList];[l[i],l[i+1]]=[l[i+1],l[i]];setReorderList(l); }} disabled={i===reorderList.length-1} style={{ padding:"6px 10px",background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--text)",cursor:"pointer",opacity:i===reorderList.length-1?0.3:1 }}>↓</button>
                </div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button className="btn-press" onClick={() => { sounds.click(); setReordering(false); }} style={{ padding: "14px", background: "transparent", border: "2px solid var(--border-hard)", borderLeft: "none", borderBottom: "none", color: "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 10, cursor: "pointer" }}>CANCEL</button>
              <button className="btn-press" onClick={() => { sounds.confirm(); socket.emit("reorder-turns", { roomId, uid: user.uid, newOrder: reorderList }); setReordering(false); }} style={{ padding: "14px", background: "var(--yellow)", border: "none", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>CONFIRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
