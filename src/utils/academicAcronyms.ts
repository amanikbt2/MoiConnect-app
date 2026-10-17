/**
 * Academic Abbreviations, Acronyms, Synonyms & Stemming Lexicon (100% Offline)
 * Sub-millisecond execution, zero network calls.
 */

export interface AcronymDefinition {
  acronym: string;
  expansion: string;
  unitCodes?: string[];
  aliases: string[];
}

// 1. Common Computer Science, Engineering, Business, Law & Sciences Acronyms
export const ACADEMIC_ACRONYMS: Record<string, string> = {
  // Computing & IT
  'os': 'Operating Systems',
  'dbms': 'Database Management Systems',
  'db': 'Database',
  'oop': 'Object Oriented Programming',
  'dsa': 'Data Structures and Algorithms',
  'ds': 'Data Structures',
  'ai': 'Artificial Intelligence',
  'ml': 'Machine Learning',
  'nlp': 'Natural Language Processing',
  'hci': 'Human Computer Interaction',
  'se': 'Software Engineering',
  'cn': 'Computer Networks',
  'networks': 'Computer Networks',
  'daa': 'Design and Analysis of Algorithms',
  'toc': 'Theory of Computation',
  'automata': 'Formal Language and Automata',
  'flat': 'Formal Language and Automata theory',
  'compiler': 'Compiler Construction',
  'compilers': 'Compiler Design',
  'web': 'Web Development',
  'cyber': 'Cyber Security',
  'crypto': 'Cryptography',

  // Mathematics & Statistics
  'calc': 'Calculus',
  'calculus 1': 'Calculus I',
  'calculus 2': 'Calculus II',
  'diff': 'Differential',
  'ode': 'Ordinary Differential Equations',
  'pde': 'Partial Differential Equations',
  'stats': 'Statistics',
  'prob': 'Probability',
  'discrete': 'Discrete Mathematics',
  'linear algebra': 'Linear Algebra',
  'la': 'Linear Algebra',

  // Engineering
  'thermo': 'Thermodynamics',
  'fluid': 'Fluid Mechanics',
  'circuits': 'Circuit Analysis',
  'electronics': 'Analogue and Digital Electronics',
  'cad': 'Computer Aided Design',
  'structures': 'Theory of Structures',
  'mechanics': 'Engineering Mechanics',

  // Business & Economics
  'mgmt': 'Management',
  'fa': 'Financial Accounting',
  'ca': 'Cost Accounting',
  'ma': 'Management Accounting',
  'micro': 'Microeconomics',
  'macro': 'Macroeconomics',
  'econ': 'Economics',
  'mktg': 'Marketing',
  'hr': 'Human Resource',
  'hrm': 'Human Resource Management',
  'scm': 'Supply Chain Management',
  'procurement': 'Procurement and Supply Chain',

  // Education
  'ed': 'Education',
  'psych': 'Educational Psychology',
  'cie': 'Curriculum Instruction',
  'ciem': 'Curriculum Instruction and Educational Media',
  'pedagogy': 'Curriculum and Instruction',
  'philosophy of ed': 'Philosophy of Education',

  // Language & Humanities
  'kisw': 'Kiswahili',
  'fasihi': 'Kiswahili Literature',
  'lit': 'Literature',
  'ling': 'Linguistics',
  'anthro': 'Anthropology',
  'soc': 'Sociology',
  'pol sci': 'Political Science',
  'crim': 'Criminology',

  // Schools & Faculties
  'ssas': 'School of Science and Aerospace Studies',
  'sass': 'School of Arts and Social Sciences',
  'sis': 'School of Information Sciences',
  'soe': 'School of Engineering',
  'sobe': 'School of Business & Economics',
  'som': 'School of Medicine',
  'son': 'School of Nursing Sciences',
  'sph': 'School of Public Health',
  'sod': 'School of Dentistry',
  'sol': 'School of Law'
};

// 2. Phonetic variations & common spelling mistakes
export const PHONETIC_SPELL_CORRECTIONS: Record<string, string> = {
  'calculas': 'calculus',
  'calclus': 'calculus',
  'differencial': 'differential',
  'pycology': 'psychology',
  'psycology': 'psychology',
  'pshychology': 'psychology',
  'programing': 'programming',
  'compting': 'computing',
  'computatinal': 'computational',
  'statistcs': 'statistics',
  'statisics': 'statistics',
  'probabilty': 'probability',
  'enviroment': 'environment',
  'curicullum': 'curriculum',
  'curriculm': 'curriculum',
  'enterpreneurship': 'entrepreneurship',
  'antropology': 'anthropology',
  'ecnomics': 'economics',
  'goverment': 'government',
  'comunication': 'communication',
  'electonic': 'electronic',
  'termodynamics': 'thermodynamics'
};

// 3. Fast Inverted Stemmer dictionary for academic search
export const STEM_DICTIONARY: Record<string, string> = {
  'computing': 'computer',
  'computational': 'computer',
  'computers': 'computer',
  'calculating': 'calculus',
  'mathematics': 'math',
  'mathematical': 'math',
  'maths': 'math',
  'programming': 'program',
  'programs': 'program',
  'management': 'manage',
  'managing': 'manage',
  'managerial': 'manage',
  'accounting': 'account',
  'accounts': 'account',
  'financial': 'finance',
  'finances': 'finance',
  'development': 'develop',
  'developing': 'develop',
  'developer': 'develop',
  'engineering': 'engineer',
  'engineers': 'engineer',
  'statistical': 'statistics',
  'statistic': 'statistics',
  'stats': 'statistics',
  'psychological': 'psychology',
  'sociological': 'sociology',
  'anthropological': 'anthropology',
  'economic': 'economics',
  'economical': 'economics'
};

/**
 * Fast normalize & stem a single token.
 */
export function stemToken(word: string): string {
  const clean = word.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (STEM_DICTIONARY[clean]) return STEM_DICTIONARY[clean];
  if (PHONETIC_SPELL_CORRECTIONS[clean]) return PHONETIC_SPELL_CORRECTIONS[clean];

  // Simple suffix stripping (fast and safe for English)
  if (clean.length > 5 && clean.endsWith('ing')) {
    return clean.slice(0, -3);
  }
  if (clean.length > 5 && clean.endsWith('tion')) {
    return clean.slice(0, -4);
  }
  if (clean.length > 4 && clean.endsWith('s') && !clean.endsWith('ss')) {
    return clean.slice(0, -1);
  }
  return clean;
}

/**
 * Expand acronyms and replace spelling errors in a query string.
 */
export function expandQueryAcronyms(query: string): { expandedText: string; addedKeywords: string[] } {
  const rawTokens = query.trim().split(/\s+/).filter(Boolean);
  const addedKeywords: string[] = [];
  const expandedTokens: string[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i].toLowerCase().replace(/[^a-z0-9]/g, '');
    const twoWord = i < rawTokens.length - 1
      ? `${rawTokens[i].toLowerCase()} ${rawTokens[i + 1].toLowerCase()}`.replace(/[^a-z0-9 ]/g, '')
      : null;

    if (twoWord && ACADEMIC_ACRONYMS[twoWord]) {
      const expansion = ACADEMIC_ACRONYMS[twoWord];
      expandedTokens.push(expansion);
      addedKeywords.push(...expansion.split(/\s+/));
      i++; // skip next token
      continue;
    }

    if (ACADEMIC_ACRONYMS[token]) {
      const expansion = ACADEMIC_ACRONYMS[token];
      expandedTokens.push(expansion);
      addedKeywords.push(...expansion.split(/\s+/));
      continue;
    }

    if (PHONETIC_SPELL_CORRECTIONS[token]) {
      const corrected = PHONETIC_SPELL_CORRECTIONS[token];
      expandedTokens.push(corrected);
      continue;
    }

    expandedTokens.push(rawTokens[i]);
  }

  return {
    expandedText: expandedTokens.join(' '),
    addedKeywords
  };
}
