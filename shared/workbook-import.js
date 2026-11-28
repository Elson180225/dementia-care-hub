// Read a small, ordinary .xlsx in the browser without running formulas or macros.
export async function workbookEntries(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('This is not a supported XLSX file. Save an Excel workbook as .xlsx or CSV UTF-8.');
 let position=view.getUint32(end+16,true);const count=view.getUint16(end+10,true),files=new Map();let total=0;
 if(count>200)throw Error('Workbook is too complex. Use the registry template.');
 for(let n=0;n<count;n++){
  if(position+46>bytes.length||view.getUint32(position,true)!==0x02014b50)throw Error('Invalid workbook directory.');
  const flags=view.getUint16(position+8,true),method=view.getUint16(position+10,true),size=view.getUint32(position+20,true),expanded=view.getUint32(position+24,true),nameLength=view.getUint16(position+28,true),extra=view.getUint16(position+30,true),comment=view.getUint16(position+32,true),offset=view.getUint32(position+42,true);
  total+=expanded;if(total>10000000||expanded>5000000||flags&1)throw Error('Workbook is oversized or encrypted. Use a small unprotected template.');
  const name=new TextDecoder().decode(bytes.slice(position+46,position+46+nameLength));position+=46+nameLength+extra+comment;
  if(!/^(xl\/.*\.xml|\[Content_Types\]\.xml)$/.test(name)&&name!=='xl/_rels/workbook.xml.rels')continue;
  if(offset+30>bytes.length||view.getUint32(offset,true)!==0x04034b50)throw Error('Invalid workbook entry.');
  const start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true);if(start+size>bytes.length)throw Error('Workbook is truncated.');
  const packed=bytes.slice(start,start+size);let data;
  if(method===0)data=packed;
  else if(method===8){const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));const reader=stream.getReader(),chunks=[];let length=0;for(;;){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>expanded||length>5000000){await reader.cancel();throw Error('Workbook expands beyond its declared size.');}chunks.push(part.value);}data=new Uint8Array(length);let p=0;for(const chunk of chunks){data.set(chunk,p);p+=chunk.length;}}
  else throw Error('Unsupported workbook compression. Save as .xlsx or CSV UTF-8.');
  if(data.length!==expanded)throw Error('Workbook entry size is invalid.');
  files.set(name,new TextDecoder().decode(data));
 }
 return files;
}
export async function workbookCsv(buffer){
 const files=await workbookEntries(buffer);
 const xml=path=>{const text=files.get(path);if(!text)throw Error('Workbook is missing '+path);const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('Workbook contains invalid XML.');return doc;};
 const workbook=xml('xl/workbook.xml'),sheet=workbook.querySelector('sheet');if(!sheet)throw Error('No worksheet found.');
 const relationship=sheet.getAttribute('r:id'),rels=xml('xl/_rels/workbook.xml.rels');
 const rel=[...rels.getElementsByTagName('Relationship')].find(r=>r.getAttribute('Id')===relationship);
 if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('Use an ordinary local worksheet.');
 const path=new URL(rel.getAttribute('Target'),'https://workbook.invalid/xl/').pathname.slice(1);
 if(!/^xl\/worksheets\/[^/]+\.xml$/.test(path))throw Error('Unsupported worksheet path.');
 const strings=files.has('xl/sharedStrings.xml')?[...xml('xl/sharedStrings.xml').getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join('')):[];
 const rows=[...xml(path).getElementsByTagName('row')];if(rows.length>501)throw Error('Maximum 500 training records per import.');
 const parsed=rows.map(row=>{const result=[];for(const cell of row.getElementsByTagName('c')){
  if(cell.getElementsByTagName('f').length)throw Error('Formulas are not imported. Paste their values into the template first.');
  const reference=cell.getAttribute('r')||'',letters=reference.match(/^[A-Z]+/)?.[0];let index=result.length;
  if(letters){index=0;for(const ch of letters)index=index*26+ch.charCodeAt(0)-64;index--;}
  if(index>50)throw Error('Too many worksheet columns. Use the registry template.');
  const value=cell.querySelector('v')?.textContent||'';result[index]=cell.getAttribute('t')==='s'?strings[Number(value)]||'':cell.getAttribute('t')==='inlineStr'?[...cell.getElementsByTagName('t')].map(t=>t.textContent).join(''):value;
 }return result;});
 const dates=new Set(['attendance_date','completion_date','issued_at']);const epoch=workbook.querySelector('workbookPr')?.getAttribute('date1904')==='1'?Date.UTC(1904,0,1):Date.UTC(1899,11,30);
 for(const row of parsed.slice(1))for(let i=0;i<row.length;i++)if(dates.has(parsed[0]?.[i])&&/^\d+(\.\d+)?$/.test(row[i]||''))row[i]=new Date(epoch+Number(row[i])*86400000).toISOString().slice(0,10);
 return parsed.map(row=>Array.from({length:parsed[0]?.length||0},(_,i)=>'"'+String(row[i]||'').replaceAll('"','""')+'"').join(',')).join('\r\n');
}
