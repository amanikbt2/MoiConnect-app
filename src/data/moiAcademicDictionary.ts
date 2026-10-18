/**
 * Moi University Master Academic Dictionary & Corpus (100% OFFLINE)
 * Statically compiled from the offline corpus: moi_academic_corpus.txt
 * Zero online API dependencies, instant sub-millisecond execution.
 * Total Units: 303
 */

export interface AcademicUnitEntry {
  code: string;
  name: string;
  department: string;
  school: string;
  aliases?: string[];
}

export interface AcademicSchoolEntry {
  name: string;
  code: string;
  aliases: string[];
}

export interface AcademicDepartmentEntry {
  name: string;
  school: string;
  aliases: string[];
}

// 1. Comprehensive Moi University Schools
export const MOI_ACADEMIC_SCHOOLS: AcademicSchoolEntry[] = [
  {
    "name": "School of Science and Aerospace Studies",
    "code": "SSAS",
    "aliases": [
      "science and aerospace",
      "science",
      "aerospace",
      "ssas",
      "aviation",
      "pure sciences"
    ]
  },
  {
    "name": "School of Information Sciences",
    "code": "SIS",
    "aliases": [
      "information sciences",
      "sis",
      "it",
      "informatics",
      "information science",
      "media"
    ]
  },
  {
    "name": "School of Law",
    "code": "SOL",
    "aliases": [
      "law",
      "sol",
      "annex",
      "legal studies",
      "school of law"
    ]
  },
  {
    "name": "School of Medicine",
    "code": "SOM",
    "aliases": [
      "medicine",
      "som",
      "mbchb",
      "med school",
      "school of medicine",
      "medical"
    ]
  },
  {
    "name": "School of Engineering",
    "code": "SOE",
    "aliases": [
      "engineering",
      "soe",
      "eng",
      "civil",
      "mechanical",
      "electrical"
    ]
  },
  {
    "name": "School of Business & Economics",
    "code": "SOBE",
    "aliases": [
      "business",
      "economics",
      "sobe",
      "commerce",
      "finance",
      "accounting"
    ]
  },
  {
    "name": "School of Education",
    "code": "SOE_ED",
    "aliases": [
      "education",
      "teaching",
      "school of education",
      "pedagogy"
    ]
  },
  {
    "name": "School of Arts and Social Sciences",
    "code": "SASS",
    "aliases": [
      "sass",
      "arts",
      "social sciences",
      "humanities",
      "anthropology",
      "sociology"
    ]
  },
  {
    "name": "School of Public Health",
    "code": "SPH",
    "aliases": [
      "public health",
      "sph",
      "epidemiology"
    ]
  },
  {
    "name": "School of Nursing and Midwifery",
    "code": "SONM",
    "aliases": [
      "nursing",
      "son",
      "sonm",
      "nursing sciences",
      "nursing and midwifery",
      "nursing & midwifery",
      "midwifery",
      "school of nursing"
    ]
  },
  {
    "name": "School of Dentistry",
    "code": "SOD",
    "aliases": [
      "dentistry",
      "dental",
      "school of dental surgery"
    ]
  },
  {
    "name": "School of Agriculture and Natural Resources",
    "code": "SANR",
    "aliases": [
      "agriculture",
      "agricultural sciences",
      "agriculture and natural resources",
      "agriculture & natural resources",
      "natural resources",
      "agribusiness",
      "crop science",
      "animal science",
      "school of agriculture"
    ]
  },
  {
    "name": "School of Postgraduate Studies, Research and Innovation",
    "code": "SPGRI",
    "aliases": [
      "postgraduate studies",
      "post graduate studies",
      "graduate studies",
      "research and innovation",
      "research & innovation",
      "graduate school",
      "postgraduate school",
      "phd studies",
      "masters studies"
    ]
  },
  {
    "name": "School of Tourism, Hospitality and Events Management",
    "code": "STHEM",
    "aliases": [
      "tourism",
      "hospitality",
      "events management",
      "tourism hospitality and events management",
      "tourism, hospitality and events management",
      "hotel management",
      "travel and tourism",
      "school of tourism"
    ]
  }
];

// 2. Comprehensive Moi University Departments (127 Departments)
export const MOI_ACADEMIC_DEPARTMENTS: AcademicDepartmentEntry[] = [
  {
    "name": "Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "arts and social sciences"
    ]
  },
  {
    "name": "Chemical & Process / Mechanical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "chemical & process / mechanical engineering"
    ]
  },
  {
    "name": "Chemistry & Biochemistry",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "chemistry & biochemistry"
    ]
  },
  {
    "name": "Chemistry and Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "chemistry and biochemistry"
    ]
  },
  {
    "name": "Civil and Structural Engineering",
    "school": "School of Engineering",
    "aliases": [
      "civil and structural engineering"
    ]
  },
  {
    "name": "Computer Science",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "computer science"
    ]
  },
  {
    "name": "Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "curriculum, instruction & educational media"
    ]
  },
  {
    "name": "Department of Accounting & Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "department of accounting & finance"
    ]
  },
  {
    "name": "Department of Accounting and Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "department of accounting and finance"
    ]
  },
  {
    "name": "Department of Anthropology and Human Ecology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of anthropology and human ecology"
    ]
  },
  {
    "name": "Department of Anthropology, Gender & Diversity Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of anthropology, gender & diversity studies"
    ]
  },
  {
    "name": "Department of Biological Sciences",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of biological sciences"
    ]
  },
  {
    "name": "Department of Business Administration",
    "school": "School of Business & Economics",
    "aliases": [
      "department of business administration"
    ]
  },
  {
    "name": "Department of Chemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of chemistry"
    ]
  },
  {
    "name": "Department of Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of chemistry & biochemistry"
    ]
  },
  {
    "name": "Department of Chemistry and Biochemistry",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "department of chemistry and biochemistry"
    ]
  },
  {
    "name": "Department of Civil & Structural Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of civil & structural engineering"
    ]
  },
  {
    "name": "Department of Communication Studies",
    "school": "School of Business & Economics",
    "aliases": [
      "department of communication studies"
    ]
  },
  {
    "name": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of computer science"
    ]
  },
  {
    "name": "Department of Curriculum Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "department of curriculum instruction & educational media"
    ]
  },
  {
    "name": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "department of curriculum instruction and educational media"
    ]
  },
  {
    "name": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "department of curriculum, instruction & educational media"
    ]
  },
  {
    "name": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "department of curriculum, instruction and educational media"
    ]
  },
  {
    "name": "Department of Economics",
    "school": "School of Business & Economics",
    "aliases": [
      "department of economics"
    ]
  },
  {
    "name": "Department of Educational Foundations",
    "school": "School of Education",
    "aliases": [
      "department of educational foundations"
    ]
  },
  {
    "name": "Department of Educational Management & Policy Studies",
    "school": "School of Education",
    "aliases": [
      "department of educational management & policy studies"
    ]
  },
  {
    "name": "Department of Educational Management and Policy Studies",
    "school": "School of Education",
    "aliases": [
      "department of educational management and policy studies"
    ]
  },
  {
    "name": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "department of educational psychology"
    ]
  },
  {
    "name": "Department of Electrical & Communication Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of electrical & communication engineering"
    ]
  },
  {
    "name": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of electrical & communications engineering"
    ]
  },
  {
    "name": "Department of Electrical and Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of electrical and communications engineering"
    ]
  },
  {
    "name": "Department of Electrical and Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of electrical and computer engineering"
    ]
  },
  {
    "name": "Department of Engineering Mathematics",
    "school": "School of Engineering",
    "aliases": [
      "department of engineering mathematics"
    ]
  },
  {
    "name": "Department of French",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of french"
    ]
  },
  {
    "name": "Department of Geography",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of geography"
    ]
  },
  {
    "name": "Department of Geography / School of Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of geography / school of arts and social sciences"
    ]
  },
  {
    "name": "Department of Geography and Environmental Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of geography and environmental studies"
    ]
  },
  {
    "name": "Department of History, Political Science & Public Admin",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of history, political science & public admin"
    ]
  },
  {
    "name": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of history, political science & public administration"
    ]
  },
  {
    "name": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of history, political science and public administration"
    ]
  },
  {
    "name": "Department of History, Political Science, Public Administration, Penology & Security Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of history, political science, public administration, penology & security studies"
    ]
  },
  {
    "name": "Department of Information Technology",
    "school": "School of Information Sciences",
    "aliases": [
      "department of information technology"
    ]
  },
  {
    "name": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of kiswahili and other african languages"
    ]
  },
  {
    "name": "Department of Library, Records & Information Management",
    "school": "School of Information Sciences",
    "aliases": [
      "department of library, records & information management"
    ]
  },
  {
    "name": "Department of Linguistics & Foreign Languages",
    "school": "School of Arts & Social Sciences (SASS)",
    "aliases": [
      "department of linguistics & foreign languages"
    ]
  },
  {
    "name": "Department of Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics and foreign languages"
    ]
  },
  {
    "name": "Department of Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, foreign languages and film studies"
    ]
  },
  {
    "name": "Department of Linguistics, Foreign Languages and Media Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, foreign languages and media studies"
    ]
  },
  {
    "name": "Department of Linguistics, Indigenous Languages and Media Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of linguistics, indigenous languages and media studies"
    ]
  },
  {
    "name": "Department of Linguistics, Languages & Literature",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, languages & literature"
    ]
  },
  {
    "name": "Department of Linguistics, Languages, Foreign Languages and French Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, languages, foreign languages and french studies"
    ]
  },
  {
    "name": "Department of Linguistics, Literature, Foreign Languages & French Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, literature, foreign languages & french studies"
    ]
  },
  {
    "name": "Department of Linguistics, Media & Communication",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, media & communication"
    ]
  },
  {
    "name": "Department of Linguistics, Media and Communication",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of linguistics, media and communication"
    ]
  },
  {
    "name": "Department of Literature, Languages and Folklore Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, languages and folklore studies"
    ]
  },
  {
    "name": "Department of Literature, Languages, Linguistics and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, languages, linguistics and film studies"
    ]
  },
  {
    "name": "Department of Literature, Linguistics & Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, linguistics & foreign languages"
    ]
  },
  {
    "name": "Department of Literature, Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of literature, linguistics and foreign languages"
    ]
  },
  {
    "name": "Department of Literature, Linguistics Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, linguistics foreign languages and film studies"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages & Film",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, linguistics, foreign languages & film"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of literature, linguistics, foreign languages & film studies"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, linguistics, foreign languages and film studies"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages, and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, linguistics, foreign languages, and film studies"
    ]
  },
  {
    "name": "Department of Literature, Theatre & Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, theatre & film studies"
    ]
  },
  {
    "name": "Department of Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of literature, theatre and film studies"
    ]
  },
  {
    "name": "Department of Literature, Theatre, Film and Media",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of literature, theatre, film and media"
    ]
  },
  {
    "name": "Department of Management Science",
    "school": "School of Business & Economics",
    "aliases": [
      "department of management science"
    ]
  },
  {
    "name": "Department of Marketing",
    "school": "School of Business & Economics",
    "aliases": [
      "department of marketing"
    ]
  },
  {
    "name": "Department of Mathematics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of mathematics"
    ]
  },
  {
    "name": "Department of Mathematics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of mathematics & computer science"
    ]
  },
  {
    "name": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of mathematics & physics"
    ]
  },
  {
    "name": "Department of Mathematics and Aerospace Studies",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "department of mathematics and aerospace studies"
    ]
  },
  {
    "name": "Department of Mathematics and Computer Science",
    "school": "School of Education",
    "aliases": [
      "department of mathematics and computer science"
    ]
  },
  {
    "name": "Department of Mathematics, Physics and Computing",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "department of mathematics, physics and computing"
    ]
  },
  {
    "name": "Department of Mathematics, Statistics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of mathematics, statistics and computing"
    ]
  },
  {
    "name": "Department of Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of mechanical & production engineering"
    ]
  },
  {
    "name": "Department of Mechanical and Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "department of mechanical and production engineering"
    ]
  },
  {
    "name": "Department of Media and Communication Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of media and communication studies"
    ]
  },
  {
    "name": "Department of Philosophy & Religious Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of philosophy & religious studies"
    ]
  },
  {
    "name": "Department of Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of philosophy and religious studies"
    ]
  },
  {
    "name": "Department of Philosophy, Religion & Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of philosophy, religion & theology"
    ]
  },
  {
    "name": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of philosophy, religion and theology"
    ]
  },
  {
    "name": "Department of Philosophy, Theology & Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of philosophy, theology & religious studies"
    ]
  },
  {
    "name": "Department of Philosophy, Theology and Religious Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of philosophy, theology and religious studies"
    ]
  },
  {
    "name": "Department of Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of physics"
    ]
  },
  {
    "name": "Department of Private Law",
    "school": "School of Law",
    "aliases": [
      "department of private law"
    ]
  },
  {
    "name": "Department of Psychology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of psychology"
    ]
  },
  {
    "name": "Department of Public Law",
    "school": "School of Law",
    "aliases": [
      "department of public law"
    ]
  },
  {
    "name": "Department of Publishing & Media Studies",
    "school": "School of Information Sciences",
    "aliases": [
      "department of publishing & media studies"
    ]
  },
  {
    "name": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of sociology and psychology"
    ]
  },
  {
    "name": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "department of sociology, psychology & anthropology"
    ]
  },
  {
    "name": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of sociology, psychology and anthropology"
    ]
  },
  {
    "name": "Department of Sociology, Psychology and Social Work",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "department of sociology, psychology and social work"
    ]
  },
  {
    "name": "Department of Statistics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "department of statistics & computer science"
    ]
  },
  {
    "name": "Department of Technology Education",
    "school": "School of Education",
    "aliases": [
      "department of technology education"
    ]
  },
  {
    "name": "Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "educational psychology"
    ]
  },
  {
    "name": "Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical & communications engineering"
    ]
  },
  {
    "name": "Electrical & Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical & computer engineering"
    ]
  },
  {
    "name": "Electrical & Electronics Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical & electronics engineering"
    ]
  },
  {
    "name": "Electrical and Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical and computer engineering"
    ]
  },
  {
    "name": "Electrical and Electronics Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical and electronics engineering"
    ]
  },
  {
    "name": "Electrical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical engineering"
    ]
  },
  {
    "name": "Geography",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "geography"
    ]
  },
  {
    "name": "History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "history, political science & public administration"
    ]
  },
  {
    "name": "Kiswahili & Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "kiswahili & other african languages"
    ]
  },
  {
    "name": "Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "kiswahili and other african languages"
    ]
  },
  {
    "name": "Kiswahili na Lugha za Kiafrika",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "kiswahili na lugha za kiafrika"
    ]
  },
  {
    "name": "Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "linguistics and foreign languages"
    ]
  },
  {
    "name": "Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "literature, theatre and film studies"
    ]
  },
  {
    "name": "Manufacturing, Industrial & Textile Engineering",
    "school": "School of Engineering",
    "aliases": [
      "manufacturing, industrial & textile engineering"
    ]
  },
  {
    "name": "Mathematics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics & computer science"
    ]
  },
  {
    "name": "Mathematics & Physics",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "mathematics & physics"
    ]
  },
  {
    "name": "Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics, physics and computing"
    ]
  },
  {
    "name": "Mathematics, Physics and Computing Department",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics, physics and computing department"
    ]
  },
  {
    "name": "Mathematics, Statistics & Actuarial Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics, statistics & actuarial science"
    ]
  },
  {
    "name": "Maths & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "maths & physics"
    ]
  },
  {
    "name": "Maths, Physics & Computing",
    "school": "School of Engineering",
    "aliases": [
      "maths, physics & computing"
    ]
  },
  {
    "name": "Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "mechanical & production engineering"
    ]
  },
  {
    "name": "Mechanical and Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "mechanical and production engineering"
    ]
  },
  {
    "name": "Mechanical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "mechanical engineering"
    ]
  },
  {
    "name": "Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "philosophy and religious studies"
    ]
  },
  {
    "name": "Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "philosophy, religion and theology"
    ]
  },
  {
    "name": "Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "physics"
    ]
  },
  {
    "name": "School of Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "school of arts and social sciences"
    ]
  },
  {
    "name": "School of Arts and Social Sciences (Common Course)",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "school of arts and social sciences (common course)"
    ]
  },
  {
    "name": "Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "sociology and psychology"
    ]
  },
  {
    "name": "Statistics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "statistics & computer science"
    ]
  }
];

// 3. Static Offline Moi University Academic Units (303 Units)
export const MOI_ACADEMIC_UNITS: AcademicUnitEntry[] = [
  {
    "code": "ANT 311",
    "name": "Political and Legal Anthropology",
    "department": "Department of Anthropology and Human Ecology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ANT 311 Political Legal Anthropology Exam"
    ]
  },
  {
    "code": "ANT 312",
    "name": "Economic Anthropology",
    "department": "Department of Anthropology and Human Ecology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ANT 312 Economic Anthropology Exam"
    ]
  },
  {
    "code": "ANT 313",
    "name": "Human Evolution",
    "department": "Department of Anthropology and Human Ecology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ANT 313 Human Evolution Exam"
    ]
  },
  {
    "code": "ANT 321",
    "name": "Quantitative and Qualitative Methods and Analysis",
    "department": "Department of Anthropology, Gender & Diversity Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Quantitative and Qualitative Methods and Analysis"
    ]
  },
  {
    "code": "ANT 325",
    "name": "Human Ecology",
    "department": "Department of Anthropology, Gender & Diversity Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "ANT 325 Human Ecology Second Semester Examination 2015"
    ]
  },
  {
    "code": "BAS 103",
    "name": "Introduction to Philosophy and Religion",
    "department": "Department of Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BAS 103 Intro Philosophy Religion Exam"
    ]
  },
  {
    "code": "BAS 201",
    "name": "Kenya in World History",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BAS 201 Kenya in World History Exam"
    ]
  },
  {
    "code": "BAS 301",
    "name": "Religion and Science",
    "department": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "BAS 301 Religion and Science University Examination"
    ]
  },
  {
    "code": "BAS 303",
    "name": "Contemporary Political Ideologies",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BAS 303: Contemporary Political Ideologies University Examination"
    ]
  },
  {
    "code": "BBM 101",
    "name": "Principles of Management",
    "department": "Department of Business Administration",
    "school": "School of Business & Economics",
    "aliases": [
      "management principles"
    ]
  },
  {
    "code": "BBM 102",
    "name": "Introduction to Business Studies",
    "department": "Department of Business Administration",
    "school": "School of Business & Economics",
    "aliases": [
      "business studies"
    ]
  },
  {
    "code": "BBM 122",
    "name": "Principles of Accounting II",
    "department": "Department of Accounting & Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "BBM 122 Principles of Accounting II Special Supplementary Examination March 2024"
    ]
  },
  {
    "code": "BBM 201",
    "name": "Financial Accounting I",
    "department": "Department of Accounting and Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "financial accounting",
      "accounting 1"
    ]
  },
  {
    "code": "BBM 202",
    "name": "Principles of Marketing",
    "department": "Department of Marketing",
    "school": "School of Business & Economics",
    "aliases": [
      "marketing principles"
    ]
  },
  {
    "code": "BBM 213",
    "name": "Financial Accounting I",
    "department": "Department of Accounting and Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "BBM 213: Financial Accounting I — Special and Supplementary Examinations"
    ]
  },
  {
    "code": "BBM 360",
    "name": "Organizational Theory and Behaviour",
    "department": "Department of Management Science",
    "school": "School of Business & Economics",
    "aliases": [
      "BBM 360 Organizational Theory and Behaviour Continuous Assessment Test April 2024"
    ]
  },
  {
    "code": "BKS 110",
    "name": "Introduction to Language and Linguistics in Kiswahili",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 110 Introduction to Language and Linguistics in Kiswahili First Year First Semester Examination 2019/2020"
    ]
  },
  {
    "code": "BKS 111",
    "name": "Introduction to Kiswahili Literature (Utangulizi wa Fasihi)",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 111: Introduction to Kiswahili Literature - University Examination December 2019"
    ]
  },
  {
    "code": "BKS 120",
    "name": "Kiswahili History and Current Issues",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 120: Kiswahili History and Contemporary Issues - Regular University Examination"
    ]
  },
  {
    "code": "BKS 121",
    "name": "Kiswahili Language and Culture",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences"
  },
  {
    "code": "BKS 210",
    "name": "Theory and Practice of Translation and Interpretation I",
    "department": "Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 210 Theory and Practice of Translation and Interpretation I Bachelor of Arts Examination",
      "Theory & Practice of Translation and Interpretation"
    ]
  },
  {
    "code": "BKS 211",
    "name": "Phonetics and Phonology in Kiswahili",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 211: Phonetics and Phonology in Kiswahili - Regular Examination"
    ]
  },
  {
    "code": "BKS 220",
    "name": "Oral Literature in Kiswahili",
    "department": "Kiswahili & Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 220 Oral Literature in Kiswahili Second Year Examination August 2016",
      "BKS 220: Oral Literature in Kiswahili - Second Year Second Semester Regular Examination (2020/2021)"
    ]
  },
  {
    "code": "BKS 221",
    "name": "Kiswahili Morphology (Mofolojia ya Kiswahili)",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 221: Kiswahili Morphology - University Examination",
      "BKS 221 Kiswahili Morphology Special Supplementary Examination June 2021"
    ]
  },
  {
    "code": "BKS 310",
    "name": "Prose Works in Kiswahili",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Prose Works in Kiswahili",
      "BKS 310 Prose Works in Kiswahili Examination"
    ]
  },
  {
    "code": "BKS 320",
    "name": "Kiswahili Modern Poetry",
    "department": "Kiswahili & Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BKS 320 Kiswahili Modern Poetry Third Year Regular Examination"
    ]
  },
  {
    "code": "BLL 111",
    "name": "Introduction to French",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 111: Introduction to French - Special & Supplementary Examination"
    ]
  },
  {
    "code": "BLL 112",
    "name": "Beginners' German",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 112 Beginners' German Regular University Examination"
    ]
  },
  {
    "code": "BLL 120",
    "name": "The Art of Speaking",
    "department": "Department of Linguistics, Media & Communication",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 120 The Art of Speaking University Examination"
    ]
  },
  {
    "code": "BLL 211",
    "name": "Intermediate French",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences"
  },
  {
    "code": "BLL 221",
    "name": "Proficiency Course in French",
    "department": "Department of French",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 221 Proficiency Course French Exam",
      "BLL 221: Proficiency Course in French - Special / Supplementary Examination (October 2023)"
    ]
  },
  {
    "code": "BLL 310",
    "name": "Business English",
    "department": "Department of Literature, Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "BLL 310 Business English Degree Examination"
    ]
  },
  {
    "code": "BLL 311",
    "name": "French Language Skills for the Media",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 311 French Language Skills Media Exam Feb 2025"
    ]
  },
  {
    "code": "BLL 321",
    "name": "Research Methods",
    "department": "Department of Linguistics, Indigenous Languages and Media Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Research Methods"
    ]
  },
  {
    "code": "BLL 410",
    "name": "Intermediate French for Journalism",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 410: Intermediate French for Journalism - Regular University Examination (2021/2022)"
    ]
  },
  {
    "code": "BOT 112",
    "name": "Cell Biology",
    "department": "Department of Biological Sciences",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "BOT 112: Cell Biology First Year Second Semester Examination - December 2022"
    ]
  },
  {
    "code": "CHE 103",
    "name": "Introduction to Kinetics and Thermodynamics",
    "department": "Chemistry & Biochemistry",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Kinetics and Thermodynamics Exam May 2022"
    ]
  },
  {
    "code": "CHE 104",
    "name": "Organic Chemistry I",
    "department": "Department of Chemistry and Biochemistry",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "CHE 104 Organic Chemistry I Exam April 2022"
    ]
  },
  {
    "code": "CHE 110",
    "name": "Fundamentals of Chemistry",
    "department": "Department of Chemistry and Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 110: Fundamentals of Chemistry First Year First Semester Examination - December 2022"
    ]
  },
  {
    "code": "CHE 111",
    "name": "General Chemistry I",
    "department": "Department of Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "general chemistry",
      "chemistry 1"
    ]
  },
  {
    "code": "CHE 112",
    "name": "Introduction to Analytical Chemistry",
    "department": "Chemistry and Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 112 Introduction to Analytical Chemistry Bachelor of Education Science Examination"
    ]
  },
  {
    "code": "CHE 121",
    "name": "Organic Chemistry I",
    "department": "Department of Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "organic chemistry"
    ]
  },
  {
    "code": "CHE 201",
    "name": "Chemical Analysis and Structural Determination",
    "department": "Chemistry & Biochemistry",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Chemical Analysis Exam August 2022"
    ]
  },
  {
    "code": "CHE 310",
    "name": "Chemistry of the s- and p-Block Elements",
    "department": "Department of Chemistry and Biochemistry",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "CHE 310 Chemistry of the s and p Block Elements Exam Dec 2023"
    ]
  },
  {
    "code": "CHE 316",
    "name": "Analytical Techniques in Structural Determination I",
    "department": "Department of Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 316: Analytical Techniques in Structural Determination I — University Examination",
      "CHE 316 Industrial Chemistry I CAT 1 March 2021"
    ]
  },
  {
    "code": "CHE 317",
    "name": "Electrochemistry",
    "department": "Department of Chemistry and Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 317: Electrochemistry — Continuous Assessment Test 1 (CAT 1)",
      "CHE 317 Electrochemistry Third Year Second Semester Examination August 2022",
      "CHE 317 Electrochemistry Third Year Second Semester Main Examination May 2021"
    ]
  },
  {
    "code": "CHE 318",
    "name": "Coordination Chemistry",
    "department": "Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 318 Coordination Chemistry Third Year Second Semester Regular Examination December 2022",
      "CHE 318: Organometallic Chemistry — Third Year Second Semester Main Examination — December 2014",
      "Co-ordination Chemistry",
      "CHE 318: Organometallic Chemistry — University Examination"
    ]
  },
  {
    "code": "CHE 319",
    "name": "Stereochemistry and Conformational Analysis",
    "department": "Chemistry and Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 319 Stereochemistry and Conformational Analysis Continuous Assessment Tests (CAT 1 & CAT 2)"
    ]
  },
  {
    "code": "CHE 320",
    "name": "Industrial Chemistry I",
    "department": "Department of Chemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "CHE 320 Industrial Chemistry I Third Year Second Semester Examination May 2021"
    ]
  },
  {
    "code": "CIM 110",
    "name": "Communication Skills",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "Communication Skills in Education",
      "CIM 110 Communication Skills in Education First Year First Semester Examination December 2022"
    ]
  },
  {
    "code": "CIM 210",
    "name": "General Methods of Teaching",
    "department": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "CIM 210 General Methods of Teaching Second Year First Semester Examination 2022/2023"
    ]
  },
  {
    "code": "CIM 211",
    "name": "Educational Media and Resources",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education"
  },
  {
    "code": "CIM 223",
    "name": "Physics Methods",
    "department": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "CIM 223 Physics Methods Exam Dec 2022"
    ]
  },
  {
    "code": "CIM 312",
    "name": "History Education",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "History Education",
      "CIM 312 History Education School Based Examination"
    ]
  },
  {
    "code": "CIM 322",
    "name": "Chemistry Education",
    "department": "Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "CIM 322 Chemistry Education Bachelor of Education Examination August 2014",
      "CIM 322 Special Methods in Chemistry Education Comprehensive Examination Pack (2020 - 2023)"
    ]
  },
  {
    "code": "CIM 323",
    "name": "Special Methods in Physics II",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "CIM 323 Special Methods in Physics II Exam Dec 2023"
    ]
  },
  {
    "code": "CMD 310",
    "name": "Leadership and Management of Community Projects",
    "department": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Leadership and Management of Community Projects"
    ]
  },
  {
    "code": "CMD 312",
    "name": "Human Service Organizations",
    "department": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "CMD 312: Human Service Organizations Special / Supplementary Examination",
      "CMD 312 Human Service Organizations Third Year First Semester Examination 2013/2014"
    ]
  },
  {
    "code": "COE 121",
    "name": "Introduction to Computers and Application",
    "department": "Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "COE 121 Introduction to Computers and Application First Year First Semester Examination January 2015",
      "COE 121 Introduction to Computers and Application Supplementary Special Examination September 2015",
      "COE 121 Introduction to Computers and Application Supplementary Examination September 2015"
    ]
  },
  {
    "code": "COE 162",
    "name": "Introduction to Computer Programming",
    "department": "Department of Electrical and Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "COE 162: Introduction to Computer Programming — First Year Supplementary/Special Examination — September 2015"
    ]
  },
  {
    "code": "COE 251",
    "name": "Operating Systems",
    "department": "Electrical & Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "COE 251 Operating Systems Supplementary Special Examination September 2015",
      "Computer Operating Systems"
    ]
  },
  {
    "code": "COE 361",
    "name": "Object Oriented Programming",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "COE 361: Object Oriented Programming — University Examination"
    ]
  },
  {
    "code": "COM 110",
    "name": "Introduction to Computers and Computing",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "intro to computers",
      "computer fundamentals"
    ]
  },
  {
    "code": "COM 111",
    "name": "Communication Skills",
    "department": "Department of Publishing & Media Studies",
    "school": "School of Information Sciences",
    "aliases": [
      "comm skills",
      "communication"
    ]
  },
  {
    "code": "COM 210",
    "name": "Object-Oriented Analysis and Design",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "ooad",
      "system analysis"
    ]
  },
  {
    "code": "CSC 111",
    "name": "Introduction to Computer Science",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "intro to cs",
      "cs101",
      "computing"
    ]
  },
  {
    "code": "CSC 112",
    "name": "Introduction to Programming",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "intro to programming",
      "c programming",
      "structured programming"
    ]
  },
  {
    "code": "CSC 121",
    "name": "Object-Oriented Programming I",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "oop 1",
      "java programming",
      "c++ programming"
    ]
  },
  {
    "code": "CSC 122",
    "name": "Discrete Mathematics",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "discrete structures",
      "discrete math"
    ]
  },
  {
    "code": "CSC 211",
    "name": "Data Structures and Algorithms",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "dsa",
      "data structures",
      "algorithms",
      "Object Oriented Programming Core Principles & Java Architecture",
      "Object Oriented Programming overview",
      "Object Oriented Programming Exam March 2025 Sem1"
    ]
  },
  {
    "code": "CSC 212",
    "name": "Computer Architecture and Organization",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "computer architecture",
      "computer org"
    ]
  },
  {
    "code": "CSC 213",
    "name": "Object Oriented Programming II",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "advanced oop",
      "oop 2",
      "Operating System Introduction",
      "Operating Systems Lecture 1",
      "Operating Systems Lecture 2"
    ]
  },
  {
    "code": "CSC 214",
    "name": "Formal Language and Automata Theory",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "automata",
      "flat",
      "formal languages",
      "turing machines",
      "Formal Language and Automata theory Course Overview",
      "Formal Language and Automata theory Lecture1",
      "Formal Language and Automata theory Lecture 2",
      "Formal Language and Automata theory Lecture3"
    ]
  },
  {
    "code": "CSC 215",
    "name": "System Programming",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "systems programming",
      "linux programming",
      "c unix",
      "System Programming - File Attributes, Permissions & Shell Programming"
    ]
  },
  {
    "code": "CSC 221",
    "name": "Operating Systems",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "os",
      "operating system"
    ]
  },
  {
    "code": "CSC 222",
    "name": "Database Management Systems",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "dbms",
      "databases",
      "sql"
    ]
  },
  {
    "code": "CSC 311",
    "name": "Software Engineering",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "se",
      "software dev"
    ]
  },
  {
    "code": "CSC 312",
    "name": "Design and Analysis of Algorithms",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "daa",
      "advanced algorithms"
    ]
  },
  {
    "code": "CSC 313",
    "name": "Assembly Language Programming",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "assembly",
      "low level programming"
    ]
  },
  {
    "code": "CSC 321",
    "name": "Computer Networks",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "networks",
      "networking",
      "telecom"
    ]
  },
  {
    "code": "CSC 322",
    "name": "Web Development and Technologies",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "web dev",
      "internet tech"
    ]
  },
  {
    "code": "CSC 323",
    "name": "Artificial Intelligence",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "ai",
      "machine learning",
      "expert systems"
    ]
  },
  {
    "code": "CSC 411",
    "name": "Compiler Construction",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "compilers",
      "automata and compilers"
    ]
  },
  {
    "code": "CSC 412",
    "name": "Computer Graphics and Multimedia",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "graphics",
      "multimedia"
    ]
  },
  {
    "code": "CSC 421",
    "name": "Distributed Systems",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "distributed computing",
      "cloud"
    ]
  },
  {
    "code": "CSC 422",
    "name": "Information and Network Security",
    "department": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "cybersecurity",
      "cryptography"
    ]
  },
  {
    "code": "CVS 315",
    "name": "Introduction to the Finite Element Method",
    "department": "Civil and Structural Engineering",
    "school": "School of Engineering",
    "aliases": [
      "CVS 315 Introduction to the Finite Element Method Degree Examination"
    ]
  },
  {
    "code": "CVS 345",
    "name": "Flow in Non-Erodible Open Channels",
    "department": "Civil and Structural Engineering",
    "school": "School of Engineering",
    "aliases": [
      "CVS 345 Flow in Non-Erodible Open Channels Degree Examination"
    ]
  },
  {
    "code": "CVS 355",
    "name": "Traffic Engineering",
    "department": "Department of Civil & Structural Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "CVS 467",
    "name": "Building Physics and Services",
    "department": "Department of Civil & Structural Engineering",
    "school": "School of Engineering",
    "aliases": [
      "CVS 467: Building Physics & Services — Continuous Assessment Test 1 Model Answer"
    ]
  },
  {
    "code": "DSS 102",
    "name": "Introduction to Anthropology",
    "department": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences"
  },
  {
    "code": "ECE 112",
    "name": "Circuit Theory I",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "ECE 152",
    "name": "Electrical Engineering Materials",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "ECE 211",
    "name": "Circuit Theory II",
    "department": "Computer Science",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Circuit Theory II Course overview",
      "ECE 211 Circuit Theory II Second Year Supplementary Special Examination September 2015"
    ]
  },
  {
    "code": "ECE 231",
    "name": "Electrical Measurements",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "ECE 252",
    "name": "Analogue Electronics I",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 252: Analogue Electronics I — Second Year First Semester Examination — April 2022",
      "ECE 252 Analogue Electronics I Second Year Second Semester Examination September 2022"
    ]
  },
  {
    "code": "ECE 261",
    "name": "Basic electrical machines",
    "department": "Electrical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "Basic Electrical Machines Exam"
    ]
  },
  {
    "code": "ECE 272",
    "name": "Basic Electrical Power",
    "department": "Electrical and Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 272 Basic Electrical Power Supplementary Examination 2012 2013",
      "ECE 272 Basic Electrical Power Second Year Second Semester Regular Examination April 2022"
    ]
  },
  {
    "code": "ECE 281",
    "name": "Basic Electronics",
    "department": "Electrical and Electronics Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 281 Basic Electronics Second Year Examination",
      "ECE 281: Basic Electronics — Second Year First Semester Examination — November 2021"
    ]
  },
  {
    "code": "ECE 301",
    "name": "Basic Electronics",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "ECE 322",
    "name": "Introduction to Telecommunication Engineering",
    "department": "Department of Electrical & Communication Engineering",
    "school": "School of Engineering",
    "aliases": [
      "intro to telcom eng",
      "telecommunications",
      "telecom eng",
      "intro to telecom engineering",
      "telecommunication engineering",
      "ECE 322 Introduction to Telecommunication Engineering Degree Examination"
    ]
  },
  {
    "code": "ECE 342",
    "name": "Transmission Lines",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 342 Transmission Lines Third Year Second Semester Examination May 2022"
    ]
  },
  {
    "code": "ECE 351",
    "name": "Control Systems I",
    "department": "Electrical and Computer Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 351 Control Systems I CAT Collection 2011 2012 2014"
    ]
  },
  {
    "code": "ECE 382",
    "name": "Microprocessors and Assembly Language",
    "department": "Department of Electrical & Communications Engineering",
    "school": "School of Engineering",
    "aliases": [
      "ECE 382: Microprocessors and Assembly Language — University Examination",
      "ECE 382: Microprocessors and Assembly Language — Third Year First Semester Examination — November 2022",
      "ECE 382 Microprocessors and Assembly Language Third Year Second Semester Examination May 2023"
    ]
  },
  {
    "code": "ECO 110",
    "name": "Introduction to Microeconomics",
    "department": "Department of Economics",
    "school": "School of Business & Economics",
    "aliases": [
      "microeconomics",
      "intro micro"
    ]
  },
  {
    "code": "ECO 111",
    "name": "Introduction to Macroeconomics",
    "department": "Department of Economics",
    "school": "School of Business & Economics",
    "aliases": [
      "macroeconomics",
      "intro macro"
    ]
  },
  {
    "code": "EDB 200",
    "name": "Business Statistics",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 200 Business Statistics Second Year First Semester Examination January 2022"
    ]
  },
  {
    "code": "EDB 201",
    "name": "Principles of Marketing",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 201: Principles of Marketing - Second Year Regular Examination (January 2022)"
    ]
  },
  {
    "code": "EDB 212",
    "name": "Principles of Management",
    "department": "Department of Educational Management & Policy Studies",
    "school": "School of Education",
    "aliases": [
      "EDB 212 Principles of Management Second Year First Semester Regular Examination",
      "Principles and Practices of Management"
    ]
  },
  {
    "code": "EDB 213",
    "name": "Business Studies Methods I",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 213 Business Studies Methods I Second Year First Semester Regular Examination",
      "EDB 213: Business Studies Methods I - Regular University Examination"
    ]
  },
  {
    "code": "EDB 300",
    "name": "Business Finance I",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 300: Business Finance I - University Examination Past Paper"
    ]
  },
  {
    "code": "EDB 301",
    "name": "Money and Banking Theory",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 301: Money and Banking Theory - University Examination Past Paper"
    ]
  },
  {
    "code": "EDB 302E",
    "name": "Company Accounts",
    "department": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "Company Accounts"
    ]
  },
  {
    "code": "EDB 312",
    "name": "History of Economic Thought",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education"
  },
  {
    "code": "EDB 313E",
    "name": "Business Finance II",
    "department": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 313E: Business Finance II - Examination"
    ]
  },
  {
    "code": "EDB 400",
    "name": "Financial Management",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education"
  },
  {
    "code": "EDB 413E",
    "name": "Principles of Auditing",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDB 413E: Principles of Auditing - University Examination Past Paper"
    ]
  },
  {
    "code": "EDE 111",
    "name": "Introduction to Education",
    "department": "Department of Curriculum Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "intro to education"
    ]
  },
  {
    "code": "EDE 211",
    "name": "Educational Media and Technology",
    "department": "Department of Curriculum Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "ed tech",
      "educational media",
      "audio visual"
    ]
  },
  {
    "code": "EDE 214",
    "name": "English Language Education I",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDE 214 English Language Education I Special Supplementary Examination"
    ]
  },
  {
    "code": "EDE 314",
    "name": "English Language Education II",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "English Language Education II"
    ]
  },
  {
    "code": "EDF 111",
    "name": "History of Education",
    "department": "Department of Educational Foundations",
    "school": "School of Education",
    "aliases": [
      "history of ed",
      "Philosophy of Education",
      "EDF 111: Philosophy of Education - Regular University Examination (2021/2022)",
      "EDF 111: Philosophy of Education First Year Second Semester Examination - March 2024"
    ]
  },
  {
    "code": "EDF 211",
    "name": "Philosophy of Education",
    "department": "Department of Educational Foundations",
    "school": "School of Education",
    "aliases": [
      "philosophy of ed",
      "EDF 211: History of Education University Examination"
    ]
  },
  {
    "code": "EDK 216",
    "name": "Mbinu za Kufundisha Kiswahili na Fasihi I",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "Mbinu za Kufundishia Lugha na Fasihi I",
      "Mbinu za Kufundisha Kiswahili I"
    ]
  },
  {
    "code": "EDK 306",
    "name": "Literary Texts Translated into Kiswahili",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDK 306: Literary Texts Translated into Kiswahili - Regular University Examination (2013/2014)"
    ]
  },
  {
    "code": "EDL 315",
    "name": "Literature Education II",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDL 315: Literature Education II - University Examination Past Paper"
    ]
  },
  {
    "code": "EDM 211",
    "name": "Mathematics Education I",
    "department": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDM 211 Mathematics Education I Special Supplementary Examination"
    ]
  },
  {
    "code": "EDR 318",
    "name": "Religious Education II",
    "department": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "EDR 318: Religious Education II - Examination",
      "EDR 318 Religious Education II Bachelor of Education School-Based Examination"
    ]
  },
  {
    "code": "EGC 111",
    "name": "Theories, Techniques & Principles of Counseling",
    "department": "Department of Educational Psychology",
    "school": "School of Education"
  },
  {
    "code": "EGC 201",
    "name": "Counselling People with Special Needs",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "EGC 201 Counselling People with Special Needs Second Year First Semester Examination August 2022"
    ]
  },
  {
    "code": "EGC 211",
    "name": "Children and Adolescent Counselling",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "EGC 211: Children and Adolescent Counselling - Special / Supplementary Examination (2023/2024)"
    ]
  },
  {
    "code": "EMP 310",
    "name": "Educational Planning",
    "department": "Department of Educational Management and Policy Studies",
    "school": "School of Education",
    "aliases": [
      "EMP 310: Educational Planning - Examination"
    ]
  },
  {
    "code": "ENG 210",
    "name": "English Phonetics",
    "department": "Department of Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ENG 210: English Phonetics University Examination",
      "ENG 210: English Phonetics Regular University Examination",
      "ENG 210: English Phonetics Special / Supplementary Examination",
      "ENG 210: English Phonetics - Special / Supplementary Examination (2023/2024)"
    ]
  },
  {
    "code": "ENG 220",
    "name": "Development of English as a Native Language",
    "department": "Department of Linguistics, Languages & Literature",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ENG 220 Development of English as a Native Language Special Supplementary Examination"
    ]
  },
  {
    "code": "ENG 322",
    "name": "Development of English as a Second Language",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "ENG 322: Development of English as a Second Language"
    ]
  },
  {
    "code": "ENG 323",
    "name": "English for Diplomacy and Public Relations",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "English for Diplomacy and Public Relations"
    ]
  },
  {
    "code": "ENG 410",
    "name": "Advance in the Description of English Grammar",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Advance in the Description of English Grammar"
    ]
  },
  {
    "code": "ENG 411",
    "name": "Practical English Stylistics",
    "department": "Department of Literature, Linguistics, Foreign Languages, and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "ENG 411 Practical English Stylistics University Examination 2022/2023"
    ]
  },
  {
    "code": "FMS 110",
    "name": "History of Film upto 1975",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "FMS 110: History of Film upto 1975 Continuous Assessment Test (CAT)"
    ]
  },
  {
    "code": "FMS 321",
    "name": "Film Editing",
    "department": "Department of Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "FMS 321 Film Editing Degree Examination April 2017"
    ]
  },
  {
    "code": "FRE 121",
    "name": "Skills in Written Expression",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "FRE 121 Skills in Written Expression Exam Feb 2025"
    ]
  },
  {
    "code": "FRE 313",
    "name": "Applied Linguistics",
    "department": "Department of Linguistics & Foreign Languages",
    "school": "School of Arts & Social Sciences (SASS)",
    "aliases": [
      "Applied Linguistics"
    ]
  },
  {
    "code": "GEO 110",
    "name": "Introduction to Geography",
    "department": "Department of Geography and Environmental Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "GEO 110: Introduction to Geography - University Examination"
    ]
  },
  {
    "code": "GEO 111",
    "name": "Introduction to Remote Sensing and GIS",
    "department": "Department of Geography",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "GEO 111 Introduction to Remote Sensing and GIS Examination January 2022"
    ]
  },
  {
    "code": "GEO 310",
    "name": "Climatology",
    "department": "Geography",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "GEO 310 Climatology Special Supplementary Examination 2023 2024"
    ]
  },
  {
    "code": "HIS 110",
    "name": "Introduction to African History to 1884",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 110 Introduction to African History to 1884 First Year First Semester Supplementary Special Examination March 2024",
      "HIS 110 Introduction to African History to 1884 First Year Second Semester Main Examination 2021/2022"
    ]
  },
  {
    "code": "HIS 111",
    "name": "Introduction to Historical Studies",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 111: Introduction to Historical Studies - University Examination"
    ]
  },
  {
    "code": "HIS 211",
    "name": "Themes in East African History",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 211: Themes in East African History - University Examination"
    ]
  },
  {
    "code": "HIS 220",
    "name": "History of Kenya Since 1895",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 220 History of Kenya Since 1895 Examination December 2022"
    ]
  },
  {
    "code": "HIS 221",
    "name": "History of International Organizations Since 1919",
    "department": "History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 221 History of International Organizations Since 1919 Second Year Second Semester Examination December 2022"
    ]
  },
  {
    "code": "HIS 325",
    "name": "Africa and Black Diaspora",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "HIS 325: Africa and Black Diaspora Special/Supplementary Examination"
    ]
  },
  {
    "code": "HRD 100",
    "name": "Communication Skills I",
    "department": "Department of Communication Studies",
    "school": "School of Business & Economics",
    "aliases": [
      "HRD 100 Communication Skills I University Examination December 2015"
    ]
  },
  {
    "code": "INF 110",
    "name": "Foundations of Information Sciences",
    "department": "Department of Information Technology",
    "school": "School of Information Sciences",
    "aliases": [
      "foundations of is"
    ]
  },
  {
    "code": "INS 111",
    "name": "Information Literacy",
    "department": "Department of Library, Records & Information Management",
    "school": "School of Information Sciences",
    "aliases": [
      "info literacy"
    ]
  },
  {
    "code": "KIS 120",
    "name": "Communication Skills in Kiswahili",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "KIS 120 Communication Skills in Kiswahili Supplementary Examination October 2023"
    ]
  },
  {
    "code": "KIS 210",
    "name": "Theory and Practice of Translation and Interpretation I",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "KIS 210 Theory and Practice of Translation and Interpretation I Second Year Second Semester Examination April 2023"
    ]
  },
  {
    "code": "KIS 220",
    "name": "Oral Literature in Kiswahili",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "KIS 220: Oral Literature in Kiswahili — Special/Supplementary Examination — July 2016",
      "KIS 220 Kiswahili Oral Literature School Based Examination April"
    ]
  },
  {
    "code": "KIS 314",
    "name": "Linguistics and the Language of Translation",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "KIS 314 Linguistics and the Language of Translation 3rd Year Examination 1st Semester 2014"
    ]
  },
  {
    "code": "KIS 320",
    "name": "Translation and Social Change",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "KIS 320: Translation and Social Change — Third Year Examination — August 2016"
    ]
  },
  {
    "code": "KIS 321",
    "name": "Drama and Theatre for Interventions",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "KIS 321 Drama and Theatre for Interventions Final Examination August 2015"
    ]
  },
  {
    "code": "LAW 110",
    "name": "Constitutional Law I",
    "department": "Department of Public Law",
    "school": "School of Law",
    "aliases": [
      "consti",
      "constitutional law"
    ]
  },
  {
    "code": "LAW 111",
    "name": "Legal Method and Legal Systems",
    "department": "Department of Public Law",
    "school": "School of Law",
    "aliases": [
      "legal systems"
    ]
  },
  {
    "code": "LAW 120",
    "name": "Law of Contract I",
    "department": "Department of Private Law",
    "school": "School of Law",
    "aliases": [
      "contract law",
      "contracts"
    ]
  },
  {
    "code": "LAW 210",
    "name": "Criminal Law I",
    "department": "Department of Public Law",
    "school": "School of Law",
    "aliases": [
      "criminal law"
    ]
  },
  {
    "code": "LAW 220",
    "name": "Law of Torts I",
    "department": "Department of Private Law",
    "school": "School of Law",
    "aliases": [
      "torts",
      "tort law"
    ]
  },
  {
    "code": "LIN 120",
    "name": "The Structure of Language",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIN 120: The Structure of Language - University Examination Past Paper"
    ]
  },
  {
    "code": "LIN 210",
    "name": "Introduction to Sociolinguistics",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIN 210 Introduction to Sociolinguistics Special Supplementary Examination March 2024"
    ]
  },
  {
    "code": "LIN 312",
    "name": "Second Language Acquisition",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIN 312 Second Language Acquisition Exam Feb 2025"
    ]
  },
  {
    "code": "LIN 325",
    "name": "Comparative Study of Language",
    "department": "Department of Linguistics & Foreign Languages",
    "school": "School of Arts & Social Sciences (SASS)",
    "aliases": [
      "Comparative Study of Language"
    ]
  },
  {
    "code": "LIN 420",
    "name": "Pragmatics and Discourse Analysis",
    "department": "Department of Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIN 420 Pragmatics and Discourse Analysis Fourth Year Second Semester Examination April 2023"
    ]
  },
  {
    "code": "LIT 120",
    "name": "Reading and Writing Skills in Literature",
    "department": "Department of Literature, Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 120: Reading and Writing Skills in Literature - Examination"
    ]
  },
  {
    "code": "LIT 210",
    "name": "Humanist Literary Theory",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 210: Humanist Literary Theory Special/Supplementary Examination"
    ]
  },
  {
    "code": "LIT 310",
    "name": "Critical Theory",
    "department": "Department of Literature, Linguistics & Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 310 Critical Theory Bachelor of Arts Regular Examination"
    ]
  },
  {
    "code": "LIT 311",
    "name": "Stylistics",
    "department": "Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 311 Stylistics Bachelor of Arts and Education Special Supplementary Examination"
    ]
  },
  {
    "code": "LIT 312",
    "name": "European Drama",
    "department": "Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 312 European Drama Bachelor of Education Arts Special Supplementary Examination",
      "LIT 312: Elements of European Drama Regular University Examination"
    ]
  },
  {
    "code": "LIT 323",
    "name": "Kenyan Fiction and History",
    "department": "Department of Literature, Theatre & Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 323 Kenyan Fiction and History Degree Examination Collection 2022"
    ]
  },
  {
    "code": "LIT 324",
    "name": "West African Drama",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 324: West African Drama - University Examination Past Paper"
    ]
  },
  {
    "code": "LIT 410",
    "name": "Literature and Postmodernist Theory",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 410 Literature and Postmodernist Theory Exam"
    ]
  },
  {
    "code": "LIT 411",
    "name": "The African Novel",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 411 The African Novel Exam"
    ]
  },
  {
    "code": "LIT 420",
    "name": "Modern African Poetry",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIT 420 Modern African Poetry Exam"
    ]
  },
  {
    "code": "LMC 110",
    "name": "Introduction to Media and Society",
    "department": "Department of Linguistics and Foreign Languages",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 110 Introduction to Media and Society Regular University Examination 2014/2015",
      "LMC 110: Introduction to Media and Society - Regular Examination",
      "LMC 110: Introduction to Media and Society - Regular University Examination (2013/2014)"
    ]
  },
  {
    "code": "LMC 111",
    "name": "Understanding Communication",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 111 Understanding Communication First Year First Semester Examination 2019/2020",
      "LMC 111: Understanding Communication - First Year First Semester Examination (October 2013)",
      "LMC 111 Understanding Communication Regular University Examination"
    ]
  },
  {
    "code": "LMC 210",
    "name": "Communication Theory",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 210 Communication Theory Supplementary Special Exam October 2019"
    ]
  },
  {
    "code": "LMC 221",
    "name": "Media Studies",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 221 Media Studies Second Year Second Semester Special Supplementary Examination 2023"
    ]
  },
  {
    "code": "LMC 222",
    "name": "Non-Verbal Communication",
    "department": "Department of Media and Communication Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 222 Non-Verbal Communication Supplementary Special Exam October 2023"
    ]
  },
  {
    "code": "LMC 311",
    "name": "Introduction to Media Law",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "LMC 311: Introduction to Media Law"
    ]
  },
  {
    "code": "LMC 312",
    "name": "Corporate Communication",
    "department": "Department of Publishing & Media Studies",
    "school": "School of Information Sciences",
    "aliases": [
      "Corporate Communication"
    ]
  },
  {
    "code": "LMC 320",
    "name": "Marketing Communication",
    "department": "Department of Linguistics, Languages, Foreign Languages and French Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 320: Marketing Communication - Regular University Examination"
    ]
  },
  {
    "code": "LMC 321",
    "name": "Language in the Media",
    "department": "Department of Literature, Languages and Folklore Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 321 Language in the Media Third Year Second Semester Regular Examination 2021/2022",
      "LMC 321: Language in the Media - Special / Supplementary Examination (March 2024)"
    ]
  },
  {
    "code": "LMC 411",
    "name": "Comparative Media Law and Governance",
    "department": "Department of Linguistics, Media and Communication",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 411: Comparative Media Law & Governance - Regular Examination",
      "LMC 411: Contemporary Media Law and Governance - Continuous Assessment Test 2 (CAT 2)"
    ]
  },
  {
    "code": "LMC 420",
    "name": "Video Production",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 420: Video Production - Regular University Examination"
    ]
  },
  {
    "code": "LMC 421",
    "name": "Reporting Disasters",
    "department": "Department of Literature, Linguistics Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 421 Reporting Disasters Fourth Year Second Semester Regular Examination 2022/2023"
    ]
  },
  {
    "code": "LMC 422",
    "name": "Organizational Communication",
    "department": "Department of Literature, Languages and Folklore Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LMC 422 Organizational Communication Fourth Year Second Semester Regular Examination 2022/2023"
    ]
  },
  {
    "code": "LTF 210",
    "name": "Fundamentals of Literature I - (Drama)",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LTF 210: Fundamentals of Literature I - (Drama) Special/Supplementary Examination"
    ]
  },
  {
    "code": "LTF 211",
    "name": "Art and Communication",
    "department": "Department of Literature, Languages, Linguistics and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LTF 211 Art and Communication Second Year First Semester Examination December 2023"
    ]
  },
  {
    "code": "LTF 411",
    "name": "Literary Journalism",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LTF 411: Literary Journalism - Degree Examination Collection (Regular & Special / Supplementary)"
    ]
  },
  {
    "code": "MAT 110",
    "name": "Basic Mathematics",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "basic math",
      "foundation math"
    ]
  },
  {
    "code": "MAT 111",
    "name": "Differential Calculus",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "calculus 1",
      "differentiation",
      "calc 1",
      "differential calulus"
    ]
  },
  {
    "code": "MAT 113",
    "name": "Differential Calculus",
    "department": "Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 113 Differential Calculus First Year Semester 1 University Examination"
    ]
  },
  {
    "code": "MAT 120",
    "name": "Integral Calculus",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "calculus 2",
      "integration",
      "calc 2"
    ]
  },
  {
    "code": "MAT 121",
    "name": "Linear Algebra I",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "linear algebra",
      "matrices",
      "vectors"
    ]
  },
  {
    "code": "MAT 205",
    "name": "Ordinary Differential Equation I",
    "department": "Department of Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 205: Ordinary Differential Equation I - Second Year First Semester Examination (May 2022)"
    ]
  },
  {
    "code": "MAT 206",
    "name": "Mathematical Modeling",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "modelling",
      "math models",
      "Numerical Methods Exam March 2025 Sem1"
    ]
  },
  {
    "code": "MAT 207",
    "name": "NGINEERING MATHEMATICS I",
    "department": "Maths, Physics & Computing",
    "school": "School of Engineering",
    "aliases": [
      "Engineering Mathematics I Exam March 2025 Sem1"
    ]
  },
  {
    "code": "MAT 208",
    "name": "Engineering Mathematics",
    "department": "Mathematics & Physics",
    "school": "School of Engineering",
    "aliases": [
      "MAT 208 Engineering Mathematics Second Year Second Semester Regular Examination May 2023"
    ]
  },
  {
    "code": "MAT 210",
    "name": "Calculus III / Multivariable Calculus",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "calc 3",
      "multivariable calculus",
      "calculus iii"
    ]
  },
  {
    "code": "MAT 211",
    "name": "Linear Algebra II",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "linear algebra 2",
      "vector spaces"
    ]
  },
  {
    "code": "MAT 214",
    "name": "Vector Analysis",
    "department": "Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 214: Vector Analysis - University Examination May 2022"
    ]
  },
  {
    "code": "MAT 220",
    "name": "Vector Analysis",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "vector calculus"
    ]
  },
  {
    "code": "MAT 221",
    "name": "Ordinary Differential Equations",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "ode",
      "differential equations"
    ]
  },
  {
    "code": "MAT 310",
    "name": "Real Analysis I",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "real analysis"
    ]
  },
  {
    "code": "MAT 311",
    "name": "Complex Analysis",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "complex variables"
    ]
  },
  {
    "code": "MAT 312",
    "name": "Complex Analysis I",
    "department": "Mathematics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 312 Complex Analysis I Third Year First Semester Regular Examination August 2021",
      "Complex Analysis"
    ]
  },
  {
    "code": "MAT 315",
    "name": "Operations Research I",
    "department": "Department of Mathematics & Computer Science",
    "school": "School of Science and Aerospace Studies"
  },
  {
    "code": "MAT 317",
    "name": "Numerical Analysis I",
    "department": "Mathematics, Physics and Computing Department",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 317: Numerical Analysis I — Third Year Second Semester Main Examination — December 2021"
    ]
  },
  {
    "code": "MAT 318",
    "name": "MAT 318 Fluid Mechanics I Main Examination 2014/2015",
    "department": "Department of Mathematics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "MAT 318 Fluid Mechanics I Main Examination 2014/2015"
    ]
  },
  {
    "code": "MAT 320",
    "name": "Partial Differential Equations",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "pde"
    ]
  },
  {
    "code": "MAT 321",
    "name": "Numerical Analysis",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "numerical methods"
    ]
  },
  {
    "code": "MIT 312",
    "name": "Engineering Design I",
    "department": "Manufacturing, Industrial & Textile Engineering",
    "school": "School of Engineering",
    "aliases": [
      "MIT 312 Engineering Design I Third Year Regular Examination 2012/2013"
    ]
  },
  {
    "code": "MPE 162",
    "name": "Engineering Drawing II",
    "department": "Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "MPE 162 Engineering Drawing II First Year Supplementary Special Examination August 2015"
    ]
  },
  {
    "code": "MPE 203",
    "name": "Thermodynamics and Fluid Mechanics",
    "department": "Department of Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "Thermodynamics and Fluid Mechanics Degree Examination June 2014",
      "Thermo-Fluids",
      "Fluid Mechanics and Thermodynamics"
    ]
  },
  {
    "code": "MPE 222",
    "name": "Solid Mechanics I",
    "department": "Department of Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "MPE 222 Solid Mechanics I Second Year Second Semester Examination April 2011",
      "MPE 222 Solid Mechanics I Degree Examination"
    ]
  },
  {
    "code": "MPE 241",
    "name": "Mechanics of Machines I",
    "department": "Department of Mechanical & Production Engineering",
    "school": "School of Engineering"
  },
  {
    "code": "MPE 321",
    "name": "Solid Mechanics II",
    "department": "Department of Mechanical and Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "MPE 321: Solid Mechanics II — Third Year First Semester Examination — February 2021",
      "MPE 321 Solid Mechanics II Degree Examination 2018/2019",
      "MPE 321 Solid Mechanics II Continuous Assessment Tests (CAT 1 & CAT 2) 2018-2020"
    ]
  },
  {
    "code": "MPE 351",
    "name": "Metrology",
    "department": "Department of Mechanical & Production Engineering",
    "school": "School of Engineering",
    "aliases": [
      "MPE 351 Metrology Third Year First Semester Examination February 2021"
    ]
  },
  {
    "code": "MPE 361",
    "name": "Mechanical Engineering Design I",
    "department": "Mechanical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "Mechanical Engineering Design I Exam"
    ]
  },
  {
    "code": "MPE 371",
    "name": "THERMODYNAMICS II",
    "department": "Mechanical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "Thermodynamics II Exam",
      "MPE 371: Thermodynamics II — Third Year First Semester Examination — February 2021",
      "MPE 371: Thermodynamics II — University Examination"
    ]
  },
  {
    "code": "PCA 313",
    "name": "Community Correction",
    "department": "Department of History, Political Science, Public Administration, Penology & Security Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "PCA 313 Community Correction Examination"
    ]
  },
  {
    "code": "PHL 110",
    "name": "Introduction to Philosophy of Human Nature",
    "department": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "PHL 110: Introduction to Philosophy of Human Nature - Examination"
    ]
  },
  {
    "code": "PHL 321",
    "name": "Contemporary Moral Issues",
    "department": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Contemporary Moral Issues"
    ]
  },
  {
    "code": "PHY 110",
    "name": "Mechanics and Properties of Matter",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mechanics",
      "general physics"
    ]
  },
  {
    "code": "PHY 111",
    "name": "Thermal Physics",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "heat and thermodynamics"
    ]
  },
  {
    "code": "PHY 112",
    "name": "Mechanics",
    "department": "Department of Mathematics, Physics and Computing",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "PHY 112 Mechanics Exam Jan 2022"
    ]
  },
  {
    "code": "PHY 113",
    "name": "Heat and Thermodynamics",
    "department": "Department of Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "PHY 113: Heat and Thermodynamics University Examination",
      "PHY 113: Heat and Thermodynamics - Regular University Examination (2021/2022)"
    ]
  },
  {
    "code": "PHY 120",
    "name": "Electricity and Magnetism",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "electromagnetism",
      "e and m"
    ]
  },
  {
    "code": "PHY 121",
    "name": "Waves and Optics",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "optics",
      "wave motion",
      "Geometrical Optics Exam April 2022"
    ]
  },
  {
    "code": "PHY 122",
    "name": "Modern Physics",
    "department": "Mathematics & Physics",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Modern Physics Exam May 2022"
    ]
  },
  {
    "code": "PHY 210",
    "name": "Electricity and Magnetism",
    "department": "Department of Mathematics, Physics and Computing",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "PHY 210 Electricity and Magnetism Exam July 2022"
    ]
  },
  {
    "code": "PHY 211",
    "name": "Waves and Oscillations",
    "department": "Department of Mathematics and Aerospace Studies",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "PHY 211 Waves and Oscillations Exam July 2022"
    ]
  },
  {
    "code": "PHY 221",
    "name": "Electricity and Magnetism II",
    "department": "Mathematics & Physics",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Electricity and Magnetism II Exam Dec 2022"
    ]
  },
  {
    "code": "PHY 311",
    "name": "Solid State Physics I",
    "department": "Department of Mathematics, Physics and Computing",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "PHY 311 Solid State Physics I Exam Dec 2023"
    ]
  },
  {
    "code": "PHY 316",
    "name": "Introduction to Material Science",
    "department": "Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "PHY 316 Introduction to Material Science Third Year Degree Examination"
    ]
  },
  {
    "code": "PRT 120",
    "name": "Introduction to Ethics",
    "department": "Department of Philosophy & Religious Studies",
    "school": "School of Arts and Social Sciences"
  },
  {
    "code": "PRT 210",
    "name": "History of Religions I",
    "department": "Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "PRT 210 History of Religions I Second Year First Semester Examination 2021/2022"
    ]
  },
  {
    "code": "PSA 212",
    "name": "Decentralization and County Governance in Kenya",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences"
  },
  {
    "code": "PSA 310",
    "name": "Research Methods in Political Science",
    "department": "History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "PSA 310 Research Methods in Political Science Bachelor of Arts Special Supplementary Examination 2023 2024"
    ]
  },
  {
    "code": "PSA 323",
    "name": "Development Administration",
    "department": "Department of History, Political Science & Public Admin",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "PSA 323 Development Administration University Examination"
    ]
  },
  {
    "code": "PSS 222",
    "name": "Criminal Procedure and Practice",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Criminal Procedure and Practice"
    ]
  },
  {
    "code": "PSS 312",
    "name": "Incarceration and Rehabilitation Process",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "PSS 312 Incarceration and Rehabilitation Process Special / Supplementary Examination March 2024"
    ]
  },
  {
    "code": "PSS 314",
    "name": "Criminal Law",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "PSS 314 Criminal Law Special Supplementary Examination March 2024"
    ]
  },
  {
    "code": "PSY 111",
    "name": "Introduction to Educational Psychology",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "ed psych"
    ]
  },
  {
    "code": "PSY 210",
    "name": "Human Growth and Development",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "PSY 210: Human Growth and Development - Regular University Examination (2021/2022)",
      "PSY 210 Human Growth and Development Special Supplementary Examination 2024"
    ]
  },
  {
    "code": "PSY 211",
    "name": "Educational Guidance and Counselling",
    "department": "Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "PSY 211 Educational Guidance and Counselling Bachelor of Education Special Supplementary Examination",
      "PSY 211 Educational Guidance and Counselling Second Year Second Semester Examination November 2022"
    ]
  },
  {
    "code": "PSY 311",
    "name": "Educational Measurement and Evaluation",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "PSY 311: Educational Measurement and Evaluation - Special / Supplementary Examination Past Paper",
      "PSY 311: Educational Measurement and Evaluation - Examination"
    ]
  },
  {
    "code": "REL 110",
    "name": "Traditional African Worldview",
    "department": "Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 110 Traditional African Worldview Bachelor of Arts Regular Examination"
    ]
  },
  {
    "code": "REL 213",
    "name": "Studies in the New Testament I",
    "department": "Department of Philosophy, Theology & Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 213: Studies in the New Testament I - Special / Supplementary Examination"
    ]
  },
  {
    "code": "REL 221",
    "name": "History of Religions II",
    "department": "Department of Philosophy, Religion & Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 221: History of Religions II Second Year First Semester Examination - December 2022"
    ]
  },
  {
    "code": "REL 222",
    "name": "History of Christianity II",
    "department": "Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 222 History of Christianity II Second Year Second Semester Examination 2022/2023",
      "REL 222: History of Christianity II - Special / Supplementary Examination"
    ]
  },
  {
    "code": "REL 313",
    "name": "History of Christianity in Africa",
    "department": "Department of Philosophy, Theology and Religious Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "History of Christianity in Africa"
    ]
  },
  {
    "code": "REL 314",
    "name": "Studies in the New Testament II",
    "department": "Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 314 Studies in the New Testament II Bachelor of Arts Special Supplementary Examination"
    ]
  },
  {
    "code": "REL 321",
    "name": "Religions in Kenya",
    "department": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "REL 321: Religions in Kenya - Examination",
      "REL 321 Religions in Kenya Bachelor of Arts Second Semester Examination 2015"
    ]
  },
  {
    "code": "SAS 101",
    "name": "Introduction to Reading and Writing Skills",
    "department": "School of Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 101: Introduction to Reading and Writing Skills - Special / Supplementary Examination",
      "SAS 101: Introduction to Reading and Writing Skills - University Examination August 2020",
      "SAS 101 Reading and Writing Skills First Year First Semester Examination 2021/2022",
      "SAS 101: Introduction to Reading and Writing Skills - First Year First Semester Examination (October 2013)"
    ]
  },
  {
    "code": "SAS 102",
    "name": "Computer Literacy and Skills",
    "department": "Department of Geography / School of Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 102: Computer Literacy and Skills First Year First Semester Examination - 2017/2018",
      "SAS 102 Computer Literacy and Skills Regular Examination",
      "SAS 102: Computer Literacy and Skills - Special / Supplementary Examination (2016/2017)"
    ]
  },
  {
    "code": "SAS 201",
    "name": "Introduction to Research Methods",
    "department": "Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 201 Introduction to Research Methods Bachelor of Arts University Examination",
      "SAS 201 Introduction to Research Methods Second Year Second Semester Examination 2013/2014"
    ]
  },
  {
    "code": "SAS 203",
    "name": "Ethnicity, Race Relations and Nation Building in Kenya",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 203 Ethnicity Race Relations Exam"
    ]
  },
  {
    "code": "SAS 302",
    "name": "Entrepreneurship",
    "department": "School of Arts and Social Sciences",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 302: Entrepreneurship - Regular Examination"
    ]
  },
  {
    "code": "SAS 402",
    "name": "Disaster and Conflict Management",
    "department": "Department of Geography and Environmental Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 402 Disaster and Conflict Management Fourth Year Second Semester Regular Examination 2022/2023"
    ]
  },
  {
    "code": "SNE 101",
    "name": "HIV/AIDS, Drugs & Special Needs in Educational Institutions",
    "department": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "SNE 101 HIV/AIDS, Drugs & Special Needs in Educational Institutions Examination December 2022"
    ]
  },
  {
    "code": "SNE 316E",
    "name": "Assessment and Identification of Learners with Emotional and Behaviour Disorders",
    "department": "Department of Educational Psychology",
    "school": "School of Education (SOE)",
    "aliases": [
      "Assessment and Identification of Learners with Emotional and Behaviour Disorders"
    ]
  },
  {
    "code": "SOC 120",
    "name": "Psychology of Individual Development and Social Life",
    "department": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SOC 120: Psychology of Individual Development and Social Life Special/Supplementary Examination"
    ]
  },
  {
    "code": "SOC 221",
    "name": "Gerontology",
    "department": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SOC 221 Gerontology Special / Supplementary Examination March 2024"
    ]
  },
  {
    "code": "SOC 313",
    "name": "Sociology of Sex and Gender",
    "department": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SOC 313 Sociology of Sex and Gender Special Supplementary Examination 2015/2016",
      "SOC 313: Sociology of Sex and Gender - Third Year First Semester Special / Supplementary Examination Past Paper"
    ]
  },
  {
    "code": "SPC 312",
    "name": "Counselling of Exceptional Populations Programmes",
    "department": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SPC 312: Counselling of Exceptional Populations Programmes - University Examination Past Paper"
    ]
  },
  {
    "code": "SPH 211",
    "name": "Electricity and Magnetism",
    "department": "Computer Science",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Electricity and Magnetism_Chapter 4 - Electric Potential"
    ]
  },
  {
    "code": "SPY 311",
    "name": "Methods of Psychological Research",
    "department": "Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SPY 311 Methods of Psychological Research Bachelor of Arts Special Supplementary Examination"
    ]
  },
  {
    "code": "SPY 322",
    "name": "Psychology of Human Behaviour and Learning",
    "department": "Department of Psychology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "SPY 322: Psychology of Human Behaviour and Learning"
    ]
  },
  {
    "code": "STA 100",
    "name": "Probability & Statistics 1",
    "department": "Department of Mathematics & Physics",
    "school": "School of Education",
    "aliases": [
      "STA 100 Probability & Statistics 1 Examination April 2023"
    ]
  },
  {
    "code": "STA 111",
    "name": "Introduction to Probability and Statistics",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "stats 1",
      "intro to stats",
      "probability"
    ]
  },
  {
    "code": "STA 112",
    "name": "Descriptive Statistics",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "descriptive stats"
    ]
  },
  {
    "code": "STA 211",
    "name": "Mathematical Statistics I",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "math stats",
      "statistical theory"
    ]
  },
  {
    "code": "STA 221",
    "name": "Probability Theory",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "probability models"
    ]
  },
  {
    "code": "STA 311",
    "name": "Regression Analysis",
    "department": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "regression models",
      "econometrics stats"
    ]
  },
  {
    "code": "STA 319",
    "name": "Sampling Theory and Methods I",
    "department": "Statistics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "STA 319 Sampling Theory and Methods I Third Year Second Semester Main Examination December 2021",
      "STA 319 Sampling Theory and Methods I Third Year Second Semester Examination December 2021"
    ]
  },
  {
    "code": "STA 320",
    "name": "Design and Analysis of Experiments I",
    "department": "Mathematics, Statistics & Actuarial Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "STA 320 Design and Analysis of Experiments I Main Examination December 2021"
    ]
  },
  {
    "code": "STA 321",
    "name": "Tests of Hypothesis",
    "department": "Mathematics, Physics and Computing",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "STA 321 Tests of Hypothesis Degree Examination December 2021"
    ]
  },
  {
    "code": "STA 328",
    "name": "Applied Linear Regression II",
    "department": "Department of Statistics & Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "STA 328 Applied Linear Regression II Main Examination January 2022"
    ]
  },
  {
    "code": "SWK 210",
    "name": "Fundamental Issues of Diversity and Globalisation in Social Work",
    "department": "Department of Sociology, Psychology and Social Work",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 210 Fundamental Issues of Diversity and Globalisation in Social Work Exam"
    ]
  },
  {
    "code": "SWK 211",
    "name": "Social Work Practice with Individuals and Families",
    "department": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 211 Social Work Practice with Individuals and Families Exam"
    ]
  },
  {
    "code": "SWK 213",
    "name": "Advocacy in Social Work",
    "department": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 213 Advocacy in Social Work Exam"
    ]
  },
  {
    "code": "SWK 223",
    "name": "Family and Child Welfare Policy",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 223 Family Child Welfare Policy Exam"
    ]
  },
  {
    "code": "SWK 224",
    "name": "Death and Dying Issues Across Lifespan",
    "department": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 224 Death and Dying Issues Across Lifespan Exam"
    ]
  },
  {
    "code": "SWK 310",
    "name": "Ethical Issues in Social Work Practice",
    "department": "Department of Sociology, Psychology and Social Work",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 310 Ethical Issues in Social Work Practice Exam"
    ]
  },
  {
    "code": "SWK 320",
    "name": "Social Work Practice with Groups",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 320 Social Work Practice Groups Exam"
    ]
  },
  {
    "code": "SWK 323",
    "name": "Family Violence",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 323 Family Violence Exam"
    ]
  },
  {
    "code": "SWK 324",
    "name": "Social Work, Health and Development",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 324 Social Work Health Development Exam"
    ]
  },
  {
    "code": "SWK 410",
    "name": "Social Work Practice with Communities",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 410 Social Work Practice Communities Exam"
    ]
  },
  {
    "code": "SWK 412",
    "name": "Contemporary Issues in Fields of Practice I",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 412 Contemporary Issues Exam"
    ]
  },
  {
    "code": "SWK 413",
    "name": "Working With Trauma",
    "department": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SWK 413 Working With Trauma Exam"
    ]
  },
  {
    "code": "TEC 102",
    "name": "Computers and Management of Information in Education",
    "department": "Department of Technology Education",
    "school": "School of Education",
    "aliases": [
      "TEC 102 Computers and Management of Information in Education Regular Examination April 2023",
      "TEC 102 Computers and Management of Information in Education First Year Second Semester Examination April 2019"
    ]
  },
  {
    "code": "TEC 103",
    "name": "Basic Engineering Mathematics II",
    "department": "Department of Engineering Mathematics",
    "school": "School of Engineering",
    "aliases": [
      "TEC 103 Basic Engineering Mathematics II First Year Second Semester Examination May 2013"
    ]
  },
  {
    "code": "TEC 111",
    "name": "Introduction to Material Science",
    "department": "Chemical & Process / Mechanical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "TEC 111 Introduction to Material Science First Year Second Semester Regular Examination March 2018"
    ]
  },
  {
    "code": "THE 320",
    "name": "Costume Design",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "THE 320 Costume Design Exam"
    ]
  },
  {
    "code": "THL 320",
    "name": "Studies in the Old Testament 1",
    "department": "Department of Philosophy & Religious Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "THL 320: Studies in the Old Testament 1"
    ]
  }
];

// 4. Semesters
export const MOI_SEMESTER_MAPPINGS = {
  SEM_1: {
    value: 'Semester 1',
    label: 'Semester 1',
    aliases: ['sem 1', 'sem1', 's1', 'first semester', 'semester 1', 'semester1']
  },
  SEM_2: {
    value: 'Semester 2',
    label: 'Semester 2',
    aliases: ['sem 2', 'sem2', 's2', 'second semester', 'semester 2', 'semester2']
  }
};
export const MOI_ACADEMIC_SEMESTERS = [
  {
    "name": "Semester 1",
    "aliases": [
      "sem 1",
      "sem1",
      "s1",
      "first semester",
      "semester 1",
      "semester1"
    ]
  },
  {
    "name": "Semester 2",
    "aliases": [
      "sem 2",
      "sem2",
      "s2",
      "second semester",
      "semester 2",
      "semester2"
    ]
  }
];

// 5. Years of Study
export const MOI_YEARS_OF_STUDY = [
  { value: 'Year 1', label: 'Year 1', aliases: ['year 1', 'y1', 'yr 1', 'first year', '1st year', 'year one'] },
  { value: 'Year 2', label: 'Year 2', aliases: ['year 2', 'y2', 'yr 2', 'second year', '2nd year', 'year two'] },
  { value: 'Year 3', label: 'Year 3', aliases: ['year 3', 'y3', 'yr 3', 'third year', '3rd year', 'year three'] },
  { value: 'Year 4', label: 'Year 4', aliases: ['year 4', 'y4', 'yr 4', 'fourth year', '4th year', 'year four'] },
  { value: 'Year 5', label: 'Year 5', aliases: ['year 5', 'y5', 'yr 5', 'fifth year', '5th year', 'year five'] },
  { value: 'Year 6', label: 'Year 6', aliases: ['year 6', 'y6', 'yr 6', 'sixth year', '6th year', 'year six'] }
];
export const MOI_ACADEMIC_YEARS_OF_STUDY = [
  {
    "year": 1,
    "label": "Year 1",
    "aliases": [
      "year 1",
      "y1",
      "yr 1",
      "first year",
      "1st year",
      "year one"
    ]
  },
  {
    "year": 2,
    "label": "Year 2",
    "aliases": [
      "year 2",
      "y2",
      "yr 2",
      "second year",
      "2nd year",
      "year two"
    ]
  },
  {
    "year": 3,
    "label": "Year 3",
    "aliases": [
      "year 3",
      "y3",
      "yr 3",
      "third year",
      "3rd year",
      "year three"
    ]
  },
  {
    "year": 4,
    "label": "Year 4",
    "aliases": [
      "year 4",
      "y4",
      "yr 4",
      "fourth year",
      "4th year",
      "year four"
    ]
  },
  {
    "year": 5,
    "label": "Year 5",
    "aliases": [
      "year 5",
      "y5",
      "yr 5",
      "fifth year",
      "5th year",
      "year five"
    ]
  },
  {
    "year": 6,
    "label": "Year 6",
    "aliases": [
      "year 6",
      "y6",
      "yr 6",
      "sixth year",
      "6th year",
      "year six"
    ]
  }
];

// 6. Examination Years Range
export const MOI_EXAM_YEAR_MIN = 2000;
export const MOI_EXAM_YEAR_MAX = 2060;
export const MOI_EXAM_YEARS = Array.from(
  { length: MOI_EXAM_YEAR_MAX - MOI_EXAM_YEAR_MIN + 1 },
  (_, idx) => MOI_EXAM_YEAR_MIN + idx
);

// 7. Material Categories
export const MOI_MATERIAL_TYPE_MAPPINGS = {
  PAST_PAPER: {
    type: 'past_paper',
    label: 'Past Paper',
    aliases: [
      'past paper', 'past papers', 'pastpaper', 'pastpapers', 'exam paper', 'exam papers',
      'exam', 'exams', 'examination', 'examinations', 'past exam', 'past exams',
      'previous paper', 'previous papers', 'previous exam', 'previous exams', 'old paper', 'old papers',
      'question paper', 'question papers', 'final exam', 'final exams', 'final paper', 'final papers',
      'end term exam', 'end of term exam', 'end semester exam', 'end of semester exam', 'semester exam',
      'main exam', 'special exam', 'supplementary exam', 'deferred exam', 'resit exam', 'retake exam',
      'mock exam', 'model exam', 'model paper', 'revision paper', 'revision exam', 'solved past paper'
    ]
  },
  NOTES: {
    type: 'notes',
    label: 'Revision Notes',
    aliases: [
      'notes', 'note', 'revision notes', 'lecture notes', 'class notes', 'course notes', 'unit notes',
      'study notes', 'pdf notes', 'notes pdf', 'notes pdfs', 'lecture pdf', 'lecture slides', 'slides',
      'lecture handout', 'lecture handouts', 'handout', 'handouts', 'reading material', 'reading materials',
      'study material', 'study materials', 'course material', 'course materials', 'learning material',
      'revision material', 'study guide', 'study guides', 'summary notes', 'summarized notes', 'summaries'
    ]
  },
  CAT: {
    type: 'cat',
    label: 'CAT / Quiz',
    aliases: [
      'cat', 'cats', 'cat paper', 'cat papers', 'cat 1', 'cat 2', 'cat 3', 'cat one', 'cat two', 'cat three',
      'continuous assessment', 'continuous assessment test', 'continuous assessment tests',
      'assessment test', 'assessment tests', 'class test', 'class tests', 'quiz', 'quizzes', 'quiz paper',
      'quiz papers', 'midterm', 'midterms', 'mid-term', 'mid-terms', 'mid term', 'mid terms',
      'mid semester test', 'mid-semester test', 'topical test', 'topical tests', 'test', 'tests'
    ]
  },
  SOLUTION: {
    type: 'solution',
    label: 'Exam Solution',
      aliases: ['solution', 'solutions', 'answer', 'answers', 'answer key', 'marking scheme', 'marking schemes', 'worked solution', 'worked solutions', 'solved paper', 'solved papers']
  }
};
export const MOI_MATERIAL_TYPES = [
  {
    "type": "past_paper",
    "label": "Past Paper",
    "aliases": [
      "past paper",
      "pastpaper",
      "exam paper",
      "exam",
      "examination",
      "main exam",
      "special exam"
    ]
  },
  {
    "type": "notes",
    "label": "Revision Notes",
    "aliases": [
      "notes",
      "revision notes",
      "lecture notes",
      "pdf notes",
      "slides",
      "handout",
      "reading material"
    ]
  },
  {
    "type": "cat",
    "label": "CAT / Quiz",
    "aliases": [
      "cat",
      "cats",
      "cat paper",
      "quiz",
      "continuous assessment",
      "cat 1",
      "cat 2",
      "midterm",
      "mid-term"
    ]
  },
  {
    "type": "solution",
    "label": "Exam Solution",
    "aliases": [
      "solution",
      "answers",
      "marking scheme",
      "worked solutions",
      "solved paper"
    ]
  }
];

/**
 * Normalized lookup helpers (100% Offline)
 */
const unitCodeLookup = new Map<string, AcademicUnitEntry>();
const unitDenseLookup = new Map<string, AcademicUnitEntry>();

for (const unit of MOI_ACADEMIC_UNITS) {
  unitCodeLookup.set(unit.code.toUpperCase().trim(), unit);
  unitDenseLookup.set(unit.code.replace(/\s+/g, '').toUpperCase().trim(), unit);
}

export function findAcademicUnitByCode(code: string): AcademicUnitEntry | undefined {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  return unitCodeLookup.get(clean) || unitDenseLookup.get(clean.replace(/\s+/g, ''));
}

export function getAllAcademicUnits(): AcademicUnitEntry[] {
  return MOI_ACADEMIC_UNITS;
}
