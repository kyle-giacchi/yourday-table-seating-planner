import type { ColorTheme } from '@/types/appData';

// Strip null bytes and Unicode control characters
// Removes: C0 controls (U+0000-U+001F), DEL (U+007F), C1 controls (U+0080-U+009F),
// and zero-width/invisible characters (U+200B-U+200F, U+FEFF, U+2028-U+2029).
export const stripControlCharacters = (str: string): string => {
  if (typeof str !== 'string') return '';
  return (
    str
      // eslint-disable-next-line no-control-regex -- intentionally matches C0/DEL/C1 control chars for sanitization
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // C0, DEL, C1 controls
      .replace(/[\u200B-\u200F\uFEFF\u2028\u2029]/g, '')
  ); // Zero-width / line-separator chars
};

// Allowlist-based input sanitization for name/text fields.
// Permits: Unicode letters (any language), digits, spaces, hyphens, apostrophes,
// periods, commas, parentheses, ampersand (literal), and hash.
// Strips control characters, then HTML-encodes the five characters that are
// meaningful in HTML/XML so the value is safe to render.
// Max length enforced at 200 characters.
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';

  // 1. Strip control / zero-width characters first
  let cleaned = stripControlCharacters(input);

  // 2. Trim and enforce max length
  cleaned = cleaned.trim().slice(0, 200);

  // 3. Allowlist: keep only characters that are valid in a human name or
  //    short descriptive field.  Unicode letter/number categories are matched
  //    with the \p{L} and \p{N} Unicode property escapes (ES2018+, supported
  //    by all evergreen browsers and Node 10+).
  //    Allowed punctuation: space, hyphen, apostrophe, period, comma,
  //    parentheses, ampersand, forward-slash (for "and/or" style values).
  cleaned = cleaned.replace(/[^\p{L}\p{N} \-'.,()/&]/gu, '');

  // Note: HTML-encoding is NOT applied here because React already escapes
  // values during JSX rendering.  Encoding at the storage layer would cause
  // double-encoding on every save cycle (e.g. O'Brien → O&#x27;Brien → …).

  return cleaned;
};

// Sanitize a URI to only allow safe schemes.
// Returns the original URI (trimmed) when the scheme is http, https, or mailto.
// Returns an empty string for anything else (javascript:, data:, vbscript:, etc.).
export const sanitizeURI = (uri: string): string => {
  if (typeof uri !== 'string') return '';
  const trimmed = uri.trim();
  if (trimmed === '') return '';

  // Decode percent-encoding iteratively until the string stabilises,
  // preventing double-encoding bypasses like javascript%253Aalert(1).
  let decoded = trimmed;
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  // Strip control characters from the decoded form before scheme check.
  const normalised = stripControlCharacters(decoded).toLowerCase().replace(/\s/g, '');

  const ALLOWED_SCHEMES = ['https:', 'http:', 'mailto:'];
  if (ALLOWED_SCHEMES.some((scheme) => normalised.startsWith(scheme))) {
    return trimmed;
  }

  return '';
};

// Validate and limit input length
export const validateInputLength = (input: string, maxLength: number): boolean => {
  return typeof input === 'string' && input.length <= maxLength;
};

// Validate guest name input
export const validateGuestName = (name: string): { valid: boolean; message?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }

  const sanitized = sanitizeInput(name);
  if (sanitized.length === 0) {
    return { valid: false, message: 'Name contains invalid characters' };
  }

  if (sanitized.length > 100) {
    return { valid: false, message: 'Name must be less than 100 characters' };
  }

  return { valid: true };
};

// Validate party name input
export const validatePartyName = (party: string): { valid: boolean; message?: string } => {
  if (!party || typeof party !== 'string') {
    return { valid: false, message: 'Party name is required' };
  }

  const sanitized = sanitizeInput(party);
  if (sanitized.length === 0) {
    return { valid: false, message: 'Party name contains invalid characters' };
  }

  if (sanitized.length > 50) {
    return { valid: false, message: 'Party name must be less than 50 characters' };
  }

  return { valid: true };
};

// Validate meal selection
export const validateMealSelection = (
  meal: string,
  validOptions: string[],
): { valid: boolean; message?: string } => {
  if (!meal || typeof meal !== 'string') {
    return { valid: false, message: 'Meal selection is required' };
  }

  if (!validOptions.includes(meal)) {
    return { valid: false, message: 'Invalid meal selection' };
  }

  return { valid: true };
};

// Safe data validation for storage
export const validateStorageData = (data: unknown): boolean => {
  try {
    if (!data || typeof data !== 'object') return false;

    // Check data size (prevent localStorage abuse)
    const dataString = JSON.stringify(data);
    if (dataString.length > 5 * 1024 * 1024) {
      // 5MB limit
      return false;
    }

    return true;
  } catch (error) {
    console.error('Data validation failed:', error);
    return false;
  }
};

// Generic error messages that don't expose system details
export const getGenericErrorMessage = (context: string): string => {
  const messages: { [key: string]: string } = {
    guest: 'Unable to process guest information. Please try again.',
    table: 'Unable to process table information. Please try again.',
    storage: 'Unable to save data. Please try again.',
    validation: 'Please check your input and try again.',
    default: 'An error occurred. Please try again.',
  };

  return messages[context] || messages['default'];
};

// Sanitize all string fields of a guest object at once.
// Safe to call with partial objects — only fields that are present are sanitized.
export const sanitizeGuestData = (guest: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  party?: string;
  mealSelection?: string;
}): typeof guest => {
  const result: typeof guest = { ...guest };

  if (typeof result.firstName === 'string') {
    result.firstName = sanitizeInput(result.firstName);
  }
  if (typeof result.lastName === 'string') {
    result.lastName = sanitizeInput(result.lastName);
  }
  if (typeof result.fullName === 'string') {
    result.fullName = sanitizeInput(result.fullName);
  }
  if (typeof result.party === 'string') {
    result.party = sanitizeInput(result.party);
  }
  // mealSelection is validated against an allowlist elsewhere, but strip
  // control characters and limit length as a baseline defence.
  if (typeof result.mealSelection === 'string') {
    result.mealSelection = stripControlCharacters(result.mealSelection).trim().slice(0, 100);
  }

  return result;
};

// Prototype-pollution-safe JSON.parse wrapper.
// Blocks __proto__, constructor, and prototype keys in any parsed object.
// Returns null when the string is not valid JSON or when parsing fails.
export function safeJSONParse<T>(str: string): T | null {
  try {
    return JSON.parse(str, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    }) as T;
  } catch {
    return null;
  }
}

// --- Config import validation ---

// Validate HSL value string format: "H S% L%" where H is 0-360, S and L are 0-100.
// Accepts the CSS custom property format used by shadcn/ui (space-separated, no commas).
export const validateHSLValue = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Pattern: 1-3 digit hue, space(s), 1-3 digit saturation with %, space(s), 1-3 digit lightness with %
  const match = trimmed.match(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/);
  if (!match) return false;

  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);

  return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
};

// Validate RGB value string format: "R, G, B" where each component is 0-255.
export const validateRGBValue = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Pattern: three groups of 1-3 digits separated by comma + optional whitespace
  const match = trimmed.match(/^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/);
  if (!match) return false;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
};

// Validate a ColorTheme object — all fields must match expected formats.
// Prevents CSS injection by ensuring HSL and RGB values conform to strict patterns.
export const validateColorTheme = (theme: unknown): theme is ColorTheme => {
  if (!theme || typeof theme !== 'object') return false;
  const t = theme as Record<string, unknown>;

  return (
    typeof t.name === 'string' &&
    t.name.length > 0 &&
    t.name.length <= 50 &&
    typeof t.value === 'string' &&
    validateHSLValue(t.value) &&
    typeof t.rgb === 'string' &&
    validateRGBValue(t.rgb) &&
    typeof t.description === 'string' &&
    t.description.length <= 200 &&
    typeof t.secondary === 'string' &&
    validateHSLValue(t.secondary) &&
    typeof t.secondaryRgb === 'string' &&
    validateRGBValue(t.secondaryRgb)
  );
};

/** RoomRectangle shape check: all coordinate/dimension fields must be finite numbers. */
const isValidRoomRect = (r: unknown): boolean => {
  if (!r || typeof r !== 'object') return false;
  const rect = r as Record<string, unknown>;
  return (
    typeof rect.x === 'number' &&
    isFinite(rect.x) &&
    typeof rect.y === 'number' &&
    isFinite(rect.y) &&
    typeof rect.width === 'number' &&
    isFinite(rect.width) &&
    typeof rect.height === 'number' &&
    isFinite(rect.height)
  );
};

/** Validate optional imageOpacity (number in [0, 1]) when present. */
const isValidImageOpacity = (value: unknown): boolean => {
  if (value === undefined) return true;
  return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 1;
};

/** Max encoded size for an inline data:image URI (~3MB base64 ≈ ~2MB binary). */
const MAX_BG_DATA_URI_BYTES = 4 * 1024 * 1024;

/** Background image value must be null/undefined, a data:image/ URI, or a safe URL. */
const isValidBackgroundImageValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const isDataUri = value.startsWith('data:image/');
  if (isDataUri) return value.length <= MAX_BG_DATA_URI_BYTES;
  return sanitizeURI(value) !== '';
};

/** Validate the optional backgroundImage settings sub-object. */
const isValidBackgroundImageSettings = (bg: unknown): boolean => {
  if (!bg || typeof bg !== 'object') return true;
  const obj = bg as Record<string, unknown>;
  return isValidImageOpacity(obj.imageOpacity) && isValidBackgroundImageValue(obj.backgroundImage);
};

// Validate an AppSettings structure — ensures room rectangles have valid numeric
// coordinates and background image settings have the correct types.
export const validateAppSettings = (settings: unknown): boolean => {
  if (!settings || typeof settings !== 'object') return false;
  const s = settings as Record<string, unknown>;

  if (!isValidRoomRect(s.roomOutline) || !isValidRoomRect(s.roomBorder)) return false;
  if (typeof s.isReferenceLocked !== 'boolean') return false;
  return isValidBackgroundImageSettings(s.backgroundImage);
};
