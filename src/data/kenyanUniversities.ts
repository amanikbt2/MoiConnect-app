export interface KenyanUniversity {
  name: string;
  shortName: string;
  aliases?: string[];
  chatAbbreviation?: string;
  studentPortalUrl?: string;
  officialWebsiteUrl?: string;
  /** Verified e-learning portal, when the university publishes a direct link. */
  elearningPortalUrl?: string;
  /** Portal's public-facing name, when known. */
  elearningPortalName?: string;
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

export function findKenyanUniversity(name?: string | null): KenyanUniversity | undefined {
  const normalized = String(name || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return KENYAN_UNIVERSITIES.find((university) =>
    [university.name, university.shortName, ...(university.aliases || [])]
      .some((alias) => alias.trim().toLowerCase() === normalized)
  );
}

const CHAT_ABBREVIATIONS: Record<string, string> = {
  'University of Nairobi': 'UON',
  'Kenyatta University': 'KU',
  'Jomo Kenyatta University of Agriculture and Technology': 'JKUAT',
  'Egerton University': 'EGU',
  'Moi University': 'MU',
  'Maseno University': 'MSU',
  'Masinde Muliro University of Science and Technology': 'MMUST',
  'Technical University of Kenya': 'TUK',
  'Technical University of Mombasa': 'TUM',
  'Dedan Kimathi University of Technology': 'DKUT',
  'University of Eldoret': 'UOE',
  'Kisii University': 'KISU',
  'Chuka University': 'CHU',
  'Pwani University': 'PU',
  'South Eastern Kenya University': 'SEKU',
  'Meru University of Science and Technology': 'MUST',
  'University of Embu': 'UEMB',
  'Jaramogi Oginga Odinga University of Science and Technology': 'JOOUST',
  'Laikipia University': 'LU',
  'Karatina University': 'KARU',
  'Kibabii University': 'KIBU',
  'Taita Taveta University': 'TTU',
  'Maasai Mara University': 'MMRU',
  'Kaimosi Friends University': 'KAFU',
  'Alupe University': 'AU',
  'Bomet University': 'BU',
  'Tharaka University': 'TU',
  'Garissa University': 'GAU',
  "Murang'a University of Technology": 'MUT',
  'Koitaleel Samoei University College': 'KSU',
  'National Defence University-Kenya': 'NDUK',
  'Open University of Kenya': 'OUK',
  'Co-operative University of Kenya': 'CUK',
  'University of Kabianga': 'UOK',
  'United States International University-Africa': 'USIU-A',
  'Strathmore University': 'STRATH',
  'Daystar University': 'DAYSTAR',
  'Catholic University of Eastern Africa': 'CUEA',
  'Mount Kenya University': 'MKU',
  'Kabarak University': 'KABU',
  'Africa Nazarene University': 'ANU',
  'University of Eastern Africa, Baraton': 'UEAB',
  'Riara University': 'RIARA',
  'Zetech University': 'ZETECH',
  'KAG East University': 'KAGU',
  "St. Paul's University": 'SPU',
  'Pan Africa Christian University': 'PACU',
  'Presbyterian University of East Africa': 'PUEA',
  'Adventist University of Africa': 'AUA',
  'International Leadership University': 'ILU',
  'Aga Khan University': 'AKU',
  'Gretsa University': 'GU',
  'Umma University': 'UU',
  'Management University of Africa': 'MUA',
  'Scott Christian University': 'SCU',
  'Great Lakes University of Kisumu': 'GLUK',
  'Uzima University': 'UZU',
  'Kenya Methodist University': 'KeMU',
  "Kiriri Women's University of Science and Technology": 'KWUST',
  'Consolata International University': 'CIU',
  'Multimedia University of Kenya': 'MMUK',
  'Machakos University': 'MKSU',
  'Kirinyaga University': 'KYU',
  'Tom Mboya University': 'TMU',
  'Africa International University': 'AIU',
  'Kenya Highlands Evangelical University': 'KHEU',
  'KCA University': 'KCAU',
  'The East African University': 'TEAU',
  'Lukenya University': 'LUK',
  'Tangaza University': 'TANG',
  'Islamic University of Kenya': 'IUK',
  'Amref International University': 'AMIU',
  'National Intelligence Research University': 'NIRU',
  'Kenya Advanced Institute of Science and Technology': 'KAIST',
  'Turkana University College': 'TUC',
  'Mama Ngina University College': 'MNUC',
  'Nyandarua University College': 'NYUC',
  'Kabarnet University College': 'KUC',
  'Makueni University College': 'MUC',
  'Hekima University College': 'HUC',
  'Marist International University College': 'MIUC',
  'Pioneer International University': 'PIU'
};

/** Return a compact, deterministic chat label for any institution in the picker. */
export function getUniversityChatAbbreviation(name?: string | null): string {
  const normalized = String(name || '').trim();
  if (!normalized) return '';
  const university = findKenyanUniversity(normalized);
  const canonicalName = university?.name || normalized;
  const explicit = university?.chatAbbreviation || CHAT_ABBREVIATIONS[canonicalName];
  if (explicit) return explicit.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();

  const initials = canonicalName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !['the', 'and', 'for', 'of'].includes(word.toLowerCase()))
    .map((word) => word[0])
    .join('');
  return initials.slice(0, 8).toUpperCase() || 'UNI';
}

// CUE-authorized universities, university colleges, and institutions with interim authority.
// Keep shortName compact for campus labels; direct portal links are included only when verified.
export const KENYAN_UNIVERSITIES: KenyanUniversity[] = [
  { name: 'University of Nairobi', shortName: 'UON', studentPortalUrl: 'https://smis.uonbi.ac.ke/', elearningPortalUrl: 'https://eclass.uonbi.ac.ke/', elearningPortalName: 'e-Class' },
  { name: 'Kenyatta University', shortName: 'KU', aliases: ['Kenyatta University Ruiru Campus'], studentPortalUrl: 'https://portal.ku.ac.ke/', elearningPortalUrl: 'https://kusoma.ku.ac.ke/', elearningPortalName: 'KUSOMA' },
  { name: 'Jomo Kenyatta University of Agriculture and Technology', shortName: 'JKUAT', studentPortalUrl: 'https://portal.jkuat.ac.ke/' },
  { name: 'Egerton University', shortName: 'Egerton', studentPortalUrl: 'https://studentportal.egerton.ac.ke/' },
  { name: 'Moi University', shortName: 'Moi', studentPortalUrl: 'https://portal.mu.ac.ke/', elearningPortalUrl: 'https://elearning.mu.ac.ke/', elearningPortalName: 'MUSOMI' },
  { name: 'Maseno University', shortName: 'Maseno', studentPortalUrl: 'https://student.maseno.ac.ke/' },
  { name: 'Masinde Muliro University of Science and Technology', shortName: 'MMUST', studentPortalUrl: 'https://myportal.mmust.ac.ke/', elearningPortalUrl: 'https://elearning.mmust.ac.ke/', elearningPortalName: 'MMUST eLearning' },
  { name: 'Technical University of Kenya', shortName: 'TUK', studentPortalUrl: 'https://portal.tukenya.ac.ke/' },
  { name: 'Technical University of Mombasa', shortName: 'TUM', officialWebsiteUrl: 'https://www.tum.ac.ke/', elearningPortalUrl: 'https://elearning.tum.ac.ke/', elearningPortalName: 'TUM eLearning' },
  { name: 'Dedan Kimathi University of Technology', shortName: 'DeKUT', studentPortalUrl: 'https://portal.dkut.ac.ke/' },
  { name: 'University of Eldoret', shortName: 'UoE', officialWebsiteUrl: 'https://uoeld.ac.ke/main-navigation/home', elearningPortalUrl: 'https://ecampus.uoeld.ac.ke/', elearningPortalName: 'eCampus' },
  { name: 'Kisii University', shortName: 'Kisii', officialWebsiteUrl: 'https://digital.kisiiuniversity.ac.ke/' },
  { name: 'Chuka University', shortName: 'Chuka', officialWebsiteUrl: 'https://www.chuka.ac.ke/current-students/', elearningPortalUrl: 'https://lms.chuka.ac.ke/', elearningPortalName: 'Chuka LMS' },
  { name: 'Pwani University', shortName: 'Pwani', studentPortalUrl: 'https://student.pu.ac.ke/Account/Login', elearningPortalUrl: 'https://soma.pu.ac.ke/', elearningPortalName: 'Soma' },
  { name: 'South Eastern Kenya University', shortName: 'SEKU', studentPortalUrl: 'https://www.portal.seku.ac.ke/', elearningPortalUrl: 'https://e-learning.seku.ac.ke/course/', elearningPortalName: 'SEKU e-Learning' },
  { name: 'Meru University of Science and Technology', shortName: 'MUST', studentPortalUrl: 'https://student.must.ac.ke/' },
  { name: 'University of Embu', shortName: 'Embu', studentPortalUrl: 'https://students.embuni.ac.ke/' },
  { name: 'Rongo University', shortName: 'Rongo', officialWebsiteUrl: 'https://www.rongovarsity.ac.ke/student-portal/', elearningPortalUrl: 'https://elearning.rongovarsity.ac.ke/', elearningPortalName: 'Rongo eLearning' },
  { name: 'Jaramogi Oginga Odinga University of Science and Technology', shortName: 'JOOUST', officialWebsiteUrl: 'https://www.jooust.ac.ke/index.php/jooust-academics/student-life' },
  { name: 'Laikipia University', shortName: 'Laikipia', studentPortalUrl: 'https://portal.laikipia.ac.ke/' },
  { name: 'Karatina University', shortName: 'Karatina', studentPortalUrl: 'https://students.karu.ac.ke/', elearningPortalUrl: 'https://e-learning.karu.ac.ke/lms/', elearningPortalName: 'Moodle' },
  { name: 'Kibabii University', shortName: 'Kibabii', officialWebsiteUrl: 'https://kibu.ac.ke/', elearningPortalUrl: 'https://onlinelearning.kibu.ac.ke/', elearningPortalName: 'Kibabii eLearning' },
  { name: 'Taita Taveta University', shortName: 'TTU', studentPortalUrl: 'https://portal.ttu.ac.ke/' },
  { name: 'Maasai Mara University', shortName: 'Maasai Mara', aliases: ['Masaai Mara University', 'MMU'], officialWebsiteUrl: 'https://students.mmarau.ac.ke/' },
  { name: 'Kaimosi Friends University', shortName: 'KAFU', officialWebsiteUrl: 'https://kafu.ac.ke/student-services' },
  { name: 'Alupe University', shortName: 'Alupe', studentPortalUrl: 'https://portal.au.ac.ke/' },
  { name: 'Bomet University', shortName: 'Bomet', aliases: ['Bomet University College', 'BUC'], officialWebsiteUrl: 'https://bu.ac.ke/' },
  { name: 'Tharaka University', shortName: 'Tharaka', studentPortalUrl: 'https://students.tharaka.ac.ke/', elearningPortalUrl: 'https://lms.tharaka.ac.ke/', elearningPortalName: 'Tharaka LMS' },
  { name: 'Garissa University', shortName: 'Garissa', officialWebsiteUrl: 'https://gau.ac.ke/' },
  { name: "Murang'a University of Technology", shortName: "Murang'a", studentPortalUrl: 'https://portal.mut.ac.ke/', elearningPortalUrl: 'https://masomo.mut.ac.ke/', elearningPortalName: 'Masomo Portal' },
  { name: 'Koitaleel Samoei University College', shortName: 'Koitaleel' },
  { name: 'National Defence University-Kenya', shortName: 'NDU-K' },
  { name: 'Open University of Kenya', shortName: 'OUK', elearningPortalUrl: 'https://somas.ouk.ac.ke/', elearningPortalName: 'SOMAS' },
  { name: 'Co-operative University of Kenya', shortName: 'CUK', aliases: ['The Co-operative University of Kenya'], studentPortalUrl: 'https://studentportal.cuk.ac.ke/' },
  { name: 'University of Kabianga', shortName: 'Kabianga', studentPortalUrl: 'https://portal.kabianga.ac.ke/' },
  { name: 'United States International University-Africa', shortName: 'USIU-A', aliases: ['USIU', 'United States International University', 'USIU Africa'], studentPortalUrl: 'https://cx.usiu.ac.ke/ics' },
  { name: 'Strathmore University', shortName: 'Strathmore', studentPortalUrl: 'https://su-sso.strathmore.edu/student-pss/private/login' },
  { name: 'Daystar University', shortName: 'Daystar', studentPortalUrl: 'https://student.daystar.ac.ke/' },
  { name: 'Catholic University of Eastern Africa', shortName: 'CUEA', studentPortalUrl: 'https://studentportal.cuea.edu/Default' },
  { name: 'Mount Kenya University', shortName: 'MKU', studentPortalUrl: 'https://login.mku.ac.ke/', elearningPortalUrl: 'https://vlms.mku.ac.ke/', elearningPortalName: 'VLMS' },
  { name: 'Kabarak University', shortName: 'Kabarak', studentPortalUrl: 'https://students.kabarak.ac.ke/' },
  { name: 'Africa Nazarene University', shortName: 'ANU', studentPortalUrl: 'https://records.anu.ac.ke/' },
  { name: 'University of Eastern Africa, Baraton', shortName: 'UEAB', studentPortalUrl: 'http://registration.ueab.ac.ke/', elearningPortalUrl: 'https://odel.ueab.ac.ke/', elearningPortalName: 'UEAB ODeL' },
  { name: 'Riara University', shortName: 'Riara', studentPortalUrl: 'https://student.riarauniversity.ac.ke/' },
  { name: 'Zetech University', shortName: 'Zetech', studentPortalUrl: 'https://student.zetech.ac.ke/' },
  { name: 'KAG East University', shortName: 'KAG East' },
  { name: "St. Paul's University", shortName: "St. Paul's", studentPortalUrl: 'https://students.spu.ac.ke/' },
  { name: 'Pan Africa Christian University', shortName: 'PACU', officialWebsiteUrl: 'https://www.pacuniversity.ac.ke/campus-life/', elearningPortalUrl: 'https://pacu.mrooms.net/', elearningPortalName: 'Open LMS' },
  { name: 'Presbyterian University of East Africa', shortName: 'PUEA' },
  { name: 'Adventist University of Africa', shortName: 'AUA' },
  { name: 'International Leadership University', shortName: 'ILU' },
  { name: 'Aga Khan University', shortName: 'AKU' },
  { name: 'Gretsa University', shortName: 'Gretsa' },
  { name: 'Umma University', shortName: 'Umma', studentPortalUrl: 'https://students.umma.ac.ke/' },
  { name: 'Management University of Africa', shortName: 'MUA', studentPortalUrl: 'https://studentportal.mua.ac.ke/' },
  { name: 'Scott Christian University', shortName: 'Scott Christian' },
  { name: 'Great Lakes University of Kisumu', shortName: 'GLUK' },
  { name: 'Uzima University', shortName: 'Uzima' },
  { name: "Kenya Methodist University", shortName: 'KeMU', studentPortalUrl: 'https://portal2.kemu.ac.ke/' },
  { name: "Kiriri Women's University of Science and Technology", shortName: "Kiriri Women's" },
  { name: 'Consolata International University', shortName: 'CIU' },
  { name: 'Multimedia University of Kenya', shortName: 'MMUK', aliases: ['Multimedia University', 'MMU Kenya'], studentPortalUrl: 'https://studentportal.mmu.ac.ke/' },
  { name: 'Machakos University', shortName: 'Machakos', aliases: ['Machakos Uni', 'MU Machakos'], studentPortalUrl: 'https://portal.mksu.ac.ke/' },
  { name: 'Kirinyaga University', shortName: 'Kirinyaga', aliases: ['KYU'], studentPortalUrl: 'https://portal.kyu.ac.ke/' },
  { name: 'Tom Mboya University', shortName: 'TMU', aliases: ['Tom Mboya', 'TMU Kenya'] },
  { name: 'Africa International University', shortName: 'AIU', studentPortalUrl: 'https://portal.aiu.ac.ke/', elearningPortalUrl: 'https://odel.aiu.ac.ke/', elearningPortalName: 'AIUODeL' },
  { name: 'Kenya Highlands Evangelical University', shortName: 'KHEU', aliases: ['Kenya Highlands University'], elearningPortalUrl: 'https://elearning.khu.ac.ke/', elearningPortalName: 'KHU e-Learning' },
  { name: 'KCA University', shortName: 'KCA', aliases: ['Kenya College of Accountancy', 'KCA'], studentPortalUrl: 'https://portal.kcau.ac.ke/' },
  { name: 'The East African University', shortName: 'TEAU', aliases: ['East African University'] },
  { name: 'Lukenya University', shortName: 'Lukenya', officialWebsiteUrl: 'https://odel.lukenyauniversity.ac.ke/page3.html' },
  { name: 'Tangaza University', shortName: 'Tangaza', studentPortalUrl: 'https://student.tangaza.ac.ke/' },
  { name: 'Islamic University of Kenya', shortName: 'IUK', aliases: ['IUKenya'] },
  { name: 'Amref International University', shortName: 'AMIU', aliases: ['Amref University'], studentPortalUrl: 'https://students.amref.ac.ke/' },
  { name: 'National Intelligence Research University', shortName: 'NIRU' },
  { name: 'Kenya Advanced Institute of Science and Technology', shortName: 'KAIST', aliases: ['Kenya AIST'] },
  { name: 'Turkana University College', shortName: 'Turkana UC', aliases: ['Turkana University'] },
  { name: 'Mama Ngina University College', shortName: 'Mama Ngina', aliases: ['Mama Ngina University'] },
  { name: 'Nyandarua University College', shortName: 'Nyandarua UC', aliases: ['Nyandarua University'] },
  { name: 'Kabarnet University College', shortName: 'Kabarnet UC', aliases: ['Kabarnet University'] },
  { name: 'Makueni University College', shortName: 'Makueni UC', aliases: ['Makueni University'] },
  { name: 'Hekima University College', shortName: 'Hekima', aliases: ['Hekima College'] },
  { name: 'Marist International University College', shortName: 'MIUC', aliases: ['Marist International'] },
  { name: 'Pioneer International University', shortName: 'PIU' },
];
