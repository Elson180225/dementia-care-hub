import {pool} from './db.js';
import {currentUser,fail} from './auth.js';
import {isAllowedOrigin} from './origin.js';

export async function trackApplicationsHandler(req,res,url,send){
 const admin=url.pathname==='/api/admin/track-applications';
 if(admin){
  const user=await currentUser(req);if(user?.role!=='admin')fail('Admin access required',user?403:401);
  if(req.method!=='GET')fail('Legacy applications are read-only. Use event registrations for current intakes.',410);
  return send(res,200,(await pool.query('SELECT * FROM track_applications ORDER BY submitted_at DESC')).rows);
 }
 if(req.method==='POST'&&!isAllowedOrigin(req.headers.origin))fail('Origin not allowed',403);
 return send(res,410,{error:'General track applications have closed. Choose an available dated intake on Physical Education to register.'});
}
