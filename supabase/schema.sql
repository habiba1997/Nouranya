-- Run once in a NEW Supabase project's SQL editor, before seed.sql.
create type public.user_role as enum ('TEACHER', 'ADMIN');
create type public.exam_type as enum ('MIDTERM_1', 'MIDTERM_2', 'FINAL');
create table public.profiles (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(trim(full_name))>0), username text unique not null,
 email text unique not null, role public.user_role not null default 'TEACHER', created_at timestamptz not null default now()
);
create table public.students (id uuid primary key default gen_random_uuid(), full_name text not null check(length(trim(full_name))>0), active boolean not null default true, created_at timestamptz not null default now());
create table public.teacher_students (teacher_id uuid not null references public.profiles(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, primary key(teacher_id,student_id));
create table public.weekly_records (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
 week_start_date date not null check(extract(dow from week_start_date)=6),
 saturday_attended boolean, midweek_attended boolean, homework_completed boolean, comment text,
 recorded_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(student_id,week_start_date)
);
create table public.exams (id uuid primary key default gen_random_uuid(), exam_type public.exam_type not null unique, max_score numeric not null check(max_score>0 and max_score<'Infinity'::numeric), created_at timestamptz not null default now());
create table public.exam_results (
 id uuid primary key default gen_random_uuid(), exam_id uuid not null references public.exams(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade,
 score numeric not null check(score>=0 and score<'Infinity'::numeric), notes text, graded_by uuid not null references public.profiles(id), graded_at timestamptz not null default now(), unique(exam_id,student_id)
);
create index idx_teacher_students_student on public.teacher_students(student_id);
create index idx_weekly_records_week on public.weekly_records(week_start_date);
create index idx_exam_results_student on public.exam_results(student_id);
create index idx_exam_results_grader on public.exam_results(graded_by);
-- Unique composite indexes already cover teacher_id, weekly student_id, and exam_id.
-- No authentication: the publishable key grants shared workspace access.
-- Role and assignment selection in React is convenience only, not authorization.
create function public.stamp_weekly() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger weekly_stamp before insert or update on public.weekly_records for each row execute function public.stamp_weekly();
create function public.validate_score() returns trigger language plpgsql set search_path='' as $$
declare maximum numeric;
begin
 select max_score into maximum from public.exams where id=new.exam_id for update;
 if maximum is null or new.score>maximum then raise exception 'Score exceeds the configured maximum mark'; end if;
 new.graded_at=now(); return new;
end $$;
create trigger result_validation before insert or update on public.exam_results for each row execute function public.validate_score();
create function public.validate_maximum() returns trigger language plpgsql set search_path='' as $$ begin
 if exists(select 1 from public.exam_results where exam_id=new.id and score>new.max_score) then raise exception 'Maximum cannot be lower than an existing score'; end if; return new;
end $$;
create trigger maximum_validation before update on public.exams for each row execute function public.validate_maximum();
grant usage on schema public to anon;
grant select,insert,update on public.profiles,public.students,public.weekly_records,public.exam_results,public.exams to anon;
grant select,insert,update,delete on public.teacher_students to anon;
-- RLS is intentionally not enabled in this no-authentication version.
-- Do not deploy this access model for private records on a publicly accessible site.
