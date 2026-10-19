import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { watchIdleSession } from './idleSession';
const TrainerContext = createContext(null);
const empty = { session:null, adminSession:null, profile:{}, profiles:[], activities:[], accessRequests:[], history:[], users:[], contributions:[], projectReach:[], maintenance:[] };
export async function api(path, data) {
 const response=await fetch(path,{credentials:'same-origin',...(data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
 const result=await response.json(); if(!response.ok) throw Object.assign(new Error(result.error || 'Request failed'),{status:response.status}); return result;
}
export default function TrainerProvider({children}) {
 const [state,setState]=useState(empty); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 const queue=useRef(Promise.resolve());
 const refresh=useCallback(async()=>{ const {user}=await api('/api/auth/me'); setState(user?await api('/api/portal'):empty); },[]);
 const signedInId=state.session?.id || state.adminSession?.id;
 useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[refresh]);
 useEffect(()=>{
  if(!signedInId)return;
  return watchIdleSession({target:document,checkSession:async()=>(await api('/api/auth/me')).user,
   reportActivity:data=>api('/api/auth/activity',data),
   onExpired:()=>{setState(empty);setError('You were signed out after 5 minutes without activity. Please sign in again.');}});
 },[signedInId]);
 useEffect(()=>{
  if(!signedInId) return;
  const update=()=>{if(document.visibilityState==='visible') refresh().catch(e=>{setError(e.message);if(e.status===401)setState(empty);});};
  const timer=setInterval(update,30000);document.addEventListener('visibilitychange',update);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);};
 },[signedInId,refresh]);
 function dispatch(action) {
  queue.current=queue.current.then(async()=>{
   setError('');
   if(['SIGN_OUT','ADMIN_SIGN_OUT'].includes(action.type)){await api('/api/auth/logout',{});setState(empty);return true;}
   setState(await api('/api/portal/actions',action)); return true;
  }).catch(e=>{setError(e.message);if(e.status===401)setState(empty);return false;});
  return queue.current;
 }
 return <TrainerContext.Provider value={{state,dispatch,refresh,loading}}>{error && <p role="alert" className="tp-note">{error}</p>}{children}</TrainerContext.Provider>;
}
export function useTrainer(){return useContext(TrainerContext);}
