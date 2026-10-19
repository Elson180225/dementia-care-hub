import { createHmac, timingSafeEqual } from 'node:crypto';
function signature(id,secret) {return createHmac('sha256',secret).update('unsubscribe:'+id).digest('hex');}
export function unsubscribeToken(id,secret) {
 if(!secret || secret.length<32) throw new Error('SUBSCRIBER_TOKEN_SECRET must contain at least 32 characters');
 return id+'.'+signature(id,secret);
}
export function verifyUnsubscribeToken(token,secret) {
 if(typeof token!=='string' || !secret || secret.length<32) return null;
 const [id,sig,...extra]=token.split('.');
 if(extra.length || !/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(sig || '')) return null;
 return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(signature(id,secret),'hex'))?id:null;
}
