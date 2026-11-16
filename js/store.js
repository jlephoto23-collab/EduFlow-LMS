/**
 * EduFlow data store — NQF-aligned pilot programmes.
 * SAQA IDs/titles are public register references only.
 * Learning outcomes are original pilot wording — not official SAQA unit-standard text.
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
  applications: 'ef_applications',
  messages: 'ef_messages',
  attendance: 'ef_attendance',
};

const CHANNEL_NAME = 'eduflow-live';
let channel = null;
const listeners = new Set();

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (ev) => {
    if (ev.data?.type === 'ef-change') listeners.forEach((fn) => fn(ev.data));
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
  return 'tab-sync';
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
    } catch { /* ignore */ }
  }
}

export function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 11);
}

function ensurePitchDemoData() {
  if (!load(KEYS.users, null)) return;

  const settings = load('ef_settings', null);
  if (!settings) {
    save(
      'ef_settings',
      {
        providerName: 'EduFlow Training Provider',
        contactEmail: 'admin@eduflow.test',
        supportPhone: '+27 00 000 0000',
        welcomeMessage:
          'Welcome to your learning programme. Complete guides, modules and assessments to progress. Results and notices are linked to your Gmail.',
        passMarkDefault: 70,
        certificateFooter:
          'This is a demo certificate for pilot modules only — not an official SETA statement of results.',
      },
      { silent: true }
    );
  }

  if (!load(KEYS.attendance, null)) {
    save(KEYS.attendance, [], { silent: true });
  }

  const subs = load(KEYS.submissions, []);
  const hasOpenSubmission = subs.some((s) => s.status === 'submitted');
  if (!hasOpenSubmission) {
    subs.push({
      id: 'sub_demo1',
      assignmentId: 'asg_pm1',
      courseId: 'c_pm4',
      learnerId: 'u_l1',
      text:
        'Goal: Roll out a simple inventory checklist for the workshop store within 4 weeks.\n' +
        'Tasks: (1) List stock categories (2) Draft checklist template (3) Pilot with two staff (4) Collect feedback (5) Finalise and train team.\n' +
        'Owners: Store supervisor + admin assistant.\n' +
        'Risk: Staff skip the form under pressure — mitigation: 5-minute toolbox talk and supervisor sign-off.',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      score: null,
      feedback: '',
      rubricScores: null,
      history: [],
    });
    save(KEYS.submissions, subs, { silent: true });
  }

  const enrolments = load(KEYS.enrolments, []);
  if (!enrolments.some((e) => e.status === 'pending')) {
    const existsLearnerCourse = enrolments.some(
      (e) => e.learnerId === 'u_l2' && e.courseId === 'c_gm4'
    );
    if (!existsLearnerCourse) {
      enrolments.push({
        id: 'e_pending_pitch',
        courseId: 'c_gm4',
        learnerId: 'u_l2',
        status: 'pending',
        enrolledAt: new Date().toISOString(),
        documents: {
          hasDisability: false,
          idCopy: { name: 'james-id.pdf', type: 'application/pdf', size: 110000, dataUrl: null, tooLarge: false },
          matric: { name: 'james-matric.pdf', type: 'application/pdf', size: 180000, dataUrl: null, tooLarge: false },
          otherCerts: [{ name: 'first-aid.pdf', type: 'application/pdf', size: 90000, dataUrl: null, tooLarge: false }],
          disabilityNote: null,
        },
        meetsMinimum: true,
        requirementIssues: [],
        reviewNotes: '',
      });
      save(KEYS.enrolments, enrolments, { silent: true });
    }
  }
}

export async function seedIfNeeded() {
  const ver = load('ef_seed_ver', 0);
  if (ver >= 8 && load(KEYS.users, null)) {
    ensurePitchDemoData();
    return;
  }

  if (ver >= 6 && ver < 8 && load(KEYS.users, null)) {
    if (!load(KEYS.attendance, null)) save(KEYS.attendance, [], { silent: true });
    const enrolments = load(KEYS.enrolments, []);
    let changed = false;
    enrolments.forEach((e) => {
      if (!e.documents) {
        e.documents = {
          hasDisability: false,
          idCopy: { name: 'id-on-file.pdf', type: 'application/pdf', size: 100000, dataUrl: null, tooLarge: false },
          matric: { name: 'matric-on-file.pdf', type: 'application/pdf', size: 100000, dataUrl: null, tooLarge: false },
          otherCerts: [],
          disabilityNote: null,
        };
        e.meetsMinimum = true;
        changed = true;
      }
    });
    if (changed) save(KEYS.enrolments, enrolments, { silent: true });
    save('ef_seed_ver', 8, { silent: true });
    ensurePitchDemoData();
    return;
  }

  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('ef_settings');

  const { runFullSeed } = await import('./seed-data.js');
  runFullSeed(save, KEYS);
}
