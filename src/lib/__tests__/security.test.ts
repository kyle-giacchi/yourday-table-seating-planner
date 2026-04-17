import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  stripControlCharacters,
  sanitizeURI,
  safeJSONParse,
  validateHSLValue,
  validateRGBValue,
  validateColorTheme,
  validateInputLength,
  validateGuestName,
  validatePartyName,
} from '@/lib/security';

// ---------------------------------------------------------------------------
// stripControlCharacters
// ---------------------------------------------------------------------------

describe('stripControlCharacters', () => {
  it('returns regular strings unchanged', () => {
    expect(stripControlCharacters('Hello World')).toBe('Hello World');
  });

  it('removes null bytes (U+0000)', () => {
    expect(stripControlCharacters('abc\u0000def')).toBe('abcdef');
  });

  it('removes C0 control characters (U+0001-U+001F)', () => {
    expect(stripControlCharacters('a\u0001b\u001Fc')).toBe('abc');
  });

  it('removes DEL (U+007F) and C1 controls (U+0080-U+009F)', () => {
    expect(stripControlCharacters('a\u007Fb\u0085c')).toBe('abc');
  });

  it('removes zero-width characters', () => {
    expect(stripControlCharacters('a\u200Bb\uFEFFc')).toBe('abc');
  });

  it('removes line separator and paragraph separator', () => {
    expect(stripControlCharacters('a\u2028b\u2029c')).toBe('abc');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error — testing JS runtime behaviour with wrong type
    expect(stripControlCharacters(null)).toBe('');
    // @ts-expect-error — testing JS runtime behaviour with wrong type
    expect(stripControlCharacters(42)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeInput
// ---------------------------------------------------------------------------

describe('sanitizeInput', () => {
  it('passes through a normal name', () => {
    expect(sanitizeInput('John Smith')).toBe('John Smith');
  });

  it('strips angle brackets and other disallowed chars from HTML-like input', () => {
    // < and > are not in the allowlist, so they are removed.
    // Letters, digits, parentheses, and slash ARE allowed.
    // <script>alert(1)</script> → scriptalert(1)/script
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('removes control characters', () => {
    expect(sanitizeInput('John\u0000Smith')).toBe('JohnSmith');
  });

  it('enforces max length of 200 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeInput(long).length).toBe(200);
  });

  it('preserves Unicode letters — José', () => {
    expect(sanitizeInput('José')).toBe('José');
  });

  it('preserves Unicode letters — Müller', () => {
    expect(sanitizeInput('Müller')).toBe('Müller');
  });

  it('preserves Unicode letters — 日本語', () => {
    expect(sanitizeInput('日本語')).toBe('日本語');
  });

  it('preserves hyphen', () => {
    expect(sanitizeInput('Mary-Jane')).toBe('Mary-Jane');
  });

  it('preserves apostrophe', () => {
    expect(sanitizeInput("O'Brien")).toBe("O'Brien");
  });

  it('preserves period', () => {
    expect(sanitizeInput('Dr. Smith')).toBe('Dr. Smith');
  });

  it('preserves comma', () => {
    expect(sanitizeInput('Smith, John')).toBe('Smith, John');
  });

  it('preserves parentheses', () => {
    expect(sanitizeInput('Smith (Jr)')).toBe('Smith (Jr)');
  });

  it('preserves ampersand', () => {
    expect(sanitizeInput('Johnson & Johnson')).toBe('Johnson & Johnson');
  });

  it('preserves forward slash', () => {
    expect(sanitizeInput('and/or')).toBe('and/or');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(sanitizeInput(null)).toBe('');
  });

  it('strips characters outside the allowlist (e.g. curly braces)', () => {
    expect(sanitizeInput('Hello{World}')).toBe('HelloWorld');
  });
});

// ---------------------------------------------------------------------------
// sanitizeURI
// ---------------------------------------------------------------------------

describe('sanitizeURI', () => {
  it('allows https URLs', () => {
    const url = 'https://example.com/path';
    expect(sanitizeURI(url)).toBe(url);
  });

  it('allows http URLs', () => {
    const url = 'http://example.com/path';
    expect(sanitizeURI(url)).toBe(url);
  });

  it('allows mailto URIs', () => {
    const uri = 'mailto:user@example.com';
    expect(sanitizeURI(uri)).toBe(uri);
  });

  it('blocks javascript: scheme', () => {
    expect(sanitizeURI('javascript:alert(1)')).toBe('');
  });

  it('blocks data: scheme', () => {
    expect(sanitizeURI('data:text/html,<h1>hi</h1>')).toBe('');
  });

  it('blocks double-encoded javascript:', () => {
    expect(sanitizeURI('javascript%3Aalert(1)')).toBe('');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(sanitizeURI(null)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeURI('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// safeJSONParse
// ---------------------------------------------------------------------------

describe('safeJSONParse', () => {
  it('parses valid JSON', () => {
    expect(safeJSONParse<{ foo: string }>('{"foo":"bar"}')).toEqual({ foo: 'bar' });
  });

  it('returns null for invalid JSON', () => {
    expect(safeJSONParse('not json at all')).toBeNull();
  });

  it('strips __proto__ keys', () => {
    const result = safeJSONParse<Record<string, unknown>>('{"__proto__":{"polluted":true},"a":1}');
    expect(result).not.toBeNull();
    // __proto__ should not be set as an own property (accessing it returns Object.prototype)
    expect(Object.hasOwn(result!, '__proto__')).toBe(false);
    expect(result!.a).toBe(1);
  });

  it('strips constructor keys', () => {
    const result = safeJSONParse<Record<string, unknown>>('{"constructor":{"name":"evil"},"b":2}');
    expect(result).not.toBeNull();
    // constructor should not be set as an own property (accessing it returns Object.prototype.constructor)
    expect(Object.hasOwn(result!, 'constructor')).toBe(false);
    expect(result!.b).toBe(2);
  });

  it('parses arrays', () => {
    expect(safeJSONParse<number[]>('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// validateHSLValue
// ---------------------------------------------------------------------------

describe('validateHSLValue', () => {
  it('accepts a valid HSL string', () => {
    expect(validateHSLValue('221 83% 41%')).toBe(true);
  });

  it('accepts hue of 0', () => {
    expect(validateHSLValue('0 0% 0%')).toBe(true);
  });

  it('accepts hue of 360', () => {
    expect(validateHSLValue('360 100% 100%')).toBe(true);
  });

  it('rejects missing percent signs', () => {
    expect(validateHSLValue('221 83 41')).toBe(false);
  });

  it('rejects hue out of range (>360)', () => {
    expect(validateHSLValue('361 50% 50%')).toBe(false);
  });

  it('rejects saturation out of range (>100)', () => {
    expect(validateHSLValue('180 101% 50%')).toBe(false);
  });

  it('rejects lightness out of range (>100)', () => {
    expect(validateHSLValue('180 50% 101%')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateHSLValue('')).toBe(false);
  });

  it('rejects non-string input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(validateHSLValue(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateRGBValue
// ---------------------------------------------------------------------------

describe('validateRGBValue', () => {
  it('accepts a valid RGB string', () => {
    expect(validateRGBValue('30, 64, 175')).toBe(true);
  });

  it('accepts RGB with no spaces', () => {
    expect(validateRGBValue('0,0,0')).toBe(true);
  });

  it('accepts max values (255,255,255)', () => {
    expect(validateRGBValue('255, 255, 255')).toBe(true);
  });

  it('rejects a value > 255', () => {
    expect(validateRGBValue('256, 0, 0')).toBe(false);
  });

  it('rejects missing components', () => {
    expect(validateRGBValue('30, 64')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateRGBValue('')).toBe(false);
  });

  it('rejects non-string input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(validateRGBValue(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateColorTheme
// ---------------------------------------------------------------------------

const VALID_THEME = {
  name: 'Ocean Blue',
  value: '221 83% 41%',
  rgb: '30, 64, 175',
  description: 'A cool ocean blue theme',
  secondary: '197 71% 52%',
  secondaryRgb: '55, 163, 196',
};

describe('validateColorTheme', () => {
  it('accepts a valid theme object', () => {
    expect(validateColorTheme(VALID_THEME)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateColorTheme(null)).toBe(false);
  });

  it('rejects missing name', () => {
    const { name: _name, ...rest } = VALID_THEME;
    expect(validateColorTheme(rest)).toBe(false);
  });

  it('rejects missing value field', () => {
    const { value: _value, ...rest } = VALID_THEME;
    expect(validateColorTheme(rest)).toBe(false);
  });

  it('rejects missing rgb field', () => {
    const { rgb: _rgb, ...rest } = VALID_THEME;
    expect(validateColorTheme(rest)).toBe(false);
  });

  it('rejects invalid HSL value', () => {
    expect(validateColorTheme({ ...VALID_THEME, value: 'not-hsl' })).toBe(false);
  });

  it('rejects invalid RGB value', () => {
    expect(validateColorTheme({ ...VALID_THEME, rgb: '999, 0, 0' })).toBe(false);
  });

  it('rejects invalid secondary HSL', () => {
    expect(validateColorTheme({ ...VALID_THEME, secondary: 'bad' })).toBe(false);
  });

  it('rejects invalid secondaryRgb', () => {
    expect(validateColorTheme({ ...VALID_THEME, secondaryRgb: '999,0,0' })).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(validateColorTheme('string')).toBe(false);
    expect(validateColorTheme(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateInputLength
// ---------------------------------------------------------------------------

describe('validateInputLength', () => {
  it('returns true when input is within limit', () => {
    expect(validateInputLength('hello', 10)).toBe(true);
  });

  it('returns true when input is exactly at limit', () => {
    expect(validateInputLength('hello', 5)).toBe(true);
  });

  it('returns false when input exceeds limit', () => {
    expect(validateInputLength('hello!', 5)).toBe(false);
  });

  it('returns false for non-string input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(validateInputLength(null, 10)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGuestName
// ---------------------------------------------------------------------------

describe('validateGuestName', () => {
  it('accepts a valid name', () => {
    expect(validateGuestName('Alice Johnson').valid).toBe(true);
  });

  it("accepts a name with an apostrophe (O'Brien)", () => {
    expect(validateGuestName("O'Brien").valid).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = validateGuestName('');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('rejects null/undefined input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(validateGuestName(null).valid).toBe(false);
  });

  it('rejects a name that is too long (>100 chars after sanitize)', () => {
    const longName = 'A'.repeat(101);
    const result = validateGuestName(longName);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/100/);
  });
});

// ---------------------------------------------------------------------------
// validatePartyName
// ---------------------------------------------------------------------------

describe('validatePartyName', () => {
  it('accepts a valid party name', () => {
    expect(validatePartyName('Johnson Family').valid).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = validatePartyName('');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('rejects null/undefined input', () => {
    // @ts-expect-error — testing runtime behaviour
    expect(validatePartyName(null).valid).toBe(false);
  });

  it('rejects a party name that is too long (>50 chars after sanitize)', () => {
    const longName = 'A'.repeat(51);
    const result = validatePartyName(longName);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/50/);
  });
});
