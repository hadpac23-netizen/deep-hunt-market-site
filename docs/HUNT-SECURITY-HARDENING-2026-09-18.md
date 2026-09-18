# HUNT Security Hardening — 2026-09-18

## Applied live

### pg_net extension schema
- Security Advisor warning extension_in_public was remediated.
- Preflight confirmed net.http_request_queue was empty.
- Transactional rollback test confirmed net.http_get, net.http_post and boom_internal.enqueue_f35_source_checks() remain resolvable after recreation.
- Migration applied: 20260918152952_move_pg_net_extension_schema.
- Verified extension schema: extensions.
- Verified F35 enqueue function remains present.
- Security Advisor no longer reports extension_in_public.

## Remaining advisor warnings

### 8 SECURITY DEFINER RPCs
These must not be modified blindly.

public.is_admin_user() and public.admin_set_user_ban(uuid, boolean) intentionally retain authenticated execution because:
- admin RLS policy evaluation calls is_admin_user();
- the admin ban flow uses admin_set_user_ban;
- both use an empty search_path;
- the ban function performs an explicit admin check before update.

The post draft lifecycle functions also intentionally use SECURITY DEFINER with explicit auth.uid() ownership checks:
- create_post_draft(...)
- get_my_drafts()
- get_my_recent_deleted()
- publish_draft(uuid)
- soft_delete_post(uuid)
- undo_delete_post(uuid)

Current posts RLS does not expose equivalent SELECT/UPDATE access for drafts/deleted rows, so switching these functions to SECURITY INVOKER without redesigning RLS would break the draft lifecycle.

### Next safe remediation
Do this as a dedicated compatibility migration + regression suite:
1. design least-privilege owner-only SELECT/UPDATE policies and column grants;
2. migrate draft RPCs to SECURITY INVOKER where behavior can remain identical;
3. keep admin checks behind a non-exposed/private helper or an authenticated Edge Function where practical;
4. verify Draft → Publish → Soft Delete → Undo and admin moderation before applying;
5. rerun Security Advisor.

### Leaked-password protection
Advisor still reports auth_leaked_password_protection.
Enable password_hibp_enabled through Supabase Auth configuration when Management Auth write access is available.
This setting is not changed by database SQL.

## Launch boundary
No live payment, supplier order, PayPlus paid acceptance or profit-release gate was enabled during this hardening pass.
