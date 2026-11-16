import {
  KEYS, load,, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

const MAX_FILE_BYTES = 1.5 * 1024 * 1024;

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
}
function formatBody(t) { return escapeHtml(t || '').replace(/\n/g, '<br>'); }
function formatSize(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function readFileAsMeta(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const meta = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: null, tooLarge: false };
    if (file.size > MAX_FILE_BYTES) {
      meta.tooLarge = true;
      return resolve(meta);
    }
    const reader = new FileReader();
    reader.onload = () => { meta.dataUrl = reader.result; resolve(meta); };
    reader.onerror = () => resolve(meta);
    reader.readAsDataURL(file);
  });
}

async function readFilesFromInput(inputEl, multiple) {
  const files = inputEl?.files ? Array.from(inputEl.files) : [];
  if (!files.length) return multiple ? [] : null;
  if (!multiple) return readFileAsMeta(files[0]);
  const out = [];
  for (const f of files) out.push(await readFileAsMeta(f));
  return out;
}

function fileLinkHtml(doc) {
  if (!doc) return '<span class="text-secondary">Not uploaded</span>';
  const label = `${escapeHtml(doc.name)} (${formatSize(doc.size)})`;
  if (doc.tooLarge) return `<span class="badge-soft badge-warn">${label} — too large (max 1.5MB)</span>`;
  if (doc.dataUrl) return `<a href="${doc.dataUrl}" target="_blank" rel="noopener" style="color:#93c5fd">${label}</a>`;
  return `<span class="text-secondary">${label}</span>`;
}

function getSession() { return load(KEYS.session, null); }
function setSession(user) {
  if (!user) { localStorage.removeItem(KEYS.session); return; }
  save(KEYS.session, { id: user.id, name: user.name, email: user.email, role: user.role, gmail: user.gmail || user.email }, { silent: true });
}
function pushMessage(toUserId, toEmail, subject, body) {
  const messages = load(KEYS.messages, []);
  messages.unshift({ id: uid(), toUserId, toEmail, subject, body, at: new Date().toISOString(), read: false });
  save(KEYS.messages, messages);
}
function getCourses() { return load(KEYS.courses, []); }
function getCourse(id) { return getCourses().find((c) => c.id === id); }
function getEnrolments() { return load(KEYS.enrolments, []); }
function saveEnrolments(list) { save(KEYS.enrolments, list); }
function getSubmissions() { return load(KEYS.submissions, []); }
function content() { return document.getElementById('content'); }
function bottomNav() { return document.getElementById('bottom-nav'); }

function login(email, password) {
  const users = load(KEYS.users, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { ok: false, message: 'Invalid email or password' };
  if (user.role === 'learner' && user.status === 'registered') {
    setSession(user); return { ok: true, user, needsApplication: true };
  }
  if (user.role === 'learner' && (user.status || 'approved') === 'pending') {
    setSession(user); return { ok: true, user, pending: true };
  }
  if (user.role === 'learner' && user.status === 'rejected') {
    return { ok: false, message: 'Your application was not approved. Contact the training provider.' };
  }
  setSession(user);
  return { ok: true, user };
}

function createLearnerAccount(p) {
  const users = load(KEYS.users, []);
  const em = (p.email || '').trim().toLowerCase();
  const name = (p.name || '').trim();
  if (!name) return { ok: false, message: 'Full name is required' };
  if (!em.includes('@')) return { ok: false, message: 'Enter a valid email (Gmail preferred)' };
  if ((p.password || '').length < 6) return { ok: false, message: 'Password must be at least 6 characters' };
  if (p.password !== p.password2) return { ok: false, message: 'Passwords do not match' };
  if (users.some((u) => u.email.toLowerCase() === em)) return { ok: false, message: 'Email already registered — sign in instead' };
  const user = {
    id: uid(), name, email: em, password: p.password, role: 'learner', gmail: em,
    phone: (p.phone || '').trim(), status: 'registered', preferredProgrammeId: null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  save(KEYS.users, users);
  pushMessage(user.id, em, 'Account created — complete your application',
    'Welcome. Complete the application (programme + documents) so an administrator can approve your access.');
  setSession(user);
  return { ok: true, user, needsApplication: true };
}

function submitApplicationForUser(userId, p) {
  const users = load(KEYS.users, []);
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'Account not found. Please sign in again.' };
  if (!p.programmeId) return { ok: false, message: 'Please select a preferred programme' };
  if (!p.documents?.idCopy) return { ok: false, message: 'Please upload your ID / Smart ID' };
  if (!p.documents?.matric) return { ok: false, message: 'Please upload your Matric certificate' };
  if (p.documents.hasDisability && !p.documents.disabilityNote) {
    return { ok: false, message: 'Doctor\'s note is required when disability is selected' };
  }
  user.status = 'pending';
  user.preferredProgrammeId = p.programmeId;
  user.appliedAt = new Date().toISOString();
  save(KEYS.users, users);
  const apps = load(KEYS.applications, []).filter((a) => !(a.userId === userId && a.status === 'pending'));
  apps.unshift({
    id: uid(), userId, name: user.name, email: user.email, phone: user.phone || '',
    programmeId: p.programmeId, notes: p.notes || '', documents: p.documents || null,
    status: 'pending', submittedAt: new Date().toISOString(), reviewNotes: '',
  });
  save(KEYS.applications, apps);
  pushMessage(user.id, user.gmail || user.email, 'Application received — awaiting approval',
    'Your application and documents are under review.');
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
      approve ? 'Your account is approved. Sign in to start learning.'
              : 'Not approved. ' + (reviewNotes || 'Contact the training provider.'));
  }
  return true;
}

function logout() { setSession(null); showLogin(); }

function hideAllAuthPanels() {
  ['login-panel','register-panel','apply-panel'].forEach((id) => document.getElementById(id)?.classList.add('d-none'));
}
function showLogin() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
  hideAllAuthPanels();
  document.getElementById('login-panel')?.classList.remove('d-none');
}
function showRegisterPanel() {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
  hideAllAuthPanels();
  document.getElementById('register-panel')?.classList.remove('d-none');
}
function populateProgrammeSelect() {
  const sel = document.getElementById('apply-programme');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select a programme</option>' +
    getCourses().map((c) => `<option value="${c.id}">${escapeHtml(c.programme || c.title)} — NQF ${c.nqfLevel}</option>`).join('');
}
function showApplicationStep(user) {
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('app-view').classList.add('d-none');
  hideAllAuthPanels();
  document.getElementById('apply-panel')?.classList.remove('d-none');
  populateProgrammeSelect();
  const sel = document.getElementById('apply-programme');
  if (sel && user?.preferredProgrammeId) sel.value = user.preferredProgrammeId;
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
      <h2 class="page-title">Step 3 — Waiting for approval</h2>
      <p class="text-secondary">Hi ${escapeHtml(s?.name || '')}. Application and documents received.</p>
      <p class="mb-3"><span class="badge-soft badge-warn">Status: Pending approval</span></p>
      <button type="button" class="btn btn-outline-light w-100 mt-3" id="btn-pending-logout">Sign out</button>
      <button type="button" class="btn btn-primary w-100 mt-2" id="btn-pending-refresh">Check status</button>
    </div>`;
  document.getElementById('btn-pending-logout')?.addEventListener('click', logout);
  document.getElementById('btn-pending-refresh')?.addEventListener('click', () => {
    const u = load(KEYS.users, []).find((x) => x.id === s.id);
    if (u?.status === 'approved') { setSession(u); showApp(); return; }
    if (u?.status === 'rejected') { alert('Application was not approved.'); logout(); return; }
    alert('Still pending.');
  });
}

function setNavActive(nav) {
  bottomNav()?.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
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
    const u = load(KEYS.users, []).find((x) => x.id === s.id);
    const st = (u && u.status) || 'approved';
    if (st === 'registered') { document.getElementById('app-view').classList.add('d-none'); showApplicationStep(u); return; }
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
  if (s.role === 'trainer') renderTrainerHome(); else renderLearnerHome();
  setNavActive('home');
}

function renderTrainerHome() {
  const courses = getCourses();
  const enrolments = getEnrolments();
  const pendingEnrol = enrolments.filter((e) => e.status === 'pending').length;
  const pendingAccounts = load(KEYS.applications, []).filter((a) => a.status === 'pending').length;
  const pending = pendingEnrol + pendingAccounts;
  const toGrade = getSubmissions().filter((s) => s.status === 'submitted').length;
  const learners = load(KEYS.users, []).filter((u) => u.role === 'learner' && !['pending','registered'].includes(u.status || 'approved'));
  content().innerHTML = `
    <h2 class="page-title">Administrator dashboard</h2>
    <p class="text-secondary small mb-3">Create account → Apply with documents → Approve → Access</p>
    <div class="card-grid mb-3">
      <div class="stat-card stat-link" data-dash="programmes" role="button"><div class="label">Programmes</div><div class="value">${courses.length}</div></div>
      <div class="stat-card stat-link" data-dash="learners" role="button"><div class="label">Learners</div><div class="value">${learners.length}</div></div>
      <div class="stat-card stat-link" data-dash="pending" role="button"><div class="label">Pending access</div><div class="value">${pending}</div></div>
      <div class="stat-card stat-link" data-dash="grade" role="button"><div class="label">To grade</div><div class="value">${toGrade}</div></div>
    </div>
    ${pending ? `<div class="list-card list-link" style="border-color:#eab308" data-dash="pending" role="button"><h3>Applications</h3><p>${pendingAccounts} account · ${pendingEnrol} course. Review documents in Approvals.</p></div>` : ''}`;
  content().querySelectorAll('[data-dash]').forEach((el) => {
    el.addEventListener('click', () => {
      const k = el.getAttribute('data-dash');
      if (k === 'programmes') { renderCatalog(); setNavActive('catalog'); }
      if (k === 'learners') renderLearners();
      if (k === 'pending') { renderApprovals(); setNavActive('approvals'); }
      if (k === 'grade') { renderGrading(); setNavActive('grade'); }
    });
  });
}

function renderLearners() {
  const users = load(KEYS.users, []).filter((u) => u.role === 'learner');
  content().innerHTML = `<h2 class="page-title">Learners</h2>` + users.map((u) => {
    const st = u.status || 'approved';
    return `<div class="list-card"><h3>${escapeHtml(u.name)}</h3>
      <p class="text-secondary small">${escapeHtml(u.email)}</p>
      <span class="badge-soft ${st==='pending'||st==='registered'?'badge-warn':st==='approved'?'badge-ok':''}">${st}</span></div>`;
  }).join('');
}

function renderApprovals() {
  const users = load(KEYS.users, []);
  const courses = getCourses();
  const pendingAccounts = load(KEYS.applications, []).filter((a) => a.status === 'pending');
  const pendingEnrol = getEnrolments().filter((e) => e.status === 'pending');
  let html = `<h2 class="page-title">Applications & access</h2>
    <p class="text-secondary mb-3">Review uploaded documents, then approve or decline.</p>`;
  if (pendingAccounts.length) {
    html += `<h3 class="h6 text-secondary">New account applications (${pendingAccounts.length})</h3>`;
    pendingAccounts.forEach((a) => {
      const prog = courses.find((c) => c.id === a.programmeId);
      const d = a.documents || {};
      html += `<div class="list-card" style="border-color:#eab308">
        <h3>${escapeHtml(a.name)} <span class="badge-soft badge-warn">New applicant</span></h3>
        <p>${escapeHtml(a.email)}</p>
        <p class="text-secondary small">Programme: ${escapeHtml(prog ? (prog.programme || prog.title) : '—')}</p>
        <div class="content-block mb-2" style="font-size:.85rem">
          <p class="mb-1"><strong>Documents</strong></p>
          <p class="mb-1">ID: ${fileLinkHtml(d.idCopy)}</p>
          <p class="mb-1">Matric: ${fileLinkHtml(d.matric)}</p>
          <p class="mb-1">Other: ${(d.otherCerts || []).length ? (d.otherCerts || []).map(fileLinkHtml).join(', ') : '—'}</p>
          <p class="mb-0">Doctor\'s note: ${d.hasDisability ? fileLinkHtml(d.disabilityNote) : 'N/A'}</p>
        </div>
        <textarea class="form-control form-control-sm mb-2" id="acc-notes-${a.id}" rows="2" placeholder="Notes"></textarea>
        <button class="btn btn-sm btn-primary me-2" data-acc-approve="${a.id}">Approve access</button>
        <button class="btn btn-sm btn-outline-light" data-acc-decline="${a.id}">Decline</button></div>`;
    });
  }
  if (pendingEnrol.length) {
    html += `<h3 class="h6 text-secondary mt-3">Course requests (${pendingEnrol.length})</h3>`;
    pendingEnrol.forEach((e) => {
      const learner = users.find((u) => u.id === e.learnerId);
      const course = courses.find((c) => c.id === e.courseId);
      html += `<div class="list-card"><h3>${escapeHtml(learner?.name || 'Learner')}</h3>
        <p>${escapeHtml(course?.title || '')}</p>
        <button class="btn btn-sm btn-primary" data-approve="${e.id}">Approve course</button>
        <button class="btn btn-sm btn-outline-light" data-decline="${e.id}">Decline</button></div>`;
    });
  }
  if (!pendingAccounts.length && !pendingEnrol.length) html += '<div class="empty">No pending applications</div>';
  content().innerHTML = html;
  content().querySelectorAll('[data-acc-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      approveAccountApplication(btn.getAttribute('data-acc-approve'), true, document.getElementById('acc-notes-' + btn.getAttribute('data-acc-approve'))?.value || '');
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-acc-decline]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-acc-decline');
      const notes = document.getElementById('acc-notes-' + id)?.value || '';
      if (!notes.trim()) { alert('Add a reason when declining.'); return; }
      approveAccountApplication(id, false, notes);
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const list = getEnrolments();
      const row = list.find((x) => x.id === btn.getAttribute('data-approve'));
      if (row) { row.status = 'approved'; saveEnrolments(list); }
      renderApprovals();
    });
  });
  content().querySelectorAll('[data-decline]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const list = getEnrolments();
      const row = list.find((x) => x.id === btn.getAttribute('data-decline'));
      if (row) { row.status = 'declined'; saveEnrolments(list); }
      renderApprovals();
    });
  });
}

function renderLearnerHome() {
  const s = getSession();
  const enrolments = getEnrolments().filter((e) => e.learnerId === s.id && e.status === 'approved');
  const courses = getCourses();
  content().innerHTML = `<h2 class="page-title">My learning</h2>
    ${enrolments.length === 0 ? '<div class="empty">No approved programmes yet. Open Courses to apply.</div>' :
      enrolments.map((e) => {
        const c = courses.find((x) => x.id === e.courseId);
        return `<div class="list-card list-link" data-course="${e.courseId}" role="button"><h3>${escapeHtml(c?.title || '')}</h3>
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
    <p class="text-secondary mb-3">Tap a programme, then open a module. Assignments support file upload.</p>` +
    courses.map((c) => {
      const enr = enrolments.find((e) => e.learnerId === s.id && e.courseId === c.id);
      const status = enr ? enr.status : null;
      return `<div class="list-card"><h3>${escapeHtml(c.title)}</h3>
        <p class="text-secondary small mb-2">${escapeHtml(c.description || '')}</p>
        <div class="meta mb-2"><span class="badge-soft">NQF ${c.nqfLevel}</span>
          <span class="badge-soft">${c.credits} credits</span></div>
        ${s.role === 'trainer' || status === 'approved'
          ? `<button class="btn btn-sm btn-primary" data-open="${c.id}">Open modules</button>`
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
      list.push({ id: uid(), courseId, learnerId: s.id, status: 'pending', enrolledAt: new Date().toISOString() });
      saveEnrolments(list);
      alert('Course application submitted.');
      renderCatalog();
    });
  });
}

function renderCourseDetail(courseId) {
  const c = getCourse(courseId);
  if (!c) return;
  const s = getSession();
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-course"><i class="bi bi-arrow-left"></i> Back</button>
    <h2 class="page-title">${escapeHtml(c.title)}</h2>
    <p class="text-secondary small">NQF ${c.nqfLevel} · ${c.credits} credits · SAQA ${c.saqaId}</p>
    <h3 class="h6 text-secondary">Modules — tap to open</h3>
    ${(c.lessons || []).map((l, i) => `
      <div class="lesson-card" data-lesson="${l.id}" role="button">
        <div class="num">${i + 1}</div>
        <div style="flex:1"><h4>${escapeHtml(l.title)}</h4>
          <p>${l.type}${l.type === 'assignment' ? ' · upload evidence' : ''} · <span style="color:#93c5fd">Open →</span></p></div>
      </div>`).join('')}`;
  document.getElementById('btn-back-course')?.addEventListener('click', () => {
    if (s.role === 'trainer') { renderCatalog(); setNavActive('catalog'); }
    else { renderLearnerHome(); setNavActive('home'); }
  });
  content().querySelectorAll('[data-lesson]').forEach((el) => {
    el.addEventListener('click', () => {
      const lesson = (c.lessons || []).find((x) => x.id === el.getAttribute('data-lesson'));
      if (lesson) openLesson(courseId, lesson, s.role === 'trainer');
    });
  });
}

function openLesson(courseId, lesson, isTrainer) {
  if (lesson.type === 'quiz') {
    const quiz = lesson.quiz || { questions: [], passMark: 70 };
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-secondary">${quiz.questions.length} questions · pass ${quiz.passMark}%</p>
      <ol class="content-block">${quiz.questions.map((q) => `<li class="mb-2">${escapeHtml(q.q)}</li>`).join('')}</ol>`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    return;
  }
  if (lesson.type === 'assignment') return openAssignmentLesson(courseId, lesson, isTrainer);
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
    <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
    <p class="text-secondary small mb-3">${lesson.type}</p>
    <div class="content-block">${formatBody(lesson.body)}</div>`;
  document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
}

function openAssignmentLesson(courseId, lesson, isTrainer) {
  const s = getSession();
  const mine = getSubmissions().filter((x) => x.learnerId === s.id && x.assignmentId === lesson.assignmentId).pop();
  if (isTrainer) {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <div class="content-block">${formatBody(lesson.body)}</div>
      <p class="text-secondary small">Learners upload knowledge + practical evidence before submit. Grade under Grade tab.</p>`;
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
      <div class="content-block mb-2" style="font-size:.85rem">
        <p class="mb-1">Knowledge file: ${fileLinkHtml(mine.attachments?.knowledge)}</p>
        <p class="mb-0">Practical evidence: ${fileLinkHtml(mine.attachments?.practical)}</p>
      </div>
      ${!mine.passed ? `<button class="btn btn-primary w-100" id="btn-resubmit">Resubmit with files</button>` : ''}`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    document.getElementById('btn-resubmit')?.addEventListener('click', () => showAssignmentSubmitForm(courseId, lesson, mine));
    return;
  }
  if (mine && mine.status === 'submitted') {
    content().innerHTML = `
      <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
      <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
      <div class="content-block mb-2"><p class="mb-0">Submitted — awaiting result.</p></div>
      <div class="content-block mb-2" style="font-size:.9rem">${formatBody(mine.text)}</div>
      <div class="content-block" style="font-size:.85rem">
        <p class="mb-1">Knowledge: ${fileLinkHtml(mine.attachments?.knowledge)}</p>
        <p class="mb-0">Practical: ${fileLinkHtml(mine.attachments?.practical)}</p>
      </div>`;
    document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
    return;
  }
  showAssignmentSubmitForm(courseId, lesson, null);
}

function showAssignmentSubmitForm(courseId, lesson, previous) {
  content().innerHTML = `
    <button class="btn btn-sm btn-outline-light mb-2" id="btn-back-lesson"><i class="bi bi-arrow-left"></i> Back</button>
    <h2 class="page-title">${escapeHtml(lesson.title)}</h2>
    <div class="content-block mb-3">${formatBody(lesson.body)}</div>
    <label class="form-label">Written answer / knowledge response</label>
    <textarea class="form-control mb-3" id="assignment-text" rows="5" placeholder="Write your knowledge response (min 20 characters)…"></textarea>
    <label class="form-label">Knowledge module evidence (PDF / image / doc)</label>
    <input type="file" id="asg-knowledge" class="form-control mb-2" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,image/*,application/pdf">
    <p class="text-secondary small mb-2">Upload worksheet, completed guide, or knowledge task file.</p>
    <label class="form-label">Practical evidence (PDF / image / video clip)</label>
    <input type="file" id="asg-practical" class="form-control mb-2" accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,image/*,video/*,application/pdf">
    <p class="text-secondary small mb-3">Upload photos, checklist, or short practical proof. Max 1.5MB per file (demo limit).</p>
    <div id="asg-error" class="alert alert-danger d-none py-2"></div>
    <button class="btn btn-primary w-100" id="btn-submit-asg">Upload & submit for marking</button>`;
  document.getElementById('btn-back-lesson')?.addEventListener('click', () => renderCourseDetail(courseId));
  document.getElementById('btn-submit-asg')?.addEventListener('click', async () => {
    const err = document.getElementById('asg-error');
    err?.classList.add('d-none');
    const text = document.getElementBy('assignment-text').value.trim();
    if (text.length < 20) {
      if (err) { err.textContent = 'Please write at least 20 characters in the knowledge response.'; err.classList.remove('d-none'); }
      return;
    }
    const btn = document.getElementById('btn-submit-asg');
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
    try {
      const knowledge = await readFilesFromInput(document.getElementById('asg-knowledge'), false);
      const practical = await readFilesFromInput(document.getElementById('asg-practical'), false);
      if (!knowledge && !practical) {
        if (err) { err.textContent = 'Upload at least one file: knowledge evidence and/or practical evidence.'; err.classList.remove('d-none'); }
        if (btn) { btn.disabled = false; btn.textContent = 'Upload & submit for marking'; }
        return;
      }
      const s = getSession();
      const list = getSubmissions();
      if (previous) {
        const sub = list.find((x) => x.id === previous.id);
        if (sub) {
          sub.text = text; sub.status = 'submitted'; sub.score = null; sub.feedback = '';
          sub.passed = false; sub.attachments = { knowledge, practical };
          sub.submittedAt = new Date().toISOString();
        }
      } else {
        list.push({
          id: uid(), assignmentId: lesson.assignmentId, courseId, learnerId: s.id, text,
          status: 'submitted', submittedAt: new Date().toISOString(), score: null, feedback: '',
          attachments: { knowledge, practical },
        });
      }
      save(KEYS.submissions, list);
      pushMessage(s.id, s.gmail || s.email, 'Submission received', 'Your assignment with uploads was submitted for marking.');
      alert('Submitted with uploads.');
      openAssignmentLesson(courseId, lesson, false);
    } catch (e) {
      if (err) { err.textContent = 'Upload failed. Try smaller files (max 1.5MB each).'; err.classList.remove('d-none'); }
      if (btn) { btn.disabled = false; btn.textContent = 'Upload & submit for marking'; }
    }
  });
}

function renderGrading() {
  const subs = getSubmissions().filter((s) => s.status === 'submitted');
  const users = load(KEYS.users, []);
  content().innerHTML = `<h2 class="page-title">To grade</h2>
    <p class="text-secondary mb-3">Open attachments, then enter a score.</p>` +
    (subs.length === 0 ? '<div class="empty">Nothing to grade</div>' :
      subs.map((sub) => {
        const learner = users.find((u) => u.id === sub.learnerId);
        return `<div class="list-card"><h3>${escapeHtml(learner?.name || 'Learner')}</h3>
          <div class="content-block mb-2" style="font-size:.9rem">${formatBody(sub.text)}</div>
          <div class="content-block mb-2" style="font-size:.85rem">
            <p class="mb-1">Knowledge: ${fileLinkHtml(sub.attachments?.knowledge)}</p>
            <p class="mb-0">Practical: ${fileLinkHtml(sub.attachments?.practical)}</p>
          </div>
          <input type="number" class="form-control mb-2" id="score-${sub.id}" min="0" max="100" value="70">
          <textarea class="form-control mb-2" id="fb-${sub.id}" rows="2" placeholder="Feedback"></textarea>
          <button class="btn btn-sm btn-primary" data-grade="${sub.id}">Save grade</button></div>`;
      }).join(''));
  content().querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-grade');
      const list = getSubmissions();
      const sub = list.find((s) => s.id === id);
      if (!sub) return;
      sub.status = 'graded';
      sub.score = Number(document.getElementById('score-' + id)?.value) || 0;
      sub.feedback = document.getElementById('fb-' + id)?.value || '';
      sub.passed = sub.score >= 70;
      sub.gradedAt = new Date().toISOString();
      save(KEYS.submissions, list);
      alert('Grade saved.');
      renderGrading();
    });
  });
}

function renderMessages() {
  const s = getSession();
  const messages = load(KEYS.messages, []).filter((m) => m.toUserId === s.id);
  content().innerHTML = `<h2 class="page-title">Inbox</h2>` +
    (messages.length === 0 ? '<div class="empty">No messages</div>' :
      messages.map((m) => `<div class="list-card"><h3>${escapeHtml(m.subject)}</h3>
        <p class="mb-0">${escapeHtml(m.body)}</p></div>`).join(''));
}

function renderAbout() {
  content().innerHTML = `<h2 class="page-title">About EduFlow</h2>
    <div class="content-block">
      <p class="mb-2"><strong>Uploads</strong></p>
      <ul class="text-secondary small mb-0">
        <li>Application: ID, Matric, other certificates, doctor\'s note</li>
        <li>Assignments: knowledge module evidence + practical evidence</li>
        <li>Demo limit: 1.5MB per file (stored in browser)</li>
      </ul>
    </div>`;
}

async function bootEduFlow() {
  await seedIfNeeded();
  setTimeout(() => document.getElementById('splash')?.classList.add('hide'), 400);

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = login(document.getElementById('email').value.trim(), document.getElementById('password').value);
    const err = document.getElementById('login-error');
    if (!result.ok) { err.textContent = result.message; err.classList.remove('d-none'); return; }
    err.classList.add('d-none');
    if (result.needsApplication) showApplicationStep(result.user);
    else if (result.pending) showAwaitingApproval();
    else showApp();
  });

  document.getElementById('btn-register')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterPanel(); });
  document.getElementById('btn-show-login')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  document.getElementById('btn-show-login-from-reg')?.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('reg-error');
    err?.classList.add('d-none');
    const result = createLearnerAccount({
      name: document.getElementById('reg-name')?.value.trim() || '',
      email: document.getElementById('reg-email')?.value.trim() || '',
      phone: document.getElementById('reg-phone')?.value.trim() || '',
      password: document.getElementById('reg-password')?.value || '',
      password2: document.getElementById('reg-password2')?.value || '',
    });
    if (!result.ok) {
      if (err) { err.textContent = result.message; err.classList.remove('d-none'); }
      else alert(result.message);
      return;
    }
    showApplicationStep(result.user);
  });

  document.getElementById('apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('apply-error');
    err?.classList.add('d-none');
    const s = getSession();
    if (!s) { alert('Please create an account first.'); showRegisterPanel(); return; }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading documents…'; }
    try {
      const hasDisability = !!document.getElementById('apply-disability')?.checked;
      const idCopy = await readFilesFromInput(document.getElementById('apply-id'), false);
      const matric = await readFilesFromInput(document.getElementById('apply-matric'), false);
      const otherCerts = await readFilesFromInput(document.getElementById('apply-other'), true);
      const disabilityNote = hasDisability ? await readFilesFromInput(document.getElementById('apply-note'), false) : null;
      const result = submitApplicationForUser(s.id, {
        programmeId: document.getElementById('apply-programme')?.value || '',
        notes: document.getElementById('apply-notes')?.value.trim() || '',
        documents: { hasDisability, idCopy, matric, otherCerts, disabilityNote },
      });
      if (!result.ok) {
        if (err) { err.textContent = result.message; err.classList.remove('d-none'); }
        else alert(result.message);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit application'; }
        return;
      }
      showAwaitingApproval();
    } catch (ex) {
      if (err) { err.textContent = 'Document upload failed. Use smaller files (max 1.5MB each).'; err.classList.remove('d-none'); }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit application'; }
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', logout);
  if (getSession()) showApp(); else showLogin();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootEduFlow);
else bootEduFlow();
