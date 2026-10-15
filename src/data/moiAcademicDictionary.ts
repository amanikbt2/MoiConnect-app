/**
 * Moi University Master Academic Dictionary & Corpus (100% OFFLINE)
 * Statically compiled from the offline corpus: moi_academic_corpus.txt
 * Zero online API dependencies, instant sub-millisecond execution.
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
      "science & aerospace",
      "sciences and aerospace",
      "sciences & aerospace",
      "science",
      "aerospace",
      "ssas",
      "sas",
      "aviation",
      "pure sciences",
      "school of science and aerospace studies",
      "school of sciences and aerospace studies",
      "school of science & aerospace studies"
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
    "name": "School of Nursing Sciences",
    "code": "SON",
    "aliases": [
      "nursing",
      "son",
      "nursing sciences"
    ]
  },
  {
    "name": "School of Dentistry",
    "code": "SOD",
    "aliases": [
      "dentistry",
      "dental"
    ]
  }
];

// 2. Comprehensive Moi University Departments
export const MOI_ACADEMIC_DEPARTMENTS: AcademicDepartmentEntry[] = [
  {
    "name": "Department of Anthropology and Human Ecology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "anthropology and human ecology"
    ]
  },
  {
    "name": "Department of Anthropology, Gender & Diversity Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "anthropology, gender & diversity studies"
    ]
  },
  {
    "name": "Department of Philosophy and Religious Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "philosophy and religious studies"
    ]
  },
  {
    "name": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "history, political science and public administration"
    ]
  },
  {
    "name": "Department of Business Administration",
    "school": "School of Business & Economics",
    "aliases": [
      "business administration"
    ]
  },
  {
    "name": "Department of Accounting and Finance",
    "school": "School of Business & Economics",
    "aliases": [
      "accounting and finance"
    ]
  },
  {
    "name": "Department of Marketing",
    "school": "School of Business & Economics",
    "aliases": [
      "marketing"
    ]
  },
  {
    "name": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "kiswahili and other african languages"
    ]
  },
  {
    "name": "Department of French",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "french"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "literature, linguistics, foreign languages and film studies"
    ]
  },
  {
    "name": "Department of Linguistics, Indigenous Languages and Media Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "linguistics, indigenous languages and media studies"
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
    "name": "Department of Chemistry and Biochemistry",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "chemistry and biochemistry"
    ]
  },
  {
    "name": "Department of Chemistry & Biochemistry",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "chemistry & biochemistry"
    ]
  },
  {
    "name": "Department of Curriculum Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "curriculum instruction and educational media"
    ]
  },
  {
    "name": "Department of Curriculum, Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "curriculum, instruction & educational media"
    ]
  },
  {
    "name": "Department of Curriculum, Instruction and Educational Media",
    "school": "School of Education",
    "aliases": [
      "curriculum, instruction and educational media"
    ]
  },
  {
    "name": "Department of Sociology, Psychology & Anthropology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "sociology, psychology & anthropology"
    ]
  },
  {
    "name": "Department of Computer Science",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "computer science"
    ]
  },
  {
    "name": "Department of Publishing & Media Studies",
    "school": "School of Information Sciences",
    "aliases": [
      "publishing & media studies"
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
    "name": "Electrical Engineering",
    "school": "School of Engineering",
    "aliases": [
      "electrical engineering"
    ]
  },
  {
    "name": "Department of Economics",
    "school": "School of Business & Economics",
    "aliases": [
      "economics"
    ]
  },
  {
    "name": "Department of Curriculum Instruction & Educational Media",
    "school": "School of Education",
    "aliases": [
      "curriculum instruction & educational media"
    ]
  },
  {
    "name": "Department of Educational Foundations",
    "school": "School of Education",
    "aliases": [
      "educational foundations"
    ]
  },
  {
    "name": "Department of Literature, Theatre and Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "literature, theatre and film studies"
    ]
  },
  {
    "name": "Department of Information Technology",
    "school": "School of Information Sciences",
    "aliases": [
      "information technology"
    ]
  },
  {
    "name": "Department of Library, Records & Information Management",
    "school": "School of Information Sciences",
    "aliases": [
      "library, records & information management"
    ]
  },
  {
    "name": "Department of Public Law",
    "school": "School of Law",
    "aliases": [
      "public law"
    ]
  },
  {
    "name": "Department of Private Law",
    "school": "School of Law",
    "aliases": [
      "private law"
    ]
  },
  {
    "name": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "literature, linguistics, foreign languages & film studies"
    ]
  },
  {
    "name": "Department of Mathematics & Physics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics & physics"
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
    "name": "Department of Mathematics",
    "school": "School of Science and Aerospace Studies",
    "aliases": [
      "mathematics"
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
    "name": "Department of History, Political Science, Public Administration, Penology & Security Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "history, political science, public administration, penology & security studies"
    ]
  },
  {
    "name": "Department of Philosophy, Religion and Theology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "philosophy, religion and theology"
    ]
  },
  {
    "name": "Department of Mathematics, Physics and Computing",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "mathematics, physics and computing"
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
    "name": "Department of Mathematics and Aerospace Studies",
    "school": "School of Sciences and Aerospace Studies",
    "aliases": [
      "mathematics and aerospace studies"
    ]
  },
  {
    "name": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "history, political science & public administration"
    ]
  },
  {
    "name": "Department of Educational Psychology",
    "school": "School of Education",
    "aliases": [
      "educational psychology"
    ]
  },
  {
    "name": "Department of Psychology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "psychology"
    ]
  },
  {
    "name": "Department of Sociology, Psychology and Social Work",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "sociology, psychology and social work"
    ]
  },
  {
    "name": "Department of Sociology, Psychology and Anthropology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "sociology, psychology and anthropology"
    ]
  },
  {
    "name": "Department of Sociology and Psychology",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "sociology and psychology"
    ]
  },
  {
    "name": "Department of Philosophy & Religious Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "philosophy & religious studies"
    ]
  }
];

// 3. Static Offline Moi University Academic Units (128 Units)
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
    "code": "BLL 221",
    "name": "Proficiency Course in French",
    "department": "Department of French",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "BLL 221 Proficiency Course French Exam"
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
    "code": "ECE 211",
    "name": "Circuit Theory II",
    "department": "Computer Science",
    "school": "School of Science & Aerospace Studies",
    "aliases": [
      "Circuit Theory II Course overview"
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
      "history of ed"
    ]
  },
  {
    "code": "EDF 211",
    "name": "Philosophy of Education",
    "department": "Department of Educational Foundations",
    "school": "School of Education",
    "aliases": [
      "philosophy of ed"
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
    "code": "KIS 314",
    "name": "Linguistics and the Language of Translation",
    "department": "Department of Kiswahili and Other African Languages",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "KIS 314 Linguistics and the Language of Translation 3rd Year Examination 1st Semester 2014"
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
    "code": "LIN 312",
    "name": "Second Language Acquisition",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "LIN 312 Second Language Acquisition Exam Feb 2025"
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
    "code": "LMC311",
    "name": "Introduction to Media Law",
    "department": "Department of Literature, Linguistics, Foreign Languages & Film Studies",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "LMC 311: Introduction to Media Law"
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
      "Thermodynamics II Exam"
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
    "code": "PSS 222",
    "name": "Criminal Procedure and Practice",
    "department": "Department of History, Political Science & Public Administration",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "Criminal Procedure and Practice"
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
    "code": "SAS 203",
    "name": "Ethnicity, Race Relations and Nation Building in Kenya",
    "department": "Department of History, Political Science and Public Administration",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "SAS 203 Ethnicity Race Relations Exam"
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
    "code": "SPY322",
    "name": "Psychology of Human Behaviour and Learning",
    "department": "Department of Psychology",
    "school": "School of Arts and Social Sciences (SASS)",
    "aliases": [
      "SPY 322: Psychology of Human Behaviour and Learning"
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
    "code": "THE 320",
    "name": "Costume Design",
    "department": "Department of Literature, Linguistics, Foreign Languages and Film Studies",
    "school": "School of Arts and Social Sciences",
    "aliases": [
      "THE 320 Costume Design Exam"
    ]
  },
  {
    "code": "THL320",
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
    aliases: ['past paper', 'pastpaper', 'exam paper', 'exam', 'examination', 'main exam', 'special exam']
  },
  NOTES: {
    type: 'notes',
    label: 'Revision Notes',
    aliases: ['notes', 'revision notes', 'lecture notes', 'pdf notes', 'slides', 'handout', 'reading material']
  },
  CAT: {
    type: 'cat',
    label: 'CAT / Quiz',
    aliases: ['cat', 'cats', 'cat paper', 'quiz', 'continuous assessment', 'cat 1', 'cat 2', 'midterm', 'mid-term']
  },
  SOLUTION: {
    type: 'solution',
    label: 'Exam Solution',
    aliases: ['solution', 'answers', 'marking scheme', 'worked solutions', 'solved paper']
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
