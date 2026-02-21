import { useEffect, useRef, useState, Component } from "react";
import { auth, savePlayer } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import socket, { setSocketRoom } from "./socket";
import { ThemeProvider, useTheme } from "./theme.jsx";
import { applyFavicon, resetFavicon } from "./favicon.js";

import Login from "./screens/Login";
import Home from "./screens/Home";
import CreateRoom from "./screens/CreateRoom";
import JoinRoom from "./screens/JoinRoom";
import Lobby from "./screens/Lobby";
import Game from "./screens/Game";
import Settlement from "./screens/Settlement";
import Leaderboard from "./screens/Leaderboard";
import SessionLeaderboard from "./screens/SessionLeaderboard";
import Profile from "./screens/Profile";
import Admin from "./screens/Admin";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

// ─── Error Boundary ────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#ff3333", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "monospace" }}>
        <div style={{ fontSize: 12, color: "#d4f700", marginBottom: 16, letterSpacing: 2 }}>// CRASH REPORT</div>
        <div style={{ fontSize: 13, maxWidth: 400, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.state.error.message}</div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 16, maxWidth: 400, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.state.error.stack?.split("\n").slice(0, 6).join("\n")}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 24, padding: "10px 20px", background: "#d4f700", border: "none", fontFamily: "monospace", fontSize: 11, cursor: "pointer", letterSpacing: 2 }}>RELOAD</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Favicon sync — listens to theme changes ───────────────────
function FaviconSync() {
  const { themeKey } = useTheme();
  useEffect(() => { applyFavicon(themeKey); }, [themeKey]);
  return null;
}

// ─── Main App ──────────────────────────────────────────────────
function AppInner() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState("home");
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const [roundState, setRoundState] = useState(null);
  const [settlementData, setSettlementData] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const roomIdRef = useRef(null);
  const userRef = useRef(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (roomId && user) setSocketRoom(roomId, user.uid, user.displayName);
  }, [roomId, user]);

  const onGameStarted  = useRef(null);
  const onRoomUpdated  = useRef(null);
  const onSessionEnded = useRef(null);
  const onHostChanged  = useRef(null);

  onGameStarted.current  = ({ room: r, roundState: rs }) => { setRoom(r); setRoundState(rs); setScreen("game"); };
  onRoomUpdated.current  = ({ room: r }) => setRoom(r);
  onSessionEnded.current = ({ sessionData: sd }) => { setSessionData(sd); setScreen("session-leaderboard"); };
  onHostChanged.current  = ({ room: r }) => setRoom(r);

  useEffect(() => {
    const h1 = (d) => onGameStarted.current(d);
    const h2 = (d) => onRoomUpdated.current(d);
    const h3 = (d) => onSessionEnded.current(d);
    const h4 = (d) => onHostChanged.current(d);
    socket.on("game-started", h1); socket.on("room-updated", h2);
    socket.on("session-ended", h3); socket.on("host-changed", h4);
    return () => {
      socket.off("game-started", h1); socket.off("room-updated", h2);
      socket.off("session-ended", h3); socket.off("host-changed", h4);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        await savePlayer(u.uid, u.displayName, u.photoURL);
        setUser(u);
        // Apply saved theme favicon on login
        const saved = localStorage.getItem("tp_theme") || "GHOST MODE";
        applyFavicon(saved);
      } else {
        setUser(null);
        resetFavicon(); // back to default on logout
      }
      setAuthLoading(false);
    });
  }, []);

  const isAdmin = user && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  const handleEndSession = () => {
    if (!window.confirm("End the session? This will finalize all stats.")) return;
    socket.emit("end-session", { roomId: roomIdRef.current, uid: userRef.current?.uid });
  };
  const handleLeaveSession = () => {
    if (!window.confirm("Leave the session? Your stats so far will be saved.")) return;
    socket.emit("leave-session", { roomId: roomIdRef.current, uid: userRef.current?.uid });
    doBackToHome();
  };
  const doBackToHome = () => {
    setSocketRoom(null, null, null);
    setRoomId(null); setRoom(null); setRoundState(null);
    setSettlementData(null); setSessionData(null);
    socket.disconnect(); setScreen("home");
  };
  const enterRoom = (id, r) => {
    setRoomId(id); setRoom(r);
    if (user) setSocketRoom(id, user.uid, user.displayName);
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", fontSize: 40 }}>🃏</div>
  );

  const wrap = { minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" };

  if (!user) return <div style={wrap}><Login onLogin={(u) => { setUser(u); setScreen("home"); }} /></div>;

  return (
    <div style={wrap}>
      <FaviconSync />
      {screen === "home"               && <Home user={user} onCreateRoom={() => setScreen("create")} onJoinRoom={() => setScreen("join")} onLeaderboard={() => setScreen("leaderboard")} onProfile={() => setScreen("profile")} onAdmin={isAdmin ? () => setScreen("admin") : null} />}
      {screen === "profile"            && <Profile user={user} onBack={() => setScreen("home")} onUpdated={(u) => setUser(p => ({ ...p, ...u }))} />}
      {screen === "admin"   && isAdmin && <Admin user={user} onBack={() => setScreen("home")} />}
      {screen === "create"             && <CreateRoom user={user} onBack={() => setScreen("home")} onRoomCreated={(id, r) => { enterRoom(id, r); setScreen("lobby"); }} />}
      {screen === "join"               && <JoinRoom user={user} onBack={() => setScreen("home")} onRoomJoined={(id, r) => { enterRoom(id, r); setScreen("lobby"); }} />}
      {screen === "lobby"              && <Lobby user={user} roomId={roomId} room={room} onBack={doBackToHome} onGameStart={(r, rs) => { setRoom(r); setRoundState(rs); setScreen("game"); }} />}
      {screen === "game"               && <Game user={user} roomId={roomId} room={room} roundState={roundState} onRoundEnd={(data) => { setSettlementData(data); setScreen("settlement"); }} onEndSession={handleEndSession} />}
      {screen === "settlement"         && <Settlement user={user} roomId={roomId} room={room} settlementData={settlementData} onEndSession={handleEndSession} onLeaveSession={handleLeaveSession} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "leaderboard"        && <Leaderboard onBack={() => setScreen(room ? "settlement" : "home")} />}
      {screen === "session-leaderboard" && sessionData && <SessionLeaderboard sessionData={sessionData} onDone={doBackToHome} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
