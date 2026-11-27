export const directoryCategories = {
  healthcare: ['healthcare', 'services', 'support-group'],
  products: ['equipment'],
  information: ['financial', 'information'],
};

export const serviceCategories = ['healthcare', 'services', 'financial', 'equipment', 'support-group', 'information'];
export const groupTypes = ['Government-led', 'NGO / private', 'Community-led'];
const normalise = value => String(value ?? '').trim().toLowerCase();

export function directoryTypes(row) {
  return row.service_type ? [row.service_type] : Array.isArray(row.services) ? row.services : [];
}

export function translateDirectoryListings(rows, translateContent) {
  return translateContent(rows, 'records/directory_services').map(row => ({
    ...row,
    name: translateContent(row.name, `records/organisations/${row.organisation_id || row.id}/name`),
    specialist_field: row.description ?? row.specialist_field,
  }));
}

export function findDirectoryListings(rows, { category, type, location, groupType, volunteers, localOnly }) {
  const locality = normalise(location);
  return rows.filter(row =>
    (!category || (directoryCategories[category] || [category]).includes(row.category)) &&
    (!type || directoryTypes(row).includes(type)) &&
    (!groupType || row.group_type === groupType) &&
    (!volunteers || row.accepting_volunteers) &&
    (!locality || (!localOnly && !row.city && !row.state) ||
      [row.city, row.state, row.address, row.postcode].some(value => normalise(value).includes(locality)))
  );
}
