export function adminRecordQuery(kind, table, filters, { exportAll = false } = {}) {
  const conditions = [];
  const values = [];
  const add = (expression, value) => {
    if (typeof value !== 'string' || !value.trim()) return;
    values.push(value.trim().slice(0, 254));
    conditions.push(expression.replaceAll('?', '$' + values.length));
  };
  let columns = 'r.*';
  let join = '';
  let order = 'r.id DESC';
  if (kind === 'enquiries') {
    add('r.status=?', filters.get('status'));
    add('r.type=?', filters.get('type'));
    for (const [key, operator] of [['from', '>='], ['through', '<=']]) {
      const date = filters.get(key);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && new Date(date).toJSON()?.slice(0, 10) === date) {
        add(`(r.received_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date ${operator} ?::date`, date);
      }
    }
    order = 'r.received_at DESC, r.id';
  }
  if (kind === 'subscribers') {
    columns = 'r.id,r.name,r.email,r.country,r.state,r.city,r.consent_version,r.consent_at,r.confirmed_at,r.unsubscribed_at,r.provider_reference';
    for (const field of ['country', 'state', 'city']) add(`lower(r.${field})=lower(?)`, filters.get(field));
    if (filters.get('status') === 'active') conditions.push('r.unsubscribed_at IS NULL');
    if (filters.get('status') === 'unsubscribed') conditions.push('r.unsubscribed_at IS NOT NULL');
    order = 'r.consent_at DESC, r.id';
  }
  if (kind === 'organisations' || kind === 'directory_services') {
    if (kind === 'directory_services') {
      columns += ',o.name AS organisation_name';
      join = ' JOIN organisations o ON o.id=r.organisation_id';
    }
    add(`strpos(lower(${join ? 'o.name' : 'r.name'}),lower(?))>0`, filters.get('name'));
    add(join ? 'r.category=?' : 'strpos(lower(r.category),lower(?))>0', filters.get('category'));
    add(`strpos(lower(concat_ws(' ',${join ? "coalesce(nullif(r.city,''),o.city),coalesce(nullif(r.state,''),o.state)" : 'r.city,r.state'})),lower(?))>0`, filters.get('location'));
    if (['published', 'unpublished'].includes(filters.get('status'))) add('r.publication_status=?', filters.get('status'));
    if (['needs review', 'current', 'archived'].includes(filters.get('status'))) add('r.review_status=?', filters.get('status'));
    order = join ? 'o.name, r.service_type, r.id' : 'r.name, r.id';
  }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  return { text: `SELECT ${columns} FROM ${table} r${join}${where} ORDER BY ${order}${exportAll ? '' : ' LIMIT 500'}`, values };
}
