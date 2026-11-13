# EduFlow LMS — Client pitch guide

**Live demo:** https://jlephoto23-collab.github.io/EduFlow-LMS/

Use this for a **10–15 minute** walkthrough with a training provider.

---

## Demo accounts

| Role | Email | Password |
|------|--------|----------|
| **Administrator** | `admin@eduflow.test` | `admin123` |
| **Learner** | `learner1@gmail.com` | `learner123` |

Tip: open **two browser windows** (or phone + laptop) to show live tab-sync.

If the dashboard does not show **Pending access: 1** and **To grade: 1**, hard-refresh (`Ctrl+F5`), or sign in as admin → **More → Reset demo data**.

---

## Suggested script (about 12 minutes)

### 1. Opening (1 min)

> “EduFlow is a mobile-first LMS for training providers. Learners apply, get approved, complete modules and assessments, and receive results — including on their Gmail. Today’s demo is live on the web with sample NQF Level 4 programmes.”

Open the **live demo** link. Point out the dark, app-like UI and **Install App** / Add to Home Screen if on mobile.

### 2. Administrator (5 min)

1. Sign in as **admin@eduflow.test** / **admin123**.
2. **Dashboard** — Programmes **3**, Learners **3**, Pending access **1**, To grade **1** (tiles open the right screens).
3. **Programmes** — open one NQF course; show **SAQA ID**, unit standards, learning outcomes.
4. **Approvals** — approve James Molefe’s Generic Management request.
5. **Grade** — open Aisha’s mini project plan:
   - **Rubric** (Content / Structure / Application)
   - **Feedback** to the learner
   - **Save result** or **Save all marks** (bulk)
6. **Reports** — progress table, **Bulk grade**, copy summary.
7. **More → Provider settings** — set *their* provider name and contact email for the meeting.

### 3. Learner (4 min)

1. Log out → sign in as **learner1@gmail.com** / **learner123**.
2. **My learning** — progress on enrolled programmes.
3. **Courses** — apply for a programme (Gmail-linked).
4. Open a course → **learner guide / module** → mark complete.
5. **Quiz** — complete; show auto score and pass/fail.
6. **Assignment** — submit 20+ characters (or show graded result after admin marks).
7. **Results** (mark + feedback) and **Inbox** (notification).
8. If mark is below pass mark → show **Resubmit for marking**.

### 4. Close (2 min)

> “What you saw runs today as a web app and PWA. Phase 1 for production is Firebase Auth + Firestore so every trainer and learner shares one secure cloud database. We can brand it with your logo, lock down roles, and package an Android install via Capacitor.”

Hand them:
- Live URL  
- This repo (or a ZIP)  
- Next steps: branding → Firebase → pilot cohort  

---

## Value points to stress

- End-to-end flow: **apply → approve → learn → assess → grade → results**
- **NQF / SAQA-aligned** pilot content (register references + original pilot wording)
- **Gmail-linked** learner communications (inbox + mailto)
- **Rubrics, feedback, resubmit, bulk grade**
- Works on **phone browser**; installable as **PWA**; Android APK path in `BUILD.md`

---

## Before the meeting checklist

- [x] Live demo URL live (GitHub Pages)
- [x] Admin and learner demo accounts
- [x] Provider settings seeded (edit to client name in meeting)
- [x] Sample assignment ready to grade (seed v7)
- [x] Sample pending access request (seed v7)
- [x] Auto-upgrade from older seed (6 → 7) on refresh
- [x] PWA Install App + service worker
- [x] Capacitor / Android build path (`BUILD.md`)
- [ ] Your action: hard-refresh live site (`Ctrl+F5`)
- [ ] Your action: set Provider settings to the client’s name
- [ ] Your action: second window ready for live sync (optional)
- [ ] Your action: phone ready for Add to Home Screen (optional)
