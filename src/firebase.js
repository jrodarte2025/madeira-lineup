import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// =============================================================
// TODO: Replace these values with your Firebase web app config.
// Firebase Console → Project Settings → Your Apps → Web app
// =============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAH8wCDYl7d751nr-mpW6_WOGJfIRtyXmI",
  authDomain: "madeira-fc-lineups.firebaseapp.com",
  projectId: "madeira-fc-lineups",
  storageBucket: "madeira-fc-lineups.firebasestorage.app",
  messagingSenderId: "275318113105",
  appId: "1:275318113105:web:10c66108571df4a1588970",
  measurementId: "G-3XPY82HK3K",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PUBLISHED_DOC = doc(db, "lineups", "published");

export async function loadPublishedLineup() {
  try {
    const snap = await getDoc(PUBLISHED_DOC);
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.warn("Failed to load published lineup:", err);
    return null;
  }
}

export async function savePublishedLineup({ formation, lineups, inactiveIds, roster, name }) {
  try {
    await setDoc(PUBLISHED_DOC, {
      formation,
      lineups,
      inactiveIds,
      roster,
      name: name || "",
      savedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to publish lineup:", err);
    return false;
  }
}
