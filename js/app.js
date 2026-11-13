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
      '. The training provider will use this address for enrolment decisions, assessment results and notices.',
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

function getSettings() {
  return load('ef_settings', {
    providerName: 'EduFlow Training Provider',
    contactEmail: 'admin@eduflow.test',
    supportPhone: '',
    welcomeMessage: 'Welcome to your learning programme. Complete guides, modules and assessments to progress.',
    passMarkDefault: 70,
    certificateFooter: 'This is a demo certificate for pilot modules only.',
  });
}

function saveSettings(s) {
  save('ef_settings', s);
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
  const units = (c.unitStandards || [])
    .map(
      (u) =>
        `<li><strong>US ${escapeHtml(String(u.id))}</strong> — ${escapeHtml(u.title)} <span class="text-secondary">(NQF ${u.nqfLevel != null ? u.nqfLevel : 4}${u.credits != null ? ', ' + u.credits + ' cr' : ''})</span></li>`
    )
    .join('');
  return `<div class="content-block mb-3">
    <p class="mb-1"><strong>SAQA reference</strong></p>
    <p class="text-secondary small mb-2">${escapeHtml(c.saqaTitle || c.title || '')} · ID <strong>${escapeHtml(String(c.saqaId || '—'))}</strong> · NQF ${c.nqfLevel || 4} · ${c.credits != null ? c.credits + ' credits' : 'credits n/a'}</p>
    ${c.relatedSaqaNote ? `<p class="text-secondary small mb-2">${escapeHtml(c.relatedSaqaNote)}${c.relatedSaqaId ? ' (related ID ' + escapeHtml(String(c.relatedSaqaId)) + ')' : ''}</p>` : ''}
    ${c.purpose ? `<p class="mb-2"><strong>Purpose</strong><br>${escapeHtml(c.purpose)}</p>` : ''}
    ${units ? `<p class="mb-1"><strong>Unit standards (register references)</strong></p><ul class="mb-2 text-secondary small">${units}</ul>` : ''}
    ${outcomes ? `<p class="mb-1"><strong>Programme learning outcomes (pilot)</strong></p><ul class="mb-0 text-secondary small">${outcomes}</ul>` : ''}
    <p class="text-secondary small mt-2 mb-0">Unit standard IDs/titles are public register references. Module outcomes are original pilot wording — not official SAQA assessment criteria.</p>
  </div>`;
}

function moduleOutcomesHtml(lesson) {
  const outcomes = (lesson.outcomes || []).map((o) => `<li>${escapeHtml(o)}</li>`).join('');
  const us = lesson.unitStandardId
    ? `<p class="text-secondary small mb-2"><strong>US ${escapeHtml(String(lesson.unitStandardId))}</strong> — ${escapeHtml(lesson.unitStandardTitle || '')}</p>`
    : '';
  if (!outcomes && !us) return '';
  return `<div class="content-block mb-3">
    ${us}
    ${outcomes ? `<p class="mb-1"><strong>Learning outcomes (pilot)</strong></p><ul class="mb-0 text-secondary small">${outcomes}</ul>` : ''}
  </div>`;
}

function moduleMetaHtml(lesson) {
  const level = lesson.nqfLevel != null ? lesson.nqfLevel : 4;
  const credits = lesson.credits != null ? lesson.credits : null;
  if (credits == null) return `<span class="badge-soft">NQF ${level}</span>`;
  return `<span class="badge-soft">NQF ${level}</span> <span class="badge-soft">${credits} cr</span>`;
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
  else if (n === 'learners') renderLearners();
  else if (n === 'programmes') renderProgrammes();
  else if (n === 'settings') renderSettings();
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

function wireNav() {
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
      setNavActive(n);
    });
  });
}

function renderNav() {
  wireNav();
}

function setNavActive(nav) {
  const bar = bottomNav();
  if (!bar) return;
  bar.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === nav);
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

// CONTINUED IN PART 2 - THIS RESTORE FAILED IF YOU SEE THIS
console.error('partial restore');
