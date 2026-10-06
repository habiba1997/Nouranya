-- Weekly homework and lesson plans (also available as database/alterone.sql for existing projects).
-- Apply in Supabase SQL Editor before deploying this version.
-- Additive migration: existing attendance and homework values are preserved.
begin;
alter table public.weekly_records
    add column if not exists homework_late boolean not null default false;

-- A late submission is completed homework, never missing or unrecorded.
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.weekly_records'::regclass and conname = 'weekly_records_homework_late_check') then
alter table public.weekly_records add constraint weekly_records_homework_late_check
    check (not homework_late or homework_completed is true);
end if;
end $$;

create table if not exists public.weekly_plans (
                                                   week_start_date date primary key check (extract(dow from week_start_date) = 6),
    group_content text not null default '',
    individual_content text not null default '',
    online_content text not null default ''
    );
-- Same no-authentication access model as the existing application.
grant select, insert, update on public.weekly_plans to anon;
commit;
