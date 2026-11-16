/** Full demo seed — loaded on first visit */
export function runFullSeed(save, KEYS) {
  const trainer = {
    id: 'u_trainer',
    name: 'Admin Trainer',
    email: 'admin@eduflow.test',
    password: 'admin123',
    role: 'trainer',
    gmail: 'admin@eduflow.test',
    status: 'approved',
  };
  const learners = [
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@gmail.com', password: 'learner123', role: 'learner', gmail: 'learner1@gmail.com', status: 'approved' },
    { id: 'u_l2', name: 'James Molefe', email: 'james.molefe@gmail.com', password: 'learner123', role: 'learner', gmail: 'james.molefe@gmail.com', status: 'approved' },
    { id: 'u_l3', name: 'Naledi Khumalo', email: 'naledi.k@gmail.com', password: 'learner123', role: 'learner', gmail: 'naledi.k@gmail.com', status: 'approved' },
  ];
  const pendingUser = {
    id: 'u_pending',
    name: 'Thabo Applicant',
    email: 'thabo.apply@gmail.com',
    password: 'pending123',
    role: 'learner',
    gmail: 'thabo.apply@gmail.com',
    status: 'pending',
    preferredProgrammeId: 'c_pm4',
    appliedAt: new Date().toISOString(),
  };
  const courses = [
    {
      id: 'c_pm4',
      title: 'Project Management support (aligned to NQF pathway)',
      nqfLevel: 4,
      credits: 136,
      saqaId: '50080',
      saqaTitle: 'FETC: Project Management (legacy reference)',
      programme: 'Project Management',
      description: 'Pilot modules for planning and supporting workplace projects.',
      unitStandards: [
        { id: '120385', title: 'Apply a range of project management tools and techniques', nqfLevel: 4, credits: 7 },
        { id: '120381', title: 'Implement project administration processes according to requirements', nqfLevel: 4, credits: 5 },
      ],
      trainerId: trainer.id,
      lessons: [
        { id: 'pm_g1', title: 'Learner guide: What is a project?', type: 'guide', order: 1, body: 'A project is a temporary effort with a clear start and end.' },
        { id: 'pm_m1', title: 'Module 1: Project life cycle', type: 'content', order: 2, body: 'Phases: initiation, planning, execution, monitoring, closure.' },
        { id: 'pm_q1', title: 'Formative assessment: Project basics', type: 'quiz', order: 3, quiz: { passMark: 70, questions: [
          { q: 'A project is best described as:', options: ['Ongoing operations', 'A temporary effort with a unique outcome', 'Only construction', 'Any meeting'], correctIndex: 1 },
          { q: 'Scope means:', options: ['Budget only', 'What is included and excluded', 'Job title', 'Celebration'], correctIndex: 1 },
          { q: 'Lessons learned belong in:', options: ['Initiation', 'Planning', 'Execution', 'Closure'], correctIndex: 3 },
        ]}},
        { id: 'pm_m2', title: 'Module 2: Planning tools', type: 'content', order: 4, body: 'Use task lists, timelines and risk notes.' },
        { id: 'pm_a1', title: 'Summative assignment: Mini project plan', type: 'assignment', order: 5, body: 'Submit goal, 5+ tasks, owners, one risk.', assignmentId: 'asg_pm1' },
      ],
    },
    {
      id: 'c_gm4',
      title: 'Generic Management (NQF Level 4)',
      nqfLevel: 4,
      credits: 150,
      saqaId: '57712',
      saqaTitle: 'FETC: Generic Management',
      programme: 'Generic Management',
      description: 'Pilot programme for junior managers and supervisors.',
      unitStandards: [
        { id: '242821', title: 'Identify responsibilities of a team leader', nqfLevel: 4, credits: 6 },
        { id: '242819', title: 'Motivate and build a team', nqfLevel: 4, credits: 10 },
      ],
      trainerId: trainer.id,
      lessons: [
        { id: 'gm_g1', title: 'Learner guide: Role of a supervisor', type: 'guide', order: 1, body: 'Supervisors turn goals into daily work.' },
        { id: 'gm_m1', title: 'Module 1: Planning and organising work', type: 'content', order: 2, body: 'Prioritise urgent vs important work.' },
        { id: 'gm_q1', title: 'Formative assessment: Supervision basics', type: 'quiz', order: 3, quiz: { passMark: 70, questions: [
          { q: 'A supervisor main focus is to:', options: ['Work alone', 'Coordinate team work', 'Avoid conflict', 'Ignore reporting'], correctIndex: 1 },
          { q: 'Feedback should be:', options: ['Public criticism', 'Specific and fair', 'Never documented', 'Harsh comparison'], correctIndex: 1 },
          { q: 'Escalating means:', options: ['Hiding problems', 'Raising with facts', 'Social media blame', 'Stop work'], correctIndex: 1 },
        ]}},
        { id: 'gm_m2', title: 'Module 2: Team communication', type: 'content', order: 4, body: 'Use the right channel for the message.' },
        { id: 'gm_a1', title: 'Summative assignment: Team briefing plan', type: 'assignment', order: 5, body: 'Write a 15-minute briefing plan.', assignmentId: 'asg_gm1' },
      ],
    },
    {
      id: 'c_ba4',
      title: 'Business Administration Services (NQF Level 4)',
      nqfLevel: 4,
      credits: 140,
      saqaId: '61595',
      saqaTitle: 'FETC: Business Administration Services',
      programme: 'Business Administration',
      description: 'Pilot modules for office systems and professional communication.',
      unitStandards: [
        { id: '110009', title: 'Manage administration records', nqfLevel: 4, credits: 4 },
        { id: '110021', title: 'Achieve personal effectiveness in business environment', nqfLevel: 4, credits: 6 },
      ],
      trainerId: trainer.id,
      lessons: [
        { id: 'ba_g1', title: 'Learner guide: Admin in the workplace', type: 'guide', order: 1, body: 'Admin keeps information and processes organised.' },
        { id: 'ba_m1', title: 'Module 1: Professional documents', type: 'content', order: 2, body: 'Clear subject lines and professional closes.' },
        { id: 'ba_q1', title: 'Formative assessment: Admin practice', type: 'quiz', order: 3, quiz: { passMark: 70, questions: [
          { q: 'A good email subject is:', options: ['Hi', 'Urgent!!!', 'Clear and specific', 'Empty'], correctIndex: 2 },
          { q: 'Confidential documents should be:', options: ['On social media', 'Shared only with authorised people', 'Left on printer', 'Emailed to all'], correctIndex: 1 },
          { q: 'Minutes should capture:', options: ['Jokes', 'Decisions, actions, owners, deadlines', 'Every word', 'Gossip'], correctIndex: 1 },
        ]}},
        { id: 'ba_m2', title: 'Module 2: Customer and telephone skills', type: 'content', order: 4, body: 'Answer promptly and take a full message.' },
        { id: 'ba_a1', title: 'Summative assignment: Professional email', type: 'assignment', order: 5, body: 'Write a meeting confirmation email.', assignmentId: 'asg_ba1' },
      ],
    },
  ];

  const assignments = [
    { id: 'asg_pm1', courseId: 'c_pm4', lessonId: 'pm_a1', title: 'Summative assignment: Mini project plan', instructions: 'Submit: goal, 5+ tasks, owners, one risk and mitigation.', maxScore: 100 },
    { id: 'asg_gm1', courseId: 'c_gm4', lessonId: 'gm_a1', title: 'Summative assignment: Team briefing plan', instructions: 'Purpose, three agenda points, check of understanding, one follow-up.', maxScore: 100 },
    { id: 'asg_ba1', courseId: 'c_ba4', lessonId: 'ba_a1', title: 'Summative assignment: Professional email', instructions: 'Full email confirming meeting.', maxScore: 100 },
  ];

  const enrolments = [
    {
      id: 'e1',
      courseId: 'c_pm4',
      learnerId: 'u_l1',
      status: 'approved',
      enrolledAt: new Date().toISOString(),
      documents: {
        hasDisability: false,
        idCopy: { name: 'aisha-id.pdf', type: 'application/pdf', size: 120000, dataUrl: null, tooLarge: false },
        matric: { name: 'aisha-matric.pdf', type: 'application/pdf', size: 200000, dataUrl: null, tooLarge: false },
        otherCerts: [],
        disabilityNote: null,
      },
      meetsMinimum: true,
      reviewNotes: 'Meets minimum document requirements (demo).',
    },
    {
      id: 'e2',
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
      reviewNotes: '',
    },
  ];

  const progress = [{ learnerId: 'u_l1', courseId: 'c_pm4', completedLessonIds: ['pm_g1', 'pm_m1'], percent: 40 }];

  const submissions = [{
    id: 'sub_demo1',
    assignmentId: 'asg_pm1',
    courseId: 'c_pm4',
    learnerId: 'u_l1',
    text: 'Goal: Roll out inventory checklist. Tasks: list categories, draft checklist, pilot, feedback, train. Risk: staff skip form — toolbox talk.',
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    score: null,
    feedback: '',
    rubricScores: null,
    history: [],
  }];

  const messages = [
    { id: 'msg1', toUserId: 'u_l1', toEmail: 'learner1@gmail.com', subject: 'Welcome to EduFlow', body: 'Updates go to your Gmail.', at: new Date().toISOString(), read: false },
    { id: 'msg2', toUserId: 'u_l2', toEmail: 'james.molefe@gmail.com', subject: 'Application received', body: 'Documents received for review.', at: new Date().toISOString(), read: false },
    { id: 'msg3', toUserId: 'u_pending', toEmail: 'thabo.apply@gmail.com', subject: 'Application received — awaiting approval', body: 'Your account application is under review.', at: new Date().toISOString(), read: false },
  ];

  const settings = {
    providerName: 'EduFlow Training Provider',
    contactEmail: 'admin@eduflow.test',
    supportPhone: '+27 00 000 0000',
    welcomeMessage: 'Welcome to your learning programme.',
    passMarkDefault: 70,
    certificateFooter: 'Demo certificate only — not an official SETA statement of results.',
  };

  save(KEYS.users, [trainer, ...learners, pendingUser], { silent: true });
  save(KEYS.courses, courses, { silent: true });
  save(KEYS.enrolments, enrolments, { silent: true });
  save(KEYS.assignments, assignments, { silent: true });
  save(KEYS.submissions, submissions, { silent: true });
  save(KEYS.progress, progress, { silent: true });
  save(KEYS.attempts, [], { silent: true });
  save(KEYS.applications, [{
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
  }], { silent: true });
  save(KEYS.messages, messages, { silent: true });
  save(KEYS.attendance, [], { silent: true });
  save('ef_settings', settings, { silent: true });
  save('ef_seed_ver', 9, { silent: true });
}
