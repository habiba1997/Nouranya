-- Run database/alterone.sql first. This only inserts/updates these six weeks.
insert into public.weekly_plans
  (week_start_date, group_content, individual_content, online_content)
values
  ('2026-10-10', 'الدرس الأول والدرس الثاني', 'الدرس الأول', 'الدرس الثاني'),
  ('2026-10-17', 'الدرس الثالث والدرس الرابع', 'الدرس الثالث', 'الدرس الرابع'),
  ('2026-10-24', 'الدرس الخامس والدرس السادس', 'الدرس الخامس', 'الدرس السادس'),
  ('2026-10-31', 'الدرس السابع والدرس الثامن', 'الدرس السابع', 'الدرس الثامن'),
  ('2026-11-07', 'الدرس التاسع والدرس العاشر', 'الدرس التاسع', 'الدرس العاشر'),
  ('2026-11-14', 'امتحان الدروس السابقة والدرس الحادي عشر والدرس الثاني عشر', 'الدرس الحادي عشر', 'الدرس الثاني عشر')
on conflict (week_start_date) do update set
  group_content = excluded.group_content,
  individual_content = excluded.individual_content,
  online_content = excluded.online_content;

select * from public.weekly_plans
where week_start_date between '2026-10-10' and '2026-11-14'
order by week_start_date;
