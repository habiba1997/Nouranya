-- Run database/altertwo_students.sql first (51 active students).
-- Nora has no email yet. Username is used to enter the app, so email is optional.
-- One transaction keeps the old assignments if any statement fails.
begin;

alter table public.profiles alter column email drop not null;

update public.profiles
set full_name = 'هبةالله'
where id = '9fc08551-edad-4186-a1bf-59f2a101139d'
  and username = 'hebatullah';

insert into public.profiles (id, full_name, username, email, role)
select gen_random_uuid(), 'نورا', 'nora', NULL, 'TEACHER'
where not exists (select 1 from public.profiles where username = 'nora');

insert into public.students (full_name, active)
select 'عبير', true
where not exists (select 1 from public.students where full_name = 'عبير');

update public.students set active = true where full_name = 'عبير';

delete from public.teacher_students;

-- Each lookup must find exactly one active student and one teacher.
-- A missing or duplicate lookup fails the INSERT and rolls back the DELETE.
insert into public.teacher_students (teacher_id, student_id)
values
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'سارة عبدالعزيز' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'بسملة حسين' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'ردينة حسين' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'شهد محمد' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'سماء ناصر' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'حبيبة صابر' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'مريم ياسر' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'رحمة عبدالمجيد' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'دنيا محمد' and active)),
  ((select id from public.profiles where username = 'magda' and role = 'TEACHER'), (select id from public.students where full_name = 'انجي محمود' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'منال خالد' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'سماسم حمادة' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'هنا زكى' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'رنا عبدالرحمن' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'منة محمد حنفى' and active)),
  ((select id from public.profiles where username = 'nora' and role = 'TEACHER'), (select id from public.students where full_name = 'اميرة محمد حنفى' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'ريناد محمد' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'سارة عبدالهادى' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'ندى ماهر' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'منة خالد' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'هدير ياسر' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'اية ياسر' and active)),
  ((select id from public.profiles where username = 'nada' and role = 'TEACHER'), (select id from public.students where full_name = 'اميرة ياسر' and active)),
  ((select id from public.profiles where username = 'nihal' and role = 'TEACHER'), (select id from public.students where full_name = 'جودى وائل' and active)),
  ((select id from public.profiles where username = 'nihal' and role = 'TEACHER'), (select id from public.students where full_name = 'سمية طارق' and active)),
  ((select id from public.profiles where username = 'nihal' and role = 'TEACHER'), (select id from public.students where full_name = 'فادية احمد' and active)),
  ((select id from public.profiles where username = 'nihal' and role = 'TEACHER'), (select id from public.students where full_name = 'بسملة احمد' and active)),
  ((select id from public.profiles where username = 'amal' and role = 'TEACHER'), (select id from public.students where full_name = 'منار الزيدى' and active)),
  ((select id from public.profiles where username = 'amal' and role = 'TEACHER'), (select id from public.students where full_name = 'ياسمين حمدي' and active)),
  ((select id from public.profiles where username = 'amal' and role = 'TEACHER'), (select id from public.students where full_name = 'نهى ممدوح' and active)),
  ((select id from public.profiles where username = 'amal' and role = 'TEACHER'), (select id from public.students where full_name = 'اية يونس' and active)),
  ((select id from public.profiles where username = 'amal' and role = 'TEACHER'), (select id from public.students where full_name = 'حبيبة رضا' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'هاجر عيد' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'فايزة السيد' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'شهد الزيدى' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'امنية مدحت' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'حسناء الزيدي' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'ملك جمعة' and active)),
  ((select id from public.profiles where username = 'habiba' and role = 'TEACHER'), (select id from public.students where full_name = 'اسماء نادر' and active)),
  ((select id from public.profiles where username = 'hebatullah' and role = 'TEACHER'), (select id from public.students where full_name = 'هاجر اشرف' and active)),
  ((select id from public.profiles where username = 'hebatullah' and role = 'TEACHER'), (select id from public.students where full_name = 'اية محمد نصر' and active)),
  ((select id from public.profiles where username = 'hebatullah' and role = 'TEACHER'), (select id from public.students where full_name = 'بسملة سلامة' and active)),
  ((select id from public.profiles where username = 'hebatullah' and role = 'TEACHER'), (select id from public.students where full_name = 'اية انس' and active)),
  ((select id from public.profiles where username = 'hebatullah' and role = 'TEACHER'), (select id from public.students where full_name = 'ندى محمد' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'سارة جمال' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'نادية على' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'هلا عبدالعظيم' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'جهاد ايمن' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'نورهان ايمن' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'اسماء شعبان' and active)),
  ((select id from public.profiles where username = 'hosna' and role = 'TEACHER'), (select id from public.students where full_name = 'ريم ابوالفتوح' and active)),
  ((select id from public.profiles where username = 'nihal' and role = 'TEACHER'), (select id from public.students where full_name = 'عبير' and active));

commit;

-- Expected total: 52. magda 10, nora 6, nada 7, nihal 5,
-- amal 5, habiba 7, hebatullah 5, hosna 7.
select p.full_name, p.username, count(ts.student_id) as student_count
from public.profiles p
left join public.teacher_students ts on ts.teacher_id = p.id
where p.role = 'TEACHER'
group by p.id, p.full_name, p.username
order by p.username;
