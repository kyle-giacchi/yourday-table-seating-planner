import { describe, it, expect } from 'vitest';
import { parseCSVFile } from '@/lib/fileUtils';

const makeCsvFile = (content: string, name = 'guests.csv'): File =>
  new File([content], name, { type: 'text/csv' });

describe('parseCSVFile — header detection', () => {
  it('imports a header-less CSV as-is', async () => {
    const csv = 'Alice,Smith,Smith Family,Chicken,Table 1\nBob,Jones,Jones Family,Beef,';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].firstName).toBe('Alice');
    expect(result.data[1].firstName).toBe('Bob');
  });

  it('skips the header row when first row looks like our template (First/Last/Party)', async () => {
    const csv =
      '"First Name","Last Name","Party Name","Meal Selection","Table"\r\n' +
      '"John","Doe","Smith Family","Chicken","Table 1"\r\n' +
      '"Jane","Smith","Smith Family","Vegetarian","Table 2"\r\n';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].firstName).toBe('John');
    expect(result.data[1].firstName).toBe('Jane');
    // Crucially the header row itself did NOT become a guest
    expect(result.data.some((d) => d.firstName === 'First Name')).toBe(false);
  });

  it('handles the exact downloaded-template round-trip with BOM + CRLF', async () => {
    const csv =
      '\uFEFF"First Name","Last Name","Party Name","Meal Selection","Table"\r\n' +
      '"John","Doe","Smith Family","Chicken","Table 1"\r\n' +
      '"Jane","Smith","Smith Family","Vegetarian","Table 2"\r\n';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('rejects a CSV whose first row looks like a different header (wrong columns)', async () => {
    const csv = 'Name,Email,Phone\nAlice,a@x.com,555-1234\n';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/header doesn't match/i);
    expect(result.data).toHaveLength(0);
  });

  it('preserves commas inside quoted fields', async () => {
    const csv = '"Smith, Jr.","O\'Brien","Smith, Inc.",Chicken,Table 1\n';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(true);
    expect(result.data[0].firstName).toBe('Smith, Jr.');
    expect(result.data[0].lastName).toBe("O'Brien");
    expect(result.data[0].partyName).toBe('Smith, Inc.');
  });

  it('flags rows with missing required fields', async () => {
    const csv = 'Alice,,Smith Family,Chicken,\n';
    const result = await parseCSVFile(makeCsvFile(csv));

    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Missing required fields/i);
  });

  it('returns success:true + empty data for a completely empty file', async () => {
    const result = await parseCSVFile(makeCsvFile(''));
    expect(result.data).toHaveLength(0);
    // An empty file has no errors and therefore success === true
    expect(result.errors).toHaveLength(0);
  });

  it('rejects files exceeding the 500-row cap', async () => {
    const rows = Array.from(
      { length: 501 },
      (_, i) => `First${i},Last${i},Party ${i},Chicken,`,
    ).join('\n');
    const result = await parseCSVFile(makeCsvFile(rows));
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/maximum of 500 rows/i);
  });

  it('skipEmptyLines leaves blank lines out of the data array', async () => {
    const csv = 'Alice,Smith,Smith Family,,\n\n\nBob,Jones,Jones Family,,\n';
    const result = await parseCSVFile(makeCsvFile(csv));
    expect(result.data).toHaveLength(2);
  });
});
