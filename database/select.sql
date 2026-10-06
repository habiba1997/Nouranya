
-- Expected total: 52. magda 10, nora 6, nada 8, nihal 5,
-- amal 5, habiba 7, hebatullah 5, hosna 7
select p.full_name, p.username, count(ts.student_id) as student_count
from public.profiles p
         left join public.teacher_students ts on ts.teacher_id = p.id
where p.role = 'TEACHER'
group by p.id, p.full_name, p.username
order by p.username;


select
    p.full_name as teacher_name,
    p.username,
    s.full_name as student_name,
    s.active as student_active,
    count(s.id) over (partition by p.id) as teacher_total
from public.profiles p
         left join public.teacher_students ts on ts.teacher_id = p.id
         left join public.students s on s.id = ts.student_id
where p.role = 'TEACHER'
order by p.full_name, s.full_name;