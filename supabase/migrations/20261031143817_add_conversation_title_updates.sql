/*
# Support editable conversation titles

## Overview
Keeps the existing conversations table and allows the PIN-gated single-tenant app
to rename a chat from the sidebar without changing or removing any messages.

## Modified Tables
- `conversations.title` remains the existing text field and can now be updated
  through the existing single-tenant UPDATE policy.

## Security
- No new tables, columns, or privileges are introduced.
- The existing anon and authenticated UPDATE grant and policy continue to apply
  because this is intentionally a single-tenant app protected by the app PIN.

## Important Notes
1. Existing titles and chat records are preserved.
2. The application validates that a saved title is not blank before updating.
*/

GRANT UPDATE (title) ON conversations TO anon, authenticated;
