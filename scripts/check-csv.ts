/**
 * Validates products.csv: confirms every row has the same column count as the
 * header (the usual cause of a Shopify "Missing image source data" import error).
 * Run: pnpm check:csv
 */
import { readFileSync } from 'node:fs';

function parse(str: string): string[][] {
  const rows: string[][] = [];
  let f = '';
  let row: string[] = [];
  let q = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (q) {
      if (c === '"') {
        if (str[i + 1] === '"') {
          f += '"';
          i++;
        } else {
          q = false;
        }
      } else {
        f += c;
      }
    } else {
      if (c === '"') q = true;
      else if (c === ',') {
        row.push(f);
        f = '';
      } else if (c === '\n') {
        row.push(f);
        rows.push(row);
        row = [];
        f = '';
      } else if (c === '\r') {
        /* skip */
      } else {
        f += c;
      }
    }
  }
  if (f.length || row.length) {
    row.push(f);
    rows.push(row);
  }
  return rows;
}

const s = readFileSync('products.csv', 'utf8');
const rows = parse(s).filter((r) => r.length > 1 || (r[0] && r[0] !== ''));
const head = rows[0];
console.log('Header columns:', head.length);

let ok = true;
rows.forEach((r, i) => {
  if (r.length !== head.length) {
    ok = false;
    console.log(`Row ${i} has ${r.length} cols :: ${r[0]} | ${r[1]}`);
  }
});

console.log('Total rows (incl header):', rows.length);
console.log('Products/variants:', rows.slice(1).map((r) => `${r[0]}${r[1] ? '' : ' (variant)'}`).join(', '));
console.log(ok ? '✓ All rows match header column count' : '✗ Column mismatch');
