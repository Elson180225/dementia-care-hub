const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function enquiryEmailContent(row, env = process.env) {
 const base = new URL(env.APP_BASE_URL);
 const assets = new URL(env.EMAIL_ASSET_BASE_URL || base.origin);
 if (![base, assets].every(url => ['https:', 'http:'].includes(url.protocol))) throw new Error('Email URLs must use HTTP or HTTPS');
 const portal = new URL('/admin/records', base).href;
 const projectLogo = new URL('/email/rcbc-alzheimers-care-logo.png', assets).href;
 const rotaryLogo = new URL('/email/rotary-logo.jpeg', assets).href;
 const reply = 'mailto:' + encodeURIComponent(String(row.email || ''));
 const received = row.received_at && !Number.isNaN(new Date(row.received_at).getTime())
  ? new Date(row.received_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'long', timeStyle: 'short' }) + ' (Malaysia time, UTC+8)'
  : 'See the admin portal';
 const details = [['Name', row.name], ['Email address', row.email], ['Enquiry type', row.type], ['Received', received], ['Reference', row.id]];
 const detailRows = details.map(([label, value]) => `<tr><th align="left" valign="top" scope="row" style="width:110px;padding:10px 12px 10px 0;border-bottom:1px solid #e8e2ee;font-size:13px;color:#665773;font-weight:normal;">${label}</th><td valign="top" style="padding:10px 0;border-bottom:1px solid #e8e2ee;font-size:14px;color:#2c2038;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(value)}</td></tr>`).join('');
 const textContent = [
  'Dementia Care Connect | Rotary Club of Bintulu Central',
  'New project enquiry',
  'A visitor has submitted an enquiry through the website. Please review the message and arrange the appropriate follow-up.',
  ...details.map(([label, value]) => `${label}: ${value ?? ''}`),
  `Visitor message (as submitted):\n${row.message || ''}`,
  `Review enquiry: ${portal}`,
  `Reply to the visitor: ${row.email || ''}`,
  'After responding, record your follow-up notes and update the enquiry status in the admin portal.',
  'This notification was generated automatically for the RCBC project team. Replying to this email addresses your response to the visitor.'
 ].join('\n\n');
 const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New project enquiry | RCBC</title></head>
<body style="margin:0;padding:0;background-color:#f4f1f7;font-family:Arial,Helvetica,sans-serif;color:#2c2038;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">A new website enquiry is ready for review by the RCBC project team.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f1f7"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e8e2ee;border-radius:16px;overflow:hidden;">
<tr><td align="center" bgcolor="#59308d" style="padding:24px;background-color:#59308d;border-bottom:5px solid #f5b324;">
<img src="${escapeHtml(projectLogo)}" width="320" alt="Rotary Club of Bintulu Central — Alzheimer's Care" style="display:block;width:100%;max-width:320px;height:auto;border:0;color:#ffffff;font-size:16px;">
<p style="margin:16px 0 0;font-size:13px;letter-spacing:1px;color:#ffffff;">DEMENTIA CARE CONNECT</p></td></tr>
<tr><td style="padding:28px 24px 16px;">
<p style="margin:0 0 10px;color:#59308d;font-size:12px;font-weight:bold;letter-spacing:1px;">WEBSITE ENQUIRY</p>
<h1 style="margin:0 0 14px;font-size:28px;line-height:1.25;color:#38204f;">A new message for your team</h1>
<p style="margin:0;font-size:15px;line-height:1.7;color:#5b5064;">A visitor has submitted an enquiry through the website. Please review the message and arrange the appropriate follow-up.</p>
</td></tr>
<tr><td style="padding:0 24px 24px;"><table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">${detailRows}</table></td></tr>
<tr><td style="padding:0 24px 24px;"><h2 style="margin:0 0 12px;font-size:18px;color:#38204f;">Visitor message</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#f7f4fa" style="padding:20px;border-left:4px solid #f5b324;font-size:15px;line-height:1.75;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(row.message).replace(/\r\n|\r|\n/g, '<br>')}</td></tr></table>
<p style="margin:8px 0 0;font-size:12px;color:#75677e;">The visitor’s message is shown as submitted.</p></td></tr>
<tr><td style="padding:0 24px 24px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#59308d" style="border-radius:8px;mso-padding-alt:15px 22px;"><a href="${escapeHtml(portal)}" style="display:inline-block;padding:15px 22px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Review enquiry</a></td></tr></table>
<p style="margin:18px 0 0;font-size:14px;line-height:1.7;"><a href="${escapeHtml(reply)}" style="color:#59308d;text-decoration:underline;">Reply to the visitor</a></p>
<p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:#5b5064;">After responding, record your follow-up notes and update the enquiry status in the admin portal.</p>
<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#75677e;">If the button does not work, open:<br><a href="${escapeHtml(portal)}" style="color:#59308d;word-break:break-all;">${escapeHtml(portal)}</a></p>
</td></tr>
<tr><td bgcolor="#faf8fc" style="padding:20px 24px;border-top:1px solid #e8e2ee;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="52" valign="top"><img src="${escapeHtml(rotaryLogo)}" width="40" height="40" alt="Rotary" style="display:block;border:0;"></td><td><p style="margin:0;font-size:13px;font-weight:bold;color:#38204f;">Rotary Club of Bintulu Central</p><p style="margin:5px 0 0;font-size:12px;line-height:1.6;color:#75677e;">Alzheimer’s Care Project · Dementia Care Connect</p></td></tr></table>
<p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#75677e;">This notification was generated automatically for the RCBC project team. Replying to this email addresses your response to the visitor.</p>
</td></tr></table></td></tr></table></body></html>`;
 return { textContent, htmlContent };
}
