#!/usr/bin/env bash
# Applies the migration + seed to a throwaway database and checks RLS rules.
# Requires a local PostgreSQL 15+ server. Usage:
#   PGHOST=/var/run/postgresql PGUSER=postgres supabase/tests/rls_smoke.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${DB:-ra_rls_smoke}
P="psql -v ON_ERROR_STOP=1 -q"
uuid() { node -e "const h=require('crypto').createHash('md5').update('rehab-academy:$1').digest('hex');console.log(h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32))"; }
STU=$(uuid u-student); INS=$(uuid u-instructor); CLA=$(uuid u-clinicadmin); SUP=$(uuid u-super)
ASK=$(uuid as-knee); CACL=$(uuid c-acl); ORGU=$(uuid org-uni); QK1=$(uuid q-k1); QK7=$(uuid q-k7)

$P -c "drop database if exists $DB" -c "create database $DB"
$P -d "$DB" -f supabase/tests/auth_stub.sql
$P -d "$DB" -f supabase/migrations/0001_init.sql
$P -d "$DB" -f supabase/seed.sql
$P -d "$DB" -c "grant usage on schema public, auth to authenticated; grant all on all tables in schema public to authenticated;
  grant execute on all functions in schema public, auth to authenticated; grant usage on all sequences in schema public to authenticated;"

as() { echo "select set_config('request.jwt.claim.sub', '$1', false);"; }
out=$(psql -d "$DB" -At 2>/dev/null <<SQL
set role authenticated;
$(as "$STU")
select 'courses_visible=' || count(*) from courses;
select 'questions_visible=' || count(*) from questions;
update profiles set role = 'super_admin' where id = '$STU';
select 'role=' || role from profiles where id = '$STU';
insert into assessment_attempts (user_id, assessment_id, answers, score, passed, attempt_no, started_at, duration_sec) values ('$STU', '$ASK', '{}', 100, true, 1, now(), 1);
select 'graded=' || score from grade_attempt('$ASK', jsonb_build_object('$QK1', 'a', '$QK7', 'a'), now());
insert into subscriptions (user_id, plan_id, status, ends_at, source) values ('$STU', 'professional', 'active', now() + interval '1 year', 'manual_pilot');
select 'student_subs=' || count(*) from subscriptions where user_id = '$STU';
$(as "$CLA")
select 'clinic_sees_uni_profiles=' || count(*) from profiles where org_id = '$ORGU';
select 'clinic_sees_attempts=' || count(*) from assessment_attempts;
$(as "$INS")
select 'instructor_sees_attempts=' || count(*) from assessment_attempts;
update courses set status = 'approved' where id = '$CACL';
select 'after_instructor_approve=' || status from courses where id = '$CACL';
$(as "$SUP")
update courses set status = 'approved' where id = '$CACL';
select 'after_super_approve=' || status from courses where id = '$CACL';
$(as "")
select 'anon_courses=' || count(*) from courses;
SQL
)
expect="courses_visible=2 questions_visible=0 role=student graded=17 student_subs=0 clinic_sees_uni_profiles=0 clinic_sees_attempts=0 instructor_sees_attempts=1 after_instructor_approve=medical_review after_super_approve=approved anon_courses=0"
got=$(echo "$out" | grep '=' | tr '\n' ' ' | sed 's/ $//')
$P -c "drop database $DB"
if [ "$got" = "$expect" ]; then echo "RLS smoke: OK"; else echo "RLS smoke: FAILED"; echo "expected: $expect"; echo "got:      $got"; exit 1; fi
