const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://www.aphis.usda.gov/sites/default/files/hpai-wild-birds.csv';
const outFile = path.join(__dirname, '..', 'data', 'hpai-wild-birds.json');

const COLUMN_MAP = {
  'State': 'State',
  'County': 'County',
  'Collection Date': 'Collection_Date',
  'Date Detected': 'Date_Detected',
  'HPAI Strain': 'HPAI_Strain',
  'Bird Species': 'Bird_species',
  'WOAH Classification': 'WOAH_Classification',
  'Sampling Method': 'Sampling_Method',
  'Submitting Agency': 'Submitting_Agency'
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

https.get(url, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    // Remove BOM if present
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);

    const lines = data.split('\n').filter(l => l.trim());
    const headers = parseCSVLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (vals.length < headers.length) continue;
      const rec = {};
      headers.forEach((h, j) => {
        const key = COLUMN_MAP[h] || h;
        rec[key] = vals[j] || '';
      });
      records.push(rec);
    }

    fs.writeFileSync(outFile, JSON.stringify(records));
    console.log('Wrote ' + records.length.toLocaleString() + ' records to ' + outFile);
  });
}).on('error', err => {
  console.error('Fetch failed:', err.message);
  process.exit(1);
});
