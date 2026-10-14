
import { createServer } from 'node:http';
import { enquiryHandler } from './enquiries.js';

const port = Number(process.env.API_PORT || 3001);
const handleEnquiry = enquiryHandler();

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });

  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Check whether the backend is running
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
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dementia Care Hub API listening on http://127.0.0.1:${port}`);
});
