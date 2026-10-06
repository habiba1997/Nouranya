-- Add مريم مدحت and assign her to ندى.
-- Safe to run again: it reuses the existing student and assignment.
begin;

insert into public.students (full_name, active)
select 'مريم مدحت', true
where not exists (select 1 from public.students where full_name = 'مريم مدحت');

update public.students set active = true where full_name = 'مريم مدحت';

insert into public.teacher_students (teacher_id, student_id)
values (
  (select id from public.profiles where username = 'nada' and role = 'TEACHER'),
  (select id from public.students where full_name = 'مريم مدحت' and active)
)
on conflict (teacher_id, student_id) do nothing;

commit;

select s.full_name, p.full_name as teacher_name, p.username
from public.students s
join public.teacher_students ts on ts.student_id = s.id
join public.profiles p on p.id = ts.teacher_id
where s.full_name = 'مريم مدحت';
