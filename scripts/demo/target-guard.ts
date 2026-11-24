import { INSTITUTIONAL_PROJECT_REFS } from "../../lib/demo/config";

/**
 * Throws unless `ref` (the project the connection really targets) is the
 * dedicated demo project: named by GUEST_DATABASE_PROJECT_REF, confirmed on the
 * command line, and never the institutional production project.
 */
export function assertDemoTarget(ref: string, guestRef: string | undefined, confirm: string | undefined): void {
  const target = ref.trim().toLowerCase();
  if (INSTITUTIONAL_PROJECT_REFS.has(target)) {
    throw new Error(`Refusing to run: ${ref} is the institutional production project. Guest data never goes there.`);
  }
  if (!/^[a-z0-9]{20}$/.test(target)) throw new Error(`Refusing to run: ${ref} is not a Supabase project ref`);
  if (guestRef?.trim().toLowerCase() !== target) {
    throw new Error(`Refusing to run: GUEST_DATABASE_PROJECT_REF must name the target project (${ref})`);
  }
  if (confirm?.trim().toLowerCase() !== target) throw new Error(`Refusing to run: pass --confirm-ref=${ref} to confirm the target`);
}
