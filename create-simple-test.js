const XLSX = require('xlsx');

// Create a very simple test file
const simpleData = [
  ['Date', 'Revenue'],
  ['2023-01-01', 1000],
  ['2023-02-01', 1100],
  ['2023-03-01', 1200]
];

const worksheet = XLSX.utils.aoa_to_sheet(simpleData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Data');

XLSX.writeFile(workbook, 'simple-test.xlsx');
console.log('✅ Simple test file created: simple-test.xlsx');
