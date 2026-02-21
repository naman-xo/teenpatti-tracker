import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// Auth
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// Save/get player profile
export const savePlayer = async (uid, name, photoURL) => {
  await setDoc(doc(db, "players", uid), { uid, name, photoURL: photoURL || "" }, { merge: true });
};

export const getPlayer = async (uid) => {
  const snap = await getDoc(doc(db, "players", uid));
  return snap.exists() ? snap.data() : null;
};

// Save round result after each round ends
export const saveRound = async (roomId, roundData) => {
  await addDoc(collection(db, "rounds"), { roomId, ...roundData, savedAt: Date.now() });
};

// Save room metadata when created
export const saveRoom = async (roomId, roomData) => {
  await setDoc(doc(db, "rooms", roomId), roomData);
};

// Get all rounds for leaderboard calculation
export const getPlayerRounds = async (uid) => {
  const q = query(collection(db, "rounds"), where(`results.${uid}`, "!=", null));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};
