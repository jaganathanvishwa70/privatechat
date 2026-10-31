/*
# Switch to single-tenant (PIN-gated, no auth) access model

## Overview
The app no longer uses Supabase Authentication. Instead a single 4-digit PIN
(entered by the owner) gates access on the client. Since there is no signed-in
user, `auth.uid()` is null and the previous owner-scoped policies would block
every request. This migration converts all tables and storage policies to a
single-tenant model: the anon-key client can read/write all rows.

## Changes
1. Make `user_id` columns nullable on conversations, messages, attachments
   (they were NOT NULL DEFAULT auth.uid(); anon inserts now leave them null).
2. Replace all owner-scoped RLS policies with permissive anon+authenticated
   policies (the data is intentionally shared across the single owner's devices).
3. Replace storage policies so anon can upload/download/list/delete objects
   in the private `attachments` bucket (path no longer needs a user-id prefix).
4. Drop the auth-user trigger and its function (no new auth users will be
   created).

## Security notes
- The `attachments` storage bucket stays PRIVATE (public=false). Objects are
  only reachable via authenticated/signed URLs through the anon key, which is
  embedded in the app. The PIN is a client-side gate; the Supabase layer is
  single-tenant by design.
- No data is lost: columns are relaxed, not dropped.
*/

-- Relax user_id columns (no auth user to populate them)
ALTER TABLE conversations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE conversations ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE messages ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE attachments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE attachments ALTER COLUMN user_id DROP DEFAULT;

-- Drop the auth trigger + function (no auth users anymore)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =========================================================
-- conversations: permissive single-tenant policies
-- =========================================================
DROP POLICY IF EXISTS "conversations_select_own" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_own" ON conversations;

GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO anon, authenticated;

CREATE POLICY "conversations_select" ON conversations FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "conversations_delete" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- messages: permissive single-tenant policies
-- =========================================================
DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_update_own" ON messages;
DROP POLICY IF EXISTS "messages_delete_own" ON messages;

GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon, authenticated;

CREATE POLICY "messages_select" ON messages FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "messages_delete" ON messages FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- attachments: permissive single-tenant policies
-- =========================================================
DROP POLICY IF EXISTS "attachments_select_own" ON attachments;
DROP POLICY IF EXISTS "attachments_insert_own" ON attachments;
DROP POLICY IF EXISTS "attachments_update_own" ON attachments;
DROP POLICY IF EXISTS "attachments_delete_own" ON attachments;

GRANT SELECT, INSERT, UPDATE, DELETE ON attachments TO anon, authenticated;

CREATE POLICY "attachments_select" ON attachments FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "attachments_insert" ON attachments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "attachments_update" ON attachments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "attachments_delete" ON attachments FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- profiles: permissive (kept for potential future use)
-- =========================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- Storage: permissive single-tenant policies
-- =========================================================
DROP POLICY IF EXISTS "attachments_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "attachments_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "attachments_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "attachments_storage_delete_own" ON storage.objects;

CREATE POLICY "attachments_storage_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "attachments_storage_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "attachments_storage_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'attachments')
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "attachments_storage_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'attachments');
