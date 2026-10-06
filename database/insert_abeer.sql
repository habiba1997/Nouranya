-- Add the active student عبير and assign her to نهال.
-- Safe to run again: existing student and assignment are reused.
begin;

insert into public.students (full_name, active)
select 'عبير', true
where not exists (select 1 from public.students where full_name = 'عبير');

update public.students set active = true where full_name = 'عبير';

insert into public.teacher_students (teacher_id, student_id)
values (
  (select id from public.profiles where username = 'nihal' and role = 'TEACHER'),
  (select id from public.students where full_name = 'عبير' and active)
)
on conflict (teacher_id, student_id) do nothing;

commit;

select s.id, s.full_name, s.active, p.full_name as teacher_name, p.username
from public.students s
join public.teacher_students ts on ts.student_id = s.id
join public.profiles p on p.id = ts.teacher_id
where s.full_name = 'عبير';
