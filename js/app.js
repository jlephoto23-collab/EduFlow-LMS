import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function formatBody(text) {
  return escapeHtml(text || '').replace(/\n/g, '<br>');
}

function getSession() { return load(KEYS.session, null); }
function setSession(user) {
  if (!user) { localStorage.removeItem(KEYS.session); return; }
  save(KEYS.session, { id: user.id, name: user.name, email: user.email, role: user.role, gmail: user.gmail || user.email }, { silent: true });
}

function login(email, password) {
  const users = load(KEYS.users, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { ok: false, message: 'Invalid email or password' };
  if (user.role === 'learner' && (user.status || 'approved') === 'pending') {
    setSession(user);
    return { ok: true, user, pending: true };
  }
  if (user.role === 'learner' && user.status === 'rejected') {
    return { ok: false, message: 'Your application was not approved. Contact the training provider.' };
  }
  setSession(user);
  return { ok: true, user };
}

function pushMessage(toUserId, toEmail, subject, body) {
  const messages = load(KEYS.messages, []);
  messages.unshift({ id: uid(), toUserId, toEmail, subject, body, at: new Date().toISOString(), read: false });
  save(KEYS.messages, messages);
}

function submitAccountApplication(payload) {
  const users = load(KEYS.users, []);
  const em = (payload.email || '').trim().toLowerCase();
  const name = (payload.name || '').trim();
  const password = payload.password || '';
  const phone = (payload.phone || '').trim();
  const programmeId = payload.programmeId || '';
  const notes = (payload.notes || '').trim();
  if (!name) return { ok: false, message: 'Full name is required' };
  if (!em.includes('@')) return { ok: false, message: 'Enter a valid email (Gmail preferred)' };
  if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters' };
  if (users.some((u) => u.email.toLowerCase() === em)) {
    return { ok: false, message: 'Email already registered — sign in or wait for approval' };
  }
  const user = {
    id: uid(), name, email: em, password, role: 'learner', gmail: em, phone,
    status: 'pending', preferredProgrammeId: programmeId || null, appliedAt: new Date().toISOString(),
  };
  users.push(user);
  save(KEYS.users, users);
  const applications = load(KEYS.applications, []);
  applications.unshift({
    id: uid(), userId: user.id, name, email: em, phone, programmeId: programmeId || null, notes,
    documents: payload.documents || null, status: 'pending', submittedAt: new Date().toISOString(), reviewNotes: '',
  });
  save(KEYS.applications, applications);
  pushMessage(user.id, em, 'Application received — awaiting approval',
    'Thank you for applying to EduFlow. An administrator must approve you before full access. We will contact ' + em + '.');
  setSession(user);
  return { ok: true, user, pending: true };
}

function approveAccountApplication(appId, approve, reviewNotes) {
  const applications = load(KEYS.applications, []);
  const app = applications.find((a) => a.id === appId);
  if (!app) return false;
  app.status = approve ? 'approved' : 'rejected';
  app.reviewNotes = reviewNotes || '';
  app.reviewedAt = new Date().toISOString();
  save(KEYS.applications, applications);
  const users = load(KEYS.users, []);
  const user = users.find((u) => u.id === app.userId);
  if (user) {
    user.status = approve ? 'approved' : 'rejected';
    save(KEYS.users, users);
    pushMessage(user.id, user.gmail || user.email,
      approve ? 'Application approved — you may access EduFlow' : 'Application not approved',
      approve
        ? 'Your account has been approved. Sign in to choose a programme and start learning.'
        : 'Your application was not approved. ' + (reviewNotes || 'Please contact the training provider.'));
  }
  return true;
}

function logout() { setSession(null); showLogin(); }

function getCourses() { return load(KEYS.courses, []); }
function getCourse(id) { return getCourses().find((c) => c.id === id); }
function getEnrolments() { return load(KEYS.enrolments, []); }
function saveEnrolments(list) { save(KEYS.enrolments, list); }
function getSubmissions() { return load(KEYS.submissions, []); }
function getAssignments() { return load(KEYS.assignments, []); }
function content() { return document.getElementById('content'); }
function bottomNav() { return document.getElementById('bottom-nav'); }

function getProgress(learnerId, courseId) {
  const all = load(KEYS.progress, []);
  let row = all.find((p) => p.learnerId === learnerId && p.courseId === courseId);
  if (!row) row = { learnerId, courseId, completedLessonIds: [], percent: 0 };
  return row;
}
function saveProgress(row) {
  const all = load(KEYS.progress, []);
  const i = all.findIndex((p) => p.learnerId === row.learnerId && p.courseId === row.courseId);
  if (i >= 0) all[i] = row; else all.push(row);
  save(KEYS.progress, all);
}
function markLessonComplete(learnerId, courseId, lessonId) {
  const course = getCourse(courseId);
  if (!course) return;
  const row = getProgress(learnerId, courseId);
  if (!row.completedLessonIds.includes(lessonId)) row.completedLessonIds.push(lessonId);
  row.percent = course.lessons.length ? Math.round((row.completedLessonIds.length / course.lessons.length) * 100) : 0;
  saveProgress(row);
}

function showLogin() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
  document.getElementById('apply-panel')?.classList.add('d-none');
  document.getElementById('login-panel')?.classList.remove('d-none');
}

function showPublicApplication() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
  document.getElementById('login-panel')?.classList.add('d-none');
  const panel = document.getElementById('apply-panel');
  if (panel) {
    panel.classList.remove('d-none');
    const sel = document.getElementById('apply-programme');
    if (sel && !sel.dataset.ready) {
      const courses = getCourses();
      sel.innerHTML = '<option value="">Select a programme (optional)</option>' +
        courses.map((c) => `<option value="${c.id}">${escapeHtml(c.programme || c.title)} — NQF ${c.nqfLevel}</option>`).join('');
      sel.dataset.ready = '1';
    }
  }
}

function showAwaitingApproval() {
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app-view').classList.remove('d-none');
  const s = getSession();
  document.getElementById('user-chip').textContent = s ? `${s.name} · pending` : '';
  if (bottomNav()) bottomNav().innerHTML = '';
  content().innerHTML = `
    <div class="content-block text-center" style="margin-top:2rem">
      <div class="splash-logo sm" style="margin:0 auto 1rem">E</div>
      <h2 class="page-title">Application under review</h2>
      <p class="text-secondary">Hi ${escapeHtml(s?.name || '')}. Your application was received.</p>
      <p class="text-secondary">An administrator must approve your access before you can open programmes, modules or assessments.</p>
      <p class="mb-3"><span class="badge-soft badge-warn">Status: Pending approval</span></p>
      <p class="text-secondary small">We will notify <strong>${escapeHtml(s?.gmail || s?.email || '')}</strong> when a decision is made.</p>
      <button type="button" class="btn btn-outline-light w-100 mt-3" id="btn-pending-logout">Sign out</button>
      <button type="button" class="btn btn-primary w-100 mt-2" id="btn-pending-refresh">Check status</button>
    </div>`;
  document.getElementById('btn-pending-logout')?.addEventListener('click', logout);
  document.getElementById('btn-pending-refresh')?.addEventListener('click', () => {
    const users = load(KEYS.users, []);
    const u = users.find((x) => x.id === s.id);
    if (u && u.status === 'approved') { setSession(u); showApp(); return; }
    if (u && u.status === 'rejected') { alert('Your application was not approved.'); logout(); return; }
    alert('Still pending. Please check again later.');
  });
}

function setNavActive(nav) {
  const bar = bottomNav();
  if (!bar) return;
  bar.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === nav);
  });
}

function wireNav() {
  const s = getSession();
  if (!s) return;
  if (s.role === 'trainer') {
    bottomNav().innerHTML = `
      <a href="#" data-nav="home" class="active"><i class="bi bi-grid-1x2"></i>Home</a>
      <a href="#" data-nav="approvals"><i class="bi bi-person-check"></i>Approvals</a>
      <a href="#" data-nav="grade"><i class="bi bi-pencil-square"></i>Grade</a>
      <a href="#" data-nav="catalog"><i class="bi bi-journal-text"></i>Programmes</a>
      <a href="#" data-nav="about"><i class="bi bi-info-circle"></i>More</a>`;
  } else {
    bottomNav().innerHTML = `
      <a href="#" data-nav="home" class="active"><i class="bi bi-grid-1x2"></i>Home</a>
      <a href="#" data-nav="catalog"><i class="bi bi-journal-plus"></i>Courses</a>
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
      if (n === 'catalog') renderCatalog();
      if (n === 'messages') renderMessages();
      if (n === 'about') renderAbout();
      setNavActive(n);
    });
  });
}

function showApp() {
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app-view').classList.remove('d-none');
  const s = getSession();
  if (s && s.role === 'learner') {
    const users = load(KEYS.users, []);
    const u = users.find((x) => x.id === s.id);
    const st = (u && u.status) || 'approved';
    if (st === 'pending') { showAwaitingApproval(); return; }
    if (st === 'rejected') { alert('Your application was not approved.'); logout(); return; }
  }
  document.getElementById('user-chip').textContent = s ? `${s.name} · ${s.role}` : '';
  wireNav();
  goHome();
}

function goHome() {
  const s = getSession();
  if (!s) return showLogin();
  if (s.role === 'trainer') renderTrainerHome();
  else renderLearnerHome();
  setNavActive('home');
}

function renderTrainerHome() {
  const courses = getCourses();
  const enrolments = getEnrolments();
  const pendingEnrol = enrolments.filter((e) => e.status === 'pending').length;
  const pendingAccounts = load(KEYS.applications, []).filter((a) => a.status === 'pending').length;
  const pending = pendingEnrol + pendingAccounts;
  const toGrade = getSubmissions().filter((s) => s.status === 'submitted').length;
  const learners = load(KEYS.users, []).filter((u) => u.role === 'learner' && (u.status || 'approved') !== 'pending');

  content().innerHTML = `
    <h2 class="page-title">Administrator dashboard</h2>
    <p class="text-secondary small mb-3">Apply → Approve → Access. Tap a tile to open the related screen.</p>
    <div class="card-grid mb-3">
      <div class="stat-card stat-link" data-dash="programmes" role="button"><div class="label">Programmes</div><div class="value">${courses.length}</div><div class="stat-hint">Open programmes</div></div>
      <div class="stat-card stat-link" data-dash="learners" role="button"><div class="label">Learners</div><div class="value">${learners.length}</div><div class="stat-hint">View learners</div></div>
      <div class="stat-card stat-link" data-dash="pending" role="button"><div class="label">Pending access</div><div class="value">${pending}</div><div class="stat-hint">Open Approvals</div></div>
      <div class="stat-card stat-link" data-dash="grade" role="button"><div class="label">To grade</div><div class="value">${toGrade}</div><div class="stat-hint">Open grading</div></div>
    </div>
    ${pending ? `<div class="list-card list-link" style="border-color:#eab308" data-dash="pending" role="button"><h3>Applications</h3><p>${pendingAccounts} new account(s) · ${pendingEnrol} course request(s). Tap to open Approvals.</p></div>` : ''}
    <div class="content-block mt-3">
      <p class="mb-1"><strong>Where do learners apply?</strong></p>
      <p class="text-secondary small mb-0">Log out → on the sign-in screen tap <strong>New learner? Apply for access</strong>. That is the public application form (documents + programme choice). Admin approves under <strong>Approvals</strong>.</p>
    </div>`;

  content().querySelectorAll('[data-dash]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-dash');
      if (key === 'programmes' || key === 'catalog') { renderCatalog(); setNavActive('catalog'); }
      if (key === 'learners') renderLearners();
      if (key === 'pending') { renderApprovals(); setNavActive('approvals'); }
      if (key === 'grade') { renderGrading(); setNavActive('grade'); }
    });
  });
}

function renderLearners() {
  const users = load(KEYS.users, []).filter((u) => u.role === 'learner');
  const enrolments = getEnrolments();
  const courses = getCourses();
  content().innerHTML = `<h2 class="page-title">Learners</h2><p class="text-secondary mb-3">${users.length} registered.</p>` +
    users.map((u) => {
      const st = u.status || 'approved';
      const mine = enrolments.filter((e) => e.learnerId === u.id);
      return `<div class="list-card"><h3>${escapeHtml(u.name)}</h3>
        <p class="text-secondary small mb-1">${escapeHtml(u.gmail || u.email)}</p>
        <span class="badge-soft ${st === 'pending' ? 'badge-warn' : st === 'rejected' ? '' : 'badge-ok'}">${st}</span>
        <p class="text-secondary small mt-2 mb-0">${mine.map((e) => {
          const c = courses.find((x) => x.id === e.courseId);
          return `${c?.title || e.courseId} (${e.status})`;
        }).join('<br>') || 'No course applications'}</p></div>`;
    }).join('') +
    `<button class="btn btn-primary w-100 mt-2" id="btn-to-approvals">Open Approvals</button>`;
  document.getElementById('btn-to-approvals')?.addEventListener('click', () => { renderApprovals(); setNavActive('approvals'); });
}

function renderApprovals() {
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const pendingEnrol = getEnrolments().filter((e) => e.status === 'pending');
  const pendingAccounts = load(KEYS.applications, []).filter((a) => a.status === 'pending');
  let html = `<h2 class="page-title">Applications & access</h2>
    <p class="text-secondary mb-3">First approve new applicants so they can enter the app. Then approve course access.</p>`;
  if (pendingAccounts.length) {
    html += `<h3 class="h6 text-secondary">New account applications (${pendingAccounts.length})</h3>`;
    pendingAccounts.forEach((a) => {
      const prog = courses.find((c) => c.id === a.programmeId);
      html += `<div class="list-card" style="border-color:#eab308">
        <h3>${escapeHtml(a.name)} <span class="badge-soft badge-warn">New applicant</span></h3>
        <p>Gmail: ${escapeHtml(a.email)}${a.phone ? '<br>Phone: ' + escapeHtml(a.phone) : ''}</p>
        <p class="text-secondary small">Preferred: ${escapeHtml(prog ? (prog.programme || prog.title) : 'Not specified')}</p>
        ${a.notes ? `<p class="text-secondary small">Notes: ${escapeHtml(a.notes)}</p>` : ''}
        <textarea class="form-control form-control-sm mb-2" id="acc-notes-${a.id}" rows="2" placeholder="Reason for approve / decline"></textarea>
        <div class="meta gap-2">
          <button class="btn btn-sm btn-primary" data-acc-approve="${a.id}">Approve access</button>
          <button class="btn btn-sm btn-outline-light" data-acc-decline="${a.id}">Decline</button>
        </div></div>`;
    });
  }
  if (pendingEnrol.length) {
    html += `<h3 class="h6 text-secondary mt-3">Course access requests (${pendingEnrol.length})</h3>`;
    pendingEnrol.forEach((e) => {
      const learner = users.find((u) => u.id === e.learnerId);
      const course = courses.find((c) => c.id === e.courseId);
      html += `<div class="list-card">
        <h3>${escapeHtml(learner?.name || 'Learner')} <span class="badge-soft">Course access</span></h3>
        <p>${escapeHtml(course?.title || 'Course')}<br><span class="text-secondary">Gmail: ${escapeHtml(learner?.gmail || learner?.email || '')}</span></p>
        <textarea class="form-control form-control-sm mb-2" id="notes-${e.id}" rows="2" placeholder="Reason"></textarea>
        <div class="meta gap-2">
          <button class="btn btn-sm btn-primary" data-approve="${e.id}">Approve course</button>
          <button class="btn btn-sm btn-outline-light" data-decline="${e.id}">Decline</button>
        </div></div>`;
    });
  }
  if (!pendingAccounts.length && !pendingEnrol.length) html += '<div class="empty">No pending applications</div>';
  content().innerHTML = html;
  content().querySelectorAll('[data-acc-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      approveAccountApplication(btn.getAttribute('data-acc-approve'), true, (document.getElementById('acc-notes-' + btn.getAttribute('data-acc-approve'))?.value || '').trim());
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-acc-decline]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-acc-decline');
      const notes = (document.getElementById('acc-notes-' + id)?.value || '').trim();
      if (!notes) { alert('Please add a reason when declining.'); return; }
      approveAccountApplication(id, false, notes);
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-approve');
      const notes = (document.getElementById('notes-' + id)?.value || '').trim();
      const list = getEnrolments();
      const row = list.find((x) => x.id === id);
      if (!row) return;
      row.status = 'approved';
      row.reviewNotes = notes;
      row.reviewedAt = new Date().toISOString();
      saveEnrolments(list);
      const learner = users.find((u) => u.id === row.learnerId);
      const course = courses.find((c) => c.id === row.courseId);
      if (learner) pushMessage(learner.id, learner.gmail || learner.email, 'Course access approved', 'You may now access: ' + (course?.title || 'your programme'));
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-decline]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-decline');
      const notes = (document.getElementById('notes-' + id)?.value || '').trim();
      if (!notes) { alert('Please add a reason when declining.'); return; }
      const list = getEnrolments();
      const row = list.find((x) => x.id === id);
      if (!row) return;
      row.status = 'declined';
      row.reviewNotes = notes;
      saveEnrolments(list);
      renderApprovals();
    });
  });
}

function renderLearnerHome() {
  const s = getSession();
  const enrolments = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'approved');
  const courses = getCourses();
  const settings = load('ef_settings', {});
  content().innerHTML = `
    <h2 class="page-title">My learning</h2>
    <p class="text-secondary mb-3">${escapeHtml(settings.welcomeMessage || 'Welcome.')}</p>
    ${enrolments.length === 0
      ? '<div class="empty">No approved programmes yet. Open Courses to apply.</div>'
      : enrolments.map((e) => {
          const c = courses.find((x) => x.id === e.courseId);
          return `<div class="list-card list-link" data-course="${e.courseId}" role="button"><h3>${escapeHtml(c?.title || e.courseId)}</h3>
            <p class="text-secondary small">NQF ${c?.nqfLevel || '?'} · ${c?.credits || '?'} credits · SAQA ${c?.saqaId || ''}</p>
            <span class="badge-soft badge-ok">Approved access</span></div>`;
        }).join('')}
    <button class="btn btn-primary w-100 mt-3" id="btn-browse">Browse programmes</button>`;
  document.getElementById('btn-browse')?.addEventListener('click', () => { renderCatalog(); setNavActive('catalog'); });
  content().querySelectorAll('[data-course]').forEach((el) => {
    el.addEventListener('click', () => renderCourseDetail(el.getAttribute('data-course')));
  });
}

function renderCatalog() {
  const s = getSession();
  const courses = getCourses();
  const enrolments = getEnrolments();
  content().innerHTML = `<h2 class="page-title">${s.role === 'trainer' ? 'Programmes' : 'Course catalogue'}</h2>
    <p class="text-secondary mb-3">Tap a programme, then tap any module to open the learner guide, content, quiz or assignment.</p>` +
    courses.map((c) => {
      const enr = enrolments.find((e) => e.learnerId === s.id && e.courseId === c.id);
      const status = enr ? enr.status : null;
      return `<div class="list-card">
        <h3>${escapeHtml(c.title)}</h3>
        <p class="text-secondary small mb-2">${escapeHtml(c.description || '')}</p>
        <div class="meta mb-2">
          <span class="badge-soft">NQF ${c.nqfLevel}</span>
          <span class="badge-soft">${c.credits} credits</span>
          <span class="badge-soft">SAQA ${c.saqaId}</span>
        </div>
        ${s.role === 'trainer'
          ? `<button class="btn btn-sm btn-primary" data-open="${c.id}">Open modules</button>`
          : status === 'approved'
            ? `<button class="btn btn-sm btn-primary" data-open="${c.id}">Continue learning</button>`
            : status === 'pending'
              ? `<span class="badge-soft badge-warn">Application pending</span>`
              : `<button class="btn btn-sm btn-primary" data-apply="${c.id}">Apply for this programme</button>`}
      </div>`;
    }).join('');
  content().querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => renderCourseDetail(btn.getAttribute('data-open')));
  });
  content().querySelectorAll('[data-apply]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-apply');
      const list = getEnrolments().filter((e) => !(e.learnerId === s.id && e.courseId === courseId));
      list.push({
        id: uid(), courseId, learnerId: s.id, status: 'pending', enrolledAt: new Date().toISOString(),
        documents: { hasDisability: false, idCopy: null, matric: null, otherCerts: [], disabilityNote: null },
        meetsMinimum: false, requirementIssues: [], reviewNotes: '',
      });
      saveEnrolments(list);
      pushMessage(s.id, s.gmail || s.email, 'Course application submitted', 'Your request is pending administrator approval.');
      alert('Application submitted for review.');
      renderCatalog();
    });
  });
}

function renderCourseDetail(courseId) {
  const c = getCourse(courseId);
  if (!c) return;
  const s = getSession();
  const isTrainer = s.role === 'trainer';
  const prog = getProgress(s.id, courseId);
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-course"><i class="bi bi-arrow-left"></i> Back</button>
    <h2 class="page-title">${escapeHtml(c.title)}</h2>
    <p class="text-secondary small">NQF ${c.nqfLevel} · ${c.credits} credits · SAQA ${c.saqaId}</p>
    <p class="mb-2">${escapeHtml(c.description || '')}</p>
    <h3 class="h6 text-secondary">Unit standards (register references)</h3>
    <ul class="text-secondary small mb-3">${(c.unitStandards || []).map((u) => `<li>${u.id}: ${escapeHtml(u.title)} (NQF ${u.nqfLevel}, ${u.credits} cr)</li>`).join('')}</ul>
    <h3 class="h6 text-secondary">Modules — tap to open</h3>
    ${(c.lessons || []).map((l, i) => {
      const done = prog.completedLessonIds.includes(l.id);
      return `<div class="lesson-card ${done ? 'done' : ''}" data-lesson="${l.id}" role="button" tabindex="0">
        <div class="num">${i + 1}</div>
        <div style="flex:1">
          <h4>${escapeHtml(l.title)}</h4>
          <p>${l.type}${done ? ' · completed' : ''} · <span style="color:#93c5fd">Open →</span></p>
        </div>
      </div>`;
    }).join('')}`;
  document.getElementById('btn-back-course')?.addEventListener('click', () => {
    if (isTrainer) { renderCatalog(); setNavActive('catalog'); }
    else { renderLearnerHome(); setNavActive('home'); }
  });
  content().querySelectorAll('[data-lesson]').forEach((el) => {
    el.addEventListener('click', () => {
      const lessonId = el.getAttribute('data-lesson');
      const lesson = (c.lessons || []).find((x) => x.id === lessonId);
      if (lesson) openLesson(courseId, lesson, isTrainer);
    });
  });
}

function openLesson(courseId, lesson, isTrainer) {
  if (lesson.type === 'quiz') return renderQuiz(courseId, lesson, isTrainer);
  if (lesson.type === 'assignment') return renderAssignment(courseId, lesson, isTrainer);
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back to modules</button>
    <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
    <p class="text-secondary small mb-3">${lesson.type}</p>
    <div class="content-block mb-3">${formatBody(lesson.body)}</div>
    ${!isTrainer ? `<button class="btn btn-primary w-100" id="btn-mark-done">Mark as complete</button>` : ''}`;
  document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
  document.getElementById('btn-mark-done')?.addEventListener('click', () => {
    const s = getSession();
    markLessonComplete(s.id, courseId, lesson.id);
    alert('Marked complete.');
    renderCourseDetail(courseId);
  });
}

function renderQuiz(courseId, lesson, isTrainer) {
  const quiz = lesson.quiz || { passMark: 70, questions: [] };
  if (isTrainer) {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-secondary">${quiz.questions.length} questions · pass mark ${quiz.passMark}%</p>
      <ol class="content-block">${quiz.questions.map((q) => `<li class="mb-2">${escapeHtml(q.q)}<ul class="small text-secondary">${(q.options || []).map((o, i) => `<li${i === q.correctIndex ? ' style="color:#86efac"' : ''}>${escapeHtml(o)}${i === q.correctIndex ? ' ✓' : ''}</li>`).join('')}</ul></li>`).join('')}</ol>`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    return;
  }
  let index = 0;
  const answers = [];
  const questions = quiz.questions;
  function paint() {
    const q = questions[index];
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-secondary small">Question ${index + 1} of ${questions.length}</p>
      <div class="content-block mb-3"><p class="mb-0">${escapeHtml(q.q)}</p></div>
      ${(q.options || []).map((o, i) => `<button type="button" class="quiz-option" data-opt="${i}">${escapeHtml(o)}</button>`).join('')}`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    content().querySelectorAll('[data-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        answers[index] = Number(btn.getAttribute('data-opt'));
        if (index < questions.length - 1) { index += 1; paint(); }
        else {
          let correct = 0;
          questions.forEach((qq, i) => { if (answers[i] === qq.correctIndex) correct += 1; });
          const score = Math.round((correct / questions.length) * 100);
          const passed = score >= (quiz.passMark || 70);
          const s = getSession();
          const attempts = load(KEYS.attempts, []);
          attempts.push({ id: uid(), learnerId: s.id, courseId, lessonId: lesson.id, score, passed, at: new Date().toISOString() });
          save(KEYS.attempts, attempts);
          if (passed) markLessonComplete(s.id, courseId, lesson.id);
          content().innerHTML = `
            <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
            <h2 class="page-title">Quiz result</h2>
            <div class="content-block text-center">
              <p class="display-6 mb-1">${score}%</p>
              <p class="mb-0"><span class="badge-soft ${passed ? 'badge-ok' : 'badge-warn'}">${passed ? 'Pass' : 'Not yet'}</span></p>
              <p class="text-secondary small mt-2">Pass mark ${quiz.passMark}%. ${correct} of ${questions.length} correct.</p>
            </div>`;
          document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
        }
      });
    });
  }
  paint();
}

function renderAssignment(courseId, lesson, isTrainer) {
  const s = getSession();
  const asg = getAssignments().find((a) => a.id === lesson.assignmentId) || {
    id: lesson.assignmentId, instructions: lesson.body, maxScore: 100,
  };
  const mine = getSubmissions().filter((x) => x.learnerId === s.id && x.assignmentId === asg.id).pop();
  if (isTrainer) {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <div class="content-block">${formatBody(asg.instructions || lesson.body)}</div>
      <p class="text-secondary small">Learners submit from their course view. Grade under the Grade tab.</p>`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    return;
  }
  if (mine && mine.status === 'graded') {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <p><span class="badge-soft ${mine.passed ? 'badge-ok' : 'badge-warn'}">Score ${mine.score}% · ${mine.passed ? 'Pass' : 'Not yet'}</span></p>
      ${mine.feedback ? `<div class="content-block mb-2"><strong>Feedback</strong><br>${formatBody(mine.feedback)}</div>` : ''}
      <div class="content-block mb-2" style="font-size:.9rem">${formatBody(mine.text)}</div>
      ${!mine.passed ? `<button class="btn btn-primary w-100" id="btn-resubmit">Resubmit</button>` : ''}`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    document.getElementById('btn-resubmit')?.addEventListener('click', () => showAssignmentForm(courseId, lesson, asg, mine));
    return;
  }
  if (mine && mine.status === 'submitted') {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <div class="content-block mb-2"><p class="mb-0">Submitted — awaiting result.</p></div>
      <div class="content-block" style="font-size:.9rem">${formatBody(mine.text)}</div>`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    return;
  }
  showAssignmentForm(courseId, lesson, asg, null);
}

function showAssignmentForm(courseId, lesson, asg, previous) {
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
    <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
    <div class="content-block mb-3">${formatBody(asg.instructions || lesson.body)}</div>
    <label class="form-label">Your answer</label>
    <textarea class="form-control mb-2" id="assignment-text" rows="6" placeholder="Write your response (min 20 characters)…"></textarea>
    <button class="btn btn-primary w-100" id="btn-submit-assignment">Submit for marking</button>`;
  document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
  document.getElementById('btn-submit-assignment')?.addEventListener('click', () => {
    const text = document.getElementById('assignment-text').value.trim();
    if (text.length < 20) { alert('Please write at least 20 characters.'); return; }
    const s = getSession();
    const list = getSubmissions();
    if (previous) {
      const sub = list.find((x) => x.id === previous.id);
      if (sub) {
        sub.history = sub.history || [];
        sub.history.push({ text: sub.text, score: sub.score, feedback: sub.feedback, gradedAt: sub.gradedAt });
        sub.text = text; sub.status = 'submitted'; sub.score = null; sub.feedback = ''; sub.passed = false;
        sub.submittedAt = new Date().toISOString();
      }
    } else {
      list.push({
        id: uid(), assignmentId: asg.id, courseId, learnerId: s.id, text,
        status: 'submitted', submittedAt: new Date().toISOString(), score: null, feedback: '', history: [],
      });
    }
    save(KEYS.submissions, list);
    pushMessage(s.id, s.gmail || s.email, 'Submission received', 'Your assignment was submitted.');
    alert('Submitted for marking.');
    renderAssignment(courseId, lesson, false);
  });
}

function renderGrading() {
  const subs = getSubmissions().filter((s) => s.status === 'submitted');
  const users = load(KEYS.users, []);
  const courses = getCourses();
  content().innerHTML = `<h2 class="page-title">To grade</h2>
    <p class="text-secondary mb-3">${subs.length} submission(s) awaiting a mark.</p>` +
    (subs.length === 0 ? '<div class="empty">Nothing to grade</div>' :
      subs.map((sub) => {
        const learner = users.find((u) => u.id === sub.learnerId);
        const course = courses.find((c) => c.id === sub.courseId);
        return `<div class="list-card">
          <h3>${escapeHtml(learner?.name || 'Learner')}</h3>
          <p class="text-secondary small">${escapeHtml(course?.title || sub.courseId)}</p>
          <div class="content-block mb-2" style="font-size:.9rem">${formatBody(sub.text)}</div>
          <label class="form-label">Score %</label>
          <input type="number" class="form-control mb-2" id="score-${sub.id}" min="0" max="100" value="70">
          <label class="form-label">Feedback</label>
          <textarea class="form-control mb-2" id="fb-${sub.id}" rows="2"></textarea>
          <button class="btn btn-sm btn-primary" data-grade="${sub.id}">Save grade</button>
        </div>`;
      }).join(''));
  content().querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-grade');
      const score = Number(document.getElementById('score-' + id)?.value) || 0;
      const feedback = document.getElementById('fb-' + id)?.value || '';
      const list = getSubmissions();
      const sub = list.find((s) => s.id === id);
      if (!sub) return;
      sub.status = 'graded'; sub.score = score; sub.feedback = feedback;
      sub.gradedAt = new Date().toISOString(); sub.passed = score >= 70;
      save(KEYS.submissions, list);
      if (sub.passed) {
        const asg = getAssignments().find((a) => a.id === sub.assignmentId);
        if (asg) markLessonComplete(sub.learnerId, sub.courseId, asg.lessonId);
      }
      const learner = users.find((u) => u.id === sub.learnerId);
      if (learner) pushMessage(learner.id, learner.gmail || learner.email, 'Assignment graded: ' + score + '%', feedback || (sub.passed ? 'Pass' : 'Not yet'));
      alert('Grade saved.');
      renderGrading();
    });
  });
}

function renderMessages() {
  const s = getSession();
  const messages = load(KEYS.messages, []).filter((m) => m.toUserId === s.id);
  content().innerHTML = `<h2 class="page-title">Inbox</h2>
    <p class="text-secondary small mb-3">Communications linked to ${escapeHtml(s.gmail || s.email)}</p>` +
    (messages.length === 0 ? '<div class="empty">No messages</div>' :
      messages.map((m) => `<div class="list-card"><h3>${escapeHtml(m.subject)}</h3>
        <p class="text-secondary small">${new Date(m.at).toLocaleString()}</p>
        <p class="mb-0">${escapeHtml(m.body)}</p></div>`).join(''));
}

function renderAbout() {
  const settings = load('ef_settings', {});
  content().innerHTML = `<h2 class="page-title">About EduFlow</h2>
    <div class="content-block">
      <p><strong>${escapeHtml(settings.providerName || 'EduFlow Training Provider')}</strong></p>
      <p class="text-secondary small">Contact: ${escapeHtml(settings.contactEmail || '')}</p>
      <p class="mb-2">Learners apply first. Administrators approve access. Then learners enrol in NQF programmes, complete modules, submit assessments and receive results.</p>
      <p class="mb-0"><strong>Apply here:</strong> Log out → on the sign-in screen choose <em>New learner? Apply for access</em>.</p>
    </div>`;
}

async function bootEduFlow() {
  await seedIfNeeded();
  setTimeout(() => document.getElementById('splash')?.classList.add('hide'), 400);
  onLiveChange(() => {
    const s = getSession();
    if (s && s.role === 'learner') {
      const u = load(KEYS.users, []).find((x) => x.id === s.id);
      if (u && u.status === 'approved' && document.getElementById('btn-pending-refresh')) showApp();
    }
  });
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const err = document.getElementById('login-error');
    const result = login(email, password);
    if (!result.ok) { err.textContent = result.message; err.classList.remove('d-none'); return; }
    err.classList.add('d-none');
    if (result.pending) showAwaitingApproval(); else showApp();
  });
  document.getElementById('btn-register')?.addEventListener('click', (e) => { e.preventDefault(); showPublicApplication(); });
  document.getElementById('btn-show-login')?.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
  document.getElementById('apply-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('apply-error');
    err?.classList.add('d-none');
    const result = submitAccountApplication({
      name: document.getElementById('apply-name')?.value.trim() || '',
      email: document.getElementById('apply-email')?.value.trim() || '',
      phone: document.getElementById('apply-phone')?.value.trim() || '',
      password: document.getElementById('apply-password')?.value || '',
      programmeId: document.getElementById('apply-programme')?.value || '',
      notes: document.getElementById('apply-notes')?.value.trim() || '',
    });
    if (!result.ok) {
      if (err) { err.textContent = result.message; err.classList.remove('d-none'); }
      else alert(result.message);
      return;
    }
    showAwaitingApproval();
  });
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  if (getSession()) showApp(); else showLogin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootEduFlow);
} else {
  bootEduFlow();
}
