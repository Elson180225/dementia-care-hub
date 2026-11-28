import {pool} from './db.js';
import {currentUser,fail} from './auth.js';
import {educationReport,reportYear} from '../shared/education-reports.js';
const xml=value=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
// Stored ZIP entries: small annual exports need no third-party dependency.
export function workbookXlsx(sheets){
 const files=[['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
 ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
 ['xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'],
 ['xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>'],
 ...sheets.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+s.rows.map((r,j)=>'<row r="'+(j+1)+'">'+r.map(v=>typeof v==='number'&&Number.isFinite(v)?'<c><v>'+v+'</v></c>':'<c t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>'])];
 const chunks=[],central=[];let offset=0;for(const [path,content] of files){const name=Buffer.from(path),data=Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+content),crc=crc32(data),h=Buffer.alloc(30),c=Buffer.alloc(46);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(name.length,26);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);chunks.push(h,name,data);central.push(c,name);offset+=h.length+name.length+data.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,directory,end]);
}
export async function educationReportsHandler(req,res,url){
 if(req.method!=='GET')fail('Not found',404);
 const unifiedPath=url.pathname==='/api/portal/education-reports';
 const adminPath=url.pathname==='/api/admin/education-reports',personalPath=url.pathname==='/api/portal/education-report';
 if(!adminPath&&!personalPath&&!unifiedPath)fail('Not found',404);
 const user=await currentUser(req);if(!user)fail('Please sign in',401);if(adminPath&&user.role!=='admin')fail('Admin access required',403);
 let year;try{year=reportYear(url.searchParams.get('year')||new Date().getFullYear());}catch(e){fail(e.message);}
 const trainerId=personalPath||(unifiedPath&&user.role!=='admin')?user.id:null;
 const rows=(await pool.query(`SELECT a.*,c.status AS completion_status,c.participants,c.actual_hours,
 to_char(c.actual_starts_at AT TIME ZONE 'Asia/Kuala_Lumpur','YYYY-MM-DD HH24:MI') AS actual_start,
 to_char(c.actual_ends_at AT TIME ZONE 'Asia/Kuala_Lumpur','YYYY-MM-DD HH24:MI') AS actual_end,
 extract(year FROM coalesce(c.actual_starts_at,a.starts_at) AT TIME ZONE 'Asia/Kuala_Lumpur')::int AS year,
 coalesce((SELECT jsonb_agg(jsonb_build_object('trainerId',t.trainer_id,'name',u.name,'role',t.role,'topic',t.topic,'hours',t.actual_hours,'contributionStatus',t.contribution_status)) FROM activity_trainers t JOIN users u ON u.id=t.trainer_id WHERE t.activity_id=a.id AND ($2::uuid IS NULL OR t.trainer_id=$2)),'[]') AS trainers
 FROM activities a JOIN completions c ON c.activity_id=a.id
 WHERE extract(year FROM coalesce(c.actual_starts_at,a.starts_at) AT TIME ZONE 'Asia/Kuala_Lumpur')=$1
 AND ($2::uuid IS NULL OR EXISTS(SELECT 1 FROM activity_trainers t WHERE t.activity_id=a.id AND t.trainer_id=$2)) ORDER BY a.starts_at,a.id`,[year,trainerId])).rows;
 const filters=Object.fromEntries(['location','type','organiser'].map(key=>[key,url.searchParams.get(key)||'']));
 if(Object.values(filters).some(v=>v.length>300)||filters.organiser&&!['rcbc','joint','independent'].includes(filters.organiser))fail('Choose valid report filters');
 const output=workbookXlsx(educationReport(rows,year,trainerId,filters));res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="education-'+year+'.xlsx"','Cache-Control':'no-store','Content-Length':output.length});res.end(output);
}
