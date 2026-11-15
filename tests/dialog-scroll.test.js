import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogScrollLock} from '../src/components/dialogScroll.js';
test('nested dialogs keep scrolling locked until both close, regardless of cleanup order',()=>{
 for(const reverse of [false,true]){
  const body={style:{overflow:'auto'}},lock=createDialogScrollLock(body);
  const event=lock(),registration=lock();
  assert.equal(body.style.overflow,'hidden');
  (reverse?registration:event)();
  assert.equal(body.style.overflow,'hidden');
  (reverse?event:registration)();
  assert.equal(body.style.overflow,'auto');
  event();registration();
  assert.equal(body.style.overflow,'auto');
 }
});
