import {
  KEYS,
  load,
  save,
  uid,
  seedIfNeeded,
  onLiveChange,
  getLiveMode,
} from './store.js';

function getSession() {
  return load(KEYS.session, null);
}

function setSession(user) {
  if (!user) {
    localStorage.removeItem(KEYS.session);
    return;
  }
  save(
    KEYS.session,
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gmail: user.gmail || user.email,
    },
    { silent: true }
  );
}

function login(email, password) {
  const users = load(KEYS.users, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return { ok: false, message: 'Invalid email or password' };
  setSession(user);
  return { ok: true, user };
}

function registerLearner(name, email, password) {
  const users = load(KEYS.users, []);
  const em = email.trim().toLowerCase();
  if (!em.includes('@')) return { ok: false, message: 'Enter a valid email (Gmail preferred)' };
  if (users.some((u) => u.email.toLowerCase() === em)) {
    return { ok: false, message: 'Email already registered' };
  }
  const user = {
    id: uid(),
    name: name.trim(),
    email: em,
    password,
    role: 'learner',
    gmail: em,
  };
  users.push(user);
  save(KEYS.users, users);

  const messages = load(KEYS.messages, []);
  messages.unshift({
    id: uid(),
    toUserId: user.id,
    toEmail: em,
    subject: 'Welcome — communications linked to your email',
    body:
      'Your EduFlow account is linked to ' +
      em +
      '. The training provider will use this address for enrolment decisions, assessment results and notices. Check Messages in the app and your Gmail inbox in production.',
    at: new Date().toISOString(),
    read: false,
  });
  save(KEYS.messages, messages);

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

function pushMessage(toUserId, toEmail, subject, body) {
  const messages = load(KEYS.messages, []);
  messages.unshift({
    id: uid(),
    toUserId,
    toEmail,
    subject,
    body,
    at: new Date().toISOString(),
    read: false,
  });
  save(KEYS.messages, messages);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function formatBody(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function saqaMetaHtml(c) {
  const level = c.nqfLevel != null ? c.nqfLevel : 4;
  const credits = c.credits != null ? c.credits : '—';
  const saqa = c.saqaId ? `SAQA ${c.saqaId}` : 'SAQA —';
  return `<div class="meta">
    <span class="badge-soft">NQF ${level}</span>
    <span class="badge-soft">${credits} credits</span>
    <span class="badge-soft">${saqa}</span>
  </div>`;
}

function saqaDetailHtml(c) {
  const outcomes = (c.outcomes || []).map((o) => `<li>${escapeHtml(o)}</li>`).join('');
  return `<div class="content-block mb-3">
    <p class="mb-1"><strong>SAQA reference</strong></p>
    <p class="text-secondary small mb-2">${escapeHtml(c.saqaTitle || c.title || '')} · ID <strong>${escapeHtml(String(c.saqaId || '—'))}</strong> · NQF ${c.nqfLevel || 4} · ${c.credits != null ? c.credits + ' credits' : 'credits n/a'}</p>
    ${c.relatedSaqaNote ? `<p class="text-secondary small mb-2">${escapeHtml(c.relatedSaqaNote)}${c.relatedSaqaId ? ' (related ID ' + escapeHtml(String(c.relatedSaqaId)) + ')' : ''}</p>` : ''}
    ${c.purpose ? `<p class="mb-2"><strong>Purpose</strong><br>${escapeHtml(c.purpose)}</p>` : ''}
    ${outcomes ? `<p class="mb-1"><strong>Learning outcomes (pilot)</strong></p><ul class="mb-0 text-secondary small">${outcomes}</ul>` : ''}
    <p class="text-secondary small mt-2 mb-0">Demo modules only. Accredited delivery requires a registered provider and licensed materials.</p>
  </div>`;
}

let quizState = null;
let currentView = { name: 'home' };

const content = () => document.getElementById('content');
const bottomNav = () => document.getElementById('bottom-nav');
const btnBack = () => document.getElementById('btn-back');

function updateLiveBadge() {
  const el = document.getElementById('live-badge');
  if (!el) return;
  el.textContent = getLiveMode() === 'firebase' ? '● Live cloud' : '● Live sync';
  el.className = 'live-badge on';
}

function flashLive() {
  const el = document.getElementById('live-badge');
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 600);
}

function refreshCurrentView() {
  if (!getSession()) return;
  flashLive();
  const n = currentView.name;
  if (n === 'home') goHome();
  else if (n === 'approvals') renderApprovals();
  else if (n === 'grade') renderGrading();
  else if (n === 'report') renderReport();
  else if (n === 'catalog') renderCatalog();
  else if (n === 'results') renderResults();
  else if (n === 'messages') renderMessages();
  else if (n === 'about') renderAbout();
  else if (n === 'course' && currentView.courseId)
    renderCourseDetail(currentView.courseId, currentView.asTrainer);
}

function showLogin() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
}

function showApp() {
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app-view').classList.remove('d-none');
  const s = getSession();
  document.getElementById('user-chip').textContent = s ? `${s.name} · ${s.role}` : '';
  updateLiveBadge();
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
      <a href="#" data-nav="about"><i class="bi bi-info-circle"></i>More</a>`;
  } else {
    bottomNav().innerHTML = `
      <a href="#" data-nav="home" class="active"><i class="bi bi-grid-1x2"></i>Home</a>
      <a href="#" data-nav="catalog"><i class="bi bi-journal-plus"></i>Courses</a>
      <a href="#" data-nav="results"><i class="bi bi-clipboard-check"></i>Results</a>
      <a href="#" data-nav="messages"><i class="bi bi-envelope"></i>Inbox</a>
      <a href="#" data-nav="about"><i class="bi bi-info-circle"></i>More</a>`;
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
      if (n === 'results') renderResults();
      if (n === 'messages') renderMessages();
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
  currentView = { name: 'home' };
  const s = getSession();
  setBack(null);
  if (s.role === 'trainer') renderTrainerHome();
  else renderLearnerHome();
}

function renderTrainerHome() {
  currentView = { name: 'home' };
  const courses = getCourses();
  const enrolments = getEnrolments();
  const pending = enrolments.filter((e) => e.status === 'pending').length;
  const submissions = getSubmissions().filter((s) => s.status === 'submitted');
  const learners = load(KEYS.users, []).filter((u) => u.role === 'learner');

  content().innerHTML = `
    <h2 class="page-title">Administrator dashboard</h2>
    <p class="text-secondary small mb-3">Manage applications, course access, assessments and results. Notices go to each learner’s linked Gmail.</p>
    <div class="card-grid mb-3">
      <div class="stat-card"><div class="label">Programmes</div><div class="value">${courses.length}</div></div>
      <div class="stat-card"><div class="label">Learners</div><div class="value">${learners.length}</div></div>
      <div class="stat-card"><div class="label">Pending access</div><div class="value">${pending}</div></div>
      <div class="stat-card"><div class="label">To grade</div><div class="value">${submissions.length}</div></div>
    </div>
    ${pending ? `<div class="list-card" style="border-color:#eab308"><h3>Applications / enrolment requests</h3><p>${pending} waiting. Open Approvals to grant course access.</p></div>` : ''}
    <h3 class="h6 text-secondary mb-2">NQF programmes</h3>
    ${courses
      .map(
        (c) => `
      <div class="list-card" data-open-course="${c.id}">
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        ${saqaMetaHtml(c)}
        <div class="meta">
          <span class="badge-soft">${c.lessons.length} modules</span>
          <span class="badge-soft">${enrolments.filter((e) => e.courseId === c.id && e.status === 'approved').length} enrolled</span>
        </div>
      </div>`
      )
      .join('')}`;

  content()
    .querySelectorAll('[data-open-course]')
    .forEach((el) =>
      el.addEventListener('click', () => renderCourseDetail(el.dataset.openCourse, true))
    );
}

function renderApprovals() {
  currentView = { name: 'approvals' };
  setBack(null);
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const pending = getEnrolments().filter((e) => e.status === 'pending');

  content().innerHTML = `
    <h2 class="page-title">Applications & access</h2>
    <p class="text-secondary mb-3">Approve course access. Learner is notified on their linked Gmail address.</p>
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
            <p>${course?.title || 'Course'}<br><span class="text-secondary">Gmail: ${learner?.gmail || learner?.email || ''}</span></p>
            <div class="meta mt-2 gap-2">
              <button class="btn btn-sm btn-primary" data-approve="${e.id}">Approve access</button>
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
      if (!row) return;
      row.status = 'approved';
      saveEnrolments(list);
      const learner = load(KEYS.users, []).find((u) => u.id === row.learnerId);
      const course = getCourse(row.courseId);
      if (learner) {
        pushMessage(
          learner.id,
          learner.gmail || learner.email,
          'Course access approved: ' + (course?.title || ''),
          'You now have access to modules, learner guides and assessments for ' +
            (course?.title || 'your course') +
            '. Open My learning to start.'
        );
      }
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const list = getEnrolments();
      const row = list.find((x) => x.id === btn.dataset.reject);
      if (row) {
        const learner = load(KEYS.users, []).find((u) => u.id === row.learnerId);
        const course = getCourse(row.courseId);
        if (learner) {
          pushMessage(
            learner.id,
            learner.gmail || learner.email,
            'Course request update',
            'Your request for ' + (course?.title || 'a course') + ' was not approved. Contact your training provider if you need help.'
          );
        }
      }
      saveEnrolments(list.filter((x) => x.id !== btn.dataset.reject));
      renderApprovals();
    });
  });
}

function renderGrading() {
  currentView = { name: 'grade' };
  setBack(null);
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const assignments = getAssignments();
  const toGrade = getSubmissions().filter((s) => s.status === 'submitted');

  content().innerHTML = `
    <h2 class="page-title">Grade assessments</h2>
    <p class="text-secondary mb-3">Mark written work. Results appear in the learner Results screen and inbox.</p>
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
            <p>${learner?.name || ''} · ${course?.title || ''}<br><span class="text-secondary">${learner?.gmail || ''}</span></p>
            <div class="content-block mt-2 mb-2" style="font-size:.9rem">${escapeHtml(sub.text)}</div>
            <div class="d-flex gap-2 align-items-center flex-wrap">
              <input type="number" class="form-control form-control-sm" style="max-width:100px" min="0" max="100" value="75" id="score-${sub.id}">
              <button class="btn btn-sm btn-primary" data-grade="${sub.id}">Save result</button>
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
      const learner = load(KEYS.users, []).find((u) => u.id === sub.learnerId);
      if (learner) {
        pushMessage(
          learner.id,
          learner.gmail || learner.email,
          'Assessment result: ' + (asg?.title || 'Assignment'),
          'Your mark is ' + score + '%. Open Results in EduFlow to view all scores.'
        );
      }
      renderGrading();
    });
  });
}

function renderLearnerHome() {
  currentView = { name: 'home' };
  const s = getSession();
  setBack(null);
  const enrolled = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'approved');
  const pending = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'pending');
  const courses = getCourses().filter((c) => enrolled.some((e) => e.courseId === c.id));
  const unread = load(KEYS.messages, []).filter((m) => m.toUserId === s.id && !m.read).length;

  content().innerHTML = `
    <h2 class="page-title">My learning</h2>
    <p class="text-secondary small mb-2">Linked Gmail: <strong>${s.gmail || s.email}</strong></p>
    ${unread ? `<div class="list-card mb-2" style="border-color:#2563eb"><h3>Inbox</h3><p>${unread} new message(s).</p></div>` : ''}
    ${pending.length ? `<div class="list-card mb-2"><h3>Pending application</h3><p>${pending.length} course request(s) awaiting approval.</p></div>` : ''}
    ${
      courses.length === 0
        ? '<div class="empty">Choose a programme under <strong>Courses</strong> to apply.</div>'
        : courses
            .map((c) => {
              const p = getProgress(s.id, c.id);
              return `
          <div class="list-card" data-open-course="${c.id}">
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            ${saqaMetaHtml(c)}
            <div class="meta w-100">
              <div class="progress flex-grow-1" style="max-width:180px">
                <div class="progress-bar" style="width:${p.percent}%"></div>
              </div>
              <span class="badge-soft">${p.percent}%</span>
            </div>
          </div>`;
            })
            .join('')
    }`;

  content()
    .querySelectorAll('[data-open-course]')
    .forEach((el) =>
      el.addEventListener('click', () => renderCourseDetail(el.dataset.openCourse, false))
    );
}

function renderCatalog() {
  currentView = { name: 'catalog' };
  setBack(null);
  const s = getSession();
  const courses = getCourses();

  content().innerHTML = `
    <h2 class="page-title">Choose your course</h2>
    <p class="text-secondary mb-3">Select an NQF-aligned programme. Administrator approval unlocks modules.</p>
    ${courses
      .map((c) => {
        const en = enrolmentFor(s.id, c.id);
        let action = `<button class="btn btn-sm btn-primary" data-request="${c.id}">Apply for this course</button>`;
        if (en?.status === 'approved') action = `<span class="badge-soft badge-ok">Access granted</span>`;
        if (en?.status === 'pending') action = `<span class="badge-soft badge-warn">Application pending</span>`;
        return `
        <div class="list-card">
          <h3>${c.title}</h3>
          <p>${c.description}</p>
          ${saqaMetaHtml(c)}
          <div class="meta">
            <span class="badge-soft">${c.category}</span>
            <span class="badge-soft">${c.lessons.length} items</span>
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
      const course = getCourse(courseId);
      pushMessage(
        s.id,
        s.gmail || s.email,
        'Application received: ' + (course?.title || ''),
        'We received your application. You will be notified when access is approved.'
      );
      renderCatalog();
    });
  });
}

function renderResults() {
  currentView = { name: 'results' };
  setBack(null);
  const s = getSession();
  const attempts = load(KEYS.attempts, []).filter((a) => a.learnerId === s.id);
  const subs = getSubmissions().filter((x) => x.learnerId === s.id);
  const courses = getCourses();

  content().innerHTML = `
    <h2 class="page-title">My results</h2>
    <p class="text-secondary mb-3">Quiz and assignment results for your linked account (${s.gmail || s.email}).</p>
    <h3 class="h6 text-secondary">Quizzes</h3>
    ${
      attempts.length
        ? `<div class="content-block p-0 overflow-auto"><table class="table-dark-ef"><thead><tr><th>Course</th><th>Score</th><th>Result</th></tr></thead><tbody>
        ${attempts
          .map((a) => {
            const c = courses.find((x) => x.id === a.courseId);
            return `<tr><td>${c?.title || a.courseId}</td><td>${a.score}%</td><td>${a.passed ? 'Pass' : 'Not yet'}</td></tr>`;
          })
          .join('')}
        </tbody></table></div>`
        : '<p class="text-secondary small">No quiz attempts yet.</p>'
    }
    <h3 class="h6 text-secondary mt-3">Assignments</h3>
    ${
      subs.length
        ? `<div class="content-block p-0 overflow-auto"><table class="table-dark-ef"><thead><tr><th>Task</th><th>Status</th><th>Mark</th></tr></thead><tbody>
        ${subs
          .map((sub) => {
            const asg = getAssignments().find((a) => a.id === sub.assignmentId);
            return `<tr><td>${asg?.title || 'Assignment'}</td><td>${sub.status}</td><td>${sub.score != null ? sub.score + '%' : '—'}</td></tr>`;
          })
          .join('')}
        </tbody></table></div>`
        : '<p class="text-secondary small">No submissions yet.</p>'
    }`;
}

function renderMessages() {
  currentView = { name: 'messages' };
  setBack(null);
  const s = getSession();
  const messages = load(KEYS.messages, []).filter((m) => m.toUserId === s.id);
  const all = load(KEYS.messages, []);
  all.forEach((m) => {
    if (m.toUserId === s.id) m.read = true;
  });
  save(KEYS.messages, all, { silent: true });

  content().innerHTML = `
    <h2 class="page-title">Inbox</h2>
    <p class="text-secondary mb-3">Linked to <strong>${s.gmail || s.email}</strong></p>
    ${
      messages.length === 0
        ? '<div class="empty">No messages yet</div>'
        : messages
            .map(
              (m) => `
      <div class="list-card">
        <h3>${escapeHtml(m.subject)}</h3>
        <p class="text-secondary small">${new Date(m.at).toLocaleString('en-ZA')}</p>
        <p class="mb-2">${escapeHtml(m.body)}</p>
        <a class="btn btn-sm btn-outline-light" href="mailto:${encodeURIComponent(s.gmail || s.email)}?subject=${encodeURIComponent('Re: ' + m.subject)}">Open in Gmail</a>
      </div>`
            )
            .join('')
    }`;
}

function renderCourseDetail(courseId, asTrainer) {
  currentView = { name: 'course', courseId, asTrainer };
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
    ${saqaDetailHtml(course)}
    ${
      asTrainer
        ? `<p class="mb-3"><span class="badge-soft">${enrolled.length} learners with access</span></p>`
        : `<div class="mb-3"><div class="progress mb-1"><div class="progress-bar" style="width:${progress.percent}%"></div></div>
           <small class="text-secondary">${progress.percent}% complete</small></div>`
    }
    ${showCert ? `<button class="btn btn-primary w-100 mb-3" id="btn-cert">View certificate</button>` : ''}
    <h3 class="h6 text-secondary mb-2">Modules, guides & assessments</h3>
    ${course.lessons
      .sort((a, b) => a.order - b.order)
      .map((lesson, idx) => {
        const done = progress?.completedLessonIds?.includes(lesson.id);
        const typeLabel =
          lesson.type === 'quiz'
            ? 'Assessment'
            : lesson.type === 'assignment'
              ? 'Summative assignment'
              : lesson.type === 'guide'
                ? 'Learner guide'
                : 'Module';
        return `
        <div class="lesson-card ${done ? 'done' : ''}" data-lesson="${lesson.id}">
          <div class="num">${done ? '✓' : idx + 1}</div>
          <div class="flex-grow-1">
            <h4>${lesson.title}</h4>
            <p>${typeLabel}${done ? ' · Done' : ''}</p>
          </div>
          <i class="bi bi-chevron-right text-secondary"></i>
        </div>`;
      })
      .join('')}`;

  document.getElementById('btn-cert')?.addEventListener('click', () => renderCertificate(courseId));

  content().querySelectorAll('[data-lesson]').forEach((el) => {
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
      <p class="text-secondary mb-1">Certificate of Completion (demo)</p>
      <h2 class="mb-2">${s.name}</h2>
      <p class="mb-3">has completed the pilot modules for</p>
      <h3 class="mb-3">${course.title}</h3>
      <p class="text-secondary small mb-0">SAQA ref ${course.saqaId || '—'} · EduFlow · ${new Date().toLocaleDateString('en-ZA')}</p>
    </div>`;
}

function renderLesson(courseId, lesson, asTrainer) {
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, asTrainer));
  const done = !asTrainer && getProgress(s.id, courseId).completedLessonIds.includes(lesson.id);
  const label = lesson.type === 'guide' ? 'Mark guide as read' : 'Mark module complete';

  content().innerHTML = `
    <h2 class="page-title">${lesson.title}</h2>
    <div class="content-block">${formatBody(lesson.body)}</div>
    ${
      asTrainer
        ? '<p class="text-secondary small">Administrator preview</p>'
        : done
          ? '<button class="btn btn-outline-light w-100" disabled>Completed</button>'
          : `<button class="btn btn-primary w-100" id="btn-complete">${label}</button>`
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
  };
  const mine = getSubmissions().find((x) => x.assignmentId === asg.id && x.learnerId === s.id);

  if (asTrainer) {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <div class="content-block">${formatBody(asg.instructions || lesson.body)}</div>
      <p class="text-secondary">Grade under <strong>Grade</strong>.</p>`;
    return;
  }

  if (mine?.status === 'graded') {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <div class="content-block">${escapeHtml(mine.text)}</div>
      <div class="stat-card mb-3"><div class="label">Your result</div><div class="value">${mine.score}%</div></div>
      <button class="btn btn-outline-light w-100" id="btn-back-c">Back</button>`;
    document.getElementById('btn-back-c').onclick = () => renderCourseDetail(courseId, false);
    return;
  }

  if (mine?.status === 'submitted') {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <p class="badge-soft badge-warn mb-3">Submitted — awaiting result</p>
      <div class="content-block">${escapeHtml(mine.text)}</div>
      <button class="btn btn-outline-light w-100" id="btn-back-c">Back</button>`;
    document.getElementById('btn-back-c').onclick = () => renderCourseDetail(courseId, false);
    return;
  }

  content().innerHTML = `
    <h2 class="page-title">${lesson.title}</h2>
    <div class="content-block mb-3">${formatBody(asg.instructions || lesson.body)}</div>
    <label class="form-label">Your submission</label>
    <textarea class="form-control mb-3" id="sub-text" rows="6" placeholder="Type your answer..."></textarea>
    <button class="btn btn-primary w-100" id="btn-submit">Submit for marking</button>`;

  document.getElementById('btn-submit').addEventListener('click', () => {
    const text = document.getElementById('sub-text').value.trim();
    if (text.length < 20) {
      alert('Please write a fuller answer before submitting.');
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
    pushMessage(
      s.id,
      s.gmail || s.email,
      'Submission received',
      'Your assignment was submitted. You will receive your result when it is graded.'
    );
    renderAssignment(courseId, lesson, false);
  });
}

function renderQuiz(courseId, lesson, asTrainer) {
  const s = getSession();
  setBack(() => renderCourseDetail(courseId, asTrainer));

  if (asTrainer) {
    content().innerHTML = `
      <h2 class="page-title">${lesson.title}</h2>
      <p class="text-secondary">${lesson.quiz.questions.length} questions · pass ${lesson.quiz.passMark}%</p>
      <ol class="content-block">${lesson.quiz.questions.map((q) => `<li class="mb-2">${q.q}</li>`).join('')}</ol>`;
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
  content().innerHTML = `
    <h2 class="page-title">Question ${quizState.index + 1} of ${quizState.questions.length}</h2>
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

  pushMessage(
    s.id,
    s.gmail || s.email,
    'Quiz result',
    'You scored ' + score + '% (' + (passed ? 'Pass' : 'Not yet passed') + '). See Results in the app.'
  );

  content().innerHTML = `
    <h2 class="page-title">Assessment result</h2>
    <div class="stat-card mb-3 text-center">
      <div class="label">Your score</div>
      <div class="value">${score}%</div>
      <div class="mt-2">${passed ? '<span class="badge-soft badge-ok">Passed</span>' : '<span class="badge-soft badge-warn">Not passed</span>'}</div>
    </div>
    <button class="btn btn-primary w-100" id="btn-back-course">Back to course</button>`;
  document.getElementById('btn-back-course').onclick = () =>
    renderCourseDetail(quizState.courseId, false);
}

function renderReport() {
  currentView = { name: 'report' };
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
      gmail: learner?.gmail || learner?.email || '',
      course: course?.title || '—',
      saqa: course?.saqaId || '—',
      percent: p?.percent ?? 0,
      quiz: best === null ? '—' : best + '%',
      assignment: avgAssign,
    };
  });

  content().innerHTML = `
    <h2 class="page-title">Progress & results report</h2>
    <div class="content-block p-0 overflow-auto">
      <table class="table-dark-ef">
        <thead><tr><th>Learner</th><th>Gmail</th><th>Course</th><th>SAQA</th><th>%</th><th>Quiz</th><th>Task</th></tr></thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (r) =>
                      `<tr><td>${r.learner}</td><td>${r.gmail}</td><td>${r.course}</td><td>${r.saqa}</td><td>${r.percent}%</td><td>${r.quiz}</td><td>${r.assignment}</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="7">No approved enrolments</td></tr>'
          }
        </tbody>
      </table>
    </div>`;
}

function renderAbout() {
  currentView = { name: 'about' };
  setBack(null);
  const s = getSession();
  content().innerHTML = `
    <h2 class="page-title">About & links</h2>
    <a class="live-demo-link" href="https://jlephoto23-collab.github.io/EduFlow-LMS/" target="_blank" rel="noopener">
      <span><span class="live-dot">●</span> Live demo</span>
      <span class="live-demo-url">jlephoto23-collab.github.io/EduFlow-LMS</span>
    </a>
    <div class="content-block">
      <p class="mb-2"><strong>EduFlow LMS</strong> · Pilot for training providers</p>
      <p class="text-secondary small mb-0">Programmes reference SAQA IDs 57712, 61595, and project pathway 50080 / 101869. In-app content is original demo material, not official SAQA/SETA guides.</p>
    </div>
    <div class="content-block">
      <p class="mb-1"><strong>Gmail-linked communications</strong></p>
      <p class="text-secondary small mb-0">Account email is used for provider notices in the Inbox. Production can send the same notices to Gmail via an email API.</p>
      ${s ? `<p class="small mt-2 mb-0">Signed in: ${s.gmail || s.email}</p>` : ''}
    </div>
    <button class="btn btn-outline-light w-100" id="btn-reset">Reset demo data</button>`;

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (!confirm('Reset all demo data and log out?')) return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('ef_seed_ver');
    seedIfNeeded();
    logout();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  seedIfNeeded();
  setTimeout(() => document.getElementById('splash')?.classList.add('hide'), 900);

  onLiveChange(() => {
    if (getSession()) refreshCurrentView();
  });

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
    const email = prompt('Gmail / email (used for provider communications)');
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
