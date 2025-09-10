// src/utils/parsers/alphaParsers.js
// Robust parsers for alphanumeric products (NOTAM, METAR, TAF, SIGMET, AIRMET, PIREP, Upper Winds)
// Goal: always prefer human readable raw text and handle multiple shapes the API may return.

function stripSurroundingParens(s) {
  if (!s) return '';
  s = String(s).trim();
  if (s.startsWith('(') && s.endsWith(')')) {
    return s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Try to normalize any "raw" like value into a plain text string.
 * Handles:
 * - direct string raw
 * - raw that is JSON encoded (double encoded)
 * - objects with raw/text/english/french fields
 * - arrays (will be stringified)
 */
function extractRawField(val) {
  if (val === null || val === undefined) return '';

  // If it's already a string, try to parse JSON inside it if it looks encoded
  if (typeof val === 'string') {
    let s = val.trim();

    // If the string itself is a JSON object/array, try to parse it and extract nested raw/text
    if ((s.startsWith('{') || s.startsWith('[')) ) {
      try {
        const parsed = JSON.parse(s);
        // prefer parsed.raw / parsed.text / parsed.english
        if (parsed && typeof parsed === 'object') {
          if (parsed.english && typeof parsed.english === 'string' && parsed.english.trim()) return stripSurroundingParens(parsed.english);
          if (parsed.raw && typeof parsed.raw === 'string' && parsed.raw.trim()) return stripSurroundingParens(parsed.raw);
          if (parsed.text && typeof parsed.text === 'string' && parsed.text.trim()) return stripSurroundingParens(parsed.text);
          // fallback to stringify parsed (but not ideal)
          return JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        // not JSON, continue
      }
    }

    // plain string, remove surrounding parentheses if present
    return stripSurroundingParens(s);
  }

  // If it's an object, try common keys
  if (typeof val === 'object') {
    // If it's an Array, join items if primitives or stringify
    if (Array.isArray(val)) {
      // If array of strings, join with double line breaks
      if (val.every(v => typeof v === 'string')) {
        return val.map(v => stripSurroundingParens(v)).join('\n\n');
      }
      try {
        return JSON.stringify(val, null, 2);
      } catch {}
    }

    // prefer english / french / raw / text / body keys
    const preferred = ['english', 'raw', 'text', 'body', 'report', 'metar', 'taf', 'message', 'remarks'];
    for (const k of preferred) {
      if (val[k] && typeof val[k] === 'string' && val[k].trim()) {
        return stripSurroundingParens(val[k]);
      }
    }

    // If object contains nested raw fields as object, try to dig one level
    for (const k of Object.keys(val)) {
      const v = val[k];
      if (typeof v === 'string' && v.trim().length > 0) {
        // if this string looks like a raw notam block (contains "E)" or "Q)"), return it
        if (v.includes('E)') || v.includes('Q)') || v.includes('NOTAM')) {
          return stripSurroundingParens(v);
        }
      }
    }

    // last resort: stringify the object
    try {
      return JSON.stringify(val, null, 2);
    } catch (err) {
      return String(val);
    }
  }

  // Fallback primitive conversion
  return String(val);
}

/**
 * Public parser used by UI to get a plain text representation for alpha products.
 * Preference order:
 *  - item.english (if string and present)
 *  - item.raw (if present)
 *  - item.text, item.body, item.report, item.metar, item.taf
 *  - if item is string -> return it cleaned
 *  - fallback to JSON.stringify(item)
 */
export function parseRawAlpha(item) {
  if (item === null || item === undefined) return '';

  // If item is already a string, return cleaned version
  if (typeof item === 'string') return extractRawField(item);

  // Item is object: prefer explicit english/french textual fields
  if (item.english && typeof item.english === 'string' && item.english.trim()) {
    return extractRawField(item.english);
  }
  if (item.french && typeof item.french === 'string' && item.french.trim()) {
    return extractRawField(item.french);
  }

  // Common 'raw' location
  if (item.raw) return extractRawField(item.raw);

  // Other common fields
  const otherFields = ['text', 'body', 'report', 'metar', 'taf', 'message', 'remarks'];
  for (const f of otherFields) {
    if (item[f] && (typeof item[f] === 'string' || typeof item[f] === 'object')) {
      return extractRawField(item[f]);
    }
  }

  // item might itself be an array of objects (e.g., API returns array)
  if (Array.isArray(item)) {
    // join multiple entries with separators
    const parts = item.map(it => (typeof it === 'string' ? extractRawField(it) : parseRawAlpha(it)));
    return parts.join('\n\n');
  }

  // If item has nested `data` with array, attempt to extract each entry
  if (item.data && Array.isArray(item.data)) {
    const parts = item.data.map(d => parseRawAlpha(d));
    return parts.join('\n\n');
  }

  // Fallback to safe stringify
  try {
    return JSON.stringify(item, null, 2);
  } catch {
    return String(item);
  }
}

// --- UPPER WINDS parser --- (unchanged aside from exporting only parseUpperWind)
export function parseUpperWind(item) {
  let arr;
  try {
    arr = typeof item.text === 'string' ? JSON.parse(item.text) : item.text || item;
  } catch {
    return { error: 'Malformed upperwind data', raw: item.text || item };
  }

  if (!Array.isArray(arr)) {
    return { error: 'Upper wind payload is not an array', raw: arr };
  }

  const [
    zone,
    source,
    issueTime,
    validStart,
    validEnd,
    frameStart,
    frameEnd,
    unused1,
    unused2,
    unused3,
    unused4,
    levels
  ] = arr;

  const parsedLevels = Array.isArray(levels)
    ? levels.map(lvl => ({
        altitude_ft: lvl[0],
        wind_dir: lvl[1],
        wind_spd: lvl[2],
        temp_c: lvl[3],
        flag: lvl[4]
      }))
    : [];

  const site = item.site || item.station || item.icao || zone || '';

  // infer usePeriod if frameStart/frameEnd present
  let usePeriod = '';
  try {
    if (frameStart && frameEnd) {
      const s = new Date(frameStart).getUTCHours().toString().padStart(2, '0');
      const e = new Date(frameEnd).getUTCHours().toString().padStart(2, '0');
      usePeriod = `${s}-${e}`;
    }
  } catch {}

  return {
    id: item.pk || item.ID || item.id || '',
    site,
    zone,
    source,
    issueTime,
    validStart,
    validEnd,
    frameStart,
    frameEnd,
    usePeriod,
    levels: parsedLevels
  };
}
