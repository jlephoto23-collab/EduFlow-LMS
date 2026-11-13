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
      });
      save(KEYS.enrolments, enrolments, { silent: true });
    } else {
      const row = enrolments.find((e) => e.learnerId === 'u_l2' && e.courseId === 'c_gm4');
      if (row && row.status !== 'approved' && row.status !== 'rejected') {
        row.status = 'pending';
        save(KEYS.enrolments, enrolments, { silent: true });
      }
    }
  }
}

export function seedIfNeeded() {
  const ver = load('ef_seed_ver', 0);
  if (ver >= 7 && load(KEYS.users, null)) {
    ensurePitchDemoData();
    return;
  }

  // Soft upgrade from seed 6 → 7 (pitch data) without wiping custom logins
  if (ver === 6 && load(KEYS.users, null)) {
    const settings = load('ef_settings', null) || {
      providerName: 'EduFlow Training Provider',
      contactEmail: 'admin@eduflow.test',
      supportPhone: '+27 00 000 0000',
      welcomeMessage:
        'Welcome to your learning programme. Complete guides, modules and assessments to progress. Results and notices are linked to your Gmail.',
      passMarkDefault: 70,
      certificateFooter:
        'This is a demo certificate for pilot modules only — not an official SETA statement of results.',
    };
    save('ef_settings', settings, { silent: true });

    const subs = load(KEYS.submissions, []);
    if (!subs.some((s) => s.id === 'sub_demo1' || (s.assignmentId === 'asg_pm1' && s.status === 'submitted'))) {
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
      enrolments.push({
        id: 'e2',
        courseId: 'c_gm4',
        learnerId: 'u_l2',
        status: 'pending',
        enrolledAt: new Date().toISOString(),
      });
      save(KEYS.enrolments, enrolments, { silent: true });
    }

    save('ef_seed_ver', 7, { silent: true });
    ensurePitchDemoData();
    return;
  }

  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('ef_settings');

  const trainer = {
    id: 'u_trainer',
    name: 'Admin Trainer',
    email: 'admin@eduflow.test',
    password: 'admin123',
    role: 'trainer',
    gmail: 'admin@eduflow.test',
  };

  const learners = [
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@gmail.com', password: 'learner123', role: 'learner', gmail: 'learner1@gmail.com' },
    { id: 'u_l2', name: 'James Molefe', email: 'james.molefe@gmail.com', password: 'learner123', role: 'learner', gmail: 'james.molefe@gmail.com' },
    { id: 'u_l3', name: 'Naledi Khumalo', email: 'naledi.k@gmail.com', password: 'learner123', role: 'learner', gmail: 'naledi.k@gmail.com' },
  ];

  const courses = [
    {
      id: 'c_pm4',
      title: 'Project Management support (aligned to NQF pathway)',
      nqfLevel: 4,
      credits: 136,
      saqaId: '50080',
      saqaTitle: 'FETC: Project Management (legacy reference)',
      relatedSaqaId: '101869',
      relatedSaqaNote: 'Current occupational pathway often cited: OC Project Manager NQF 5 (verify on SAQA)',
      programme: 'Project Management',
      description: 'Pilot modules for planning and supporting workplace projects. Demo content only — not a full accredited qualification pack.',
      purpose: 'Help learners clarify project goals, break work into tasks, track progress and report status in a simple workplace project.',
      outcomes: [
        'Explain what makes work a project (scope, time, cost)',
        'List project life-cycle phases and typical support tasks',
        'Use basic planning tools (task list, timeline, risk note)',
        'Submit a mini project plan for assessment',
      ],
      unitStandards: [
        { id: '120385', title: 'Apply a range of project management tools and techniques', nqfLevel: 4, credits: 7 },
        { id: '120381', title: 'Implement project administration processes according to requirements', nqfLevel: 4, credits: 5 },
      ],
      category: 'Project Management',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'pm_g1',
          title: 'Learner guide: What is a project?',
          type: 'guide',
          order: 1,
          nqfLevel: 4,
          credits: 4,
          unitStandardId: '120381',
          unitStandardTitle: 'Implement project administration processes according to requirements',
          outcomes: [
            'Define a project in workplace language',
            'Identify scope, schedule, resources and stakeholders',
            'Describe one simple workplace project idea',
          ],
          body: 'A project is a temporary effort with a clear start and end, done to create a unique product, service or result. Unlike day-to-day operations, projects have defined scope, time and cost. At NQF Level 4 you learn to support project work: clarify goals, list tasks, track progress and report status.\n\nKey terms: scope (what is included), schedule (when), resources (who and what), risk (what could go wrong), stakeholder (anyone affected).\n\nActivity: Write down one workplace improvement that could be run as a short project (e.g. organising a team induction day).',
        },
        {
          id: 'pm_m1',
          title: 'Module 1: Project life cycle',
          type: 'content',
          order: 2,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '120381',
          unitStandardTitle: 'Implement project administration processes according to requirements',
          outcomes: [
            'List the main phases of a simple project life cycle',
            'Match support tasks to each phase',
            'Explain why monitoring and closure matter',
          ],
          body: 'Typical phases: (1) Initiation — agree the need and high-level goal. (2) Planning — break work into tasks, estimate time and resources. (3) Execution — do the work and communicate. (4) Monitoring — compare plan vs actual. (5) Closure — hand over, lessons learned.\n\nYour role may include updating task lists, booking venues, collecting status from team members and filing documents.',
        },
        {
          id: 'pm_q1',
          title: 'Formative assessment: Project basics',
          type: 'quiz',
          order: 3,
          nqfLevel: 4,
          credits: 3,
          unitStandardId: '120381',
          unitStandardTitle: 'Implement project administration processes according to requirements',
          outcomes: [
            'Check understanding of project vs operations',
            'Check understanding of scope and closure',
          ],
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              { q: 'A project is best described as:', options: ['Ongoing daily operations', 'A temporary effort with a unique outcome', 'Only large construction work', 'Any meeting with a manager'], correctIndex: 1 },
              { q: 'Scope means:', options: ['The project budget only', 'What is included and excluded in the work', 'The project manager job title', 'The final celebration'], correctIndex: 1 },
              { q: 'Which phase includes lessons learned?', options: ['Initiation', 'Planning', 'Execution', 'Closure'], correctIndex: 3 },
            ],
          },
        },
        {
          id: 'pm_m2',
          title: 'Module 2: Planning tools',
          type: 'content',
          order: 4,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '120385',
          unitStandardTitle: 'Apply a range of project management tools and techniques',
          outcomes: [
            'Use a simple task breakdown for a small project',
            'Explain timeline, RACI and risk register in plain language',
            'Choose a tool that fits a given planning need',
          ],
          body: 'Simple tools you will use: work breakdown (list of tasks), Gantt-style timeline (tasks vs weeks), RACI (who is Responsible, Accountable, Consulted, Informed), and a risk register (risk, likelihood, impact, action).\n\nGood plans are clear enough that another team member can follow them without guessing.',
        },
        {
          id: 'pm_a1',
          title: 'Summative assignment: Mini project plan',
          type: 'assignment',
          order: 5,
          nqfLevel: 4,
          credits: 10,
          unitStandardId: '120385',
          unitStandardTitle: 'Apply a range of project management tools and techniques',
          outcomes: [
            'Produce a goal statement for a mini project',
            'List tasks with owners',
            'Record one risk and a mitigation action',
          ],
          body: 'Choose a simple workplace or community project. Submit: (1) project goal in one sentence, (2) list of at least 5 tasks, (3) who does each task, (4) one risk and how you would reduce it. Minimum one short paragraph per point.',
          assignmentId: 'asg_pm1',
        },
      ],
    },
    {
      id: 'c_gm4',
      title: 'Generic Management (NQF Level 4)',
      nqfLevel: 4,
      credits: 150,
      saqaId: '57712',
      saqaTitle: 'FETC: Generic Management',
      relatedSaqaId: '',
      relatedSaqaNote: 'Confirm registration and enrolment end dates on the SAQA register before marketing as accredited delivery.',
      programme: 'Generic Management',
      description: 'Pilot programme for junior managers and supervisors. Demo modules and assessments — not the full accredited unit-standard pack.',
      purpose: 'Support team leaders and supervisors to plan work, communicate clearly, motivate teams and monitor performance against organisational standards.',
      outcomes: [
        'Describe the role of a junior manager / supervisor',
        'Plan and prioritise team work for a day or week',
        'Give fair, behaviour-focused feedback',
        'Prepare a short team briefing plan for assessment',
      ],
      unitStandards: [
        { id: '242821', title: 'Identify responsibilities of a team leader in ensuring that organisational standards are met', nqfLevel: 4, credits: 6 },
        { id: '242819', title: 'Motivate and build a team', nqfLevel: 4, credits: 10 },
        { id: '11473', title: 'Manage individual and team performance', nqfLevel: 4, credits: 8 },
      ],
      category: 'Generic Management',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'gm_g1',
          title: 'Learner guide: Role of a supervisor',
          type: 'guide',
          order: 1,
          nqfLevel: 4,
          credits: 4,
          unitStandardId: '242821',
          unitStandardTitle: 'Identify responsibilities of a team leader in ensuring that organisational standards are met',
          outcomes: [
            'Describe supervisor responsibilities in plain language',
            'List behaviours that support team performance',
            'Reflect on effective supervision examples',
          ],
          body: 'Supervisors turn organisational goals into daily work. You allocate tasks, support people, check quality and escalate problems early.\n\nCore skills: clear instruction, fair feedback, listening, basic planning, and modelling the behaviour you expect.\n\nReflection: Think of a good supervisor you have seen. List three behaviours that made them effective.',
        },
        {
          id: 'gm_m1',
          title: 'Module 1: Planning and organising work',
          type: 'content',
          order: 2,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '242821',
          unitStandardTitle: 'Identify responsibilities of a team leader in ensuring that organisational standards are met',
          outcomes: [
            'Prioritise urgent versus important work',
            'Match tasks to skills and deadlines',
            'Prepare a short team briefing structure',
          ],
          body: 'Match tasks to skills and deadlines. Prioritise urgent vs important work. Confirm resources before you commit the team. Hold short stand-up or briefing sessions so everyone knows the plan for the day or week.',
        },
        {
          id: 'gm_q1',
          title: 'Formative assessment: Supervision basics',
          type: 'quiz',
          order: 3,
          nqfLevel: 4,
          credits: 3,
          unitStandardId: '11473',
          unitStandardTitle: 'Manage individual and team performance',
          outcomes: [
            'Check understanding of supervisor focus',
            'Check understanding of fair feedback and escalation',
          ],
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              { q: 'A supervisor main focus is to:', options: ['Only do technical work alone', 'Translate goals into coordinated team work', 'Avoid all conflict', 'Ignore reporting lines'], correctIndex: 1 },
              { q: 'When giving feedback you should:', options: ['Only criticise in public', 'Be specific, fair and focused on behaviour', 'Never document anything', 'Compare staff to each other harshly'], correctIndex: 1 },
              { q: 'Escalating a problem means:', options: ['Hiding it until month-end', 'Raising it to the right person with facts', 'Blaming a colleague on social media', 'Stopping all work permanently'], correctIndex: 1 },
            ],
          },
        },
        {
          id: 'gm_m2',
          title: 'Module 2: Team communication',
          type: 'content',
          order: 4,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '242819',
          unitStandardTitle: 'Motivate and build a team',
          outcomes: [
            'Select an appropriate communication channel',
            'Confirm understanding after instructions',
            'Keep a simple record of agreed actions',
          ],
          body: 'Use the right channel: face-to-face for sensitive topics, written notes for instructions that must be kept, group chats for quick coordination. Confirm understanding by asking the person to repeat key points. Keep records of agreed actions.',
        },
        {
          id: 'gm_a1',
          title: 'Summative assignment: Team briefing plan',
          type: 'assignment',
          order: 5,
          nqfLevel: 4,
          credits: 10,
          unitStandardId: '11473',
          unitStandardTitle: 'Manage individual and team performance',
          outcomes: [
            'Write a clear briefing purpose',
            'List agenda points and a check for understanding',
            'Define one follow-up action to track',
          ],
          body: 'Write a short plan for a 15-minute team briefing: purpose, three agenda points, how you will check understanding, and one follow-up action you will track. Minimum 3–4 short paragraphs.',
          assignmentId: 'asg_gm1',
        },
      ],
    },
    {
      id: 'c_ba4',
      title: 'Business Administration Services (NQF Level 4)',
      nqfLevel: 4,
      credits: 140,
      saqaId: '61595',
      saqaTitle: 'FETC: Business Administration Services',
      relatedSaqaId: '',
      relatedSaqaNote: 'Confirm the exact learning programme ID your provider is accredited for on SAQA.',
      programme: 'Business Administration',
      description: 'Pilot modules for office systems, professional communication and customer support. Not a substitute for licensed SETA learning materials.',
      purpose: 'Build practical administration skills: accurate records, professional documents, confidential handling of information and clear customer contact.',
      outcomes: [
        'Explain why accurate, confidential admin matters',
        'Produce a clear professional email',
        'Apply basic customer and telephone etiquette',
        'Submit a meeting-confirmation email for assessment',
      ],
      unitStandards: [
        { id: '110009', title: 'Manage administration records', nqfLevel: 4, credits: 4 },
        { id: '110021', title: 'Achieve personal effectiveness in business environment', nqfLevel: 4, credits: 6 },
        { id: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements', nqfLevel: 3, credits: 3 },
      ],
      category: 'Business Administration',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'ba_g1',
          title: 'Learner guide: Admin in the workplace',
          type: 'guide',
          order: 1,
          nqfLevel: 4,
          credits: 4,
          unitStandardId: '110009',
          unitStandardTitle: 'Manage administration records',
          outcomes: [
            'Describe typical admin duties in an office',
            'Explain why accuracy and confidentiality matter',
            'Suggest a simple daily checklist for recurring tasks',
          ],
          body: 'Business administration keeps information, people and processes organised. Typical duties: diaries, correspondence, filing, data entry, meeting support and basic reports.\n\nQuality admin is accurate, confidential and on time. Errors in records can affect payroll, customers and compliance.\n\nTip: Create a daily checklist for recurring tasks so nothing is forgotten under pressure.',
        },
        {
          id: 'ba_m1',
          title: 'Module 1: Professional documents',
          type: 'content',
          order: 2,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '110021',
          unitStandardTitle: 'Achieve personal effectiveness in business environment',
          outcomes: [
            'Structure a professional email',
            'Use a clear subject line and closing',
            'Apply sensible file naming for final documents',
          ],
          body: 'Emails and letters need a clear subject, polite greeting, short paragraphs and a professional close. Use spell-check. Save final versions in the correct folder with a sensible file name (date + topic).',
        },
        {
          id: 'ba_q1',
          title: 'Formative assessment: Admin practice',
          type: 'quiz',
          order: 3,
          nqfLevel: 4,
          credits: 3,
          unitStandardId: '110009',
          unitStandardTitle: 'Manage administration records',
          outcomes: [
            'Check understanding of professional email practice',
            'Check understanding of confidentiality and minutes',
          ],
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              { q: 'A good email subject line is:', options: ['Hi', 'Urgent!!!', 'Clear and specific about the topic', 'Empty'], correctIndex: 2 },
              { q: 'Confidential documents should be:', options: ['Shared on public social media', 'Stored and shared only with authorised people', 'Left on the printer', 'Emailed to everyone in the company'], correctIndex: 1 },
              { q: 'Meeting minutes should mainly capture:', options: ['Jokes only', 'Decisions, actions, owners and deadlines', 'Every word spoken', 'Personal opinions about colleagues'], correctIndex: 1 },
            ],
          },
        },
        {
          id: 'ba_m2',
          title: 'Module 2: Customer and telephone skills',
          type: 'content',
          order: 4,
          nqfLevel: 4,
          credits: 8,
          unitStandardId: '110021',
          unitStandardTitle: 'Achieve personal effectiveness in business environment',
          outcomes: [
            'Greet callers professionally',
            'Take a complete message with callback details',
            'Explain when to escalate a customer issue',
          ],
          body: 'Answer promptly, greet with the organisation name, listen actively, take a full message (who, company, number, reason), and agree a follow-up time. Escalate angry or complex issues early with facts.',
        },
        {
          id: 'ba_a1',
          title: 'Summative assignment: Professional email',
          type: 'assignment',
          order: 5,
          nqfLevel: 4,
          credits: 10,
          unitStandardId: '110021',
          unitStandardTitle: 'Achieve personal effectiveness in business environment',
          outcomes: [
            'Write a clear subject line',
            'Produce a polite, complete meeting confirmation',
            'Include date, time, place and any preparation needed',
          ],
          body: 'Write a professional email confirming a meeting with a client or internal team. Include subject line, greeting, purpose, date/time/place, what to prepare, and a polite close.',
          assignmentId: 'asg_ba1',
        },
      ],
    },
  ];

  const assignments = [
    { id: 'asg_pm1', courseId: 'c_pm4', lessonId: 'pm_a1', title: 'Summative assignment: Mini project plan', instructions: 'Submit: goal, 5+ tasks, owners, one risk and mitigation.', maxScore: 100 },
    { id: 'asg_gm1', courseId: 'c_gm4', lessonId: 'gm_a1', title: 'Summative assignment: Team briefing plan', instructions: 'Purpose, three agenda points, check of understanding, one follow-up action.', maxScore: 100 },
    { id: 'asg_ba1', courseId: 'c_ba4', lessonId: 'ba_a1', title: 'Summative assignment: Professional email', instructions: 'Full email confirming meeting with subject line and body.', maxScore: 100 },
  ];

  const enrolments = [
    { id: 'e1', courseId: 'c_pm4', learnerId: 'u_l1', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e2', courseId: 'c_gm4', learnerId: 'u_l2', status: 'pending', enrolledAt: new Date().toISOString() },
  ];

  const progress = [
    { learnerId: 'u_l1', courseId: 'c_pm4', completedLessonIds: ['pm_g1', 'pm_m1'], percent: 40 },
  ];

  const submissions = [
    {
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
    },
  ];

  const messages = [
    {
      id: 'msg1',
      toUserId: 'u_l1',
      toEmail: 'learner1@gmail.com',
      subject: 'Welcome to EduFlow',
      body: 'Your application/enrolment updates and results will be sent to this Gmail address.',
      at: new Date().toISOString(),
      read: false,
    },
    {
      id: 'msg2',
      toUserId: 'u_l2',
      toEmail: 'james.molefe@gmail.com',
      subject: 'Application received — Generic Management',
      body: 'We received your access request. An administrator will approve or reject shortly.',
      at: new Date().toISOString(),
      read: false,
    },
  ];

  const settings = {
    providerName: 'EduFlow Training Provider',
    contactEmail: 'admin@eduflow.test',
    supportPhone: '+27 00 000 0000',
    welcomeMessage:
      'Welcome to your learning programme. Complete guides, modules and assessments to progress. Results and notices are linked to your Gmail.',
    passMarkDefault: 70,
    certificateFooter: 'This is a demo certificate for pilot modules only — not an official SETA statement of results.',
  };

  save(KEYS.users, [trainer, ...learners], { silent: true });
  save(KEYS.courses, courses, { silent: true });
  save(KEYS.enrolments, enrolments, { silent: true });
  save(KEYS.assignments, assignments, { silent: true });
  save(KEYS.submissions, submissions, { silent: true });
  save(KEYS.progress, progress, { silent: true });
  save(KEYS.attempts, [], { silent: true });
  save(KEYS.applications, [], { silent: true });
  save(KEYS.messages, messages, { silent: true });
  save('ef_settings', settings, { silent: true });
  save('ef_seed_ver', 7, { silent: true });
}
