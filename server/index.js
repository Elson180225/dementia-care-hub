
import { createServer } from 'node:http';
import { enquiryHandler } from './enquiries.js';
import { authHandler } from './auth.js';
import { portalHandler } from './portal.js';
import { pool } from './db.js';
import { subscriberPool } from './subscriber-db.js';
import { startReminderWorker } from './reminders.js';
import { filesHandler } from './uploads.js';
import { managementHandler } from './management.js';
import { publicRecordsHandler } from './public-records.js';
import { createHash } from 'node:crypto';

const port = Number(process.env.API_PORT || 3001);
const handleEnquiry = enquiryHandler({persist:async data=>{
 const {id,name,email,type,message}=data;
 const fingerprint=createHash('sha256').update(JSON.stringify({name,email,type,message})).digest('hex');
 await pool.query('INSERT INTO enquiries(id,fingerprint,name,email,type,message) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[id,fingerprint,name,email,type,message]);
}});

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });

  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
 try {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if(url.pathname==='/api/uploads' || url.pathname.startsWith('/api/files/')) return await filesHandler(req,res,url,sendJson);
  if(url.pathname.startsWith('/api/admin/')) return await managementHandler(req,res,url,sendJson);
  if(url.pathname.startsWith('/api/public/')) return await publicRecordsHandler(req,res,url,sendJson);
  if(url.pathname.startsWith('/api/auth/')) return await authHandler(req,res,url.pathname,sendJson);
  if(url.pathname.startsWith('/api/portal') || url.pathname==='/api/trainers' || url.pathname==='/api/activities') return await portalHandler(req,res,url,sendJson);
  if(url.pathname==='/api/health/database') {
   await pool.query('SELECT 1'); return sendJson(res,200,{status:'OK',database:'PostgreSQL'});
  }

  // Check whether the backend is running
  if(url.pathname==='/api/health/subscribers' && req.method==='GET') {
   await subscriberPool.query('SELECT id FROM subscribers LIMIT 0');
   return sendJson(res,200,{status:'OK',database:'PostgreSQL',separate:subscriberPool!==pool});
  }
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'OK',
      service: 'Dementia Care Hub API',
    });
  }

  // Describe the initial API structure
  if (url.pathname === '/api' && req.method === 'GET') {
    return sendJson(res, 200, {
      name: 'Dementia Care Hub API',
      version: '1.0.0',
      modules: [
        'authentication',
        'content',
        'faqs',
        'healthcare-resources',
        'events',
        'trainers',
        'enquiries',
      ],
    });
  }

  // Preserve the existing contact form API
  if (url.pathname === '/api/enquiries') {
    return handleEnquiry(req, res);
  }

  // Other API endpoints will be implemented in later tasks
  return sendJson(res, 404, {
    error: 'API endpoint not found',
  });
 } catch(error) {
  const status=error.status || (error.code==='23505'?409: error.code?.startsWith('23') || error.code?.startsWith('22')?400:500);
  if(status===500) console.error('API failure:',error.code || error.name);
  return sendJson(res,status,{error:status===500?'Database service unavailable':error.code==='23505'?'This record already exists':error.message});
 }
});

server.on('error',error=>{
 console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Stop the existing API before starting another server.`:'API listener failed: '+error.code);
 process.exitCode=1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Dementia Care Hub API listening on http://127.0.0.1:${port}`);
  try {startReminderWorker();} catch(error) {console.error('Reminder worker disabled:',error.message);}
});
