export const headingSections = [
  {id:'rcbc',name:'Public education webinars',hint:'The first webinar section on the page.'},
  {id:'ct',name:'Certified trainer webinars',hint:'The section for webinars delivered by certified trainers.'},
  {id:'upcoming',name:'Upcoming events & topics',hint:'The introduction above the upcoming topic cards.'},
  {id:'approved',name:'Recordings & learning materials',hint:'The introduction above the recordings and Q&A archive.'},
];

export function onlineHeadingText(translations, headers, language) {
  if (language !== 'en') return translations;
  const result = {...translations};
  for (const {id} of headingSections) for (const suffix of ['Label','Title','Desc']) {
    const key=id+suffix;
    const target=id==='upcoming' ? ({Label:'lookingAhead',Title:'upcomingEventsTitle',Desc:'upcomingEventsDesc'}[suffix]) : key;
    if (typeof headers?.[key]==='string' && headers[key].trim()) result[target]=headers[key];
  }
  return result;
}
