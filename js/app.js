const KEYS = {
  users: 'ef_users',
  session: 'ef_session',
  courses: 'ef_courses',
  enrolments: 'ef_enrolments',
  progress: 'ef_progress',
  attempts: 'ef_attempts',
  assignments: 'ef_assignments',
  submissions: 'ef_submissions',
};

function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 11);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedIfNeeded() {
  if (load(KEYS.users, null)) return;

  const trainer = {
    id: 'u_trainer',
    name: 'Thabo Trainer',
    email: 'trainer@eduflow.test',
    password: 'trainer123',
    role: 'trainer',
  };
  const learners = [
    { id: 'u_l1', name: 'Aisha Learner', email: 'learner1@eduflow.test', password: 'learner123', role: 'learner' },
    { id: 'u_l2', name: 'James Molefe', email: 'learner2@eduflow.test', password: 'learner123', role: 'learner' },
    { id: 'u_l3', name: 'Naledi Khumalo', email: 'learner3@eduflow.test', password: 'learner123', role: 'learner' },
  ];

  const courses = [
    {
      id: 'c1',
      title: 'Workplace Safety Essentials',
      description: 'Core health and safety practices for the workplace. Includes lessons, quiz and a written assignment.',
      category: 'Compliance',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to workplace safety',
          type: 'content',
          order: 1,
          body: 'Safety starts with awareness. Every worker shares responsibility for a safe environment. This module covers duties of employers and employees under basic OHS principles.',
        },
        {
          id: 'l2',
          title: 'Hazard identification',
          type: 'content',
          order: 2,
          body: 'Learn to spot common hazards: slips, electrical risks, chemical exposure, and unsafe equipment. Report hazards early and use the correct PPE.',
        },
        {
          id: 'l3',
          title: 'Safety knowledge check',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'Who is responsible for workplace safety?',
                options: ['Only managers', 'Only the safety officer', 'Everyone at work', 'Visitors only'],
                correctIndex: 2,
              },
              {
                q: 'What should you do when you see a hazard?',
                options: ['Ignore it if you are busy', 'Report it and keep others safe', 'Fix only electrical issues', 'Wait for an inspection'],
                correctIndex: 1,
              },
              {
                q: 'PPE stands for:',
                options: ['Personal Protective Equipment', 'Public Protection Event', 'Primary Process Example', 'Paid Professional Employee'],
                correctIndex: 0,
              },
            ],
          },
        },
        {
          id: 'l4',
          title: 'Safety reflection assignment',
          type: 'assignment',
          order: 4,
          body: 'Write a short reflection (minimum 3 sentences) describing one hazard in a workplace you know and how you would control it.',
          assignmentId: 'a1',
        },
      ],
    },
    {
      id: 'c2',
      title: 'Customer Service Basics',
      description: 'Practical skills for professional customer-facing service, with quiz and submission.',
      category: 'Soft skills',
      trainerId: trainer.id,
      lessons: [
        {
          id: 'l5',
          title: 'First impressions',
          type: 'content',
          order: 1,
          body: 'Greeting, body language, and clear communication set the tone. Smile, introduce yourself, and listen before you respond.',
        },
        {
          id: 'l6',
          title: 'Handling complaints',
          type: 'content',
          order: 2,
          body: 'Stay calm, acknowledge the issue, apologise where appropriate, and offer a clear next step. Document what was agreed.',
        },
        {
          id: 'l7',
          title: 'Service quiz',
          type: 'quiz',
          order: 3,
          body: '',
          quiz: {
            passMark: 70,
            questions: [
              {
                q: 'The best first step with an upset customer is to:',
                options: ['Argue the policy', 'Listen and acknowledge', 'Transfer immediately', 'Offer a discount only'],
                correctIndex: 1,
              },
              {
                q: 'Clear communication means:',
                options: ['Using jargon', 'Speaking as fast as possible', 'Simple language and confirming understanding', 'Avoiding eye contact'],
                correctIndex: 2,
              },
            ],
          },
        },
        {
          id: 'l8',
          title: 'Complaint response assignment',
          type: 'assignment',
          order: 4,
          body: 'A customer is unhappy about a delayed service. Write the reply you would give (3–6 sentences).',
          assignmentId: 'a2',
        },
      ],
    },
  ];

  const assignments = [
    {
      id: 'a1',
      courseId: 'c1',
      lessonId: 'l4',
      title: 'Safety reflection assignment',
      instructions: 'Write a short reflection (minimum 3 sentences) describing one hazard in a workplace you know and how you would control it.',
      maxScore: 100,
    },
    {
      id: 'a2',
      courseId: 'c2',
      lessonId: 'l8',
      title: 'Complaint response assignment',
      instructions: 'A customer is unhappy about a delayed service. Write the reply you would give (3–6 sentences).',
      maxScore: 100,
    },
  ];

  const enrolments = [
    { id: 'e1', courseId: 'c1', learnerId: 'u_l1', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e2', courseId: 'c1', learnerId: 'u_l2', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e3', courseId: 'c2', learnerId: 'u_l1', status: 'approved', enrolledAt: new Date().toISOString() },
    { id: 'e4', courseId: 'c2', learnerId: 'u_l3', status: 'pending', enrolledAt: new Date().toISOString() },
  ];

  save(KEYS.users, [trainer, ...learners]);
  save(KEYS.courses, courses);
  save(KEYS.enrolments, enrolments);
  save(KEYS.assignments, assignments);
  save(KEYS.submissions, []);
  save(KEYS.progress, []);
  save(KEYS.attempts, []);
}

function getSession() {
  return load(KEYS.session, null);
}

function setSession(user) {
  if (!user) {
    localStorage.removeItem(KEYS.session);
    return;
  }
  save(KEYS.session, { id: user.id, name: user.name, email: user.email, role: user.role });
}

function login(email, password) {
  const users = load(KEYS.users, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { ok: false, message: 'Invalid email or password' };
  setSession(user);
  return { ok: true, user };
}

function registerLearner(name, email, password) {
  const users = load(KEYS.users, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: 'Email already registered' };
  }
  const user = { id: uid(), name, email, password, role: 'learner' };
  users.push(user);
  save(KEYS.users, users);
  setSession(user);
  return { ok: true, user };
}

function logout() {
  setSession(null);
  showLogin();
}

function getCourses() {
  return load(KEYS.courses, []);
}

function getCourse(id) {
  return getCourses().find((c) => c.id === id);
}

function getEnrolments() {
  return load(KEYS.enrolments, []);
}

function saveEnrolments(list) {
  save(KEYS.enrolments, list);
}

function getAssignments() {
  return load(KEYS.assignments, []);
}

function getSubmissions() {
  return load(KEYS.submissions, []);
}

function saveSubmissions(list) {
  save(KEYS.submissions, list);
}

function getProgressAll() {
  return load(KEYS.progress, []);
}

function getProgress(learnerId, courseId) {
  const all = getProgressAll();
  let row = all.find((p) => p.learnerId === learnerId && p.courseId === courseId);
  if (!row) row = { learnerId, courseId, completedLessonIds: [], percent: 0 };
  return row;
}

function saveProgress(row) {
  const all = getProgressAll();
  const i = all.findIndex((p) => p.learnerId === row.learnerId && p.courseId === row.courseId);
  if (i >= 0) all[i] = row;
  else all.push(row);
  save(KEYS.progress, all);
}

function computePercent(course, completedIds) {
  if (!course.lessons.length) return 0;
  return Math.round((completedIds.length / course.lessons.length) * 100);
}

function markLessonComplete(learnerId, courseId, lessonId) {
  const course = getCourse(courseId);
  if (!course) return;
  const row = getProgress(learnerId, courseId);
  if (!row.completedLessonIds.includes(lessonId)) row.completedLessonIds.push(lessonId);
  row.percent = computePercent(course, row.completedLessonIds);
  saveProgress(row);
}

function enrolmentFor(learnerId, courseId) {
  return getEnrolments().find((e) => e.learnerId === learnerId && e.courseId === courseId);
}

// ---------- UI ----------
let quizState = null;

const content = () => document.getElementById('content');
const bottomNav = () => document.getElementById('bottom-nav');
const btnBack = () => document.getElementById('btn-back');

function showLogin() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
}

function showApp() {
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app-view').classList.remove('d-none');
  const s = getSession();
  document.getElementById('user-chip').textContent = s ? `${s.name} · ${s.role}` : '';
  renderNav();
  goHome();
}

function renderNav() {
  const s = getSession();
  if (!s) return;
  if (s.role === 'trainer') {
    bottomNav().innerHTML = `
      <a href="#" data-nav="home" class="active"><i class="bi bi-grid-1x2"></i>Home</a>
      <a href="#" data-nav="approvals"><i class="bi bi-person-check"></i>Approvals</a>
      <a href="#" data-nav="grade"><i class="bi bi-pencil-square"></i>Grade</a>
      <a href="#" data-nav="report"><i class="bi bi-graph-up"></i>Reports</a>
      <a href="#" data-nav="about"><i class="bi bi-info-circle"></i>About</a>`;
  } else {
    bottomNav().innerHTML = `
      <a href="#" data-nav="home" class="active"><i class="bi bi-grid-1x2"></i>Home</a>
      <a href="#" data-nav="catalog"><i class="bi bi-search"></i>Catalog</a>
      <a href="#" data-nav="mycourses"><i class="bi bi-journal-bookmark"></i>My courses</a>
      <a href="#" data-nav="about"><i class="bi bi-info-circle"></i>About</a>`;
  }
  bottomNav().querySelectorAll('[data-nav]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const n = a.dataset.nav;
      if (n === 'home') goHome();
      if (n === 'approvals') renderApprovals();
      if (n === 'grade') renderGrading();
      if (n === 'report') renderReport();
      if (n === 'catalog') renderCatalog();
      if (n === 'mycourses') renderLearnerHome();
      if (n === 'about') renderAbout();
      bottomNav().querySelectorAll('a').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
    });
  });
}

function setBack(handler) {
  const b = btnBack();
  if (!handler) {
    b.classList.add('d-none');
    b.onclick = null;
    return;
  }
  b.classList.remove('d-none');
  b.onclick = handler;
}

function goHome() {
  const s = getSession();
  setBack(null);
  if (s.role === 'trainer') renderTrainerHome();
  else renderLearnerHome();
}

function renderTrainerHome() {
  const courses = getCourses();
  const enrolments = getEnrolments();
  const pending = enrolments.filter((e) => e.status === 'pending').length;
  const submissions = getSubmissions().filter((s) => s.status === 'submitted');
  const learners = load(KEYS.users, []).filter((u) => u.role === 'learner');
  const progress = getProgressAll();
  const avg = progress.length === 0 ? 0 : Math.round(progress.reduce((a, p) => a + p.percent, 0) / progress.length);

  content().innerHTML = `
    <h2 class="page-title">Trainer dashboard</h2>
    <div class="card-grid mb-3">
      <div class="stat-card"><div class="label">Courses</div><div class="value">${courses.length}</div></div>
      <div class="stat-card"><div class="label">Learners</div><div class="value">${learners.length}</div></div>
      <div class="stat-card"><div class="label">Pending approvals</div><div class="value">${pending}</div></div>
      <div class="stat-card"><div class="label">To grade</div><div class="value">${submissions.length}</div></div>
      <div class="stat-card"><div class="label">Avg progress</div><div class="value">${avg}%</div></div>
    </div>
    ${pending ? `<div class="list-card" style="border-color:#eab308"><h3>Action needed</h3><p>${pending} enrolment request(s) waiting for approval. Open Approvals in the menu.</p></div>` : ''}
    <h3 class="h6 text-secondary mb-2">Courses</h3>
    ${courses
      .map(
        (c) => `
      <div class="list-card" data-open-course="${c.id}">
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <div class="meta">
          <span class="badge-soft">${c.category}</span>
          <span class="badge-soft">${c.lessons.length} lessons</span>
          <span class="badge-soft">${enrolments.filter((e) => e.courseId === c.id && e.status === 'approved').length} enrolled</span>
        </div>
      </div>`
      )
      .join('')}`;

  content()
    .querySelectorAll('[data-open-course]')
    .forEach((el) => el.addEventListener('click', () => renderCourseDetail(el.dataset.openCourse, true)));
}

function renderApprovals() {
  setBack(null);
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const pending = getEnrolments().filter((e) => e.status === 'pending');

  content().innerHTML = `
    <h2 class="page-title">Enrolment approvals</h2>
    <p class="text-secondary mb-3">Approve or reject learner requests to join a course.</p>
    ${
      pending.length === 0
        ? '<div class="empty">No pending requests</div>'
        : pending
            .map((e) => {
              const learner = users.find((u) => u.id === e.learnerId);
              const course = courses.find((c) => c.id === e.courseId);
              return `
          <div class="list-card">
            <h3>${learner?.name || 'Learner'}</h3>
            <p>${course?.title || 'Course'} · ${learner?.email || ''}</p>
            <div class="meta mt-2 gap-2">
              <button class="btn btn-sm btn-primary" data-approve="${e.id}">Approve</button>
              <button class="btn btn-sm btn-outline-light" data-reject="${e.id}">Reject</button>
            </div>
          </div>`;
            })
            .join('')
    }`;

  content().querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const list = getEnrolments();
      const row = list.find((x) => x.id === btn.dataset.approve);
      if (row) {
        row.status = 'approved';
        saveEnrolments(list);
      }
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const list = getEnrolments().filter((x) => x.id !== btn.dataset.reject);
      saveEnrolments(list);
      renderApprovals();
    });
  });
}

function renderGrading() {
  setBack(null);
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const assignments = getAssignments();
  const toGrade = getSubmissions().filter((s) => s.status === 'submitted');

  content().innerHTML = `
    <h2 class="page-title">Grade submissions</h2>
    <p class="text-secondary mb-3">Review learner assignments and award a mark.</p>
    ${
      toGrade.length === 0
        ? '<div class="empty">No submissions waiting</div>'
        : toGrade
            .map((sub) => {
              const learner = users.find((u) => u.id === sub.learnerId);
              const course = courses.find((c) => c.id === sub.courseId);
              const asg = assignments.find((a) => a.id === sub.assignmentId);
              return `
          <div class="list-card">
            <h3>${asg?.title || 'Assignment'}</h3>
            <p>${learner?.name || ''} · ${course?.title || ''}</p>
            <div class="content-block mt-2 mb-2" style="font-size:.9rem">${escapeHtml(sub.text)}</div>
            <div class="d-flex gap-2 align-items-center">
              <input type="number" class="form-control form-control-sm" style="max-width:100px" min="0" max="100" value="75" id="score-${sub.id}">
              <button class="btn btn-sm btn-primary" data-grade="${sub.id}">Save grade</button>
            </div>
          </div>`;
            })
            .join('')
    }`;

  content().querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.grade;
      const score = Number(document.getElementById('score-' + id).value);
      const list = getSubmissions();
      const sub = list.find((s) => s.id === id);
      if (!sub) return;
      sub.status = 'graded';
      sub.score = score;
      sub.gradedAt = new Date().toISOString();
      saveSubmissions(list);
      const asg = getAssignments().find((a) => a.id === sub.assignmentId);
      if (asg) markLessonComplete(sub.learnerId, sub.courseId, asg.lessonId);
      renderGrading();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function renderLearnerHome() {
  const s = getSession();
  setBack(null);
  const enrolled = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'approved');
  const pending = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'pending');
  const courses = getCourses().filter((c) => enrolled.some((e) => e.courseId === c.id));

  content().innerHTML = `
    <h2 class="page-title">My learning</h2>
    ${pending.length ? `<div class="list-card mb-2"><h3>Pending approval</h3><p>You have ${pending.length} course request(s) waiting for a trainer.</p></div>` : ''}
    ${
      courses.length === 0
        ? '<div class="empty">No approved courses yet. Open <strong>Catalog</strong> to request enrolment.</div>'
        : courses
            .map((c) => {
              const p = getProgress(s.id, c.id);
              const cert = p.percent >= 100;
              return `
          <div class="list-card" data-open-course="${c.id}">
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="meta w-100">
              <div class="progress flex-grow-1" style="max-width:180px">
                <div class="progress-bar" style="width:${p.percent}%"></div>
              </div>
              <span class="badge-soft">${p.percent}%</span>
              ${cert ? '<span class="badge-soft badge-ok">Certificate ready</span>' : ''}
            </div>
          </div>`;
            })
            .join('')
    }`;

  content()
    .querySelectorAll('[data-open-course]')
    .forEach((el) => el.addEventListener('click', () => renderCourseDetail(el.dataset.openCourse, false)));
}

function renderCatalog() {
  setBack(null);
  const s = getSession();
  const courses = getCourses();

  content().innerHTML = `
    <h2 class="page-title">Course catalog</h2>
    <p class="text-secondary mb-3">Request enrolment — a trainer must approve before you can start.</p>
    ${courses
      .map((c) => {
        const en = enrolmentFor(s.id, c.id);
        let action = `<button class="btn btn-sm btn-primary" data-request="${c.id}">Request enrolment</button>`;
        if (en?.status === 'approved') action = `<span class="badge-soft badge-ok">Enrolled</span>`;
        if (en?.status === 'pending') action = `<span class="badge-soft badge-warn">Pending approval</span>`;
        return `
        <div class="list-card">
          <h3>${c.title}</h3>
          <p>${c.description}</p>
          <div class="meta">
            <span class="badge-soft">${c.category}</span>
            <span class="badge-soft">${c.lessons.length} lessons</span>
            ${action}
          </div>
        </div>`;
      })
      .join('')}`;

  content().querySelectorAll('[data-request]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const courseId = btn.dataset.request;
      if (enrolmentFor(s.id, courseId)) return;
      const list = getEnrolments();
      list.push({
        id: uid(),
        courseId,
        learnerId: s.id,
        status: 'pending',
        enrolledAt: new Date().toISOString(),
      });
      saveEnrolments(list);
      renderCatalog();
    });
  });
}

function renderCourseDetail(courseId, asTrainer) {
  const course = getCourse(courseId);
  if (!course) return;
  const s = getSession();
  const progress = asTrainer ? null : getProgress(s.id, courseId);
  const enrolled = getEnrolments().filter((e) => e.courseId === courseId && e.status === 'approved');

  setBack(() => (asTrainer ? renderTrainerHome() : renderLearnerHome()));

  const showCert = !asTrainer && progress && progress.percent >= 100;

  content().innerHTML = `
    <h2 class="page-title">${course.title}</h2>
    <p class="text-secondary">${course.description}</p>
    ${
      asTrainer
        ? `<p class="mb-3"><span class="badge-soft">${enrolled.length} learners enrolled</span></p>`
        : `<div class="mb-3"><div class="progress mb-1"><div class="progress-bar" style="width:${progress.percent}%"></div></div>
           <small class="text-secondary">${progress.percent}% complete</small></div>`
    }
    ${showCert ? `<button class="btn btn-primary w-100 mb-3" id="btn-cert"><i class="bi bi-award"></i> View certificate</button>` : ''}
    <h3 class="h6 text-secondary mb-2">Lessons & assessments</h3>
    ${course.lessons
      .sort((a, b) => a.order - b.order)
      .map((lesson, idx) => {
        const done = progress?.completedLessonIds?.includes(lesson.id);
        const typeLabel =
          lesson.type === 'quiz' ? 'Quiz' : lesson.type === 'assignment' ? 'Assignment' : 'Lesson';
        return `
        <div class="lesson-card ${done ? 'done' : ''}" data-lesson="${lesson.id}">
          <div class="num">${done ? '✓' : idx + 1}</div>
          <div class="flex-grow-1">
            <h4>${lesson.title}</h4>
            <p>${typeLabel}${done ? ' · Completed' : ''}</p>
          </div>
          <i class="bi bi-chevron-right text-secondary"></i>
        </div>`;
      })
      .join('')}`;

  document.getElementById('btn-cert')?.addEventListener('click', () => renderCertificate(courseId));

  content()
    .querySelectorAll('[data-lesson]')
    .forEach((el) => {
      el.addEventListener('click', () => {
        const lesson = course.lessons.find((l) => l.id === el.dataset.lesson);
        if (lesson.type === 'quiz') renderQuiz(courseId, lesson, asTrainer);
        else if (lesson.type === 'assignment') renderAssignment(courseId, lesson, asTrainer);
        else renderLesson(courseId, lesson, asTrainer);
      });
    });
}

function renderCertificate(courseId) {
  const course = getCourse(courseId);
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, false));
  content().innerHTML = `
    <div class="content-block text-center" style="border:2px solid #2563eb">
      <p class="text-secondary mb-1">Certificate of Completion</p>
      <h2 class="mb-2">${s.name}</h2>
      <p class="mb-3">has successfully completed</p>
      <h3 class="mb-3">${course.title}</h3>
      <p class="text-secondary small mb-0">EduFlow LMS · ${new Date().toLocaleDateString('en-ZA')}</p>
    </div>
    <p class="text-secondary small text-center mt-3">Demo certificate for pilot use. Production can issue PDF certificates.</p>`;
}

function renderLesson(courseId, lesson, asTrainer) {
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, asTrainer));
  const done = !asTrainer && getProgress(s.id, courseId).completedLessonIds.includes(lesson.id);

  content().innerHTML = `
    <h2 class="page-title">${lesson.title}</h2>
    <div class="content-block">${lesson.body}</div>
    ${
      asTrainer
        ? '<p class="text-secondary small">Trainer preview</p>'
        : done
          ? '<button class="btn btn-outline-light w-100" disabled>Completed</button>'
          : `<button class="btn btn-primary w-100" id="btn-complete">Mark as complete</button>`
    }`;

  document.getElementById('btn-complete')?.addEventListener('click', () => {
    markLessonComplete(s.id, courseId, lesson.id);
    renderCourseDetail(courseId, false);
  });
}

function renderAssignment(courseId, lesson, asTrainer) {
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, asTrainer));
  const asg = getAssignments().find((a) => a.id === lesson.assignmentId) || {
    id: lesson.assignmentId,
    instructions: lesson.body,
    maxScore: 100,
  };
  const subs = getSubmissions().filter(
    (x) => x.assignmentId === asg.id && x.learnerId === (asTrainer ? x.learnerId : s.id)
  );
  const mine = getSubmissions().find((x) => x.assignmentId === asg.id && x.learnerId === s.id);

  if (asTrainer) {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <div class="content-block">${asg.instructions || lesson.body}</div>
      <p class="text-secondary">Learners submit written work here. Grade them under <strong>Grade</strong> in the menu.</p>`;
    return;
  }

  if (mine?.status === 'graded') {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <div class="content-block">${escapeHtml(mine.text)}</div>
      <div class="stat-card mb-3"><div class="label">Your mark</div><div class="value">${mine.score}%</div></div>
      <button class="btn btn-outline-light w-100" id="btn-back-c">Back to course</button>`;
    document.getElementById('btn-back-c').onclick = () => renderCourseDetail(courseId, false);
    return;
  }

  if (mine?.status === 'submitted') {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <p class="badge-soft badge-warn mb-3">Submitted — waiting for grade</p>
      <div class="content-block">${escapeHtml(mine.text)}</div>
      <button class="btn btn-outline-light w-100" id="btn-back-c">Back to course</button>`;
    document.getElementById('btn-back-c').onclick = () => renderCourseDetail(courseId, false);
    return;
  }

  content().innerHTML = `
    <h2 class="page-title">${lesson.title}</h2>
    <div class="content-block mb-3">${asg.instructions || lesson.body}</div>
    <label class="form-label">Your submission</label>
    <textarea class="form-control mb-3" id="sub-text" rows="5" placeholder="Type your answer here..."></textarea>
    <button class="btn btn-primary w-100" id="btn-submit">Submit assignment</button>`;

  document.getElementById('btn-submit').addEventListener('click', () => {
    const text = document.getElementById('sub-text').value.trim();
    if (text.length < 20) {
      alert('Please write a bit more before submitting (at least a few sentences).');
      return;
    }
    const list = getSubmissions();
    list.push({
      id: uid(),
      assignmentId: asg.id,
      courseId,
      learnerId: s.id,
      text,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      score: null,
    });
    saveSubmissions(list);
    renderAssignment(courseId, lesson, false);
  });
}

function renderQuiz(courseId, lesson, asTrainer) {
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, asTrainer));

  if (asTrainer) {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <p class="text-secondary">Trainer preview — ${lesson.quiz.questions.length} questions, pass mark ${lesson.quiz.passMark}%.</p>
      <ol class="content-block">
        ${lesson.quiz.questions.map((q) => `<li class="mb-2">${q.q}</li>`).join('')}
      </ol>`;
    return;
  }

  quizState = {
    courseId,
    lessonId: lesson.id,
    questions: lesson.quiz.questions,
    passMark: lesson.quiz.passMark,
    index: 0,
    answers: [],
  };
  drawQuizQuestion();
}

function drawQuizQuestion() {
  const q = quizState.questions[quizState.index];
  const n = quizState.index + 1;
  const total = quizState.questions.length;

  content().innerHTML = `
    <h2 class="page-title">Question ${n} of ${total}</h2>
    <p class="mb-3">${q.q}</p>
    ${q.options.map((opt, i) => `<button type="button" class="quiz-option" data-opt="${i}">${opt}</button>`).join('')}
    <button class="btn btn-primary w-100 mt-2" id="btn-next-q" disabled>Next</button>`;

  let selected = null;
  content().querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      content().querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selected = Number(btn.dataset.opt);
      document.getElementById('btn-next-q').disabled = false;
    });
  });

  document.getElementById('btn-next-q').addEventListener('click', () => {
    quizState.answers[quizState.index] = selected;
    if (quizState.index < quizState.questions.length - 1) {
      quizState.index += 1;
      drawQuizQuestion();
    } else finishQuiz();
  });
}

function finishQuiz() {
  const s = getSession();
  let correct = 0;
  quizState.questions.forEach((q, i) => {
    if (quizState.answers[i] === q.correctIndex) correct += 1;
  });
  const score = Math.round((correct / quizState.questions.length) * 100);
  const passed = score >= quizState.passMark;

  const attempts = load(KEYS.attempts, []);
  attempts.push({
    id: uid(),
    learnerId: s.id,
    courseId: quizState.courseId,
    lessonId: quizState.lessonId,
    score,
    passed,
    at: new Date().toISOString(),
  });
  save(KEYS.attempts, attempts);
  if (passed) markLessonComplete(s.id, quizState.courseId, quizState.lessonId);

  content().innerHTML = `
    <h2 class="page-title">Quiz result</h2>
    <div class="stat-card mb-3 text-center">
      <div class="label">Your score</div>
      <div class="value">${score}%</div>
      <div class="mt-2">${passed ? '<span class="badge-soft badge-ok">Passed</span>' : '<span class="badge-soft badge-warn">Not passed</span>'}</div>
    </div>
    <p class="text-secondary">Pass mark: ${quizState.passMark}% · Correct: ${correct}/${quizState.questions.length}</p>
    <button class="btn btn-primary w-100" id="btn-back-course">Back to course</button>`;

  document.getElementById('btn-back-course').addEventListener('click', () => {
    renderCourseDetail(quizState.courseId, false);
  });
}

function renderReport() {
  setBack(null);
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const enrolments = getEnrolments().filter((e) => e.status === 'approved');
  const progress = getProgressAll();
  const attempts = load(KEYS.attempts, []);
  const submissions = getSubmissions();

  const rows = enrolments.map((e) => {
    const learner = users.find((u) => u.id === e.learnerId);
    const course = courses.find((c) => c.id === e.courseId);
    const p = progress.find((x) => x.learnerId === e.learnerId && x.courseId === e.courseId);
    const quizAttempts = attempts.filter((a) => a.learnerId === e.learnerId && a.courseId === e.courseId);
    const best = quizAttempts.reduce((m, a) => Math.max(m, a.score), null);
    const graded = submissions.filter(
      (s) => s.learnerId === e.learnerId && s.courseId === e.courseId && s.status === 'graded'
    );
    const avgAssign =
      graded.length === 0 ? '—' : Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) + '%';
    return {
      learner: learner?.name || '—',
      course: course?.title || '—',
      percent: p?.percent ?? 0,
      quiz: best === null ? '—' : best + '%',
      assignment: avgAssign,
    };
  });

  content().innerHTML = `
    <h2 class="page-title">Progress report</h2>
    <div class="content-block p-0 overflow-auto">
      <table class="table-dark-ef">
        <thead><tr><th>Learner</th><th>Course</th><th>Progress</th><th>Quiz</th><th>Assignment</th></tr></thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (r) =>
                      `<tr><td>${r.learner}</td><td>${r.course}</td><td>${r.percent}%</td><td>${r.quiz}</td><td>${r.assignment}</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="5">No approved enrolments</td></tr>'
          }
        </tbody>
      </table>
    </div>`;
}

function renderAbout() {
  setBack(null);
  content().innerHTML = `
    <h2 class="page-title">About EduFlow</h2>
    <div class="content-block">
      <p class="mb-2"><strong>EduFlow LMS</strong></p>
      <p class="mb-2 text-secondary">Pilot for training providers: catalogue, enrolment approval, lessons, quizzes, written assignments, grading, progress reports and completion certificates.</p>
      <p class="mb-0 text-secondary small">Version 1.1.0 · Demo data is stored in this browser only.</p>
    </div>
    <div class="content-block">
      <p class="mb-1"><strong>Going live for real students</strong></p>
      <p class="text-secondary small mb-0">This demo runs on one device. For real multi-user enrolments you need a cloud backend (e.g. Firebase or Supabase). See the README in the GitHub repo for the go-live checklist.</p>
    </div>
    <button class="btn btn-outline-light w-100" id="btn-reset">Reset demo data</button>`;

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (!confirm('Reset all demo data and log out?')) return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    seedIfNeeded();
    logout();
  });
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  seedIfNeeded();
  setTimeout(() => document.getElementById('splash')?.classList.add('hide'), 900);

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const err = document.getElementById('login-error');
    const result = login(email, password);
    if (!result.ok) {
      err.textContent = result.message;
      err.classList.remove('d-none');
      return;
    }
    err.classList.add('d-none');
    showApp();
  });

  document.getElementById('btn-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = prompt('Full name');
    if (!name) return;
    const email = prompt('Email');
    if (!email) return;
    const password = prompt('Password (min 6 characters)');
    if (!password || password.length < 6) {
      alert('Password too short');
      return;
    }
    const result = registerLearner(name, email, password);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    showApp();
  });

  document.getElementById('btn-logout')?.addEventListener('click', logout);

  if (getSession()) showApp();
  else showLogin();
});
