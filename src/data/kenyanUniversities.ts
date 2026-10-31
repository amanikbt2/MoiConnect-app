export interface KenyanUniversity {
  name: string;
  shortName: string;
  aliases?: string[];
  studentPortalUrl?: string;
  officialWebsiteUrl?: string;
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

// CUE-authorized universities, university colleges, and institutions with interim authority.
// Keep shortName compact for campus labels; direct portal links are included only when verified.
export const KENYAN_UNIVERSITIES: KenyanUniversity[] = [
  { name: 'University of Nairobi', shortName: 'UON', studentPortalUrl: 'https://smis.uonbi.ac.ke/' },
  { name: 'Kenyatta University', shortName: 'KU', aliases: ['Kenyatta University Ruiru Campus'], studentPortalUrl: 'https://portal.ku.ac.ke/' },
  { name: 'Jomo Kenyatta University of Agriculture and Technology', shortName: 'JKUAT', studentPortalUrl: 'https://portal.jkuat.ac.ke/' },
  { name: 'Egerton University', shortName: 'Egerton', studentPortalUrl: 'https://studentportal.egerton.ac.ke/' },
  { name: 'Moi University', shortName: 'Moi', studentPortalUrl: 'https://portal.mu.ac.ke/' },
  { name: 'Maseno University', shortName: 'Maseno', studentPortalUrl: 'https://student.maseno.ac.ke/' },
  { name: 'Masinde Muliro University of Science and Technology', shortName: 'MMUST', studentPortalUrl: 'https://portal.mmust.ac.ke/' },
  { name: 'Technical University of Kenya', shortName: 'TUK', studentPortalUrl: 'https://portal.tukenya.ac.ke/' },
  { name: 'Technical University of Mombasa', shortName: 'TUM', officialWebsiteUrl: 'https://www.tum.ac.ke/' },
  { name: 'Dedan Kimathi University of Technology', shortName: 'DeKUT', studentPortalUrl: 'https://portal.dkut.ac.ke/' },
  { name: 'University of Eldoret', shortName: 'UoE', officialWebsiteUrl: 'https://uoeld.ac.ke/main-navigation/home' },
  { name: 'Kisii University', shortName: 'Kisii', officialWebsiteUrl: 'https://digital.kisiiuniversity.ac.ke/' },
  { name: 'Chuka University', shortName: 'Chuka', officialWebsiteUrl: 'https://www.chuka.ac.ke/current-students/' },
  { name: 'Pwani University', shortName: 'Pwani', studentPortalUrl: 'https://student.pu.ac.ke/Account/Login' },
  { name: 'South Eastern Kenya University', shortName: 'SEKU', studentPortalUrl: 'https://www.portal.seku.ac.ke/' },
  { name: 'Meru University of Science and Technology', shortName: 'MUST', studentPortalUrl: 'https://student.must.ac.ke/' },
  { name: 'University of Embu', shortName: 'Embu', studentPortalUrl: 'https://students.embuni.ac.ke/' },
  { name: 'Rongo University', shortName: 'Rongo', officialWebsiteUrl: 'https://www.rongovarsity.ac.ke/student-portal/' },
  { name: 'Jaramogi Oginga Odinga University of Science and Technology', shortName: 'JOOUST', officialWebsiteUrl: 'https://www.jooust.ac.ke/index.php/jooust-academics/student-life' },
  { name: 'Laikipia University', shortName: 'Laikipia', studentPortalUrl: 'https://portal.laikipia.ac.ke/' },
  { name: 'Karatina University', shortName: 'Karatina', studentPortalUrl: 'https://students.karu.ac.ke/' },
  { name: 'Kibabii University', shortName: 'Kibabii', officialWebsiteUrl: 'https://kibu.ac.ke/' },
  { name: 'Taita Taveta University', shortName: 'TTU', studentPortalUrl: 'https://portal.ttu.ac.ke/' },
  { name: 'Maasai Mara University', shortName: 'Maasai Mara', aliases: ['Masaai Mara University', 'MMU'], officialWebsiteUrl: 'https://students.mmarau.ac.ke/' },
  { name: 'Kaimosi Friends University', shortName: 'KAFU', officialWebsiteUrl: 'https://kafu.ac.ke/student-services' },
  { name: 'Alupe University', shortName: 'Alupe', studentPortalUrl: 'https://portal.au.ac.ke/' },
  { name: 'Bomet University', shortName: 'Bomet', aliases: ['Bomet University College', 'BUC'], officialWebsiteUrl: 'https://bu.ac.ke/' },
  { name: 'Tharaka University', shortName: 'Tharaka', studentPortalUrl: 'https://students.tharaka.ac.ke/' },
  { name: 'Garissa University', shortName: 'Garissa', officialWebsiteUrl: 'https://gau.ac.ke/' },
  { name: "Murang'a University of Technology", shortName: "Murang'a", studentPortalUrl: 'https://portal.mut.ac.ke/' },
  { name: 'Koitaleel Samoei University College', shortName: 'Koitaleel' },
  { name: 'National Defence University-Kenya', shortName: 'NDU-K' },
  { name: 'Open University of Kenya', shortName: 'OUK' },
  { name: 'Co-operative University of Kenya', shortName: 'CUK', aliases: ['The Co-operative University of Kenya'], studentPortalUrl: 'https://studentportal.cuk.ac.ke/' },
  { name: 'University of Kabianga', shortName: 'Kabianga', studentPortalUrl: 'https://portal.kabianga.ac.ke/' },
  { name: 'United States International University-Africa', shortName: 'USIU-A', aliases: ['USIU', 'United States International University', 'USIU Africa'], studentPortalUrl: 'https://cx.usiu.ac.ke/ics' },
  { name: 'Strathmore University', shortName: 'Strathmore', studentPortalUrl: 'https://su-sso.strathmore.edu/student-pss/private/login' },
  { name: 'Daystar University', shortName: 'Daystar', studentPortalUrl: 'https://student.daystar.ac.ke/' },
  { name: 'Catholic University of Eastern Africa', shortName: 'CUEA', studentPortalUrl: 'https://studentportal.cuea.edu/Default' },
  { name: 'Mount Kenya University', shortName: 'MKU', studentPortalUrl: 'https://login.mku.ac.ke/' },
  { name: 'Kabarak University', shortName: 'Kabarak', studentPortalUrl: 'https://students.kabarak.ac.ke/' },
  { name: 'Africa Nazarene University', shortName: 'ANU', studentPortalUrl: 'https://records.anu.ac.ke/' },
  { name: 'University of Eastern Africa, Baraton', shortName: 'UEAB', studentPortalUrl: 'http://registration.ueab.ac.ke/' },
  { name: 'Riara University', shortName: 'Riara', studentPortalUrl: 'https://student.riarauniversity.ac.ke/' },
  { name: 'Zetech University', shortName: 'Zetech', studentPortalUrl: 'https://student.zetech.ac.ke/' },
  { name: 'KAG East University', shortName: 'KAG East' },
  { name: "St. Paul's University", shortName: "St. Paul's", studentPortalUrl: 'https://students.spu.ac.ke/' },
  { name: 'Pan Africa Christian University', shortName: 'PACU', officialWebsiteUrl: 'https://www.pacuniversity.ac.ke/campus-life/' },
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
  { name: 'Africa International University', shortName: 'AIU', studentPortalUrl: 'https://portal.aiu.ac.ke/' },
  { name: 'Kenya Highlands Evangelical University', shortName: 'KHEU', aliases: ['Kenya Highlands University'] },
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
