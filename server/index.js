import { createServer } from 'node:http';
import { enquiryHandler } from './enquiries.js';

const port = Number(process.env.API_PORT || 3001);
createServer(enquiryHandler()).listen(port, '127.0.0.1', () => {
  console.log(`Enquiry API listening on port ${port}`);
});
