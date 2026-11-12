const invalid = message => { throw Object.assign(new Error(message), {status:400}); };

export function decodeCertificateEvidence(evidence) {
 if (evidence == null) return null;
 if (typeof evidence !== 'object' || typeof evidence.name !== 'string' || !evidence.name.trim() || evidence.name.length > 150 || typeof evidence.data !== 'string') invalid('Choose a valid certificate image or PDF');
 if (evidence.data.length > 11184812) invalid('Certificate file must be 8 MB or smaller');
 if (evidence.data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(evidence.data)) invalid('Invalid certificate file data');
 const data = Buffer.from(evidence.data, 'base64');
 if (!data.length || data.length > 8388608) invalid('Certificate file must be 8 MB or smaller');
 let mime;
 if (data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) mime='image/png';
 else if (data[0]===255 && data[1]===216 && data[2]===255) mime='image/jpeg';
 else if (data.toString('ascii',0,4)==='RIFF' && data.toString('ascii',8,12)==='WEBP') mime='image/webp';
 else if (data.toString('ascii',0,5)==='%PDF-') mime='application/pdf';
 else invalid('Use a PNG, JPEG, WebP or PDF certificate');
 return {name:evidence.name.replace(/[\r\n"\\/]/g,'_'),mime,data};
}

export async function storeCertificateEvidence(db, ownerId, evidence) {
 const file=decodeCertificateEvidence(evidence);
 if (!file) return null;
 return (await db.query("INSERT INTO files(owner_id,kind,name,mime,data) VALUES($1,'document',$2,$3,$4) RETURNING id",[ownerId,file.name,file.mime,file.data])).rows[0].id;
}

export async function certificateFileId(db, user, url) {
 if (!url) return null;
 if (typeof url !== 'string' || !/^\/api\/files\/[a-f0-9-]{36}$/i.test(url)) invalid('Upload a certificate image or PDF using the certificate field');
 const id=url.split('/').at(-1);
 const file=(await db.query("SELECT owner_id FROM files WHERE id=$1 AND kind='document'",[id])).rows[0];
 const assigned = file && user.role!=='admin' && file.owner_id!==user.id
  ? (await db.query('SELECT 1 FROM trainer_profiles WHERE id=$1 AND certificate_file_id=$2',[user.id,id])).rowCount : false;
 if (!file || (user.role!=='admin' && file.owner_id!==user.id && !assigned)) invalid('Only your private document uploads can be used as certificate evidence');
 return id;
}
