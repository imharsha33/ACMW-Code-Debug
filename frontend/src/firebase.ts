import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDZF0xW2MOOG_7cAAtv8Za_cPXH4qpQLxo",
  authDomain: "herizon-code-debug.firebaseapp.com",
  projectId: "herizon-code-debug",
  storageBucket: "herizon-code-debug.firebasestorage.app",
  messagingSenderId: "508375561617",
  appId: "1:508375561617:web:185d7f9af8e34e48a65630",
  measurementId: "G-EZZCSBK2QM"
};

// Initialize default Firebase instance
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Force localStorage persistence on ALL browsers (fixes desktop browser cookie/ITP blocking)
// Without this, Firefox/Safari Enhanced Tracking Protection can break Firebase Auth session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not set Firebase Auth persistence:", err);
});

/**
 * Pre-seeds a student account in Firebase Auth using the REST API.
 * 
 * WHY REST API instead of createUserWithEmailAndPassword:
 *   - The SDK's createUserWithEmailAndPassword automatically signs the caller IN,
 *     which would log the admin out mid-session.
 *   - The REST API creates the account WITHOUT signing anyone in.
 *   - A single lightweight HTTP fetch (~200ms) vs initializing a full secondary
 *     Firebase App instance (was causing the 3-second lag).
 * 
 * RESULT: Students are pre-registered in Firebase Auth the moment admin adds them.
 * Their subsequent login is always a fast signInWithEmailAndPassword (~300ms) with
 * zero fallback overhead.
 */
export const seedStudentAuthViaRestApi = async (
  email: string,
  pass: string
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, returnSecureToken: false }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      // EMAIL_EXISTS means already registered — perfectly fine, treat as success
      if (data?.error?.message === "EMAIL_EXISTS") return { ok: true };
      return { ok: false, error: data?.error?.message || "REST registration failed" };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn("Auth REST pre-seed failed:", err.message);
    return { ok: false, error: err.message };
  }
};

// Export createUserWithEmailAndPassword for use in on-demand fallback login seeding
export { createUserWithEmailAndPassword };
