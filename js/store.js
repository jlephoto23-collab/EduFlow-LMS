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
        { id: 'pm_a1', title: 'Summative assignment: Mini project plan', type: 'assignment', order: 6, moduleNum: 2, body: 'Submit goal, 5+ tasks, owners, one risk. Include full name in filename. For remediation use "YourName - Remediation".', assignmentId: 'asg_pm1' },
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
        { id: 'gm_g1', title: 'Learner guide: Managing people and work', type: 'guide', order: 1, moduleNum: 1, body: 'Management is about planning, organising, leading and controlling resources to achieve goals.' },
        { id: 'gm_m1', title: 'Module 1: Leadership basics', type: 'content', order: 2, moduleNum: 1, body: 'Leadership styles and when to use them.' },
        { id: 'gm_q1', title: 'Formative: Leadership', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'A leader who involves the team in decisions is using:', options: ['Autocratic', 'Democratic', 'Laissez-faire only', 'None'], correctIndex: 1 },
        ]}},
        { id: 'gm_a1', title: 'Summative: Team plan', type: 'assignment', order: 4, moduleNum: 1, body: 'Describe a team goal and how you will lead the team.', assignmentId: 'asg_gm1' },
      ],
    },
    {
      id: 'c_ba4', title: 'Business Administration Services (NQF Level 4)', nqfLevel: 4, credits: 140,
      saqaId: '61595', programme: 'Business Administration', feeZAR: 4000,
      description: 'Office administration and support skills.',
      lessons: [
        { id: 'ba_g1', title: 'Learner guide: Office systems', type: 'guide', order: 1, moduleNum: 1, body: 'Effective filing, communication and customer service.' },
        { id: 'ba_m1', title: 'Module 1: Records and communication', type: 'content', order: 2, moduleNum: 1, body: 'Keep accurate records and professional communication.' },
        { id: 'ba_q1', title: 'Formative: Admin basics', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'Good customer service includes:', options: ['Ignoring complaints', 'Listening and resolving issues', 'Only email', 'None'], correctIndex: 1 },
        ]}},
        { id: 'ba_a1', title: 'Summative: Process document', type: 'assignment', order: 4, moduleNum: 1, body: 'Document one office process step by step.', assignmentId: 'asg_ba1' },
      ],
    },
  ];
}

function runMinimalSeed() {
  const users = [
    { id: 'u_admin', name: 'Admin Trainer', email: 'admin@eduflow.test', password: 'admin123', role: 'trainer', gmail: 'admin@eduflow.test', status: 'approved' },
    { id: 'u_trainer', name: 'Facilitator Demo', email: 'facilitator@eduflow.test', password: 'facil123', role: 'trainer', gmail: 'facilitator@eduflow.test', status: 'approved' },
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@gmail.com', password: 'learner123', role: 'learner', gmail: 'learner1@gmail.com', status: 'approved' },
    { id: 'u_pending', name: 'Thabo Applicant', email: 'thabo.apply@gmail.com', password: 'pending123', role: 'learner', gmail: 'thabo.apply@gmail.com', status: 'pending' },
  ];
  save(KEYS.users, users, { silent: true });
  save(KEYS.courses, defaultCourses(), { silent: true });
  save(KEYS.enrolments, [
    { id: 'enr1', learnerId: 'u_l1', courseId: 'c_pm4', status: 'approved', paymentStatus: 'paid', appliedAt: new Date().toISOString(), approvedAt: new Date().toISOString() },
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
    // Ensure admin still exists
    if (!users.some(u => u.email === 'admin@eduflow.test')) {
      users.unshift({ id: 'u_admin', name: 'Admin Trainer', email: 'admin@eduflow.test', password: 'admin123', role: 'trainer', gmail: 'admin@eduflow.test', status: 'approved' });
      save(KEYS.users, users, { silent: true });
    }
    return;
  }
  runMinimalSeed();
}
