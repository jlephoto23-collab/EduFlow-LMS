/**
 * EduFlow data store — NQF-aligned pilot programmes.
 * Mid-level LMS: payments, Zoom sessions, certificates, roles.
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
  sessions: 'ef_sessions',
  certificates: 'ef_certificates',
  payments: 'ef_payments',
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

function applyMidLevelData() {
  if (!load(KEYS.sessions, null)) save(KEYS.sessions, [], { silent: true });
  if (!load(KEYS.certificates, null)) save(KEYS.certificates, [], { silent: true });
  if (!load(KEYS.payments, null)) save(KEYS.payments, [], { silent: true });
  if (!load(KEYS.attendance, null)) save(KEYS.attendance, [], { silent: true });

  const users = load(KEYS.users, []);
  if (users.length && !users.some((u) => u.id === 'u_fac' || u.email === 'facilitator@eduflow.test')) {
    users.push({
      id: 'u_fac',
      name: 'Facilitator Dlamini',
      email: 'facilitator@eduflow.test',
      password: 'facil123',
      role: 'facilitator',
      gmail: 'facilitator@eduflow.test',
      status: 'approved',
    });
    save(KEYS.users, users, { silent: true });
  }

  const courses = load(KEYS.courses, []);
  let cChanged = false;
  courses.forEach((c) => {
    if (c.feeZAR == null) {
      c.feeZAR = c.id === 'c_pm4' ? 4500 : c.id === 'c_gm4' ? 4200 : 4000;
      cChanged = true;
    }
  });
  if (cChanged) save(KEYS.courses, courses, { silent: true });

  const enrolments = load(KEYS.enrolments, []);
  let eChanged = false;
  enrolments.forEach((e) => {
    if (!e.paymentStatus) {
      e.paymentStatus = e.status === 'approved' ? 'paid' : 'unpaid';
      eChanged = true;
    }
  });
  if (eChanged) save(KEYS.enrolments, enrolments, { silent: true });

  const sessions = load(KEYS.sessions, []);
  if (!sessions.length) {
    const start = new Date();
    start.setDate(start.getDate() + 2);
    start.setHours(10, 0, 0, 0);
    sessions.push({
      id: 'sess_demo1',
      courseId: 'c_pm4',
      title: 'Project kick-off (virtual class)',
      startsAt: start.toISOString(),
      durationMin: 90,
      zoomUrl: 'https://zoom.us/j/83019475621?pwd=EduFlowDemo',
      zoomMeetingId: '830 1947 5621',
      hostName: 'Admin Trainer',
      createdAt: new Date().toISOString(),
    });
    save(KEYS.sessions, sessions, { silent: true });
  }
}

function ensurePitchDemoData() {
  if (!load(KEYS.users, null)) return;

  applyMidLevelData();

  const settings = load('ef_settings', null);
  if (!settings) {
    save(
      'ef_settings',
      {
        providerName: 'EduFlow Training Provider',
        contactEmail: 'admin@eduflow.test',
        supportPhone: '+27 00 000 0000',
        welcomeMessage: 'Welcome to your learning programme.',
        passMarkDefault: 70,
        certificateFooter: 'Pilot certificate — not an official SETA statement of results.',
      },
      { silent: true }
    );
  }

  const apps = load(KEYS.applications, []);
  if (!apps.some((a) => a.status === 'pending')) {
    const users = load(KEYS.users, []);
    if (!users.some((u) => u.id === 'u_pending')) {
      users.push({
        id: 'u_pending',
        name: 'Thabo Applicant',
        email: 'thabo.apply@gmail.com',
        password: 'pending123',
        role: 'learner',
        gmail: 'thabo.apply@gmail.com',
        status: 'pending',
        preferredProgrammeId: 'c_pm4',
        appliedAt: new Date().toISOString(),
      });
      save(KEYS.users, users, { silent: true });
    }
    apps.push({
      id: 'app_demo1',
      userId: 'u_pending',
      name: 'Thabo Applicant',
      email: 'thabo.apply@gmail.com',
      phone: '+27 82 000 0000',
      programmeId: 'c_pm4',
      notes: 'Interested in project admin support role.',
      documents: {
        idCopy: { name: 'thabo-id.pdf', type: 'application/pdf', size: 100000, dataUrl: null, tooLarge: false },
        matric: { name: 'thabo-matric.pdf', type: 'application/pdf', size: 120000, dataUrl: null, tooLarge: false },
      },
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewNotes: '',
    });
    save(KEYS.applications, apps, { silent: true });
  }

  const subs = load(KEYS.submissions, []);
  if (!subs.some((s) => s.status === 'submitted')) {
    subs.push({
      id: 'sub_demo1',
      assignmentId: 'asg_pm1',
      courseId: 'c_pm4',
      learnerId: 'u_l1',
      text: 'Goal: Roll out a simple inventory checklist for the workshop store within 4 weeks.',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      score: null,
      feedback: '',
      attachments: {
        knowledge: { name: 'mini-project-plan.pdf', type: 'application/pdf', size: 48200, dataUrl: null, tooLarge: false },
        practical: { name: 'checklist-draft.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 31800, dataUrl: null, tooLarge: false },
      },
    });
    save(KEYS.submissions, subs, { silent: true });
  }
}

export async function seedIfNeeded() {
  const ver = load('ef_seed_ver', 0);
  const hasUsers = !!load(KEYS.users, null);

  // Existing installs: apply mid-level LMS data automatically
  if (hasUsers) {
    if (ver < 10) {
      applyMidLevelData();
      save('ef_seed_ver', 10, { silent: true });
    }
    ensurePitchDemoData();
    return;
  }

  // Fresh install
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('ef_settings');

  const { runFullSeed } = await import('./seed-data.js');
  runFullSeed(save, KEYS);
  applyMidLevelData();
  save('ef_seed_ver', 10, { silent: true });
}
