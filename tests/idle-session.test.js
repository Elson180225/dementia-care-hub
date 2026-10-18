import test from 'node:test';
import assert from 'node:assert/strict';
import { watchIdleSession, IDLE_TIMEOUT_MS } from '../src/trainer-portal/idleSession.js';

async function fixture() {
 let clock=0,expiresAt=IDLE_TIMEOUT_MS,expired=0,reports=0,id=0;
 const tasks=new Map(),handlers=new Map();
 const target={addEventListener:(type,fn)=>handlers.set(type,fn),removeEventListener:type=>handlers.delete(type)};
 const checkSession=async()=>clock<expiresAt?{sessionExpiresAt:new Date(expiresAt).toISOString()}:null;
 const stop=watchIdleSession({target,now:()=>clock,schedule:(fn,delay)=>{tasks.set(++id,{fn,at:clock+delay});return id;},cancel:key=>tasks.delete(key),
  checkSession,reportActivity:async({idleMs})=>{reports++;expiresAt=Math.max(expiresAt,clock+IDLE_TIMEOUT_MS-idleMs);},onExpired:()=>expired++});
 await Promise.resolve();await Promise.resolve();
 async function advance(ms) {
  const until=clock+ms;
  for(;;){const next=[...tasks].filter(([,task])=>task.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;tasks.delete(next[0]);clock=next[1].at;await next[1].fn();}
  clock=until;await Promise.resolve();
 }
 return {advance,stop,activity:(type='keydown',isTrusted=true)=>handlers.get(type)?.({isTrusted}),checkSession,
  otherTabActivity:()=>{expiresAt=clock+IDLE_TIMEOUT_MS;},get expired(){return expired;},get reports(){return reports;},handlers};
}
test('idle session locks at five minutes; polling does not extend it',async()=>{
 const f=await fixture();await f.advance(IDLE_TIMEOUT_MS-1);await f.checkSession();assert.equal(f.expired,0);
 await f.advance(1);assert.equal(f.expired,1);assert.equal(f.reports,0);
});
test('real activity resets the idle timeout; untrusted events do not',async()=>{
 const f=await fixture();await f.advance(240000);f.activity();await Promise.resolve();
 await f.advance(IDLE_TIMEOUT_MS-1);assert.equal(f.expired,0);await f.advance(1);assert.equal(f.expired,1);
 const synthetic=await fixture();await synthetic.advance(240000);synthetic.activity('pointermove',false);
 await synthetic.advance(60000);assert.equal(synthetic.expired,1);assert.equal(synthetic.reports,0);
});
test('another active tab keeps the shared session alive; cleanup removes timers',async()=>{
 const f=await fixture();await f.advance(240000);f.otherTabActivity();await f.advance(60000);assert.equal(f.expired,0);
 await f.advance(240000);assert.equal(f.expired,1);
 const stopped=await fixture();stopped.stop();await stopped.advance(600000);assert.equal(stopped.expired,0);assert.equal(stopped.handlers.size,0);
});
