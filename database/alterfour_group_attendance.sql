-- Run in Supabase SQL Editor before deploying the group attendance page.
-- These are the three teacher usernames chosen for group attendance.
alter table public.profiles
  add column if not exists can_record_group_attendance boolean not null default false;

update public.profiles
set can_record_group_attendance = username in ('hosna', 'hebatullah', 'habiba')
where role = 'TEACHER';

create table if not exists public.group_attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  week_start_date date not null check (extract(dow from week_start_date) = 6),
  attended boolean not null default true,
  excused boolean not null default false,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (student_id, week_start_date),
  constraint group_absence_excuse check (not attended or not excused)
);

grant select, insert, update on public.group_attendance_records to anon;

select username, full_name, can_record_group_attendance
from public.profiles
where username in ('hosna', 'hebatullah', 'habiba')
order by username;
