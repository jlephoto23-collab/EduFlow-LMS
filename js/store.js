/**
 * EduFlow data store
 * - Sample data seed
 * - localStorage persistence
 * - Real-time updates across browser tabs (BroadcastChannel + storage events)
 * - Ready for Firebase (see firebase-config.js)
 */

import { isFirebaseEnabled } from './firebase-config.js';

export const KEYS = {
  users: 'ef_users',
  session: 'ef_session',
  courses: 'ef_courses',
  enrolments: 'ef_enrolments',
  progress: 'ef_progress',
  attempts: 'ef_attempts',
  assignments: 'ef_assignments',
  submissions: 'ef_submissions',
};

const CHANNEL_NAME = 'eduflow-live';
let channel = null;
const listeners = new Set();

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (ev) => {
    if (ev.data?.type === 'ef-change') {
      listeners.forEach((fn) => fn(ev.data));
    }
  };
} catch {
  channel = null;
}

window.addEventListener('storage', (e) => {
  if (!e.key || !String(e.key).startsWith('ef_')) return;
  listeners.forEach((fn) => fn({ type: 'ef-change', key: e.key, source: 'storage' }));
});

export function onLiveChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLiveMode() {
  if (isFirebaseEnabled()) return 'firebase';
  return 'tab-sync'; // real-time across tabs on same browser profile
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value, { silent = false } = {}) {
  localStorage.setItem(key, JSON.stringify(value));
  if (!silent) {
    try {
      channel?.postMessage({ type: 'ef-change', key, at: Date.now() });
    } catch {
      /* ignore */
    }
  }
}

export function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 11);
}

export function seedIfNeeded() {
  if (load(KEYS.users, null)) return;

  const trainer = {
    id: 'u_trainer',
    name: 'Thabo Trainer',
    email: 'trainer@eduflow.test',
    password: 'trainer123',
    role: 'trainer',
  };
  const learners = [
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@eduflow.test', password: 'learner123', role: 'learner' },
    { id: 'u_l2', name: 'James Molefe', email: 'learner2@eduflow.test', password: 'learner123', role: 'learner' },
    { id: 'u_l3', name: 'Naledi Khumalo', email: 'learner3@eduflow.test', password: 'learner123', role: 'learner' },
    { id: 'u_l4', name: 'Sipho Dlamini', email: 'learner4@eduflow.test', password: 'learner123', role: 'learner' },
  ];

  const courses = [
    {
      id: 'c1',
      title: 'Workplace Safety Essentials',
      description: 'Core health and safety practices. Lessons, quiz and written assignment.',
      category: 'Compliance',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to workplace safety',
          type: 'content',
          order: 1,
          body: 'Safety starts with awareness. Every worker shares responsibility for a safe environment under basic OHS principles.',
        },
        {
          id: 'l2',
          title: 'Hazard identification',
          type: 'content',
          order: 2,
          body: 'Spot common hazards: slips, electrical risks, chemicals, unsafe equipment. Report early and use correct PPE.',
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
                options: ['Ignore it if busy', 'Report it and keep others safe', 'Fix only electrical issues', 'Wait for inspection'],
                correctIndex: 1,
              },
              {
                q: 'PPE stands for:',
                options: ['Personal Protective Equipment', 'Public Protection Event', 'Primary Process Example', 'Paid Professional Employee'],
                correctIndex: 0,
              },
            ],
          },
        },
        {
          id: 'l4',
          title: 'Safety reflection assignment',
          type: 'assignment',
          order: 4,
          body: 'Write a short reflection (min 3 sentences) on one workplace hazard and how you would control it.',
          assignmentId: 'a1',
        },
      ],
    },
    {
      id: 'c2',
      title: 'Customer Service Basics',
      description: 'Professional service skills with quiz and submission.',
      category: 'Soft skills',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'l5',
          title: 'First impressions',
          type: 'content',
          order: 1,
          body: 'Greeting, body language and clear communication set the tone. Listen before you respond.',
        },
        {
          id: 'l6',
          title: 'Handling complaints',
          type: 'content',
          order: 2,
          body: 'Stay calm, acknowledge the issue, apologise where appropriate, and offer a clear next step.',
        },
        {
          id: 'l7',
          title: 'Service quiz',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'Best first step with an upset customer?',
                options: ['Argue policy', 'Listen and acknowledge', 'Transfer immediately', 'Offer discount only'],
                correctIndex: 1,
              },
              {
                q: 'Clear communication means:',
                options: ['Using jargon', 'Speaking fast', 'Simple language and confirming understanding', 'Avoiding eye contact'],
                correctIndex: 2,
              },
            ],
          },
        },
        {
          id: 'l8',
          title: 'Complaint response assignment',
          type: 'assignment',
          order: 4,
          body: 'A customer is unhappy about a delayed service. Write the reply you would give (3–6 sentences).',
          assignmentId: 'a2',
        },
      ],
    },
    {
      id: 'c3',
      title: 'Digital Skills for the Workplace',
      description: 'Email, files, and online professionalism for entry-level staff.',
      category: 'Digital',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'l9',
          title: 'Professional email',
          type: 'content',
          order: 1,
          body: 'Use a clear subject line, greeting, short paragraphs, and a professional sign-off. Proofread before sending.',
        },
        {
          id: 'l10',
          title: 'Digital skills check',
          type: 'quiz',
          order: 2,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'A good email subject line is:',
                options: ['Hello', 'Urgent!!!', 'Clear and specific about the topic', 'Empty'],
                correctIndex: 2,
              },
            ],
          },
        },
      ],
    },
  ];

  const assignments = [
    {
      id: 'a1',
      courseId: 'c1',
      lessonId: 'l4',
      title: 'Safety reflection assignment',
      instructions: 'Write a short reflection (min 3 sentences) on one workplace hazard and how you would control it.',
      maxScore: 100,
    },
    {
      id: 'a2',
      courseId: 'c2',
      lessonId: 'l8',
      title: 'Complaint response assignment',
      instructions: 'A customer is unhappy about a delayed service. Write the reply you would give (3–6 sentences).',
      maxScore: 100,
    },
  ];

  const enrolments = [
    { id: 'e1', courseId: 'c1', learnerId: 'u_l1', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e2', courseId: 'c1', learnerId: 'u_l2', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e3', courseId: 'c2', learnerId: 'u_l1', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e4', courseId: 'c2', learnerId: 'u_l3', status: 'pending', enrolledAt: new Date().toISOString() },
    { id: 'e5', courseId: 'c3', learnerId: 'u_l4', status: 'pending', enrolledAt: new Date().toISOString() },
    { id: 'e6', courseId: 'c3', learnerId: 'u_l2', status: 'approved', enrolledAt: new Date().toISOString() },
  ];

  // Sample progress so reports look alive
  const progress = [
    { learnerId: 'u_l1', courseId: 'c1', completedLessonIds: ['l1', 'l2'], percent: 50 },
    { learnerId: 'u_l2', courseId: 'c1', completedLessonIds: ['l1'], percent: 25 },
    { learnerId: 'u_l1', courseId: 'c2', completedLessonIds: ['l5'], percent: 25 },
  ];

  const submissions = [
    {
      id: 'sub_demo',
      assignmentId: 'a1',
      courseId: 'c1',
      learnerId: 'u_l2',
      text: 'One hazard in our workshop is oil on the floor near the bay. I would clean spills immediately, put up a wet-floor sign, and check that drip trays are used under vehicles.',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      score: null,
    },
  ];

  save(KEYS.users, [trainer, ...learners], { silent: true });
  save(KEYS.courses, courses, { silent: true });
  save(KEYS.enrolments, enrolments, { silent: true });
  save(KEYS.assignments, assignments, { silent: true });
  save(KEYS.submissions, submissions, { silent: true });
  save(KEYS.progress, progress, { silent: true });
  save(KEYS.attempts, [], { silent: true });
}
