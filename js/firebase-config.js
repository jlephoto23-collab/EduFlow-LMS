// ============================================================
// LIVE MODE: paste your Firebase web app config below.
// Create a free project at https://console.firebase.google.com
// Enable Authentication > Email/Password and Cloud Firestore.
// ============================================================

export const firebaseConfig = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_PROJECT.firebaseapp.com",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_PROJECT.appspot.com",
  // messagingSenderId: "...",
  // appId: "...",
};

/** True when a real projectId is set */
export function isFirebaseEnabled() {
  return Boolean(firebaseConfig && firebaseConfig.projectId);
}
