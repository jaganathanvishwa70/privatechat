/*
# Create private chat, file & code sharing schema

## Overview
Builds the persistent storage for a personal chat + file-transfer + code-sharing app.
Each authenticated user can only ever see their own conversations, messages, and
uploaded files. Files (images and documents) live in a private Supabase Storage
bucket and are only reachable through authenticated download URLs scoped to the owner.

## New Tables

1. `profiles`
   - `id` (uuid, PK) — mirrors `auth.users.id`
   - `email` (text) — cached for display
   - `created_at` (timestamptz)

2. `conversations`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK -> auth.users, NOT NULL, DEFAULT auth.uid())
   - `title` (text, NOT NULL)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz) — bumped on new message

3. `messages`
   - `id` (uuid, PK)
   - `conversation_id` (uuid, FK -> conversations, ON DELETE CASCADE)
   - `user_id` (uuid, FK -> auth.users, NOT NULL, DEFAULT auth.uid())
   - `message_type` (text) — 'normal' | 'code' | 'image' | 'file'
   - `content` (text) — text body, code body, or empty for pure-attachment messages
   - `language` (text, nullable) — detected/declared code language for code messages
   - `created_at` (timestamptz)

4. `attachments`
   - `id` (uuid, PK)
   - `message_id` (uuid, FK -> messages, ON DELETE CASCADE)
   - `user_id` (uuid, FK -> auth.users, NOT NULL, DEFAULT auth.uid())
   - `original_filename` (text, NOT NULL) — preserved for downloads
   - `storage_path` (text, NOT NULL) — path within the private bucket
   - `mime_type` (text, NOT NULL)
   - `file_size` (bigint, NOT NULL) — bytes
   - `created_at` (timestamptz)

## Indexes
- `messages` by `conversation_id` + `created_at` (chat history scroll)
- `attachments` by `message_id`
- `conversations` by `user_id` + `updated_at` (sidebar ordering)

## Security (RLS + grants)
- RLS enabled on every table.
- Grants scoped to `authenticated` only (the app has a sign-in screen; anon gets nothing).
- Owner-scoped CRUD policies using `auth.uid() = user_id` on every table.
- A trigger auto-creates a `profiles` row when a new auth user signs up.
- A trigger bumps `conversations.updated_at` whenever a message is inserted.

## Storage
- Creates a PRIVATE bucket `attachments` (no public access).
- Storage policies: authenticated users can manage only objects whose path starts
  with their own user id (`<user_id>/...`), so cross-user access is impossible.
*/

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- auto-create a profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =========================================================
-- conversations
-- =========================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;

DROP POLICY IF EXISTS "conversations_select_own" ON conversations;
CREATE POLICY "conversations_select_own" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
CREATE POLICY "conversations_update_own" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_delete_own" ON conversations;
CREATE POLICY "conversations_delete_own" ON conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations (user_id, updated_at DESC);

-- =========================================================
-- messages
-- =========================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type text NOT NULL DEFAULT 'normal',
  content text,
  language text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

DROP POLICY IF EXISTS "messages_select_own" ON messages;
CREATE POLICY "messages_select_own" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_delete_own" ON messages;
CREATE POLICY "messages_delete_own" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at);

-- bump conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = new.conversation_id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

REVOKE EXECUTE ON FUNCTION public.touch_conversation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_conversation() TO authenticated;

-- =========================================================
-- attachments
-- =========================================================
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON attachments TO authenticated;

DROP POLICY IF EXISTS "attachments_select_own" ON attachments;
CREATE POLICY "attachments_select_own" ON attachments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_insert_own" ON attachments;
CREATE POLICY "attachments_insert_own" ON attachments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_update_own" ON attachments;
CREATE POLICY "attachments_update_own" ON attachments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_delete_own" ON attachments;
CREATE POLICY "attachments_delete_own" ON attachments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments (message_id);

-- =========================================================
-- Storage bucket + policies (private)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: allow reading object metadata + creating download URLs for own files
DROP POLICY IF EXISTS "attachments_storage_select_own" ON storage.objects;
CREATE POLICY "attachments_storage_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- INSERT: upload into own folder only
DROP POLICY IF EXISTS "attachments_storage_insert_own" ON storage.objects;
CREATE POLICY "attachments_storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE: only own files
DROP POLICY IF EXISTS "attachments_storage_update_own" ON storage.objects;
CREATE POLICY "attachments_storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE: only own files
DROP POLICY IF EXISTS "attachments_storage_delete_own" ON storage.objects;
CREATE POLICY "attachments_storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
