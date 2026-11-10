/**
 * ============================================================
 * FIREBASE CONFIG — EduFlow LMS
 * ============================================================
 *
 * SETUP (about 10 minutes)
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project (e.g. "eduflow-lms")
 * 3. Add a Web app (</> icon) — copy the firebaseConfig object
 * 4. Build > Authentication > Sign-in method > enable Email/Password
 * 5. Build > Firestore Database > Create database
 *    - Start in test mode for the pilot (lock rules before production)
 * 6. Paste your config values below (uncomment and fill every field)
 * 7. Commit / push this file, then hard-refresh the live site
 *
 * When projectId is set, EduFlow uses Cloud Firestore + Auth.
 * When empty, EduFlow uses localStorage + live tab-sync (demo mode).
 * ============================================================
 */

export const firebaseConfig = {
  // apiKey: "AIza...",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123456789:web:abc",
};

/** True when a real projectId is configured */
export function isFirebaseEnabled() {
  return Boolean(firebaseConfig && firebaseConfig.projectId);
}

/**
 * Suggested Firestore collections (created automatically by the app):
 *
 *   users/{userId}          { name, email, role, createdAt }
 *   courses/{courseId}      { title, description, category, trainerId, lessons[] }
 *   enrolments/{id}         { courseId, learnerId, status, enrolledAt }
 *   progress/{id}           { learnerId, courseId, completedLessonIds[], percent }
 *   assignments/{id}        { courseId, lessonId, title, instructions, maxScore }
 *   submissions/{id}        { assignmentId, courseId, learnerId, text, status, score }
 *   attempts/{id}           { learnerId, courseId, lessonId, score, passed, at }
 *
 * Auth: Firebase Authentication (email/password).
 * Passwords are NOT stored in Firestore — only in Auth.
 */
