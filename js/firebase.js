/**
 * Firebase integration for EduFlow LMS
 * Loaded only when firebase-config.js has a projectId.
 * Uses Firebase JS SDK v10 via CDN ESM imports.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import { firebaseConfig, isFirebaseEnabled } from './firebase-config.js';

let app = null;
let auth = null;
let db = null;
let unsubscribers = [];

export function initFirebase() {
  if (!isFirebaseEnabled()) return false;
  if (app) return true;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  return true;
}

export function getFirebaseAuth() {
  return auth;
}

export function getDb() {
  return db;
}

export async function fbLogin(email, password) {
  initFirebase();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(cred.user.uid);
  return {
    id: cred.user.uid,
    email: cred.user.email,
    name: profile?.name || email.split('@')[0],
    role: profile?.role || 'learner',
  };
}

export async function fbRegisterLearner(name, email, password) {
  initFirebase();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    role: 'learner',
    createdAt: serverTimestamp(),
  });
  return {
    id: cred.user.uid,
    email,
    name,
    role: 'learner',
  };
}

export async function fbLogout() {
  if (auth) await signOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function watchCollection(name, callback) {
  initFirebase();
  const unsub = onSnapshot(collection(db, name), (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(rows);
  });
  unsubscribers.push(unsub);
  return unsub;
}

export function stopAllWatchers() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
}

export async function listCollection(name) {
  initFirebase();
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function upsertDoc(col, id, data) {
  initFirebase();
  await setDoc(doc(db, col, id), data, { merge: true });
}

export async function addToCollection(col, data) {
  initFirebase();
  const ref = await addDoc(collection(db, col), data);
  return ref.id;
}

export async function patchDoc(col, id, data) {
  initFirebase();
  await updateDoc(doc(db, col, id), data);
}

export async function removeDoc(col, id) {
  initFirebase();
  await deleteDoc(doc(db, col, id));
}

/**
 * Seed sample LMS data into Firestore (run once as trainer / admin).
 * Creates demo users in Auth only if you create them manually in Console,
 * or register via the app. Courses/enrolments are written to Firestore.
 */
export async function seedFirestoreSample() {
  initFirebase();
  const coursesSnap = await getDocs(collection(db, 'courses'));
  if (!coursesSnap.empty) return { seeded: false, reason: 'courses already exist' };

  const courses = [
    {
      id: 'c1',
      title: 'Workplace Safety Essentials',
      description: 'Core health and safety practices. Lessons, quiz and written assignment.',
      category: 'Compliance',
      trainerId: 'trainer',
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to workplace safety',
          type: 'content',
          order: 1,
          body: 'Safety starts with awareness. Every worker shares responsibility for a safe environment.',
        },
        {
          id: 'l2',
          title: 'Hazard identification',
          type: 'content',
          order: 2,
          body: 'Spot common hazards and report them early. Use correct PPE.',
        },
        {
          id: 'l3',
          title: 'Safety knowledge check',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'Who is responsible for workplace safety?',
                options: ['Only managers', 'Only the safety officer', 'Everyone at work', 'Visitors only'],
                correctIndex: 2,
              },
              {
                q: 'What should you do when you see a hazard?',
                options: ['Ignore it', 'Report it and keep others safe', 'Fix only electrical issues', 'Wait'],
                correctIndex: 1,
              },
            ],
          },
        },
        {
          id: 'l4',
          title: 'Safety reflection assignment',
          type: 'assignment',
          order: 4,
          body: 'Describe one workplace hazard and how you would control it (min 3 sentences).',
          assignmentId: 'a1',
        },
      ],
    },
    {
      id: 'c2',
      title: 'Customer Service Basics',
      description: 'Professional service skills with quiz and submission.',
      category: 'Soft skills',
      trainerId: 'trainer',
      lessons: [
        {
          id: 'l5',
          title: 'First impressions',
          type: 'content',
          order: 1,
          body: 'Greeting, body language and clear communication set the tone.',
        },
        {
          id: 'l6',
          title: 'Service quiz',
          type: 'quiz',
          order: 2,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'Best first step with an upset customer?',
                options: ['Argue', 'Listen and acknowledge', 'Transfer immediately', 'Offer discount only'],
                correctIndex: 1,
              },
            ],
          },
        },
        {
          id: 'l7',
          title: 'Complaint response assignment',
          type: 'assignment',
          order: 3,
          body: 'Write a professional reply to a complaint about delayed service.',
          assignmentId: 'a2',
        },
      ],
    },
  ];

  for (const c of courses) {
    const { id, ...data } = c;
    await setDoc(doc(db, 'courses', id), data);
  }

  await setDoc(doc(db, 'assignments', 'a1'), {
    courseId: 'c1',
    lessonId: 'l4',
    title: 'Safety reflection assignment',
    instructions: 'Describe one workplace hazard and how you would control it.',
    maxScore: 100,
  });
  await setDoc(doc(db, 'assignments', 'a2'), {
    courseId: 'c2',
    lessonId: 'l7',
    title: 'Complaint response assignment',
    instructions: 'Write a professional reply to a delayed-service complaint.',
    maxScore: 100,
  });

  return { seeded: true };
}

/**
 * Example Firestore security rules (Console > Firestore > Rules).
 * Tighten before production.
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     function signedIn() { return request.auth != null; }
 *     function isTrainer() {
 *       return signedIn() &&
 *         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'trainer';
 *     }
 *     match /users/{userId} {
 *       allow read: if signedIn();
 *       allow write: if signedIn() && (request.auth.uid == userId || isTrainer());
 *     }
 *     match /courses/{id} {
 *       allow read: if signedIn();
 *       allow write: if isTrainer();
 *     }
 *     match /enrolments/{id} {
 *       allow read: if signedIn();
 *       allow create: if signedIn();
 *       allow update, delete: if isTrainer() ||
 *         (signedIn() && resource.data.learnerId == request.auth.uid);
 *     }
 *     match /progress/{id} {
 *       allow read: if signedIn();
 *       allow write: if signedIn();
 *     }
 *     match /assignments/{id} {
 *       allow read: if signedIn();
 *       allow write: if isTrainer();
 *     }
 *     match /submissions/{id} {
 *       allow read: if signedIn();
 *       allow create: if signedIn();
 *       allow update: if isTrainer() ||
 *         (signedIn() && resource.data.learnerId == request.auth.uid);
 *     }
 *     match /attempts/{id} {
 *       allow read: if signedIn();
 *       allow create: if signedIn();
 *     }
 *   }
 * }
 */
