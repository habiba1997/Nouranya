create type user_role as enum ('TEACHER', 'ADMIN');

create table profiles (
                          id uuid primary key references auth.users(id) on delete cascade,
                          full_name text not null,
                          username text unique not null,
                          email text unique not null,
                          role user_role not null default 'TEACHER',
                          created_at timestamptz default now()
);


create table students (
                          id uuid primary key default gen_random_uuid(),
                          full_name text not null,
                          active boolean not null default true,
                          created_at timestamptz default now()
);

create table teacher_students (
                                  teacher_id uuid not null references profiles(id),
                                  student_id uuid not null references students(id),

                                  primary key (teacher_id, student_id)
);


create table weekly_records (
                                id uuid primary key default gen_random_uuid(),

                                student_id uuid not null references students(id),
                                week_start_date date not null,

                                saturday_attended boolean,
                                midweek_attended boolean,
                                homework_completed boolean,

                                comment text,

                                recorded_by uuid references profiles(id),

                                created_at timestamptz default now(),
                                updated_at timestamptz default now(),

                                unique(student_id, week_start_date)
);


create type exam_type as enum (
    'MIDTERM_1',
    'MIDTERM_2',
    'FINAL'
);

create table exams (
                       id uuid primary key default gen_random_uuid(),

                       exam_type exam_type not null unique,
                       max_score numeric not null check (max_score > 0),

                       created_at timestamptz default now()
);

create table exam_results (
                              id uuid primary key default gen_random_uuid(),

                              exam_id uuid not null references exams(id),
                              student_id uuid not null references students(id),

                              score numeric not null check (score >= 0),

                              notes text,

                              graded_by uuid not null references profiles(id),

                              graded_at timestamptz default now(),

                              unique(exam_id, student_id)
);