/*
# Enable Realtime Sync for Messages and Attachments

## Why
The app is used as a private bridge between an office laptop and a phone.
Messages and files sent from one device were not appearing on the other
device until a manual page refresh. The realtime subscription code was
already in place in the frontend, but the database was not broadcasting
row changes to the Supabase Realtime publication.

## What this does
1. Adds the `messages` table to the `supabase_realtime` publication so
   INSERT / UPDATE / DELETE events on messages are streamed to all
   subscribed clients instantly.
2. Adds the `attachments` table to the same publication so new file
   attachments are also streamed in real time.

## Notes
- `ALTER PUBLICATION ... ADD TABLE` is idempotent-safe: we guard with a
  DO block so re-running does not error if the table is already in the
  publication.
- No data is changed. No policies or grants are changed.
- Only the `public.messages` and `public.attachments` tables are affected.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'attachments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments;
  END IF;
END $$;
