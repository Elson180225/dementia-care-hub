// Timers are injectable so idle logout can be checked without waiting five minutes.
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export function createIdleSession({
  onActivity,
  onExpire,
  now = Date.now,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  idleMs = IDLE_TIMEOUT_MS,
  renewMs = 15000,
}) {
  let lastAction = now(),
    lastRenew = -Infinity,
    idleTimer,
    renewTimer,
    stopped = false;
  function stop() {
    stopped = true;
    clearTimer(idleTimer);
    clearTimer(renewTimer);
  }
  function check() {
    if (stopped) return;
    if (now() - lastAction >= idleMs) {
      stop();
      onExpire();
    } else {
      clearTimer(idleTimer);
      idleTimer = setTimer(check, idleMs - (now() - lastAction));
    }
  }
  function renew() {
    renewTimer = undefined;
    if (stopped) return;
    if (now() - lastAction >= idleMs) {
      check();
      return;
    }
    lastRenew = now();
    onActivity();
  }
  function activity() {
    if (stopped) return;
    if (now() - lastAction >= idleMs) {
      check();
      return;
    }
    lastAction = now();
    check();
    if (now() - lastRenew >= renewMs) renew();
    else if (renewTimer === undefined)
      renewTimer = setTimer(renew, renewMs - (now() - lastRenew));
  }
  check();
  renew();
  return { activity, check, stop };
}
