import test from "node:test";
import assert from "node:assert/strict";
import { createIdleSession, IDLE_TIMEOUT_MS } from "../src/auth/idleSession.js";
function fixture() {
  let clock = 0,
    renewals = 0,
    expirations = 0,
    id = 0;
  const timers = new Map();
  const session = createIdleSession({
    now: () => clock,
    setTimer: (fn, delay) => {
      timers.set(++id, { fn, at: clock + delay });
      return id;
    },
    clearTimer: (key) => timers.delete(key),
    onActivity: () => renewals++,
    onExpire: () => expirations++,
  });
  return {
    session,
    get renewals() {
      return renewals;
    },
    get expirations() {
      return expirations;
    },
    advance(ms) {
      const target = clock + ms;
      while (true) {
        const due = [...timers]
          .filter(([, t]) => t.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        clock = due[1].at;
        timers.delete(due[0]);
        due[1].fn();
      }
      clock = target;
    },
    jump(ms) {
      clock += ms;
    },
  };
}
test("idle session signs out exactly at five minutes without background renewals", () => {
  const f = fixture();
  assert.equal(f.renewals, 1);
  f.advance(IDLE_TIMEOUT_MS - 1);
  assert.equal(f.expirations, 0);
  f.advance(1);
  assert.equal(f.expirations, 1);
  assert.equal(f.renewals, 1);
});
test("actions extend the idle deadline and keep active sessions signed in", () => {
  const f = fixture();
  for (let i = 0; i < 8; i++) {
    f.advance(60000);
    f.session.activity();
    assert.equal(f.expirations, 0);
  }
  f.advance(IDLE_TIMEOUT_MS);
  assert.equal(f.expirations, 1);
});
test("returning from a suspended tab expires before new activity can revive it", () => {
  const f = fixture();
  f.jump(IDLE_TIMEOUT_MS + 1);
  f.session.activity();
  assert.equal(f.expirations, 1);
  assert.equal(f.renewals, 1);
});
test("cleanup cancels timers", () => {
  const f = fixture();
  f.session.stop();
  f.advance(IDLE_TIMEOUT_MS * 2);
  assert.equal(f.expirations, 0);
});
