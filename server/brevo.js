export class BrevoError extends Error {
 constructor(message,status,{uncertain=false,retryable=false}={}) {super(message);this.status=502;this.providerStatus=status;this.uncertain=uncertain;this.retryable=retryable;}
}
export function createBrevo({env=process.env,fetcher=fetch}={}) {
 return async function request(path,{method='GET',data,missing=false}={}) {
  if(!env.BREVO_API_KEY) throw new BrevoError('Configure BREVO_API_KEY on the API server.',0);
  let response;
  try {response=await fetcher('https://api.brevo.com/v3'+path,{method,headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(15000)});}
  catch {throw new BrevoError('Brevo connection failed. Check the provider logs before retrying an email.',0,{uncertain:method==='POST',retryable:method!=='POST'});}
  if(missing && response.status===404) return null;
  let result={};
  try {result=await response.json();} catch {if(response.ok && method==='POST' && path==='/smtp/email') throw new BrevoError('Brevo accepted the request but its receipt could not be read. Check provider logs.',response.status,{uncertain:true});}
  if(!response.ok) {
   const blocked=response.status===401 && /unrecogni[sz]ed IP/i.test(String(result.message));
   const message=blocked?'Brevo blocked the server IP. Review https://app.brevo.com/security/authorised_ips.'
    :response.status===401?'Brevo rejected the API key. Check the key and restart the API.'
    :response.status===404?'Brevo list or contact was not found. Check BREVO_LIST_ID.'
    :response.status===429?'Brevo rate limit reached. Wait before retrying.'
    :'Brevo rejected the request. Check the sender, account allowance, list and contact attributes.';
   throw new BrevoError(message,response.status,{retryable:response.status===429,uncertain:method==='POST' && response.status>=500});
  }
  return result;
 };
}
