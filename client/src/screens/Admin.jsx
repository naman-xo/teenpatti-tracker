import { useEffect, useState } from "react";
import { NavBar } from "../components/UI";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, writeBatch, updateDoc } from "firebase/firestore";
import { sounds } from "../haptics";
import { useScreenEnter } from "../transitions";

export default function Admin({ user, onBack }) {
  const enterStyle = useScreenEnter("up");
  const [tab, setTab] = useState("overview");
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 19)]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "players")),
        getDocs(collection(db, "rounds")),
      ]);
      setPlayers(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRounds(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { addLog("ERROR: " + e.message); }
    setLoading(false);
  };

  // ─── Delete all rounds ─────────────────────────────────────────
  const clearAllRounds = async () => {
    if (!window.confirm("Delete ALL game rounds? This wipes the entire leaderboard and history. Cannot be undone.")) return;
    setWorking(true);
    try {
      const snap = await getDocs(collection(db, "rounds"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setRounds([]);
      addLog(`Deleted ${snap.docs.length} rounds.`);
    } catch (e) { addLog("ERROR: " + e.message); }
    setWorking(false);
  };

  // ─── Delete all players ────────────────────────────────────────
  const clearAllPlayers = async () => {
    if (!window.confirm("Delete ALL player profiles from Firestore? Auth accounts stay — they'll need to re-register. Cannot be undone.")) return;
    setWorking(true);
    try {
      const snap = await getDocs(collection(db, "players"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setPlayers([]);
      addLog(`Deleted ${snap.docs.length} player profiles.`);
    } catch (e) { addLog("ERROR: " + e.message); }
    setWorking(false);
  };

  // ─── Nuke everything ───────────────────────────────────────────
  const nukeEverything = async () => {
    if (!window.confirm("⚠️ NUKE EVERYTHING — delete all rounds AND all player profiles? This cannot be undone.")) return;
    if (!window.confirm("Are you absolutely sure? Last chance.")) return;
    setWorking(true);
    try {
      const [pSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "players")),
        getDocs(collection(db, "rounds")),
      ]);
      const batch = writeBatch(db);
      pSnap.docs.forEach(d => batch.delete(d.ref));
      rSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setPlayers([]); setRounds([]);
      addLog(`NUKE: Deleted ${pSnap.docs.length} players + ${rSnap.docs.length} rounds.`);
    } catch (e) { addLog("ERROR: " + e.message); }
    setWorking(false);
  };

  // ─── Delete single player ──────────────────────────────────────
  const deletePlayer = async (p) => {
    if (!window.confirm(`Remove ${p.name} from Firestore? Their Auth account stays.`)) return;
    setWorking(true);
    try {
      await deleteDoc(doc(db, "players", p.id));
      setPlayers(pl => pl.filter(x => x.id !== p.id));
      addLog(`Deleted player: ${p.name}`);
    } catch (e) { addLog("ERROR: " + e.message); }
    setWorking(false);
  };

  // ─── Adjust player net balance (manual correction) ────────────
  const [editUid, setEditUid] = useState(null);
  const [editAdj, setEditAdj] = useState("");

  const applyAdjustment = async (p) => {
    const adj = parseFloat(editAdj);
    if (isNaN(adj)) return;
    setWorking(true);
    try {
      // Save as a correction round
      const { addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "rounds"), {
        roomId: "ADMIN_ADJ",
        winnerId: adj >= 0 ? p.id : null,
        pot: Math.abs(adj),
        results: { [p.id]: adj },
        playerNames: { [p.id]: p.name },
        playerBets: {},
        timestamp: Date.now(),
        adminNote: `Manual adjustment by admin`,
      });
      addLog(`Adjusted ${p.name} by ₹${adj > 0 ? "+" : ""}${adj}`);
      setEditUid(null); setEditAdj("");
      await loadData();
    } catch (e) { addLog("ERROR: " + e.message); }
    setWorking(false);
  };

  const TABS = ["overview", "players", "danger", "log"];

  const totalPot = rounds.reduce((s, r) => s + (r.pot || 0), 0);
  const uniqueRooms = new Set(rounds.map(r => r.roomId)).size;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", ...enterStyle }}>
      <NavBar title="⚡ ADMIN" onBack={() => { sounds.nav(); onBack(); }} />

      {/* Admin badge */}
      <div style={{ padding: "8px 16px", background: "var(--yellow)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--on-accent)", fontWeight: 700, letterSpacing: "2px" }}>ADMIN SESSION — {user.email}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border-hard)", flexShrink: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} className="btn-press" onClick={() => { sounds.click(); setTab(t); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRight: i < TABS.length - 1 ? "1px solid var(--border-hard)" : "none", background: tab === t ? "var(--yellow)" : "transparent", color: tab === t ? "var(--on-accent)" : "var(--muted)", fontFamily: "'Space Mono', monospace", fontSize: 8, fontWeight: 700, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "TOTAL PLAYERS", value: players.length, color: "var(--yellow)" },
              { label: "TOTAL ROUNDS", value: rounds.length, color: "var(--text)" },
              { label: "UNIQUE ROOMS", value: uniqueRooms, color: "var(--blue)" },
              { label: "TOTAL POT TRACKED", value: `₹${totalPot.toFixed(0)}`, color: "var(--green)" },
            ].map(s => (
              <div key={s.label} style={{ border: "2px solid var(--border-hard)", background: "var(--surface)", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: s.color, lineHeight: 1 }}>{loading ? "..." : s.value}</div>
              </div>
            ))}
            <button className="btn-press" onClick={loadData} style={{ border: "2px solid var(--border-hard)", background: "transparent", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "12px", cursor: "pointer", letterSpacing: "2px" }}>
              ↻ REFRESH DATA
            </button>
          </div>
        )}

        {/* PLAYERS */}
        {tab === "players" && (
          <div>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px" }}>
              {players.length} REGISTERED PLAYERS
            </div>
            {players.map((p, i) => (
              <div key={p.id} style={{ borderBottom: "1px solid var(--border)", padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: editUid === p.id ? 10 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{p.name || "Unknown"}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{p.id}</div>
                  </div>
                  <button className="btn-press" onClick={() => { sounds.click(); setEditUid(editUid === p.id ? null : p.id); setEditAdj(""); }} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--border-hard)", color: "var(--yellow)", fontFamily: "'Space Mono', monospace", fontSize: 8, cursor: "pointer", letterSpacing: "1px" }}>
                    ADJ
                  </button>
                  <button className="btn-press" onClick={() => deletePlayer(p)} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--red)", color: "var(--red)", fontFamily: "'Space Mono', monospace", fontSize: 8, cursor: "pointer", letterSpacing: "1px" }}>
                    DEL
                  </button>
                </div>
                {editUid === p.id && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" value={editAdj} onChange={e => setEditAdj(e.target.value)} placeholder="e.g. +50 or -20" style={{ flex: 1, background: "var(--bg-hard)", border: "2px solid var(--border-hard)", color: "var(--text)", fontFamily: "'Space Mono', monospace", fontSize: 12, padding: "8px", outline: "none" }} />
                    <button className="btn-press" onClick={() => applyAdjustment(p)} disabled={working} style={{ padding: "8px 14px", background: "var(--yellow)", border: "none", color: "var(--on-accent)", fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: "1px" }}>APPLY</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DANGER ZONE */}
        {tab === "danger" && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--red)", letterSpacing: "2px", padding: "10px 0" }}>// ALL ACTIONS BELOW ARE IRREVERSIBLE</div>

            {[
              { label: "CLEAR ALL GAME ROUNDS", desc: "Wipes leaderboard + history. Player profiles stay.", fn: clearAllRounds, color: "var(--red)" },
              { label: "CLEAR ALL PLAYERS", desc: "Removes all Firestore profiles. Auth accounts stay.", fn: clearAllPlayers, color: "var(--red)" },
              { label: "☢ NUKE EVERYTHING", desc: "Deletes ALL rounds + ALL player profiles. Full reset.", fn: nukeEverything, color: "#ff0000" },
            ].map(a => (
              <div key={a.label} style={{ border: `2px solid ${a.color}`, padding: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10, color: a.color, marginBottom: 6, letterSpacing: "1px" }}>{a.label}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>{a.desc}</div>
                <button className="btn-press" onClick={a.fn} disabled={working} style={{ padding: "10px 20px", background: "transparent", border: `2px solid ${a.color}`, color: a.color, fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10, cursor: "pointer", letterSpacing: "2px", opacity: working ? 0.5 : 1 }}>
                  {working ? "WORKING..." : "EXECUTE"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LOG */}
        {tab === "log" && (
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted)", letterSpacing: "2px", marginBottom: 10 }}>// ADMIN ACTION LOG (THIS SESSION)</div>
            {log.length === 0 && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--muted2)" }}>NO ACTIONS YET</div>}
            {log.map((entry, i) => (
              <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: i === 0 ? "var(--yellow)" : "var(--muted)", padding: "4px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.6 }}>{entry}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
