/**
 * SQL run by the guest-mode-cleanup pg_cron job. Deleting a college cascades
 * to its users, students, drives, rankings and every other college-owned
 * table, so each delete is limited to colleges that are recognisably guest
 * workspaces, not just to rows listed in demo_workspaces. This matches the
 * app's own cleanup in app/api/demo/[...action]/route.ts.
 */
export const CLEANUP_JOB = "guest-mode-cleanup";

export const CLEANUP_SQL = `DELETE FROM public.colleges c USING public.demo_workspaces w
  WHERE w.college_id = c.id AND w.expires_at < now()
    AND c.student_domain LIKE '%.demo.invalid';
DELETE FROM public.ai_rate_limits WHERE model_key LIKE 'demo:%' AND window_start < now() - interval '2 days';`;
