// Explicit origins only: never trust the request's Host or forwarded headers.
export function isAllowedOrigin(origin, env = process.env) {
  if (!origin) return true;
  const configured = [env.PUBLIC_ORIGIN || 'http://localhost:5173',
    ...(env.ADDITIONAL_PUBLIC_ORIGINS || '').split(',')];
  return configured.some(value => {
    try { return new URL(value.trim()).origin === origin; }
    catch { return false; }
  });
}
