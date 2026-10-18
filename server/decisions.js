export async function decision(db, user, entity, id, value, comment='', from=null, to=null) {
 if(user.role!=='admin') throw Object.assign(new Error('Admin access required'),{status:403});
 await db.query(`INSERT INTO audit_log(actor_id,entity,record_id,operation,decision,admin_comment,from_status,to_status)
 VALUES($1,$2,$3,'DECISION',$4,$5,$6,$7)`,[user.id,entity,id,value,comment,from,to]);
}
