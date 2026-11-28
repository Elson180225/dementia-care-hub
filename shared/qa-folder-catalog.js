/** Grouped_Q&A asset folders and their linked RCBC webinar activity records. */
export const qaFolderCatalog = [
 {
  folder: 'Understanding the Missing Pieces',
  activityId: 'a0000001-0000-0000-0000-000000000001',
  webinarTitle: "Alzheimer's 101: Eye-opening facts",
  resourceTitle: 'Understanding the Missing Pieces — Q&A Collection',
 },
 {
  folder: 'Prevention&Early Detection (Chinese)',
  activityId: 'a0000001-0000-0000-0000-000000000003',
  webinarTitle: 'Early Detection & Monitoring of Dementia',
  resourceTitle: 'Prevention & Early Detection of Dementia — Q&A Guide',
 },
 {
  folder: 'Oral Health Webinar',
  activityId: 'a0000001-0000-0000-0000-000000000010',
  webinarTitle: 'Is Tooth Loss Really Part of Getting Older?',
  resourceTitle: 'Oral Health & Ageing Webinar — Q&A Reference Pack',
 },
];

export const qaFolders = qaFolderCatalog.map((row) => row.folder);