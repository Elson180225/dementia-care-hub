import {useEffect,useId,useRef} from 'react';
import {createPortal} from 'react-dom';
import {lockDialogScroll} from './dialogScroll';

export default function RegistrationDialog({title,busy,onClose,children,id}){
 const root=useRef(null),close=useRef(onClose),working=useRef(busy),titleId=useId();
 useEffect(()=>{close.current=onClose;working.current=busy;},[onClose,busy]);
 useEffect(()=>{
  const opener=document.activeElement,previousDialog=opener?.closest('[role="dialog"]');
  const previousHidden=previousDialog?.getAttribute('aria-hidden'),previousInert=previousDialog?.inert;
  const unlock=lockDialogScroll();
  if(previousDialog){previousDialog.inert=true;previousDialog.setAttribute('aria-hidden','true');}
  root.current?.focus({preventScroll:true});
  const keyboard=e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!working.current)close.current();return;}
   if(e.key!=='Tab')return;
   e.stopImmediatePropagation();
   const controls=[...root.current.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),summary')].filter(el=>el.getClientRects().length);
   const first=controls[0],last=controls.at(-1);
   if(!first){e.preventDefault();return;}
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root.current)){e.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',keyboard,true);
  return()=>{
   document.removeEventListener('keydown',keyboard,true);unlock();
   if(previousDialog){previousDialog.inert=previousInert;if(previousHidden===null)previousDialog.removeAttribute('aria-hidden');else previousDialog.setAttribute('aria-hidden',previousHidden);}
   opener?.focus?.();
  };
 },[]);
 return createPortal(<div className="registration-window-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
  <section id={id} ref={root} className="registration-window event-registration" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1}>
   <header className="registration-window-header"><div><span className="registration-eyebrow">Event registration</span><h2 id={titleId}>Complete your registration</h2><p>{title}</p></div><button type="button" className="registration-window-close" onClick={onClose} disabled={busy} aria-label="Close registration form">×</button></header>
   <div className="registration-window-body">{children}</div>
  </section>
 </div>,document.body);
}
