# EduFlow LMS

Learning Management System demo for training providers.

**Live demo:** https://jlephoto23-collab.github.io/EduFlow-LMS/

## Demo logins

| Role | Email | Password |
|------|--------|----------|
| Trainer | trainer@eduflow.test | trainer123 |
| Learner | learner1@eduflow.test | learner123 |

Or use **New learner? Create account** on the login screen.

## Features (pilot demo)

- Trainer and learner roles
- Course catalog
- Learner requests enrolment → trainer approves/rejects
- Lessons (content)
- Quizzes with pass mark
- Written assignments + submit
- Trainer grades submissions
- Progress % and reports
- Completion certificate view
- Reset demo data

## Important: demo vs live students

This version stores data in the **browser (localStorage)**. It is perfect for **pitches and single-device demos**.

It is **not** yet a multi-user live system: a student on another phone does not share the same database as the trainer.

### To go live (real enrolments across devices)

1. Keep this UI.
2. Add a free backend:
   - **Firebase** (Auth + Firestore), or
   - **Supabase** (Auth + Postgres)
3. Replace `localStorage` in `js/app.js` with cloud read/write.
4. Host the same files on GitHub Pages (or Netlify/Vercel).
5. Optional: custom domain (e.g. learn.yourprovider.co.za).

### Suggested go-live phases

| Phase | Deliverable |
|-------|-------------|
| Pilot demo (now) | This app on GitHub Pages |
| Phase 1 live | Firebase/Supabase auth + shared courses/enrolments |
| Phase 2 | File uploads, email notifications, PDF certificates |
| Phase 3 | Multi-campus admin, exports, integrations |

## Pitch tip

Demo the full path on one device (trainer approve → learner study → submit → grade → certificate), then explain Phase 1 live as the paid pilot setup.
