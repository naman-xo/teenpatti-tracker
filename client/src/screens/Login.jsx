import { Button } from "../components/UI";
import { signInWithGoogle } from "../firebase";

export default function Login({ onLogin }) {
  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      onLogin(result.user);
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px", gap: 0 }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🃏</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 12 }}>
          Teen Patti<br /><span style={{ color: "var(--gold)" }}>Tracker</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
          Track bets, settle debts,<br />keep the game clean.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Button onClick={handleGoogle}>Continue with Google</Button>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 28 }}>
        By continuing you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}