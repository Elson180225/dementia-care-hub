export function createDialogScrollLock(body){
 let count=0,previous='';
 return ()=>{
  if(count===0)previous=body.style.overflow;
  count++;body.style.overflow='hidden';
  let active=true;
  return ()=>{if(!active)return;active=false;count--;if(count===0)body.style.overflow=previous;};
 };
}
let acquire;
export function lockDialogScroll(){
 acquire||=createDialogScrollLock(document.body);
 return acquire();
}
