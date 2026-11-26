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
      id: 'c_euc3',
      title: 'End User Computing',
      nqfLevel: 3,
      credits: 130,
      saqaId: '61591',
      programme: 'End User Computing NQF Level 3',
      feeZAR: 8500,
      description: 'Foundational computer skills for the workplace: MS Office, internet, email, and file management.',
      lessons: [
        { id: 'euc_g1', title: 'Learner guide: Working with a PC', type: 'guide', order: 1, moduleNum: 1, body: 'Hardware, software, and safe use of computers in a South African workplace context.' },
        { id: 'euc_m1', title: 'Module 1: Word processing', type: 'content', order: 2, moduleNum: 1, body: 'Create, format and save business documents. Use styles, tables and page layout for professional letters and reports.' },
        { id: 'euc_q1', title: 'Formative: Computer basics', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'Which application is best for a formal letter to a SETA?', options: ['Spreadsheet', 'Word processor', 'Presentation tool', 'Database only'], correctIndex: 1 },
          { q: 'A strong workplace password should be:', options: ['Your ID number', 'Long, unique and not shared', 'Written on the monitor', 'The same for all systems'], correctIndex: 1 },
        ]}},
        { id: 'euc_a1', title: 'Summative: Business document pack', type: 'assignment', order: 4, moduleNum: 2, body: 'Submit a one-page formal letter and a simple invoice layout (PDF or images). Show clear formatting.', assignmentId: 'asg_euc1' },
      ],
    },
    {
      id: 'c_pm4',
      title: 'Further Education and Training Certificate: Project Management',
      nqfLevel: 4,
      credits: 136,
      saqaId: '50080',
      programme: 'Project Management NQF Level 4',
      feeZAR: 12500,
      description: 'Plan, support and monitor workplace projects in line with South African project practice.',
      lessons: [
        { id: 'pm_g1', title: 'Learner guide: What is a project?', type: 'guide', order: 1, moduleNum: 1, body: 'A project is a temporary effort with a clear start and end, delivering a unique product or result.' },
        { id: 'pm_m1', title: 'Module 1: Project life cycle', type: 'content', order: 2, moduleNum: 1, body: 'Phases: initiation, planning, execution, monitoring and control, and closure. Document risks and stakeholders early.' },
        { id: 'pm_q1', title: 'Formative assessment: Project basics', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'A project is best described as:', options: ['Ongoing operations', 'A temporary effort with a unique outcome', 'Only construction work', 'Any team meeting'], correctIndex: 1 },
          { q: 'Which document lists risks and responses?', options: ['Attendance register', 'Risk register', 'Payslip', 'Tax invoice only'], correctIndex: 1 },
        ]}},
        { id: 'pm_a1', title: 'Summative assignment: Mini project plan', type: 'assignment', order: 4, moduleNum: 2, body: 'Submit a mini project plan: goal, at least five tasks with owners, timeline, and one risk with a mitigation action.', assignmentId: 'asg_pm1' },
      ],
    },
    {
      id: 'c_its5',
      title: 'National Certificate: IT Systems Development',
      nqfLevel: 5,
      credits: 131,
      saqaId: '48872',
      programme: 'IT Systems Development NQF Level 5',
      feeZAR: 18500,
      description: 'Analyse requirements and contribute to systems development in an ICT environment.',
      lessons: [
        { id: 'its_g1', title: 'Learner guide: Systems development overview', type: 'guide', order: 1, moduleNum: 1, body: 'From business need to working software: requirements, design, build, test and deploy.' },
        { id: 'its_m1', title: 'Module 1: Requirements gathering', type: 'content', order: 2, moduleNum: 1, body: 'Interview stakeholders, document functional requirements, and prioritise with MoSCoW (Must, Should, Could, Won\'t).' },
        { id: 'its_q1', title: 'Formative: Requirements', type: 'quiz', order: 3, moduleNum: 1, quiz: { passMark: 70, questions: [
          { q: 'A functional requirement describes:', options: ['Server brand only', 'What the system must do for users', 'Office furniture', 'Payroll tax rates only'], correctIndex: 1 },
        ]}},
        { id: 'its_a1', title: 'Summative: Requirements brief', type: 'assignment', order: 4, moduleNum: 2, body: 'Write a one-page requirements brief for a simple learner attendance app (purpose, users, three must-have features).', assignmentId: 'asg_its1' },
      ],
    },
  ];
}

function defaultUsers() {
  return [
    { id: 'u_admin', name: 'Nomsa Khumalo', email: 'admin@eduflow.test', password: 'admin123', role: 'admin', gmail: 'admin@eduflow.test', status: 'approved', emailVerified: true },
    { id: 'u_facil', name: 'Sipho Nkosi', email: 'facilitator@eduflow.test', password: 'facil123', role: 'facilitator', gmail: 'facilitator@eduflow.test', status: 'approved', emailVerified: true },
    { id: 'u_l1', name: 'Aisha Dlamini', email: 'learner1@gmail.com', password: 'learner123', role: 'learner', gmail: 'learner1@gmail.com', status: 'approved', emailVerified: true },
    { id: 'u_pend', name: 'Thabo Mokoena', email: 'thabo.apply@gmail.com', password: 'pending123', role: 'learner', gmail: 'thabo.apply@gmail.com', status: 'pending', emailVerified: true },
  ];
}

function runMinimalSeed() {
  const users = defaultUsers();
  save(KEYS.users, users, { silent: true });
  save(KEYS.courses, defaultCourses(), { silent: true });
  save(KEYS.enrolments, [
    { id: 'enr1', learnerId: 'u_l1', courseId: 'c_pm4', status: 'approved', paymentStatus: 'paid', enrolledAt: new Date().toISOString() },
  ], { silent: true });
  // Sample graded submission for facilitator demo (Competent / NYC trail)
  save(KEYS.submissions, [
    {
      id: 'sub_demo1',
      learnerId: 'u_l1',
      courseId: 'c_pm4',
      lessonId: 'pm_a1',
      assignmentId: 'asg_pm1',
      status: 'graded',
      attempt: 1,
      notes: 'First submission of mini project plan',
      fileName: 'Aisha_Dlamini_ProjectPlan.pdf',
      at: new Date().toISOString(),
      grade: 'Not Yet Competent',
      feedback: 'Add clear task owners and one measurable milestone. Resubmit for attempt 2.',
      rubricScores: { clarity: 1, content: 1, evidence: 1, presentation: 2 },
      rubricTotal: 5,
      gradedAt: new Date().toISOString(),
      gradedBy: 'u_facil',
    },
  ], { silent: true });
  save(KEYS.progress, [
    { id: 'pr1', learnerId: 'u_l1', courseId: 'c_pm4', lessonId: 'pm_g1', done: true, at: new Date().toISOString() },
    { id: 'pr2', learnerId: 'u_l1', courseId: 'c_pm4', lessonId: 'pm_m1', done: true, at: new Date().toISOString() },
  ], { silent: true });
  save(KEYS.attempts, [], { silent: true });
  save(KEYS.assignments, [], { silent: true });
  save(KEYS.applications, [], { silent: true });
  save(KEYS.messages, [], { silent: true });
  save(KEYS.attendance, [], { silent: true });
  save(KEYS.sessions, [], { silent: true });
  save(KEYS.certificates, [], { silent: true });
  save(KEYS.payments, [
    { id: 'pay1', learnerId: 'u_l1', courseId: 'c_pm4', amountZAR: 12500, status: 'paid', at: new Date().toISOString(), method: 'EFT' },
  ], { silent: true });
  save('ef_seed_ver', 13, { silent: true });
  save('ef_settings', { providerName: 'EduFlow Skills Academy', contactEmail: 'admin@eduflow.test', city: 'Johannesburg' }, { silent: true });
}

export async function seedIfNeeded() {
  const users = load(KEYS.users, null);
  const ver = load('ef_seed_ver', 0);

  // Refresh catalogue + demo names when seed is older than 13 (keeps enrolments)
  if (users && Array.isArray(users) && users.length > 0 && ver >= 10 && ver < 13) {
    save(KEYS.courses, defaultCourses(), { silent: true });
    const next = defaultUsers();
    const byEmail = Object.fromEntries(users.map((u) => [String(u.email).toLowerCase(), u]));
    next.forEach((n) => {
      const existing = byEmail[n.email.toLowerCase()];
      if (existing) {
        existing.name = n.name;
        existing.role = n.role;
        existing.status = n.status || existing.status;
        existing.password = n.password;
        existing.id = existing.id || n.id;
      } else {
        users.push(n);
      }
    });
    save(KEYS.users, users, { silent: true });
    save('ef_seed_ver', 13, { silent: true });
    return;
  }

  if (users && Array.isArray((users) && users.length > 0 && ver >= 13) {
    if (!users.some(u => u.email === 'admin@eduflow.test')) {
      users.unshift(defaultUsers()[0]);
      save(KEYS.users, users, { silent: true });
    }
    return;
  }
  runMinimalSeed();
}
