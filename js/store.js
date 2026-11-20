const KEYS = {
  users: 'ef_users',
  session: 'ef_session',
  courses: 'ef_courses',
  enrolments: 'ef_enrolments',
  progress: 'ef_progress',
  attempts: 'ef_attempts',
  submissions: 'ef_submissions',
  messages: 'ef_messages',
  attendance: 'ef_attendance',
  sessions: 'ef_sessions',
  certificates: 'ef_certificates',
  payments: 'ef_payments',
};

const CHANNEL = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('eduflow_live') : null;

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value, opts = {}) {
  localStorage.setItem(key, JSON.stringify(value));
  if (!opts.silent && CHANNEL) {
    try { CHANNEL.postMessage({ type: 'change', key }); } catch (_) {}
  }
}

export function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function onLiveChange(fn) {
  if (!CHANNEL) return () => {};
  const handler = (e) => fn(e.data);
  CHANNEL.addEventListener('message', handler);
  return () => CHANNEL.removeEventListener('message', handler);
}

export function getLiveMode() {
  return !!CHANNEL;
}

function defaultCourses() {
  const quiz = (id, title, q) => ({
    id, title, type: 'quiz', moduleNum: 1,
    quiz: { passMark: 70, questions: q },
  });
  const guide = (id, title, body, mod) => ({ id, title, type: 'guide', body, moduleNum: mod || 1 });
  const content = (id, title, body, mod) => ({ id, title, type: 'content', body, moduleNum: mod || 1 });
  const assignment = (id, title, body, assignmentId, mod) => ({
    id, title, type: 'assignment', body, assignmentId, moduleNum: mod || 1,
  });

  const pmLessons = [
    guide('pm_g1', 'Learner guide — Project life cycle', 'Introduction to project phases: initiate, plan, execute, close.', 1),
    content('pm_c1', 'Project life cycle overview', 'Projects move through defined stages. Document scope, stakeholders and risks.', 1),
    quiz('pm_q1', 'Formative assessment: Project basics', [
      { q: 'Which is a project phase?', options: ['Ignore scope', 'Initiate', 'Skip risks', 'Avoid close'], correctIndex: 1 },
    ]),
    assignment('pm_a1', 'Summative: Project charter', 'Prepare a short project charter for a workplace improvement project. Upload knowledge and practical evidence.', 'asg_pm1', 1),
    guide('pm_g2', 'Module 2 — Stakeholders', 'Identify and manage stakeholders.', 2),
    content('pm_c2', 'Stakeholder mapping', 'List interest and influence. Plan communication.', 2),
    quiz('pm_q2', 'Formative: Stakeholders', [
      { q: 'A stakeholder is someone who:', options: ['Is never affected', 'Has interest in the project', 'Only funds IT', 'Avoids meetings'], correctIndex: 1 },
    ]),
    assignment('pm_a2', 'Summative: Stakeholder register', 'Build a stakeholder register and communication plan. Upload evidence.', 'asg_pm2', 2),
    guide('pm_g3', 'Module 3 — Risk', 'Identify, analyse and respond to risks.', 3),
    content('pm_c3', 'Risk register basics', 'Likelihood × impact. Mitigate, accept, transfer or avoid.', 3),
    quiz('pm_q3', 'Formative: Risk', [
      { q: 'Risk response options include:', options: ['Only ignore', 'Mitigate and accept', 'Delete the project', 'Hide issues'], correctIndex: 1 },
    ]),
    assignment('pm_a3', 'Summative: Risk register', 'Create a risk register for your project. Upload knowledge and practical evidence.', 'asg_pm3', 3),
  ];

  const gmLessons = [
    guide('gm_g1', 'Learner guide — Team leadership', 'Lead teams ethically and effectively.', 1),
    content('gm_c1', 'Module 1: Team leader role', 'Allocate tasks, monitor performance, model values.', 1),
    quiz('gm_q1', 'Formative assessment: Team leadership', [
      { q: 'A team leader should:', options: ['Ignore conflict', 'Support and guide the team', 'Do all work alone', 'Avoid reporting'], correctIndex: 1 },
    ]),
    assignment('gm_a1', 'Summative: Leadership reflection', 'Describe a team situation and how you applied leadership principles. Upload evidence.', 'asg_gm1', 1),
    guide('gm_g2', 'Module 2 — Communication', 'Clear workplace communication.', 2),
    content('gm_c2', 'Meeting and feedback skills', 'Agenda, minutes, constructive feedback.', 2),
    quiz('gm_q2', 'Formative: Communication', [
      { q: 'Effective feedback is:', options: ['Personal attacks', 'Specific and constructive', 'Only negative', 'Delayed forever'], correctIndex: 1 },
    ]),
    assignment('gm_a2', 'Summative: Communication plan', 'Draft a team communication plan. Upload evidence.', 'asg_gm2', 2),
    guide('gm_g3', 'Module 3 — Performance', 'Monitor and improve performance.', 3),
    content('gm_c3', 'Performance conversations', 'Set goals, review progress, support improvement.', 3),
    quiz('gm_q3', 'Formative: Performance', [
      { q: 'Performance goals should be:', options: ['Vague', 'SMART', 'Secret', 'Impossible'], correctIndex: 1 },
    ]),
    assignment('gm_a3', 'Summative: Performance review', 'Prepare a sample performance review conversation plan. Upload evidence.', 'asg_gm3', 3),
  ];

  const baLessons = [
    guide('ba_g1', 'Learner guide — Office admin', 'Support business administration processes.', 1),
    content('ba_c1', 'Module 1: Records management', 'File, retrieve and protect information.', 1),
    quiz('ba_q1', 'Formative: Records', [
      { q: 'Records should be:', options: ['Thrown away randomly', 'Organised and retrievable', 'Never backed up', 'Shared with everyone'], correctIndex: 1 },
    ]),
    assignment('ba_a1', 'Summative: Filing system', 'Design a simple filing system for a small office. Upload evidence.', 'asg_ba1', 1),
    guide('ba_g2', 'Module 2 — Customer service', 'Professional service standards.', 2),
    content('ba_c2', 'Handling enquiries', 'Listen, clarify, resolve or escalate.', 2),
    quiz('ba_q2', 'Formative: Service', [
      { q: 'Good customer service includes:', options: ['Ignoring calls', 'Clear and respectful communication', 'Blaming the client', 'No follow-up'], correctIndex: 1 },
    ]),
    assignment('ba_a2', 'Summative: Service scenario', 'Respond to a customer complaint scenario. Upload evidence.', 'asg_ba2', 2),
    guide('ba_g3', 'Module 3 — Workplace admin', 'Diaries, meetings and basic reports.', 3),
    content('ba_c3', 'Meeting support', 'Prepare agenda, take notes, action list.', 3),
    quiz('ba_q3', 'Formative: Meetings', [
      { q: 'A meeting agenda should:', options: ['Be optional always', 'List topics and time', 'Hide the purpose', 'Exclude actions'], correctIndex: 1 },
    ]),
    assignment('ba_a3', 'Summative: Meeting pack', 'Prepare a sample agenda and minutes template. Upload evidence.', 'asg_ba3', 3),
  ];

  return [
    { id: 'c_pm4', title: 'Project Management NQF 4', programme: 'Project Management', description: 'Plan and support projects in the workplace.', nqfLevel: 4, credits: 136, saqaId: '50080', feeZAR: 4500, lessons: pmLessons },
    { id: 'c_gm4', title: 'Generic Management NQF 4', programme: 'Generic Management', description: 'Lead teams and improve workplace performance.', nqfLevel: 4, credits: 150, saqaId: '57712', feeZAR: 4200, lessons: gmLessons },
    { id: 'c_ba4', title: 'Business Administration NQF 4', programme: 'Business Administration', description: 'Support office and business administration processes.', nqfLevel: 4, credits: 140, saqaId: '61595', feeZAR: 4000, lessons: baLessons },
  ];
}

function applyMidLevelData() {
  if (!load(KEYS.sessions, null)) save(KEYS.sessions, [], { silent: true });
  if (!load(KEYS.certificates, null)) save(KEYS.certificates, [], { silent: true });
  if (!load(KEYS.payments, null)) save(KEYS.payments, [], { silent: true });
  if (!load(KEYS.attendance, null)) save(KEYS.attendance, [], { silent: true });

  // Ensure demo learner Aisha has one approved programme (for Pay + modules)
  (function ensureDemoLearnerEnrolment() {
    const users = load(KEYS.users, []);
    const aisha = users.find((u) => u.email === 'learner1@gmail.com' || u.id === 'u_l1');
    if (!aisha) return;
    let enrolments = load(KEYS.enrolments, []);
    const mine = enrolments.filter((e) => e.learnerId === aisha.id && e.status === 'approved');
    if (!mine.length) {
      enrolments = enrolments.filter((e) => !(e.learnerId === aisha.id && e.status === 'approved'));
      enrolments.push({
        id: 'e1',
        courseId: 'c_pm4',
        learnerId: aisha.id,
        status: 'approved',
        paymentStatus: 'unpaid',
        enrolledAt: new Date().toISOString(),
      });
      save(KEYS.enrolments, enrolments, { silent: true });
    } else {
      let changed = false;
      enrolments.forEach((e) => {
        if (e.learnerId === aisha.id && e.status === 'approved' && !e.paymentStatus) {
          e.paymentStatus = 'unpaid';
          changed = true;
        }
      });
      if (changed) save(KEYS.enrolments, enrolments, { silent: true });
    }
  })();

  const users = load(KEYS.users, []);
  if (users.length && !users.some((u) => u.email === 'facilitator@eduflow.test')) {
    users.push({ id: 'u_fac', name: 'Facilitator Dlamini', email: 'facilitator@eduflow.test', password: 'facil123', role: 'facilitator', gmail: 'facilitator@eduflow.test', status: 'approved' });
    save(KEYS.users, users, { silent: true });
  }

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
        hostName: 'Facilitator Dlamini' };
    };
    sessions = [
      mk(1, 9, 'sess1', 'c_pm4', 'PM virtual class — Project charter', '12345678901'),
      mk(2, 14, 'sess2', 'c_gm4', 'Generic Management — Team leadership', '23456789012'),
      mk(3, 10, 'sess3', 'c_ba4', 'Business Admin — Records workshop', '34567890123'),
    ];
    save(KEYS.sessions, sessions, { silent: true });
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

export { KEYS };
