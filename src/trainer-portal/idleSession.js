export const IDLE_TIMEOUT_MS=5*60*1000;
// Background refreshes never call this heartbeat. Only real input does.
export function watchIdleSession({target,checkSession,reportActivity,onExpired,now=Date.now,schedule=setTimeout,cancel=clearTimeout}) {
 let stopped=false,timer,pending,lastInput=now(),lastReport=-Infinity;
 const expire=()=>{if(!stopped){stop();onExpired();}};
 const arm=delay=>{cancel(timer);timer=schedule(check,Math.max(1,delay));};
 async function check(){
  try {
   const user=await checkSession();if(stopped)return;
   if(!user) {expire();return;}
   arm(Math.max(1,new Date(user.sessionExpiresAt).getTime()-now()));
  }catch(error){if(error.status===401 || now()-lastInput>=IDLE_TIMEOUT_MS)expire();else if(!stopped)arm(5000);}
 }
 async function report(){
  pending=undefined;if(stopped)return;
  lastReport=now();
  try {await reportActivity({idleMs:Math.max(0,now()-lastInput)});}
  catch(error){if(error.status===401)expire();}
 }
 function activity(event){
  if(stopped || event.isTrusted===false)return;
  lastInput=now();arm(IDLE_TIMEOUT_MS);
  if(now()-lastReport>=10000){cancel(pending);report();}
  else if(pending===undefined)pending=schedule(report,10000-(now()-lastReport));
 }
 const events=['pointerdown','pointermove','keydown','scroll','touchstart'];
 for(const name of events)target.addEventListener(name,activity,{passive:true,capture:true});
 function stop(){stopped=true;cancel(timer);cancel(pending);for(const name of events)target.removeEventListener(name,activity,{capture:true});}
 check();
 return stop;
}
