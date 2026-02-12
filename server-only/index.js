// Minimal shim for Next's `server-only` import used in the app during runtime.
// The real `server-only` is a Next.js dev/runtime helper — for CLI scripts
// we simply export a no-op to satisfy imports.
module.exports = {};
