import test from 'node:test';
import assert from 'node:assert/strict';
import { onlineHeadingText } from '../shared/online-headings.js';

test('English headings use saved content, including upcoming field aliases',()=>{
 const result=onlineHeadingText({rcbcTitle:'Default',upcomingEventsTitle:'Default upcoming'},{rcbcTitle:'Edited webinars',upcomingTitle:'Edited topics',upcomingDesc:'Edited intro',upcomingLabel:'Next sessions'},'en');
 assert.equal(result.rcbcTitle,'Edited webinars');assert.equal(result.upcomingEventsTitle,'Edited topics');assert.equal(result.upcomingEventsDesc,'Edited intro');assert.equal(result.lookingAhead,'Next sessions');
});
test('blank custom content falls back and other languages retain translations',()=>{
 const translations={rcbcTitle:'Translated heading'};
 assert.equal(onlineHeadingText(translations,{rcbcTitle:'  '},'en').rcbcTitle,'Translated heading');
 for(const lang of ['ms','zh'])assert.deepEqual(onlineHeadingText(translations,{rcbcTitle:'English override'},lang),translations);
 assert.equal(translations.rcbcTitle,'Translated heading');
});
