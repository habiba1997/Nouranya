-- Admin assignments, online schedules, and excuses.
-- Apply after alterone.sql and alterfour_group_attendance.sql, before deploying.
begin;

-- Add the confirmed missing student and her initial teacher.
insert into public.students (full_name, active)
select 'مريم مدحت', true
where not exists (select 1 from public.students where full_name = 'مريم مدحت');
update public.students set active = true where full_name = 'مريم مدحت';
insert into public.teacher_students (teacher_id, student_id)
values (
  (select id from public.profiles where username = 'nada' and role = 'TEACHER'),
  (select id from public.students where full_name = 'مريم مدحت')
) on conflict (teacher_id, student_id) do nothing;

-- This becomes the app's assignment table. The old links remain as migration history.
create table if not exists public.student_teacher_assignments (
  student_id uuid primary key references public.students(id) on delete cascade,
  individual_teacher_id uuid references public.profiles(id),
  online_teacher_id uuid references public.profiles(id)
);
insert into public.student_teacher_assignments (student_id, individual_teacher_id, online_teacher_id)
select s.id,
  (select teacher_id from public.teacher_students where student_id = s.id),
  (select teacher_id from public.teacher_students where student_id = s.id)
from public.students s
on conflict (student_id) do nothing;

create table if not exists public.teacher_schedules (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  weekday integer check (weekday between 0 and 6),
  start_time time,
  notes text not null default ''
);

alter table public.weekly_records
  add column if not exists saturday_excused boolean not null default false,
  add column if not exists midweek_excused boolean not null default false;
alter table public.weekly_records drop constraint if exists individual_excuse_check;
alter table public.weekly_records add constraint individual_excuse_check
  check (not saturday_excused or saturday_attended is false);
alter table public.weekly_records drop constraint if exists online_excuse_check;
alter table public.weekly_records add constraint online_excuse_check
  check (not midweek_excused or midweek_attended is false);

grant select, insert, update on public.student_teacher_assignments, public.teacher_schedules to anon;
commit;

-- Expected after the previously approved roster updates: 53 active students, 8 with nada, 5 with nihal.
select p.username, count(s.id) as individual_students
from public.profiles p
left join public.student_teacher_assignments a on a.individual_teacher_id = p.id
left join public.students s on s.id = a.student_id and s.active
where p.role = 'TEACHER'
group by p.id, p.username order by p.username;
