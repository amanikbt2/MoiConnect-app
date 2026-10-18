export interface KenyanUniversity {
  name: string;
  shortName: string;
  aliases?: string[];
}

const UNIVERSITY_STOP_WORDS = new Set(['of', 'the', 'and', 'for']);

/** Offline aliases for common university-name shortcuts and spelling variants. */
export function getKenyanUniversitySearchAliases(university: KenyanUniversity): string[] {
  const words = university.name.replace(/[^a-zA-Z0-9 '&-]/g, ' ').split(/\s+/).filter(Boolean);
  const initials = words
    .filter((word) => !UNIVERSITY_STOP_WORDS.has(word.toLowerCase()))
    .map((word) => word[0])
    .join('');
  const withoutUniversity = university.name
    .replace(/\buniversity\b/ig, '')
    .replace(/\bof\b/ig, '')
    .replace(/[^a-zA-Z0-9 '&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const aliases = [
    university.name,
    university.name.replace(/\buniversity\b/ig, 'Uni'),
    university.shortName,
    ...(university.aliases || []),
    withoutUniversity,
    ...(initials.length >= 3 ? [initials, initials.toLowerCase()] : [])
  ];
  return Array.from(new Set(aliases.map((alias) => alias.trim()).filter((alias) => alias.length >= 2)));
}

// Local list used during first-run setup. shortName keeps community labels compact.
export const KENYAN_UNIVERSITIES: KenyanUniversity[] = [
  { name: 'University of Nairobi', shortName: 'UON' },
  { name: 'Kenyatta University', shortName: 'KU' },
  { name: 'Jomo Kenyatta University of Agriculture and Technology', shortName: 'JKUAT' },
  { name: 'Egerton University', shortName: 'Egerton' },
  { name: 'Moi University', shortName: 'Moi' },
  { name: 'Maseno University', shortName: 'Maseno' },
  { name: 'Masinde Muliro University of Science and Technology', shortName: 'MMUST' },
  { name: 'Technical University of Kenya', shortName: 'TUK' },
  { name: 'Technical University of Mombasa', shortName: 'TUM' },
  { name: 'Dedan Kimathi University of Technology', shortName: 'DeKUT' },
  { name: 'University of Eldoret', shortName: 'UoE' },
  { name: 'Kisii University', shortName: 'Kisii' },
  { name: 'Chuka University', shortName: 'Chuka' },
  { name: 'Pwani University', shortName: 'Pwani' },
  { name: 'South Eastern Kenya University', shortName: 'SEKU' },
  { name: 'Meru University of Science and Technology', shortName: 'MUST' },
  { name: 'University of Embu', shortName: 'Embu' },
  { name: 'Rongo University', shortName: 'Rongo' },
  { name: 'Jaramogi Oginga Odinga University of Science and Technology', shortName: 'JOOUST' },
  { name: 'Laikipia University', shortName: 'Laikipia' },
  { name: 'Karatina University', shortName: 'Karatina' },
  { name: 'Kibabii University', shortName: 'Kibabii' },
  { name: 'Taita Taveta University', shortName: 'TTU' },
  { name: 'Maasai Mara University', shortName: 'Maasai Mara', aliases: ['Masaai Mara University', 'MMU'] },
  { name: 'Kaimosi Friends University', shortName: 'KAFU' },
  { name: 'Alupe University', shortName: 'Alupe' },
  { name: 'Bomet University', shortName: 'Bomet', aliases: ['Bomet University College', 'BUC'] },
  { name: 'Tharaka University', shortName: 'Tharaka' },
  { name: 'Garissa University', shortName: 'Garissa' },
  { name: "Murang'a University of Technology", shortName: "Murang'a" },
  { name: 'Koitaleel Samoei University College', shortName: 'Koitaleel' },
  { name: 'National Defence University-Kenya', shortName: 'NDU-K' },
  { name: 'Open University of Kenya', shortName: 'OUK' },
  { name: 'Co-operative University of Kenya', shortName: 'CUK', aliases: ['The Co-operative University of Kenya'] },
  { name: 'University of Kabianga', shortName: 'Kabianga' },
  { name: 'Kenyatta University Ruiru Campus', shortName: 'KU' },
  { name: 'United States International University-Africa', shortName: 'USIU-A', aliases: ['USIU', 'United States International University', 'USIU Africa'] },
  { name: 'Strathmore University', shortName: 'Strathmore' },
  { name: 'Daystar University', shortName: 'Daystar' },
  { name: 'Catholic University of Eastern Africa', shortName: 'CUEA' },
  { name: 'Mount Kenya University', shortName: 'MKU' },
  { name: 'Kabarak University', shortName: 'Kabarak' },
  { name: 'Africa Nazarene University', shortName: 'ANU' },
  { name: 'University of Eastern Africa, Baraton', shortName: 'UEAB' },
  { name: 'Riara University', shortName: 'Riara' },
  { name: 'Zetech University', shortName: 'Zetech' },
  { name: 'KAG East University', shortName: 'KAG East' },
  { name: "St. Paul's University", shortName: "St. Paul's" },
  { name: 'Pan Africa Christian University', shortName: 'PACU' },
  { name: 'Presbyterian University of East Africa', shortName: 'PUEA' },
  { name: 'Adventist University of Africa', shortName: 'AUA' },
  { name: 'International Leadership University', shortName: 'ILU' },
  { name: 'Aga Khan University', shortName: 'AKU' },
  { name: 'Gretsa University', shortName: 'Gretsa' },
  { name: 'Umma University', shortName: 'Umma' },
  { name: 'Management University of Africa', shortName: 'MUA' },
  { name: 'Scott Christian University', shortName: 'Scott Christian' },
  { name: 'Great Lakes University of Kisumu', shortName: 'GLUK' },
  { name: 'Uzima University', shortName: 'Uzima' },
  { name: "Kenya Methodist University", shortName: 'KeMU' },
  { name: "Kiriri Women's University of Science and Technology", shortName: "Kiriri Women's" },
  { name: 'Regina Pacis University', shortName: 'Regina Pacis' },
  { name: 'Consolata International University', shortName: 'CIU' },
  { name: 'Multimedia University of Kenya', shortName: 'MMUK', aliases: ['Multimedia University', 'MMU Kenya'] },
  { name: 'Machakos University', shortName: 'Machakos', aliases: ['Machakos Uni', 'MU Machakos'] },
  { name: 'Kirinyaga University', shortName: 'Kirinyaga', aliases: ['KYU'] },
  { name: 'Tom Mboya University', shortName: 'TMU', aliases: ['Tom Mboya', 'TMU Kenya'] },
  { name: 'Africa International University', shortName: 'AIU' },
  { name: 'Kenya Highlands Evangelical University', shortName: 'KHEU', aliases: ['Kenya Highlands University'] },
  { name: 'KCA University', shortName: 'KCA', aliases: ['Kenya College of Accountancy', 'KCA'] },
  { name: 'The East African University', shortName: 'TEAU', aliases: ['East African University'] },
  { name: 'Lukenya University', shortName: 'Lukenya' },
  { name: 'Tangaza University', shortName: 'Tangaza' },
  { name: 'Islamic University of Kenya', shortName: 'IUK', aliases: ['IUKenya'] },
  { name: 'Amref International University', shortName: 'AMIU', aliases: ['Amref University'] },
  { name: 'National Intelligence Research University', shortName: 'NIRU' },
  { name: 'Kenya Advanced Institute of Science and Technology', shortName: 'KAIST', aliases: ['Kenya AIST'] },
  { name: 'Kenya Medical Research Institute', shortName: 'KEMRI', aliases: ['KEMRI university'] },
  { name: 'Turkana University College', shortName: 'Turkana UC', aliases: ['Turkana University'] },
  { name: 'Mama Ngina University College', shortName: 'Mama Ngina', aliases: ['Mama Ngina University'] },
  { name: 'Nyandarua University College', shortName: 'Nyandarua UC', aliases: ['Nyandarua University'] },
  { name: 'Kabarnet University College', shortName: 'Kabarnet UC', aliases: ['Kabarnet University'] },
  { name: 'Makueni University College', shortName: 'Makueni UC', aliases: ['Makueni University'] },
  { name: 'Hekima University College', shortName: 'Hekima', aliases: ['Hekima College'] },
  { name: 'Marist International University College', shortName: 'MIUC', aliases: ['Marist International'] },
  { name: 'Pioneer International University', shortName: 'PIU' },
  { name: 'Outspan Global University', shortName: 'OGU', aliases: ['Outspan University'] },
  { name: 'The African Talent University', shortName: 'ATU', aliases: ['African Talent University'] },
  { name: 'East Kenya Integrated University', shortName: 'EKIU' }
];
