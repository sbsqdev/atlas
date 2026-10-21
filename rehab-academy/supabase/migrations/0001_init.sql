-- Rehab Academy — initial schema (PostgreSQL 15 / Supabase).
-- Mirrors src/data/types.ts table-for-table. Row Level Security enforces
-- role-based access and organization isolation on the server; the browser
-- demo adapter only mirrors these rules for UX.

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type app_role as enum ('student', 'instructor', 'uni_admin', 'clinic_admin', 'super_admin');
create type org_type as enum ('university', 'clinic', 'platform');
create type content_status as enum ('draft', 'medical_review', 'approved', 'published', 'archived');
create type course_level as enum ('beginner', 'intermediate', 'advanced');
create type lesson_type as enum ('text', 'video', 'anatomy', 'simulation', 'quiz', 'file');
create type question_type as enum ('single', 'multi', 'match', 'sequence', 'identify', 'case');
create type feedback_mode as enum ('immediate', 'after', 'never');
create type plan_id as enum ('student', 'professional', 'university', 'clinic', 'enterprise');
create type subscription_status as enum ('pilot', 'active', 'requested', 'cancelled');
create type subscription_source as enum ('manual_pilot', 'payment');
create type sim_category as enum ('functional', 'biomech', 'injuries', 'postsurgical', 'assessment', 'cases', 'surgical');

-- ---------- Organizations & users ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  type org_type not null,
  city text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- One row per auth.users row. Passwords live in Supabase Auth, never here.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null check (length(full_name) between 2 and 200),
  role app_role not null default 'student',
  org_id uuid references organizations (id) on delete set null,
  cohort text,
  headline text,
  job_prefs text,
  career_visible boolean not null default false,   -- explicit opt-in
  consent_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on profiles (org_id);

-- Helpers used by policies. SECURITY DEFINER so policies on profiles do not recurse.
create or replace function auth_role() returns app_role language sql stable security definer set search_path = public as
  $$ select role from profiles where id = auth.uid() $$;
create or replace function auth_org() returns uuid language sql stable security definer set search_path = public as
  $$ select org_id from profiles where id = auth.uid() $$;
create or replace function is_super() returns boolean language sql stable security definer set search_path = public as
  $$ select coalesce(auth_role() = 'super_admin', false) $$;
create or replace function is_org_admin() returns boolean language sql stable security definer set search_path = public as
  $$ select coalesce(auth_role() in ('uni_admin', 'clinic_admin'), false) $$;

-- Self-signup creates a student/instructor profile; admin roles are never self-assigned.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, role, consent_at)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'role' = 'instructor' then 'instructor'::app_role else 'student'::app_role end,
    (new.raw_user_meta_data ->> 'consent_at')::timestamptz
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Users may edit their own profile but not escalate role or change organization.
create or replace function guard_profile_update() returns trigger language plpgsql as $$
begin
  -- No JWT (service role, migrations, seed): trusted server context.
  if auth.uid() is null then return new; end if;
  if not is_super() and (new.role is distinct from old.role or new.org_id is distinct from old.org_id) then
    if not (is_org_admin() and old.org_id = auth_org() and new.org_id = auth_org() and new.role in ('student', 'instructor')) then
      raise exception 'role/organization change not permitted';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_profile_update();

-- ---------- Content ----------
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  level course_level not null default 'beginner',
  description text not null default '',
  instructor_id uuid not null references profiles (id),
  org_id uuid references organizations (id),          -- null = platform catalog
  duration_min int not null default 60 check (duration_min > 0),
  status content_status not null default 'draft',
  cover text not null default 'slate',
  final_assessment_id uuid,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on courses (status, org_id);

create table course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  position int not null default 1
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  module_id uuid not null references course_modules (id) on delete cascade,
  title text not null,
  type lesson_type not null,
  body text,
  video_url text,
  file_url text,
  simulation_id text,
  assessment_id uuid,
  anatomy_focus text[] not null default '{}',
  duration_min int not null default 10,
  position int not null default 1
);

create table anatomy_structures (
  id text primary key,                   -- node name in knee.glb
  name text not null,
  latin text not null,
  grp text not null check (grp in ('bone', 'muscle', 'fascia', 'ligament')),
  region text not null,
  classification text,
  origin text,
  insertion text,
  innervation text,
  function text,
  biomech text,
  notes text,
  "references" jsonb not null default '[]',
  has_model boolean not null default false,
  verified boolean not null default false
);

create table simulations (
  id text primary key,
  title text not null,
  category sim_category not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  duration_min int not null,
  course_id uuid references courses (id),
  available boolean not null default false,
  status content_status not null default 'draft',
  definition jsonb not null              -- objectives, context, nodes, reading
);

create table virtual_patients (
  id text primary key,
  title text not null,
  status content_status not null default 'draft',
  definition jsonb not null              -- synthetic patient, history, exams, questions
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_id uuid references courses (id) on delete cascade,
  author_id uuid not null references profiles (id),
  passing_score int not null default 70 check (passing_score between 1 and 100),
  max_attempts int not null default 3 check (max_attempts >= 0),
  time_limit_min int not null default 0 check (time_limit_min >= 0),
  randomize boolean not null default false,
  feedback feedback_mode not null default 'after',
  status content_status not null default 'draft',
  created_at timestamptz not null default now()
);
alter table courses add constraint courses_final_fk foreign key (final_assessment_id) references assessments (id) on delete set null;

create table questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  type question_type not null,
  prompt text not null,
  case_text text,
  structure_id text references anatomy_structures (id),
  options jsonb,                         -- [{id,text,correct}]
  pairs jsonb,                           -- [{left,right}]
  sequence jsonb,                        -- ["…"]
  explanation text not null default '',
  points numeric not null default 1 check (points > 0),
  position int not null default 1
);

-- ---------- Learning records ----------
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  last_lesson_id uuid references lessons (id) on delete set null,
  unique (user_id, course_id)
);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  time_spent_sec int not null default 0,
  unique (user_id, lesson_id)
);

create table assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  assessment_id uuid not null references assessments (id) on delete cascade,
  course_id uuid references courses (id),
  answers jsonb not null,
  score int not null check (score between 0 and 100),
  passed boolean not null,
  attempt_no int not null,
  started_at timestamptz not null,
  completed_at timestamptz not null default now(),
  duration_sec int not null,
  unique (user_id, assessment_id, attempt_no)
);

create table simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  simulation_id text not null references simulations (id),
  score int not null,
  max_score int not null,
  decisions jsonb not null default '[]',
  completed_at timestamptz not null default now(),
  duration_sec int not null default 0
);

create table patient_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  case_id text not null references virtual_patients (id),
  asked text[] not null default '{}',
  requested text[] not null default '{}',
  answers jsonb not null default '{}',
  score int not null,
  max_score int not null,
  completed_at timestamptz not null default now()
);

create table anatomy_views (
  user_id uuid not null references profiles (id) on delete cascade,
  structure_id text not null references anatomy_structures (id),
  viewed_at timestamptz not null default now(),
  primary key (user_id, structure_id)
);

create table activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('lesson', 'simulation', 'assessment', 'anatomy', 'patient')),
  minutes int not null default 1,
  at timestamptz not null default now()
);
create index on activity_log (user_id, at);

-- ---------- Classroom ----------
create table classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  instructor_id uuid not null references profiles (id),
  name text not null,
  cohort text not null default '',
  created_at timestamptz not null default now()
);
create table class_students (
  class_id uuid not null references classes (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  primary key (class_id, student_id)
);
create table assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes (id) on delete cascade,
  kind text not null check (kind in ('course', 'simulation', 'assessment')),
  ref_id text not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create table feedback (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles (id),
  student_id uuid not null references profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------- Credentials ----------
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id),
  course_title text not null,
  code text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- Commercial ----------
create table plans (
  id plan_id primary key,
  name text not null,
  price_kzt int,                         -- indicative; null = custom
  per_seat boolean not null default false,
  entitlements text[] not null
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  plan_id plan_id not null references plans (id),
  status subscription_status not null,
  seats int not null default 1 check (seats > 0),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  source subscription_source not null default 'manual_pilot',
  activated_by uuid references profiles (id),
  check ((org_id is null) <> (user_id is null)),
  -- No payment provider is connected: nothing may be marked as paid.
  check (source <> 'payment' or status <> 'active')
);

-- ---------- Governance ----------
create table content_reviews (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('course', 'assessment', 'simulation')),
  entity_id text not null,
  from_status content_status not null,
  to_status content_status not null,
  by_user_id uuid not null references profiles (id),
  note text,
  at timestamptz not null default now()
);
create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles (id),
  action text not null,
  entity text not null,
  entity_id text,
  meta text,
  at timestamptz not null default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  text text not null,
  link text,
  read boolean not null default false,
  at timestamptz not null default now()
);

-- Workflow guard: authors may only move draft → medical_review / archived;
-- approval and publication require a super admin (medical reviewer).
create or replace function guard_course_status() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if auth.uid() is null then return new; end if;  -- trusted server context
  if new.status is distinct from old.status and not is_super() then
    if not ((old.status = 'draft' and new.status in ('medical_review', 'archived'))
         or (old.status = 'archived' and new.status = 'draft')
         or (old.status = 'published' and new.status = 'archived')) then
      raise exception 'status transition % -> % requires medical reviewer', old.status, new.status;
    end if;
  end if;
  if new.status = old.status and old.status <> 'draft' and not is_super() then
    raise exception 'course is locked outside draft';
  end if;
  return new;
end $$;
create trigger courses_guard before update on courses for each row execute function guard_course_status();

-- ---------- Row Level Security ----------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table anatomy_structures enable row level security;
alter table simulations enable row level security;
alter table virtual_patients enable row level security;
alter table assessments enable row level security;
alter table questions enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table assessment_attempts enable row level security;
alter table simulation_attempts enable row level security;
alter table patient_attempts enable row level security;
alter table anatomy_views enable row level security;
alter table activity_log enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table assignments enable row level security;
alter table feedback enable row level security;
alter table certificates enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table content_reviews enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;

-- Organizations: members see their own; super admin manages all.
create policy org_read on organizations for select using (id = auth_org() or is_super());
create policy org_admin on organizations for all using (is_super()) with check (is_super());

-- Profiles: self, same-org staff, super admin.
create policy profile_self on profiles for select using (id = auth.uid());
create policy profile_org on profiles for select using (org_id = auth_org() and auth_role() in ('instructor', 'uni_admin', 'clinic_admin'));
create policy profile_super on profiles for all using (is_super()) with check (is_super());
create policy profile_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profile_update_org on profiles for update using (is_org_admin() and org_id = auth_org()) with check (org_id = auth_org());

-- Courses: published platform/org catalog; authors see their own; reviewers see all.
create function can_read_course(c courses) returns boolean language sql stable as $$
  select auth.uid() is not null and (
    c.status = 'published' and (c.org_id is null or c.org_id = auth_org())
    or c.instructor_id = auth.uid() or is_super()) $$;
create policy course_read on courses for select using (can_read_course(courses));
create policy course_insert on courses for insert with check (
  instructor_id = auth.uid() and status = 'draft' and auth_role() in ('instructor', 'super_admin')
  and (org_id is null and is_super() or org_id = auth_org()));
create policy course_update on courses for update using (instructor_id = auth.uid() or is_super());
create policy course_delete on courses for delete using ((instructor_id = auth.uid() and status = 'draft') or is_super());

create policy module_read on course_modules for select using (exists (select 1 from courses c where c.id = course_id and can_read_course(c)));
create policy module_write on course_modules for all
  using (exists (select 1 from courses c where c.id = course_id and ((c.instructor_id = auth.uid() and c.status = 'draft') or is_super())))
  with check (exists (select 1 from courses c where c.id = course_id and ((c.instructor_id = auth.uid() and c.status = 'draft') or is_super())));
create policy lesson_read on lessons for select using (exists (select 1 from courses c where c.id = course_id and can_read_course(c)));
create policy lesson_write on lessons for all
  using (exists (select 1 from courses c where c.id = course_id and ((c.instructor_id = auth.uid() and c.status = 'draft') or is_super())))
  with check (exists (select 1 from courses c where c.id = course_id and ((c.instructor_id = auth.uid() and c.status = 'draft') or is_super())));

-- Reference content is readable by every signed-in user; only super admin edits it.
create policy anat_read on anatomy_structures for select using (auth.uid() is not null);
create policy anat_write on anatomy_structures for all using (is_super()) with check (is_super());
create policy sim_read on simulations for select using (auth.uid() is not null and (status = 'published' or not available or is_super()));
create policy sim_write on simulations for all using (is_super()) with check (is_super());
create policy vp_read on virtual_patients for select using (auth.uid() is not null and (status = 'published' or is_super()));
create policy vp_write on virtual_patients for all using (is_super()) with check (is_super());

create policy as_read on assessments for select using (
  status = 'published' or author_id = auth.uid() or is_super());
create policy as_write on assessments for all
  using (author_id = auth.uid() and status = 'draft' or is_super())
  with check (author_id = auth.uid() or is_super());
-- Learners never read answer keys directly; the take_assessment view / RPC strips them.
create policy q_author on questions for all
  using (exists (select 1 from assessments a where a.id = assessment_id and (a.author_id = auth.uid() or is_super())))
  with check (exists (select 1 from assessments a where a.id = assessment_id and a.status = 'draft' and (a.author_id = auth.uid() or is_super())));

-- Own learning records; staff of the same organization can read them.
create function same_org_staff(uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select is_super() or (auth_role() in ('instructor', 'uni_admin', 'clinic_admin')
    and exists (select 1 from profiles p where p.id = uid and p.org_id = auth_org())) $$;

create policy en_own on enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy en_staff on enrollments for select using (same_org_staff(user_id));
create policy en_org_assign on enrollments for insert with check (is_org_admin() and same_org_staff(user_id));
create policy lp_own on lesson_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy lp_staff on lesson_progress for select using (same_org_staff(user_id));
-- Attempts are inserted only by the grade_attempt() RPC (security definer) so scores cannot be forged.
create policy at_own_read on assessment_attempts for select using (user_id = auth.uid() or same_org_staff(user_id));
create policy sa_own on simulation_attempts for select using (user_id = auth.uid() or same_org_staff(user_id));
create policy sa_insert on simulation_attempts for insert with check (user_id = auth.uid());
create policy pa_own on patient_attempts for select using (user_id = auth.uid() or same_org_staff(user_id));
create policy pa_insert on patient_attempts for insert with check (user_id = auth.uid());
create policy av_own on anatomy_views for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy act_own on activity_log for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy act_staff on activity_log for select using (same_org_staff(user_id));

-- Classroom: org isolation; instructors manage their own classes, org admins all in org.
create policy cls_read on classes for select using (
  org_id = auth_org() and auth_role() in ('instructor', 'uni_admin', 'clinic_admin') or is_super()
  or exists (select 1 from class_students s where s.class_id = id and s.student_id = auth.uid()));
create policy cls_write on classes for all
  using (org_id = auth_org() and (instructor_id = auth.uid() or is_org_admin()) or is_super())
  with check (org_id = auth_org() and (instructor_id = auth.uid() or is_org_admin()) or is_super());
create policy cs_read on class_students for select using (student_id = auth.uid()
  or exists (select 1 from classes c where c.id = class_id and c.org_id = auth_org() and auth_role() <> 'student') or is_super());
create policy cs_write on class_students for all
  using (exists (select 1 from classes c where c.id = class_id and c.org_id = auth_org() and (c.instructor_id = auth.uid() or is_org_admin())))
  with check (exists (select 1 from classes c join profiles p on p.id = student_id
    where c.id = class_id and c.org_id = auth_org() and p.org_id = c.org_id and (c.instructor_id = auth.uid() or is_org_admin())));
create policy asg_read on assignments for select using (exists (select 1 from classes c where c.id = class_id and (
  c.org_id = auth_org() and auth_role() <> 'student' or exists (select 1 from class_students s where s.class_id = c.id and s.student_id = auth.uid())))
  or is_super());
create policy asg_write on assignments for all
  using (exists (select 1 from classes c where c.id = class_id and c.org_id = auth_org() and (c.instructor_id = auth.uid() or is_org_admin())))
  with check (exists (select 1 from classes c where c.id = class_id and c.org_id = auth_org() and (c.instructor_id = auth.uid() or is_org_admin())));
create policy fb_read on feedback for select using (student_id = auth.uid() or instructor_id = auth.uid() or same_org_staff(student_id));
create policy fb_write on feedback for insert with check (instructor_id = auth.uid() and same_org_staff(student_id));

create policy cert_read on certificates for select using (user_id = auth.uid() or same_org_staff(user_id));
-- Certificates are issued by the issue_certificate() RPC only.

create policy plans_read on plans for select using (true);
create policy plans_write on plans for all using (is_super()) with check (is_super());
create policy sub_read on subscriptions for select using (user_id = auth.uid() or org_id = auth_org() or is_super());
create policy sub_request on subscriptions for insert with check (
  status = 'requested' and source = 'manual_pilot'
  and (user_id = auth.uid() or (is_org_admin() and org_id = auth_org())));
create policy sub_admin on subscriptions for all using (is_super()) with check (is_super());

create policy rv_read on content_reviews for select using (by_user_id = auth.uid() or is_super()
  or exists (select 1 from courses c where c.id::text = entity_id and c.instructor_id = auth.uid()));
create policy rv_insert on content_reviews for insert with check (by_user_id = auth.uid());
create policy audit_read on audit_logs for select using (is_super());
create policy audit_insert on audit_logs for insert with check (actor_id = auth.uid());
create policy notif_own on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Server-side grading ----------
-- Learners submit answers; the server grades against the answer key so a
-- client cannot forge a score. Mirrors src/data/grading.ts.
create or replace function grade_attempt(p_assessment uuid, p_answers jsonb, p_started timestamptz)
returns assessment_attempts language plpgsql security definer set search_path = public as $$
declare
  a assessments; q questions; total numeric := 0; got numeric := 0; used int; res assessment_attempts;
  want jsonb; ans jsonb; ok int; n int;
begin
  select * into a from assessments where id = p_assessment and status = 'published';
  if not found then raise exception 'assessment not available'; end if;
  select count(*) into used from assessment_attempts where user_id = auth.uid() and assessment_id = p_assessment;
  if a.max_attempts > 0 and used >= a.max_attempts then raise exception 'no attempts left'; end if;
  if a.time_limit_min > 0 and now() > p_started + make_interval(mins => a.time_limit_min + 1) then raise exception 'time limit exceeded'; end if;
  for q in select * from questions where assessment_id = p_assessment loop
    total := total + q.points;
    ans := p_answers -> q.id::text;
    if ans is null then continue; end if;
    if q.type in ('single', 'identify', 'case') then
      if exists (select 1 from jsonb_array_elements(q.options) o where o ->> 'id' = ans #>> '{}' and (o ->> 'correct')::boolean) then got := got + q.points; end if;
    elsif q.type = 'multi' then
      select jsonb_agg(o -> 'id' order by o ->> 'id') into want from jsonb_array_elements(q.options) o where (o ->> 'correct')::boolean;
      if want = (select jsonb_agg(x order by x #>> '{}') from jsonb_array_elements(ans) x) then got := got + q.points; end if;
    elsif q.type = 'sequence' then
      if ans = q.sequence then got := got + q.points; end if;
    elsif q.type = 'match' then
      select count(*) filter (where ans ->> (p ->> 'left') = p ->> 'right'), count(*) into ok, n from jsonb_array_elements(q.pairs) p;
      if n > 0 then got := got + q.points * ok / n; end if;
    end if;
  end loop;
  insert into assessment_attempts (user_id, assessment_id, course_id, answers, score, passed, attempt_no, started_at, duration_sec)
  values (auth.uid(), p_assessment, a.course_id, p_answers,
          case when total > 0 then round(got / total * 100) else 0 end,
          case when total > 0 then round(got / total * 100) >= a.passing_score else false end,
          used + 1, p_started, extract(epoch from now() - p_started)::int)
  returning * into res;
  return res;
end $$;

-- Issues a certificate only when every lesson is completed and the final test is passed.
create or replace function issue_certificate(p_course uuid) returns certificates
language plpgsql security definer set search_path = public as $$
declare c courses; res certificates; missing int;
begin
  select * into c from courses where id = p_course;
  select count(*) into missing from lessons l where l.course_id = p_course
    and not exists (select 1 from lesson_progress p where p.lesson_id = l.id and p.user_id = auth.uid());
  if missing > 0 then raise exception 'course not completed'; end if;
  if c.final_assessment_id is not null and not exists (
    select 1 from assessment_attempts where user_id = auth.uid() and assessment_id = c.final_assessment_id and passed) then
    raise exception 'final assessment not passed';
  end if;
  insert into certificates (user_id, course_id, course_title, code)
  values (auth.uid(), p_course, c.title, 'RA-' || extract(year from now()) || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)))
  on conflict (user_id, course_id) do update set course_title = excluded.course_title
  returning * into res;
  return res;
end $$;
