/**
 * EduFlow data store — self-contained for GitHub Pages deploy
 */
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
export function getLiveMode() { return 'tab-sync'; }
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
        { id: 'pm_g1', title: 'Learner guide: What is a project?', type: 'guide', order: 1, moduleNum: 1, body: 'A project is a temporary effort with a clear start and end.' },
        { id: 'pm_m1', title: 'Module 1: Project life cycle', type: 'content', order: 2, moduleNum: 1, body: 'Phases: initiation, planning, execution, monitoring, closure.' },
        { id: 'pm_q1', title: 'Formative assessment: Project basics', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'A project is best described as:', options: ['Ongoing operations', 'A temporary effort with a unique outcome', 'Only construction', 'Any meeting'], correctIndex: 1 },
        ]}},
        { id: 'pm_a1', title: 'Summative assignment: Mini project plan', type: 'assignment', order: 4, moduleNum: 2, body: 'Submit goal, 5+ tasks, owners, one risk.', assignmentId: 'asg_pm1' },
      ],
    },
    {
      id: 'c_gm4', title: 'Generic Management (NQF Level 4)', nqfLevel: 4, credits: 150,
      saqaId: '57712', programme: 'Generic Management', feeZAR: 4200,
      description: 'Pilot programme for junior managers.',
      lessons: [
        { id: 'gm_g1', title: 'Learner guide: Managing people', type: 'guide', order: 1, moduleNum: 1, body: 'Management is planning, organising, leading and controlling.' },
        { id: 'gm_a1', title: 'Summative: Team plan', type: 'assignment', order: 2, moduleNum: 1, body: 'Describe a team goal.', assignmentId: 'asg_gm1' },
      ],
    },
    {
      id: 'c_ba4', title: 'Business Administration Services (NQF Level 4)', nqfLevel: 4, credits: 140,
      saqaId: '61595', programme: 'Business Administration', feeZAR: 4000,
      description: 'Office administration skills.',
      lessons: [
        { id: 'ba_g1', title: 'Learner guide: Office systems', type: 'guide', order: 1, moduleNum: 1, body: 'Filing, communication and customer service.' },
        { id: 'ba_a1', title: 'Summative: Process document', type: 'assignment', order: 2, moduleNum: 1, body: 'Document one office process.', assignmentId: 'asg_ba1' },
      ],
    },
  ];
}

function runMinimalSeed() {
  const users = [
    { id: 'u_admin', name: 'Admin Trainer', email: 'admin@eduflow.test', password: 'admin123', role: 'admin', gmail: 'admin@eduflow.test', status: 'approved' },
    { id: 'u_facil', name: 'Facilitator Demo', email: 'facilitator@eduflow.test', password: 'facil123', role: 'facilitator', gmail: 'facilitator@eduflow.test', status: 'approved' },
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@gmail.com', password: 'learner123', role: 'learner', gmail: 'learner1@gmail.com', status: 'approved' },
    { id: 'u_pend', name: 'Thabo Applicant', email: 'thabo.apply@gmail.com', password: 'pending123', role: 'learner', gmail: 'thabo.apply@gmail.com', status: 'pending' },
  ];
  save(KEYS.users, users, { silent: true });
  save(KEYS.courses, defaultCourses(), { silent: true });
  save(KEYS.enrolments, [
    { id: 'enr1', learnerId: 'u_l1', courseId: 'c_pm4', status: 'approved', paymentStatus: 'paid', enrolledAt: new Date().toISOString() },
  ], { silent: true });
  save(KEYS.progress, [], { silent: true });
  save(KEYS.attempts, [], { silent: true });
  save(KEYS.assignments, [], { silent: true });
  save(KEYS.submissions, [], { silent: true });
  save(KEYS.applications, [], { silent: true });
  save(KEYS.messages, [], { silent: true });
  save(KEYS.attendance, [], { silent: true });
  save(KEYS.sessions, [], { silent: true });
  save(KEYS.certificates, [], { silent: true });
  save(KEYS.payments, [], { silent: true });
  save('ef_seed_ver', 12, { silent: true });
  save('ef_settings', { providerName: 'EduFlow Training Provider', contactEmail: 'admin@eduflow.test' }, { silent: true });
}

export async function seedIfNeeded() {
  const users = load(KEYS.users, null);
  const ver = load('ef_seed_ver', 0);
  if (users && Array.isArray(users) && users.length > 0 && ver >= 10) {
    if (!users.some(u => u.email === 'admin@eduflow.test')) {
      users.unshift({ id: 'u_admin', name: 'Admin Trainer', email: 'admin@eduflow.test', password: 'admin123', role: 'admin', gmail: 'admin@eduflow.test', status: 'approved' });
      save(KEYS.users, users, { silent: true });
    }
    return;
  }
  runMinimalSeed();
}
