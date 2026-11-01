-- Apply before deploying the first exam attendance page.
create table if not exists public.first_exam_attendance (
  student_id uuid primary key references public.students(id) on delete cascade,
  attended boolean not null default true,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now()
);
grant select, insert, update on public.first_exam_attendance to anon;
