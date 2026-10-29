# Nouranya

A mobile-friendly school workspace for students, teachers, weekly attendance, homework, comments, and exam marks. Built with React, TypeScript, Vite, React Router, and Supabase PostgreSQL.

## Current connection

The local `.env` is configured for your existing Supabase project. It contains only the project URL and publishable key and is git-ignored. The app uses real Supabase data only: there is no demo adapter, sample-data fallback, or browser-local record storage.

The existing six tables were checked through the read API and their required columns match the app. Profiles, students, and teacher assignments are readable. Weekly records, exams, and exam results returned no visible rows. No remote records or policies were changed during connection setup.

## Start the app

Use Node.js **22.13 or newer**; the default Node 18 is too old for Vite 8.

```bash
nvm use
npm install
npm run dev
```

Open the URL printed by Vite. Enter a username from `profiles`, such as `habiba.admin` or `habiba.teacher`. The app loads the corresponding profile and opens the appropriate workspace.

## Username selection, without authentication

As requested, there is no Supabase Auth, password, `auth.users` dependency, or `auth.uid()` authorization in the application setup. Selecting a username is **not identity verification**. Teacher/admin navigation and assignment filtering are UI conveniences, not secure authorization: anyone with the public API key and your database permissions can call the API outside the UI. Do not treat this version as protection for private records on a publicly accessible website.

Your existing database must permit the required operations for the `anon` role. Successful reads do not prove write permissions. If a save fails with a permissions error, review the existing table grants and RLS policies in Supabase; do not blindly replace the database schema. The app shows returned API errors. No server secret is needed or used.

## Configure another environment

Copy `.env.example` to `.env` and enter:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

Find these in your Supabase project's Connect dialog/API settings. Never use a service-role or secret key. Restart Vite after changing environment values. When configuration is missing, the app displays setup instructions instead of fake data.

## Database files

**Your existing project is already connected. Do not run `schema.sql` over it.**

- `supabase/schema.sql` is a reference initial setup for a **new empty database**, using independent profile UUIDs and shared, no-authentication access. It includes constraints and score validation triggers.
- `supabase/seed.sql` intentionally inserts no records. Set the three real maximum scores from Admin → Exam settings. No example students, teachers, marks, or attendance are inserted.
- `database/` contains the original planning drafts, not active setup scripts. The current app does not execute these.

Database triggers in the reference schema are not assumed to exist in your live project. Live writes and server-side validation have not been tested by modifying your real student records.

## Using the app

- **Teachers:** their assigned students, weekly attendance/homework/comments, history, and grading for any active student.
- **Administrators:** all students, teacher profiles, assignments, weekly filters, exam reports, and exam maximums.
- Add teacher profiles with a unique username; no Auth account is required. The existing database must allow standalone profile UUIDs.
- Deactivate students rather than deleting them. Historical records remain available.
- Weekly data uses the Saturday starting that school week. The exact midweek date is not stored.
- `Not entered` is distinct from `Absent` and `Not completed`. All three states are preserved.
- Weekly saves upsert only edited student rows, unique by student/week. Exam saves upsert by student/exam and record the selected profile as the grader.
- Blank exam marks are not converted to zero. Marks must be between zero and the configured maximum. The app prevents lowering a maximum below loaded results.
- Shared assignments and concurrent editors use last-save-wins behavior. Save before changing pages or reloading; changing weeks/exams within the editor prompts before discarding changes.
- Mobile layouts use horizontally scrollable navigation, labeled student cards, large inputs/buttons, and a sticky save action. Desktop layouts use tables.

## Verification and deployment

For the independent group-attendance page, run `database/alterfour_group_attendance.sql` in the existing Supabase project before deploying this version. It adds `group_attendance_records` and a `can_record_group_attendance` profile flag, enabled for the teacher usernames `hosna`, `hebatullah`, and `habiba`. The page shows every active student checked as present. No attendance is recorded until someone presses **حفظ حضور المجمعة**; that first save stores all active students. Unchecking a student reveals the **معتذرة** option. The group page is separate from the individual, online, and homework records. The profile flag controls the app's navigation; with username-only entry and no authentication, it does not protect the database from direct API access.

```bash
npm run build
npm run lint
npm run format
npm run preview
```

Deploy `dist/` to a static host with all application paths rewritten to `/index.html`. Set the two `VITE_` variables at build time. Use HTTPS. For phone testing on your own network, run `npm run dev -- --host 0.0.0.0` and open the computer's LAN address on the phone; this makes the development server reachable on the local network.

This version represents one school term. Multi-term tracking and scheduled email reminders are deferred. Keep any future email-provider secrets in a server-side function.

## تحديث إدخال الأسبوع وخطة الحلقات

قبل نشر هذه النسخة، شغّلي `database/alterone.sql` في محرر SQL بمشروع Supabase الحالي. الملف يضيف علامة الواجب المتأخر وجدول `weekly_plans`، ويحافظ على السجلات الموجودة. يمكن تشغيله مجددًا دون إعادة إنشاء البيانات. لا تشغّلي ملف إنشاء قاعدة البيانات كاملة فوق المشروع الموجود.

من حساب الإدارة، افتحي «الحضور والواجب»، اختاري الأسبوع ثم «إضافة خطة الأسبوع». أدخلي محتوى المجمعة (السبت)، والفردية (السبت)، والأونلاين ثم احفظي. تظهر الخطة في الرئيسية وإدخال الأسبوع للحسابات التي تدخل بعد الحفظ. الأونلاين غير مرتبط بيوم السبت؛ تاريخ السبت يحدد بداية الأسبوع فقط.

حالات الواجب: لم يُسجّل، تم، لم يُحل، واجب متأخر. المتأخر يُحفظ كواجب مكتمل مع `homework_late=true`. فلاتر الحالات أصبحت في الرئيسية، وإدخال الأسبوع يحتفظ بالبحث وفلتر المعلمة للإدارة. هذا التحديث لا يضيف تسجيل حضور المجمعة أو صلاحياته بعد.
