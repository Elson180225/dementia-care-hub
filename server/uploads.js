import { pool, transaction } from './db.js';
import { currentUser, fail } from './auth.js';
import { isAllowedOrigin } from './origin.js';

export async function validateFileLinks(db,user,urls) {
 for(const url of urls.filter(Boolean)) {
  if(!url.startsWith('/api/files/')) continue;
  const file=(await db.query('SELECT owner_id FROM files WHERE id=$1',[url.split('/').at(-1)])).rows[0];
  if(!file || (user.role!=='admin' && file.owner_id!==user.id)) fail('You can only attach files you uploaded',403);
 }
}
export async function filesHandler(req,res,url,send) {
 const user=await currentUser(req);
 if(req.method==='POST' && url.pathname==='/api/uploads') {
  if(!user) fail('Please sign in',401);
  if(!isAllowedOrigin(req.headers.origin)) fail('Origin not allowed',403);
  const kind=url.searchParams.get('kind');
  if(!['photo','document','poster','activity-photo'].includes(kind)) fail('Invalid file purpose');
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>8388608)fail('File must be 8 MB or smaller',413);chunks.push(chunk);}
  const data=Buffer.concat(chunks);
  let mime;
  if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) mime='image/png';
  else if(data[0]===255 && data[1]===216 && data[2]===255) mime='image/jpeg';
  else if(data.toString('ascii',0,4)==='RIFF' && data.toString('ascii',8,12)==='WEBP') mime='image/webp';
  else if(kind==='document' && data.toString('ascii',0,5)==='%PDF-') mime='application/pdf';
  else fail('Use a PNG, JPEG or WebP image, or a PDF supporting document');
  const name=decodeURIComponent(req.headers['x-file-name'] || 'upload').replace(/[\r\n"\\/]/g,'_').slice(0,150);
  const file=await transaction(async db=>(await db.query('INSERT INTO files(owner_id,kind,name,mime,data) VALUES($1,$2,$3,$4,$5) RETURNING id,name,mime',[user.id,kind,name,mime,data])).rows[0],user.id);
  return send(res,201,{...file,url:'/api/files/'+file.id});
 }
 if(req.method!=='GET' || !/^\/api\/files\/[a-f0-9-]{36}$/.test(url.pathname)) fail('Not found',404);
 const file=(await pool.query('SELECT * FROM files WHERE id=$1',[url.pathname.split('/').at(-1)])).rows[0];
 if(!file) fail('File not found',404);
 let allowed=user && (user.role==='admin' || user.id===file.owner_id);
 if(!allowed && file.kind!=='document') {
  const link=url.pathname;
  allowed=!!(await pool.query(`SELECT 1 FROM public_trainers WHERE photo_url=$1
   UNION ALL SELECT 1 FROM activities a WHERE a.poster_url=$1 AND a.status IN ('published','completed','verified','archived') AND a.published_at IS NOT NULL
   UNION ALL SELECT 1 FROM completions c JOIN activities a ON a.id=c.activity_id WHERE c.status='verified' AND a.published_at IS NOT NULL AND c.photos ? $1 LIMIT 1`,[link])).rowCount;
 }
 if(!allowed) fail('File access denied',403);
 res.writeHead(200,{'Content-Type':file.mime,'Content-Length':file.data.length,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':`${file.kind==='document'?'attachment':'inline'}; filename="${file.name.replace(/[^\x20-\x7e]/g,'_')}"`});
 res.end(file.data);
}
