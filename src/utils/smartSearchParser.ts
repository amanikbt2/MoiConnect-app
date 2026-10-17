/**
 * Smart Academic Search Parser & "Did You Mean" Corrector
 * Lightning fast (< 1ms), in-memory Google-style intent parsing and typo tolerance.
 */

import {
  MOI_ACADEMIC_UNITS,
  MOI_ACADEMIC_SCHOOLS,
  MOI_ACADEMIC_DEPARTMENTS,
  MOI_SEMESTER_MAPPINGS,
  MOI_YEARS_OF_STUDY,
  MOI_EXAM_YEARS,
  MOI_MATERIAL_TYPE_MAPPINGS,
  AcademicUnitEntry
} from '../data/moiAcademicDictionary';

import { expandQueryAcronyms, stemToken, PHONETIC_SPELL_CORRECTIONS } from './academicAcronyms';

export interface ParsedSearchIntent {
  rawQuery: string;
  cleanedQuery: string;
  expandedQuery?: string;
  unitCode?: string;
  unitName?: string;
  semester?: string;
  yearOfStudy?: string;
  examYear?: number;
  materialType?: string;
  school?: string;
  department?: string;
  keywords: string[];
  stemmedKeywords?: string[];
  hasCorrection: boolean;
  correctedQuery?: string;
  didYouMeanText?: string;
  autoPivotSuggestion?: string;
  chips: Array<{ label: string; type: 'unit' | 'semester' | 'year' | 'material' | 'school' | 'department' }>;
}

const normalize = (v: string | undefined | null) => String(v || '').toLowerCase().trim();
const normalizeCode = (v: string) => normalize(v).replace(/[^a-z0-9]/g, '');

/**
 * Fast Damerau-Levenshtein distance calculation.
 * Handles insertion, deletion, substitution, and adjacent transpositions.
 */
export function getDamerauLevenshteinDistance(source: string, target: string): number {
  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const sl = s.length;
  const tl = t.length;

  if (s === t) return 0;
  if (sl === 0) return tl;
  if (tl === 0) return sl;
  if (Math.abs(sl - tl) > 3) return 99; // Fast-fail threshold

  const matrix: number[][] = [];
  for (let i = 0; i <= sl; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= tl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= sl; i++) {
    for (let j = 1; j <= tl; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[sl][tl];
}

/**
 * Resolve closest matching Unit Code from the master catalog.
 * Handles patterns like "csc112", "csc 112", "c0m 110", "ede211", "csc11".
 */
export function matchClosestUnitCode(queryToken: string): AcademicUnitEntry | null {
  const normalized = normalizeCode(queryToken);
  if (normalized.length < 3) return null;

  // 1. Direct match on normalized code (e.g. "csc112" -> "CSC 112")
  const exact = MOI_ACADEMIC_UNITS.find((unit) => normalizeCode(unit.code) === normalized);
  if (exact) return exact;

  // 2. Fix common OCR/typing mistakes (e.g. zero for 'o', one for 'l')
  const fixedToken = normalized.replace(/0/g, 'o').replace(/1/g, 'l');
  const ocrFix = MOI_ACADEMIC_UNITS.find((unit) => {
    const unitNorm = normalizeCode(unit.code).replace(/0/g, 'o').replace(/1/g, 'l');
    return unitNorm === fixedToken;
  });
  if (ocrFix) return ocrFix;

  // 3. Prefix match for typing in progress (e.g. "csc11" -> "CSC 111" or "CSC 112")
  const prefix = MOI_ACADEMIC_UNITS.find((unit) => normalizeCode(unit.code).startsWith(normalized));
  if (prefix) return prefix;

  // 4. Fuzzy distance <= 1 for unit codes (e.g. "csc113" -> "CSC 112")
  let bestCandidate: AcademicUnitEntry | null = null;
  let minDistance = Infinity;

  for (const unit of MOI_ACADEMIC_UNITS) {
    const dist = getDamerauLevenshteinDistance(normalized, normalizeCode(unit.code));
    if (dist <= 1 && dist < minDistance) {
      minDistance = dist;
      bestCandidate = unit;
    }
  }

  return bestCandidate;
}

/**
 * Find closest unit name or academic keyword with typo correction.
 * Handles typos like "differetial calulus" -> "Differential Calculus".
 */
export function matchClosestUnitName(phrase: string): { unit: AcademicUnitEntry; distance: number } | null {
  const clean = normalize(phrase);
  if (clean.length < 4) return null;

  // Direct includes check
  const directMatch = MOI_ACADEMIC_UNITS.find((unit) => {
    const nameNorm = normalize(unit.name);
    return nameNorm === clean || nameNorm.includes(clean) || clean.includes(nameNorm);
  });
  if (directMatch) return { unit: directMatch, distance: 0 };

  // Fuzzy check on full unit name & aliases
  let bestMatch: AcademicUnitEntry | null = null;
  let lowestDist = Infinity;

  for (const unit of MOI_ACADEMIC_UNITS) {
    const candidates = [unit.name, ...(unit.aliases || [])];
    for (const cand of candidates) {
      const dist = getDamerauLevenshteinDistance(clean, normalize(cand));
      // Allow distance up to 2 for words >= 5 characters, or 3 for phrases >= 10 characters
      const allowed = cand.length > 10 ? 3 : (cand.length >= 5 ? 2 : 1);
      if (dist <= allowed && dist < lowestDist) {
        lowestDist = dist;
        bestMatch = unit;
      }
    }
  }

  return bestMatch ? { unit: bestMatch, distance: lowestDist } : null;
}

/**
 * Detect Semester from keywords or shortcuts (e.g. "sem1", "s1", "sem 2", "semester 1")
 */
export function detectSemester(tokens: string[]): string | undefined {
  const fullText = tokens.join(' ').toLowerCase();

  for (const sem of Object.values(MOI_SEMESTER_MAPPINGS)) {
    if (sem.aliases.some((alias) => fullText.includes(alias) || tokens.includes(alias))) {
      return sem.value;
    }
  }

  // Regex fallback: sem1, sem2, s1, s2
  const match = fullText.match(/\b(?:sem|s|semester)[-_ ]?([12])\b/i);
  if (match) {
    return match[1] === '1' ? 'Semester 1' : 'Semester 2';
  }

  return undefined;
}

/**
 * Detect Year of Study from keywords or shortcuts (e.g. "yr1", "y2", "year 3", "freshman")
 */
export function detectYearOfStudy(tokens: string[]): string | undefined {
  const fullText = tokens.join(' ').toLowerCase();

  for (const yr of MOI_YEARS_OF_STUDY) {
    if (yr.aliases.some((alias) => fullText.includes(alias))) {
      return yr.value;
    }
  }

  // Regex fallback: yr1, y2, year 4
  const match = fullText.match(/\b(?:yr|year|y)[-_ ]?([1-6])\b/i);
  if (match) {
    return `Year ${match[1]}`;
  }

  return undefined;
}

/**
 * Detect Calendar / Exam Year (e.g. 2024, 2023, 2019) from 2000 to 2060
 */
export function detectExamYear(tokens: string[]): number | undefined {
  for (const token of tokens) {
    const num = parseInt(token, 10);
    if (!isNaN(num) && num >= 2000 && num <= 2060) {
      return num;
    }
  }
  return undefined;
}

/**
 * Detect Material Type (e.g. "past paper", "cat", "revision notes", "exam")
 */
export function detectMaterialType(tokens: string[]): { type: string; label: string } | undefined {
  const fullText = tokens.join(' ').toLowerCase();

  for (const mat of Object.values(MOI_MATERIAL_TYPE_MAPPINGS)) {
    if (mat.aliases.some((alias) => fullText.includes(alias))) {
      return { type: mat.type, label: mat.label };
    }
  }

  return undefined;
}

const matchWordOrPhrase = (text: string, phrase: string) => {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  if (normalizedPhrase.length <= 4) {
    const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizedText);
  }
  return normalizedText.includes(normalizedPhrase);
};

/**
 * Detect School or Department
 */
export function detectSchoolOrDepartment(fullText: string): { school?: string; department?: string } {
  const clean = normalize(fullText);

  for (const sch of MOI_ACADEMIC_SCHOOLS) {
    if (sch.aliases.some((alias) => matchWordOrPhrase(clean, alias)) || matchWordOrPhrase(clean, sch.name)) {
      return { school: sch.name };
    }
  }

  for (const dept of MOI_ACADEMIC_DEPARTMENTS) {
    if (dept.aliases.some((alias) => matchWordOrPhrase(clean, alias)) || matchWordOrPhrase(clean, dept.name)) {
      return { school: dept.school, department: dept.name };
    }
  }

  return {};
}

/**
 * Main Smart Search Query Parser.
 * Runs in < 1ms to deconstruct the query, fix typos, extract entities,
 * and provide the "Did you mean?" or "Showing results for..." suggestions.
 */
export function parseSmartSearchQuery(rawQuery: string): ParsedSearchIntent {
  const cleaned = rawQuery.trim();
  // Pre-split glued keywords e.g. "examcsc 111" -> "exam csc 111", "notescsc" -> "notes csc"
  const separatedQuery = cleaned.replace(/\b(exam|exams|pastpaper|pastpapers|paper|papers|cat|cats|note|notes|quiz|solution|solutions)([a-zA-Z]{2,4}\d{0,3})\b/gi, '$1 $2');
  
  // 0. Expand Acronyms and Synonyms (e.g. "os" -> "Operating Systems", "dbms" -> "Database Management Systems")
  const { expandedText, addedKeywords } = expandQueryAcronyms(separatedQuery);
  const isAcronymExpanded = expandedText.toLowerCase() !== separatedQuery.toLowerCase();

  const activeQueryText = isAcronymExpanded ? `${separatedQuery} ${expandedText}` : separatedQuery;
  const tokens = separatedQuery.split(/\s+/).filter(Boolean);
  const expandedTokens = expandedText.split(/\s+/).filter(Boolean);
  const allTokens = Array.from(new Set([...tokens, ...expandedTokens]));
  const stemmedKeywords = allTokens.map(stemToken);

  const chips: ParsedSearchIntent['chips'] = [];

  let detectedUnitCode: string | undefined;
  let detectedUnitName: string | undefined;
  let detectedSchool: string | undefined;
  let detectedDepartment: string | undefined;
  let hasCorrection = false;
  let typoFixedFrom: string | undefined;

  // 1. Check for Unit Code in tokens (both 2-token pairs like "CSC 111" and single tokens like "CSC111")
  for (let i = 0; i < tokens.length; i++) {
    const single = tokens[i];
    const pair = i < tokens.length - 1 ? `${tokens[i]} ${tokens[i + 1]}` : null;

    let match: AcademicUnitEntry | null = null;
    let matchedToken = '';

    if (pair && /^[a-zA-Z]{2,4}[-_ ]?\d{2,3}$/i.test(pair)) {
      match = matchClosestUnitCode(pair);
      if (match) matchedToken = pair;
    }

    if (!match && /^[a-zA-Z]{2,4}[-_ ]?\d{0,3}$/i.test(single)) {
      match = matchClosestUnitCode(single);
      if (match) matchedToken = single;
    }

    if (match) {
      detectedUnitCode = match.code;
      detectedUnitName = detectedUnitName || match.name;
      detectedSchool = detectedSchool || match.school;
      detectedDepartment = detectedDepartment || match.department;
      chips.push({ label: match.code, type: 'unit' });

      if (matchedToken.toUpperCase() !== match.code) {
        hasCorrection = true;
        typoFixedFrom = matchedToken;
      }
      break;
    }
  }

  // 2. Check for Unit Name / Subject (testing raw query first, then expanded acronyms)
  if (!detectedUnitCode || !detectedUnitName) {
    const queriesToTest = isAcronymExpanded ? [cleaned, expandedText] : [cleaned];
    for (const qTest of queriesToTest) {
      const nameMatch = matchClosestUnitName(qTest);
      if (nameMatch) {
        detectedUnitCode = detectedUnitCode || nameMatch.unit.code;
        detectedUnitName = nameMatch.unit.name;
        detectedSchool = detectedSchool || nameMatch.unit.school;
        detectedDepartment = detectedDepartment || nameMatch.unit.department;

        if (!chips.some((c) => c.label === nameMatch.unit.code)) {
          chips.push({ label: nameMatch.unit.code, type: 'unit' });
        }

        if (nameMatch.distance > 0 || isAcronymExpanded) {
          hasCorrection = true;
          typoFixedFrom = cleaned;
        }
        break;
      }
    }
  }

  // 3. Detect Semester (e.g. "sem1", "sem 2", "s1")
  const semester = detectSemester(allTokens);
  if (semester) {
    chips.push({ label: semester, type: 'semester' });
  }

  // 4. Detect Year of Study (e.g. "yr 1", "year 2", "y3")
  const yearOfStudy = detectYearOfStudy(allTokens);
  if (yearOfStudy) {
    chips.push({ label: yearOfStudy, type: 'year' });
  }

  // 5. Detect Calendar / Exam Year (e.g. 2024, 2023)
  const examYear = detectExamYear(tokens);
  if (examYear) {
    chips.push({ label: String(examYear), type: 'year' });
  }

  // 6. Detect Material Type (e.g. "past paper", "cat", "notes")
  const materialType = detectMaterialType(allTokens);
  if (materialType) {
    chips.push({ label: materialType.label, type: 'material' });
  }

  // 7. Detect School / Department if not already matched
  if (!detectedSchool) {
    const schoolOrDept = detectSchoolOrDepartment(activeQueryText);
    if (schoolOrDept.school) {
      detectedSchool = schoolOrDept.school;
      chips.push({ label: schoolOrDept.school, type: 'school' });
    }
    if (schoolOrDept.department) {
      detectedDepartment = schoolOrDept.department;
      chips.push({ label: schoolOrDept.department, type: 'department' });
    }
  }

  // 8. Build the Google-Style "Did You Mean" or "Showing Results For" string
  let didYouMeanText: string | undefined;
  let autoPivotSuggestion: string | undefined;
  let correctedQuery: string | undefined;

  if (detectedUnitCode && detectedUnitName) {
    correctedQuery = `${detectedUnitCode} ${detectedUnitName}`;
    if (semester) correctedQuery += ` ${semester}`;
    if (materialType) correctedQuery += ` ${materialType.label}`;
    if (examYear) correctedQuery += ` ${examYear}`;

    didYouMeanText = `${detectedUnitCode}: ${detectedUnitName}`;
    if (semester || materialType?.label || examYear) {
      const extras = [semester, materialType?.label, examYear].filter(Boolean).join(', ');
      didYouMeanText += ` (${extras})`;
    }
    autoPivotSuggestion = detectedUnitCode;
  } else if (isAcronymExpanded) {
    correctedQuery = expandedText;
    didYouMeanText = expandedText;
    autoPivotSuggestion = expandedText;
    hasCorrection = true;
  } else if (hasCorrection && typoFixedFrom) {
    correctedQuery = cleaned.replace(new RegExp(typoFixedFrom, 'i'), detectedUnitCode || '');
    didYouMeanText = correctedQuery;
  }

  return {
    rawQuery,
    cleanedQuery: cleaned,
    expandedQuery: isAcronymExpanded ? expandedText : undefined,
    unitCode: detectedUnitCode,
    unitName: detectedUnitName,
    semester,
    yearOfStudy,
    examYear,
    materialType: materialType?.type,
    school: detectedSchool,
    department: detectedDepartment,
    keywords: allTokens,
    stemmedKeywords,
    hasCorrection: (hasCorrection || isAcronymExpanded) && Boolean(didYouMeanText),
    correctedQuery,
    didYouMeanText,
    autoPivotSuggestion,
    chips
  };
}
