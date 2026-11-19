/**
 * EduFlow data store — mid-level LMS
 */
import { isFirebaseEnabled } from './firebase-config.js';

export const KEYS = {
  users: 'ef_users', session: 'ef_session', courses: 'ef_courses', enrolments: 'ef_enrolments',
  progress: 'ef_progress', attempts: 'ef_attempts', assignments: 'ef_assignments',
  submissions: 'ef_submissions', applications: 'ef_applications', messages: 'ef_messages',
  attendance: 'ef_attendance', sessions: 'ef_sessions', certificates: 'ef_certificates', payments: 'ef_payments',
};

const CHANNEL_NAME = 'eduflow-live';
let channel = null;
const listeners = new Set();
try {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (ev) => { if (ev.data?.type === 'ef-change') listeners.forEach((fn) => fn(ev.data)); };
} catch { channel = null; }

window.addEventListener('storage', (e) => {
  if (!e.key || !String(e.key).startsWith('ef_')) return;
  listeners.forEach((fn) => fn({ type: 'ef-change', key: e.key, source: 'storage' }));
});

export function onLiveChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getLiveMode() { return isFirebaseEnabled() ? 'firebase' : 'tab-sync'; }
export function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
export function save(key, value, { silent = false } = {}) {
  localStorage.setItem(key, JSON.stringify(value));
  if (!silent) { try { channel?.postMessage({ type: 'ef-change', key, at: Date.now() }); } catch {} }
}
export function uid() { return 'id_' + Math.random().toString(36).slice(2, 11); }

function defaultCourses() {
  return [
    {
      id: 'c_pm4', title: 'Project Management support (aligned to NQF pathway)', nqfLevel: 4, credits: 136,
      saqaId: '50080', programme: 'Project Management', feeZAR: 4500,
      description: 'Pilot modules for planning and supporting workplace projects.',
      lessons: [
        { id: 'pm_g1', title: 'Learner guide: What is a project?', type: 'guide', order: 1, moduleNum: 1, body: 'A project is a temporary effort with a clear start and end. Read carefully before assessments.' },
        { id: 'pm_m1', title: 'Module 1: Project life cycle', type: 'content', order: 2, moduleNum: 1, body: 'Phases: initiation, planning, execution, monitoring, closure.' },
        { id: 'pm_q1', title: 'Formative assessment: Project basics', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'A project is best described as:', options: ['Ongoing operations', 'A temporary effort with a unique outcome', 'Only construction', 'Any meeting'], correctIndex: 1 },
          { q: 'Scope means:', options: ['Budget only', 'What is included and excluded', 'Job title', 'Celebration'], correctIndex: 1 },
          { q: 'Lessons learned belong in:', options: ['Initiation', 'Planning', 'Execution', 'Closure'], correctIndex: 3 },
        ]}},
        { id: 'pm_m2', title: 'Module 2: Planning tools', type: 'content', order: 4, moduleNum: 2, body: 'Use task lists, timelines and risk notes.' },
        { id: 'pm_q2', title: 'Formative assessment: Planning tools', type: 'quiz', order: 5, moduleNum: 2, quiz: { passMark: 70, questions: [
          { q: 'A Gantt chart mainly shows:', options: ['Company profits', 'Tasks over time', 'HR policies', 'Only risks'], correctIndex: 1 },
          { q: 'A risk register is used to:', options: ['Ignore problems', 'Record and track risks', 'Replace the budget', 'Hire staff'], correctIndex: 1 },
        ]}},
        { id: 'pm_a1', title: 'Summative assignment: Mini project plan', type: 'assignment', order: 6, moduleNum: 2, body: 'Submit goal, 5+ tasks, owners, one risk.', assignmentId: 'asg_pm1' },
        { id: 'pm_m3', title: 'Module 3: Monitoring and closure', type: 'content', order: 7, moduleNum: 3, body: 'Track progress, manage change, close with lessons learned.' },
        { id: 'pm_q3', title: 'Formative assessment: Monitoring', type: 'quiz', order: 8, moduleNum: 3, quiz: { passMark: 70, questions: [
          { q: 'Monitoring compares:', options: ['Plan vs actual', 'Only budget to HR', 'Meetings to emails', 'None'], correctIndex: 0 },
          { q: 'Project closure includes:', options: ['Ignoring results', 'Lessons learned and handover', 'Starting the same work again only', 'Deleting files'], correctIndex: 1 },
        ]}},
        { id: 'pm_a2', title: 'Summative assignment: Closure report', type: 'assignment', order: 9, moduleNum: 3, body: 'Write outcomes, what went well, one improvement.', assignmentId: 'asg_pm2' },
      ],
    },
    {
      id: 'c_gm4', title: 'Generic Management (NQF Level 4)', nqfLevel: 4, credits: 150,
      saqaId: '57712', programme: 'Generic Management', feeZAR: 4200,
      description: 'Pilot programme for junior managers and supervisors.',
      lessons: [
        { id: 'gm_g1', title: 'Learner guide: Leading a team', type: 'guide', order: 1, moduleNum: 1, body: 'A team leader plans work, supports people and reports progress.' },
        { id: 'gm_m1', title: 'Module 1: Team leader role', type: 'content', order: 2, moduleNum: 1, body: 'Allocate tasks, monitor performance, model values.' },
        { id: 'gm_q1', title: 'Formative assessment: Team leadership', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [{ q: 'A team leader should:', options: ['Ignore conflict', 'Support and guide the team', 'Do all work alone', 'Avoid reporting'], correctIndex: 1 }] }},
        { id: 'gm_m2', title: 'Module 2: Motivation and communication', type: 'content', order: 4, moduleNum: 2, body: 'Clear goals, feedback and recognition improve performance.' },
        { id: 'gm_a1', title: 'Summative assignment: Team plan', type: 'assignment', order: 5, moduleNum: 2, body: 'Team goal, two actions, how you check progress.', assignmentId: 'asg_gm1' },
        { id: 'gm_m3', title: 'Module 3: Workplace problem-solving', type: 'content', order: 6, moduleNum: 3, body: 'Identify problem, facts, solution, follow up.' },
        { id: 'gm_a2', title: 'Summative assignment: Problem case', type: 'assignment', order: 7, moduleNum: 3, body: 'Problem, options, action, result.', assignmentId: 'asg_gm2' },
      ],
    },
    {
      id: 'c_ba4', title: 'Business Administration Services (NQF Level 4)', nqfLevel: 4, credits: 140,
      saqaId: '61595', programme: 'Business Administration', feeZAR: 4000,
      description: 'Pilot modules for office systems and customer support.',
      lessons: [
        { id: 'ba_g1', title: 'Learner guide: Office systems', type: 'guide', order: 1, moduleNum: 1, body: 'Office systems keep information accurate and secure.' },
        { id: 'ba_m1', title: 'Module 1: Filing and records', type: 'content', order: 2, moduleNum: 1, body: 'Consistent naming, version control, access rules.' },
        { id: 'ba_q1', title: 'Formative assessment: Records', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [{ q: 'Good filing includes:', options: ['Random folders', 'Consistent naming and structure', 'No backups', 'Sharing passwords'], correctIndex: 1 }] }},
        { id: 'ba_m2', title: 'Module 2: Professional communication', type: 'content', order: 4, moduleNum: 2, body: 'Clear, polite, purposeful emails and reports.' },
        { id: 'ba_a1', title: 'Summative assignment: Business email', type: 'assignment', order: 5, moduleNum: 2, body: 'Professional email confirming a meeting with agenda.', assignmentId: 'asg_ba1' },
        { id: 'ba_m3', title: 'Module 3: Customer support basics', type: 'content', order: 6, moduleNum: 3, body: 'Listen, clarify, resolve or escalate, record outcome.' },
        { id: 'ba_a2', title: 'Summative assignment: Customer response', type: 'assignment', order: 7, moduleNum: 3, body: 'Response to a delayed order complaint.', assignmentId: 'asg_ba2' },
      ],
    },
  ];
}

function applyMidLevelData() {
  if (!load(KEYS.sessions, null)) save(KEYS.sessions, [], { silent: true });
  if (!load(KEYS.certificates, null)) save(KEYS.certificates, [], { silent: true });
  if (!load(KEYS.payments, null)) save(KEYS.payments, [], { silent: true });
  if (!load(KEYS.attendance, null)) save(KEYS.attendance, [], { silent: true });

  const users = load(KEYS.users, []);
  if (users.length && !users.some((u) => u.email === 'facilitator@eduflow.test')) {
    users.push({ id: 'u_fac', name: 'Facilitator Dlamini', email: 'facilitator@eduflow.test', password: 'facil123', role: 'facilitator', gmail: 'facilitator@eduflow.test', status: 'approved' });
    save(KEYS.users, users, { silent: true });
  }

  // Restore or upgrade courses (modules 1–3)
  let courses = load(KEYS.courses, []);
  if (!courses.length) {
    save(KEYS.courses, defaultCourses(), { silent: true });
    courses = load(KEYS.courses, []);
  } else {
    const defs = defaultCourses();
    let changed = false;
    courses.forEach((c) => {
      if (c.feeZAR == null) {
        c.feeZAR = c.id === 'c_pm4' ? 4500 : c.id === 'c_gm4' ? 4200 : 4000;
        changed = true;
      }
      const def = defs.find((d) => d.id === c.id);
      if (def && (!c.lessons || c.lessons.length < def.lessons.length || !(c.lessons || []).some((l) => l.moduleNum === 3))) {
        c.lessons = def.lessons;
        changed = true;
      }
    });
    if (changed) save(KEYS.courses, courses, { silent: true });
  }

  let sessions = load(KEYS.sessions, []);
  if (!sessions.length || sessions.length < 3) {
    const base = new Date();
    const mk = (days, hour, id, courseId, title, meetId) => {
      const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0);
      return { id, courseId, title, startsAt: d.toISOString(), durationMin: 90,
        zoomUrl: 'https://zoom.us/j/' + meetId + '?pwd=EduFlowDemo',
        zoomMeetingId: meetId.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3'),
        hostName: 'Admin Trainer', createdAt: new Date().toISOString() };
    };
    sessions = [
      mk(1, 9, 'sess_demo1', 'c_pm4', 'Project kick-off (virtual class)', '83019475621'),
      mk(3, 14, 'sess_demo2', 'c_pm4', 'Work breakdown & scheduling workshop', '83019475622'),
      mk(5, 10, 'sess_demo3', 'c_gm4', 'Team leadership live session', '83019475623'),
      mk(7, 11, 'sess_demo4', 'c_ba4', 'Business admin practical Q&A', '83019475624'),
    ];
    save(KEYS.sessions, sessions, { silent: true });
  }

  // One approved programme only; unpaid if not approved/completed
  {
    const enrolments2 = load(KEYS.enrolments, []);
    let eChanged2 = false;
    const approvedByLearner = {};
    enrolments2.forEach((e) => {
      if (e.status !== 'approved' && e.status !== 'completed' && e.paymentStatus === 'paid') {
        e.paymentStatus = 'unpaid'; eChanged2 = true;
      }
      if (e.status === 'approved') {
        if (!approvedByLearner[e.learnerId]) approvedByLearner[e.learnerId] = [];
        approvedByLearner[e.learnerId].push(e);
      }
    });
    Object.values(approvedByLearner).forEach((list) => {
      if (list.length <= 1) return;
      list.sort((a, b) => String(a.enrolledAt || '').localeCompare(String(b.enrolledAt || '')));
      for (let i = 1; i < list.length; i++) {
        list[i].status = 'inactive'; list[i].paymentStatus = 'unpaid'; eChanged2 = true;
      }
    });
    if (eChanged2) save(KEYS.enrolments, enrolments2, { silent: true });
  }

  let certs = load(KEYS.certificates, []);
  if (!certs.some((c) => c.id === 'cert_demo1')) {
    certs.unshift({
      id: 'cert_demo1', learnerId: 'u_l1', courseId: 'c_pm4', learnerName: 'Aisha Learner',
      programmeTitle: 'Project Management', nqfLevel: 4, credits: 136, saqaId: '50080',
      issuedAt: new Date().toISOString(), certificateNo: 'EF-2026-DEMO01',
    });
    save(KEYS.certificates, certs, { silent: true });
  }
}

function ensurePitchDemoData() {
  if (!load(KEYS.users, null)) return;
  applyMidLevelData();
  if (!load('ef_settings', null)) {
    save('ef_settings', {
      providerName: 'EduFlow Training Provider', contactEmail: 'admin@eduflow.test',
      supportPhone: '+27 00 000 0000', welcomeMessage: 'Welcome to your learning programme.',
      passMarkDefault: 70, certificateFooter: 'Pilot certificate — not an official SETA statement of results.',
    }, { silent: true });
  }
}

export async function seedIfNeeded() {
  const ver = load('ef_seed_ver', 0);
  const hasUsers = !!load(KEYS.users, null);

  if (hasUsers) {
    // Always restore/upgrade courses + mid-level data
    applyMidLevelData();
    if (ver < 10) save('ef_seed_ver', 10, { silent: true });
    ensurePitchDemoData();
    return;
  }

  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('ef_settings');

  try {
    const { runFullSeed } = await import('./seed-data.js');
    runFullSeed(save, KEYS);
  } catch {
    save(KEYS.courses, defaultCourses(), { silent: true });
  }
  applyMidLevelData();
  save('ef_seed_ver', 10, { silent: true });
}
