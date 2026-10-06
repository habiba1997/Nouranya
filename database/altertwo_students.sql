-- Roster reconciliation against the user's final 51-student list.
-- Run manually in Supabase SQL Editor. Does not delete students, history,
-- teacher profiles, or assignments. Safe to rerun for this supplied snapshot.
begin;
create temporary table roster_extras (id uuid primary key, expected_name text not null) on commit drop;
insert into roster_extras (id, expected_name) values
  ('15042d41-021f-4531-b678-7b5dc26f7498'::uuid, 'بسنت محسن'),
  ('1988fbde-0c1f-44df-861d-b61c912227fc'::uuid, 'حبيبة محمد'),
  ('69db8aca-6185-46e1-9150-0d8d8b1f89e9'::uuid, 'رنا حازم'),
  ('8a5b13a3-c5bf-4c55-a792-492b005efe94'::uuid, 'سما صلاح'),
  ('b4168095-4e2b-45cd-8683-0625ab8a07f5'::uuid, 'سهام محمد'),
  ('d617c5a5-9e29-40be-b001-7ba666992148'::uuid, 'يمنى علاءالدين'),
  ('dcba7535-1d18-4ccf-b3a5-aeb50fb69c35'::uuid, 'هبة عماد'),
  ('e7602acd-b5f7-4506-98e6-f459974a67eb'::uuid, 'ريتاج أحمد'),
  ('ebbac5d1-dd07-4ece-99f2-37b63548df9e'::uuid, 'سارة سليمان');

-- Refuse to update a different or missing student if the supplied snapshot changed.
do $$ begin
  if exists (
    select 1 from roster_extras e left join public.students s on s.id = e.id
    where s.id is null or s.full_name is distinct from e.expected_name
  ) then
    raise exception 'Roster differs from the supplied snapshot. Review student IDs and names before retrying.';
  end if;
  if not exists (
    select 1 from public.students
    where id = '08371a3b-8e6b-4bfe-8285-d4c194e1c516'::uuid
      and full_name in ('انجى محمود', 'انجي محمود')
  ) then
    raise exception 'Unable to verify the student for the spelling correction.';
  end if;
end $$;

update public.students s set active = false
from roster_extras e where s.id = e.id
returning s.id, s.full_name, s.active;

update public.students set full_name = 'انجي محمود'
where id = '08371a3b-8e6b-4bfe-8285-d4c194e1c516'::uuid
returning id, full_name, active;
commit;

-- Expected from the supplied 60-student snapshot: 51 active, 9 inactive.
select count(*) filter (where active) as active_students,
       count(*) filter (where not active) as inactive_students
from public.students;
