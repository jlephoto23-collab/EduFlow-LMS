/**
 * EduFlow data store — sample NQF-aligned programmes (original training content).
 * Not official SAQA/SETA materials; written for pilot demo purposes.
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

export function seedIfNeeded() {
  // Force-refresh seed when structure version changes
  const ver = load('ef_seed_ver', 0);
  if (ver >= 3 && load(KEYS.users, null)) return;

  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));

  const trainer = {
    id: 'u_trainer',
    name: 'Admin Trainer',
    email: 'admin@eduflow.test',
    password: 'admin123',
    role: 'trainer',
    gmail: 'admin@eduflow.test',
  };

  const learners = [
    {
      id: 'u_l1',
      name: 'Aisha Learner',
      email: 'learner1@gmail.com',
      password: 'learner123',
      role: 'learner',
      gmail: 'learner1@gmail.com',
    },
    {
      id: 'u_l2',
      name: 'James Molefe',
      email: 'james.molefe@gmail.com',
      password: 'learner123',
      role: 'learner',
      gmail: 'james.molefe@gmail.com',
    },
    {
      id: 'u_l3',
      name: 'Naledi Khumalo',
      email: 'naledi.k@gmail.com',
      password: 'learner123',
      role: 'learner',
      gmail: 'naledi.k@gmail.com',
    },
  ];

  const courses = [
    {
      id: 'c_pm4',
      title: 'Project Management (NQF Level 4)',
      nqfLevel: 4,
      programme: 'Project Management',
      description:
        'Plan, implement and close simple projects in a workplace context. Includes learner guide modules, formative quizzes and a summative assignment.',
      category: 'Project Management',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'pm_g1',
          title: 'Learner guide: What is a project?',
          type: 'guide',
          order: 1,
          body:
            'A project is a temporary effort with a clear start and end, done to create a unique product, service or result. Unlike day-to-day operations, projects have defined scope, time and cost. At NQF Level 4 you learn to support project work: clarify goals, list tasks, track progress and report status.\n\nKey terms: scope (what is included), schedule (when), resources (who and what), risk (what could go wrong), stakeholder (anyone affected).\n\nActivity: Write down one workplace improvement that could be run as a short project (e.g. organising a team induction day).',
        },
        {
          id: 'pm_m1',
          title: 'Module 1: Project life cycle',
          type: 'content',
          order: 2,
          body:
            'Typical phases: (1) Initiation — agree the need and high-level goal. (2) Planning — break work into tasks, estimate time and resources. (3) Execution — do the work and communicate. (4) Monitoring — compare plan vs actual. (5) Closure — hand over, lessons learned.\n\nYour role may include updating task lists, booking venues, collecting status from team members and filing documents.',
        },
        {
          id: 'pm_q1',
          title: 'Formative assessment: Project basics',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'A project is best described as:',
                options: [
                  'Ongoing daily operations',
                  'A temporary effort with a unique outcome',
                  'Only large construction work',
                  'Any meeting with a manager',
                ],
                correctIndex: 1,
              },
              {
                q: 'Scope means:',
                options: [
                  'The project budget only',
                  'What is included and excluded in the work',
                  'The project manager’s job title',
                  'The final celebration',
                ],
                correctIndex: 1,
              },
              {
                q: 'Which phase includes lessons learned?',
                options: ['Initiation', 'Planning', 'Execution', 'Closure'],
                correctIndex: 3,
              },
            ],
          },
        },
        {
          id: 'pm_m2',
          title: 'Module 2: Planning tools',
          type: 'content',
          order: 4,
          body:
            'Simple tools you will use: work breakdown (list of tasks), Gantt-style timeline (tasks vs weeks), RACI (who is Responsible, Accountable, Consulted, Informed), and a risk register (risk, likelihood, impact, action).\n\nGood plans are clear enough that another team member can follow them without guessing.',
        },
        {
          id: 'pm_a1',
          title: 'Summative assignment: Mini project plan',
          type: 'assignment',
          order: 5,
          body:
            'Choose a simple workplace or community project. Submit: (1) project goal in one sentence, (2) list of at least 5 tasks, (3) who does each task, (4) one risk and how you would reduce it. Minimum one short paragraph per point.',
          assignmentId: 'asg_pm1',
        },
      ],
    },
    {
      id: 'c_gm4',
      title: 'Generic Management (NQF Level 4)',
      nqfLevel: 4,
      programme: 'Generic Management',
      description:
        'Supervise teams, communicate effectively and support operational goals. Learner guides, knowledge checks and practical assignment.',
      category: 'Generic Management',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'gm_g1',
          title: 'Learner guide: Role of a supervisor',
          type: 'guide',
          order: 1,
          body:
            'Supervisors turn organisational goals into daily work. You allocate tasks, support people, check quality and escalate problems early.\n\nCore skills: clear instruction, fair feedback, listening, basic planning, and modelling the behaviour you expect.\n\nReflection: Think of a good supervisor you have seen. List three behaviours that made them effective.',
        },
        {
          id: 'gm_m1',
          title: 'Module 1: Planning and organising work',
          type: 'content',
          order: 2,
          body:
            'Match tasks to skills and deadlines. Prioritise urgent vs important work. Confirm resources before you commit the team. Hold short stand-up or briefing sessions so everyone knows the plan for the day or week.',
        },
        {
          id: 'gm_q1',
          title: 'Formative assessment: Supervision basics',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'A supervisor’s main focus is to:',
                options: [
                  'Only do technical work alone',
                  'Translate goals into coordinated team work',
                  'Avoid all conflict',
                  'Ignore reporting lines',
                ],
                correctIndex: 1,
              },
              {
                q: 'When giving feedback you should:',
                options: [
                  'Only criticise in public',
                  'Be specific, fair and focused on behaviour',
                  'Never document anything',
                  'Compare staff to each other harshly',
                ],
                correctIndex: 1,
              },
              {
                q: 'Escalating a problem means:',
                options: [
                  'Hiding it until month-end',
                  'Raising it to the right person with facts',
                  'Blaming a colleague on social media',
                  'Stopping all work permanently',
                ],
                correctIndex: 1,
              },
            ],
          },
        },
        {
          id: 'gm_m2',
          title: 'Module 2: Team communication',
          type: 'content',
          order: 4,
          body:
            'Use the right channel: face-to-face for sensitive topics, written notes for instructions that must be kept, group chats for quick coordination. Confirm understanding by asking the person to repeat key points. Keep records of agreed actions.',
        },
        {
          id: 'gm_a1',
          title: 'Summative assignment: Team briefing plan',
          type: 'assignment',
          order: 5,
          body:
            'Write a short plan for a 15-minute team briefing: purpose, three agenda points, how you will check understanding, and one follow-up action you will track. Minimum 3–4 short paragraphs.',
          assignmentId: 'asg_gm1',
        },
      ],
    },
    {
      id: 'c_ba4',
      title: 'Business Administration (NQF Level 4)',
      nqfLevel: 4,
      programme: 'Business Administration',
      description:
        'Office systems, professional communication, records and customer support. Modules, learner guide notes and assessments.',
      category: 'Business Administration',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'ba_g1',
          title: 'Learner guide: Admin in the workplace',
          type: 'guide',
          order: 1,
          body:
            'Business administration keeps information, people and processes organised. Typical duties: diaries, correspondence, filing, data entry, meeting support and basic reports.\n\nQuality admin is accurate, confidential and on time. Errors in records can affect payroll, customers and compliance.\n\nTip: Create a daily checklist for recurring tasks so nothing is forgotten under pressure.',
        },
        {
          id: 'ba_m1',
          title: 'Module 1: Professional documents',
          type: 'content',
          order: 2,
          body:
            'Emails and letters need a clear subject, polite greeting, short paragraphs and a professional close. Use spell-check. Save final versions in the correct folder with a sensible file name (date + topic).',
        },
        {
          id: 'ba_q1',
          title: 'Formative assessment: Admin practice',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'A good email subject line is:',
                options: ['Hi', 'Urgent!!!', 'Clear and specific about the topic', 'Empty'],
                correctIndex: 2,
              },
              {
                q: 'Confidential documents should be:',
                options: [
                  'Shared on public social media',
                  'Stored and shared only with authorised people',
                  'Left on the printer',
                  'Emailed to everyone in the company',
                ],
                correctIndex: 1,
              },
              {
                q: 'Meeting minutes should mainly capture:',
                options: [
                  'Jokes only',
                  'Decisions, actions, owners and deadlines',
                  'Every word spoken',
                  'Personal opinions about colleagues',
                ],
                correctIndex: 1,
              },
            ],
          },
        },
        {
          id: 'ba_m2',
          title: 'Module 2: Customer and telephone skills',
          type: 'content',
          order: 4,
          body:
            'Greet clearly, use the organisation’s name, listen fully before responding, and agree a next step. Note the caller’s name and reference number. If you cannot help, transfer with a brief summary so the customer does not repeat everything.',
        },
        {
          id: 'ba_a1',
          title: 'Summative assignment: Professional email',
          type: 'assignment',
          order: 5,
          body:
            'A client asks for confirmation of a meeting next Tuesday at 10:00, venue Boardroom B, and a one-page agenda. Write the full email you would send (subject line + body).',
          assignmentId: 'asg_ba1',
        },
      ],
    },
  ];

  const assignments = [
    {
      id: 'asg_pm1',
      courseId: 'c_pm4',
      lessonId: 'pm_a1',
      title: 'Summative assignment: Mini project plan',
      instructions:
        'Submit: goal, 5+ tasks, owners, one risk and mitigation. One short paragraph per point minimum.',
      maxScore: 100,
    },
    {
      id: 'asg_gm1',
      courseId: 'c_gm4',
      lessonId: 'gm_a1',
      title: 'Summative assignment: Team briefing plan',
      instructions: 'Purpose, three agenda points, check of understanding, one follow-up action.',
      maxScore: 100,
    },
    {
      id: 'asg_ba1',
      courseId: 'c_ba4',
      lessonId: 'ba_a1',
      title: 'Summative assignment: Professional email',
      instructions: 'Full email confirming meeting with subject line and body.',
      maxScore: 100,
    },
  ];

  const enrolments = [
    {
      id: 'e1',
      courseId: 'c_pm4',
      learnerId: 'u_l1',
      status: 'approved',
      enrolledAt: new Date().toISOString(),
    },
    {
      id: 'e2',
      courseId: 'c_gm4',
      learnerId: 'u_l2',
      status: 'pending',
      enrolledAt: new Date().toISOString(),
    },
  ];

  const progress = [
    {
      learnerId: 'u_l1',
      courseId: 'c_pm4',
      completedLessonIds: ['pm_g1', 'pm_m1'],
      percent: 40,
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
  ];

  save(KEYS.users, [trainer, ...learners], { silent: true });
  save(KEYS.courses, courses, { silent: true });
  save(KEYS.enrolments, enrolments, { silent: true });
  save(KEYS.assignments, assignments, { silent: true });
  save(KEYS.submissions, [], { silent: true });
  save(KEYS.progress, progress, { silent: true });
  save(KEYS.attempts, [], { silent: true });
  save(KEYS.applications, [], { silent: true });
  save(KEYS.messages, messages, { silent: true });
  save('ef_seed_ver', 3, { silent: true });
}
