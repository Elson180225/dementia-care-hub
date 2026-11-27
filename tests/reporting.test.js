import test from 'node:test';
import assert from 'node:assert/strict';
import {activityTime,activityTiming,individualHours,organiserRecord} from '../shared/trainer-governance.js';
import {educationReport,reportYear} from '../shared/education-reports.js';
import {workbookXlsx} from '../server/education-reports.js';
const event={id:'one',activity_reference:'ACT-000001',year:2026,title:'=SUM(A1)',completion_status:'verified',actual_hours:3,city:'Kuching',type:'Workshop',organiser_kind:'rcbc',participants:20,trainers:[{trainerId:'a',name:'A & B',hours:2,contributionStatus:'verified'},{trainerId:'b',name:'B',hours:3,contributionStatus:'confirmed'}]};
test('timing uses Malaysia time and rejects impossible duration and dates',()=>{
 assert.equal(activityTime('2026-01-01T08:00').toISOString(),'2026-01-01T00:00:00.000Z');
 assert.equal(activityTiming('2026-01-01T09:00','2026-01-01T12:00',2.5).hours,2.5);
 for(const args of [['2026-02-30T09:00','2026-03-02T12:00',1],['2026-01-01T12:00','2026-01-01T09:00',1],['2026-01-01T09:00','2026-01-01T12:00',4],['2026-01-01T09:00','2026-01-01T12:00',0]])assert.throws(()=>activityTiming(...args));
 assert.throws(()=>individualHours([{trainerId:'a'}],{a:4},3));assert.deepEqual(individualHours([{trainerId:'a'}],{a:0},3),[{id:'a',hours:0}]);
 assert.throws(()=>organiserRecord('joint',''));assert.equal(organiserRecord('rcbc','').name,'RCBC');
});
test('five sheets count verified individual hours and project attendance once',()=>{
 const sheets=educationReport([event,{...event,id:'two',year:2025},{...event,id:'cancelled',cancelled_at:'now'},{...event,id:'postponed',postponed_at:'now'}],2026);
 assert.equal(sheets.length,5);assert.deepEqual(sheets[0].rows[1],[2026,1,2,20,1,3]);assert.equal(sheets[4].rows.length,2);assert.equal(sheets[2].rows.length,3);
 const personal=educationReport([event],2026,'b');assert.deepEqual(personal[0].rows[1],[2026,0,0,0,0,0]);assert.equal(personal[2].rows.length,2);assert.equal(personal[2].rows[1][1],'B');
 assert.equal(educationReport([event],2026,'outsider')[1].rows.length,1);
 assert.throws(()=>reportYear('2026 OR 1=1'));assert.throws(()=>reportYear(1999));
});
function entries(zip){const output=new Map();let offset=0;while(zip.readUInt32LE(offset)===0x04034b50){const length=zip.readUInt32LE(offset+18),nameLength=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),start=offset+30+nameLength+extra;output.set(zip.subarray(offset+30,offset+30+nameLength).toString(),zip.subarray(start,start+length).toString());offset=start+length;}assert.equal(zip.readUInt32LE(offset),0x02014b50);return output;}
test('XLSX is a ZIP workbook with five XML worksheets and literal text cells',()=>{
 const zip=workbookXlsx(educationReport([event],2026)),files=entries(zip);assert.equal(files.size,9);
 assert.equal((files.get('xl/workbook.xml').match(/<sheet /g)||[]).length,5);
 const activities=files.get('xl/worksheets/sheet2.xml');assert.match(activities,/t="inlineStr"/);assert.match(activities,/=SUM\(A1\)/);assert.doesNotMatch(activities,/<f[ >]/);
 assert.match(files.get('xl/worksheets/sheet3.xml'),/A &amp; B/);
});

test('report filters scope every sheet and pending records never enter final totals',()=>{const other={...event,id:'other',city:'Miri',completion_status:'submitted'};const selected=educationReport([event,other],2026,null,{location:'Miri',type:'Workshop',organiser:'rcbc'});assert.deepEqual(selected[0].rows[1],[2026,0,0,0,0,0]);assert.equal(selected[1].rows.length,2);assert.equal(selected[4].rows.length,1);assert.ok(selected.every(s=>s.name.length<=31));assert.equal(educationReport([event],2026,null,{organiser:'independent'})[1].rows.length,1);});
