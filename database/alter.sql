alter table profiles
drop constraint if exists profiles_id_fkey;

alter table profiles
    alter column id set default gen_random_uuid();