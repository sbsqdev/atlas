-- Minimal stand-in for Supabase's auth schema, used only to test the migration on plain PostgreSQL.
create extension if not exists pgcrypto;
create schema auth;
create table auth.users (instance_id uuid, id uuid primary key, aud text, role text, email text, encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb default '{}', created_at timestamptz, updated_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text);
create table auth.identities (id uuid primary key, user_id uuid, provider_id text, identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz, unique (provider_id, provider));
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if; end $$;
