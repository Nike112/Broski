#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test queries
const testQueries = [
  'Generate 11-month financial projections',
  'Show me our cash flow forecast for next 6 months',
  'What will our revenue look like over the next 12 months?',
  'Create a burn rate analysis',
  'Generate customer acquisition forecast',
  'Show me break-even analysis',
  'What\'s our runway with current burn rate?',
  'Project our MRR growth for next 8 months'
];

function makeRequest(query, index = 0) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `http://localhost:3000/api/search?query=${encodedQuery}`;
    
    console.log(`\n🧪 Test ${index + 1}: "${query}"`);
    console.log(`📡 URL: ${url}`);
    
    const request = http.get(url, (response) => {
      const contentType = response.headers['content-type'];
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📄 Content-Type: ${contentType}`);
      
      if (contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        // Excel file response
        const filename = `test_forecast_${index + 1}.xlsx`;
        const filepath = path.join(__dirname, filename);
        const fileStream = fs.createWriteStream(filepath);
        
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          console.log(`✅ Excel file saved: ${filename}`);
          resolve({ type: 'excel', filename, status: response.status });
        });
      } else {
        // JSON response
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            console.log(`📋 JSON Response:`, JSON.stringify(jsonData, null, 2));
            resolve({ type: 'json', data: jsonData, status: response.status });
          } catch (e) {
            console.log(`📝 Text Response:`, data);
            resolve({ type: 'text', data, status: response.status });
          }
        });
      }
    });
    
    request.on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
      reject(error);
    });
    
    request.setTimeout(30000, () => {
      console.error(`⏰ Timeout after 30 seconds`);
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('Make sure your Next.js server is running on http://localhost:3000\n');
  
  const results = [];
  
  for (let i = 0; i < testQueries.length; i++) {
    try {
      const result = await makeRequest(testQueries[i], i);
      results.push({ query: testQueries[i], ...result });
      
      // Wait 1 second between requests
      if (i < testQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
      results.push({ query: testQueries[i], error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const excelFiles = results.filter(r => r.type === 'excel').length;
  const jsonResponses = results.filter(r => r.type === 'json').length;
  const textResponses = results.filter(r => r.type === 'text').length;
  const errors = results.filter(r => r.error).length;
  
  console.log(`✅ Excel files generated: ${excelFiles}`);
  console.log(`📋 JSON responses: ${jsonResponses}`);
  console.log(`📝 Text responses: ${textResponses}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 Total tests: ${results.length}`);
  
  if (excelFiles > 0) {
    console.log('\n📁 Generated Excel files:');
    results.filter(r => r.type === 'excel').forEach(r => {
      console.log(`   • ${r.filename}`);
    });
  }
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const request = http.get('http://localhost:3000', (response) => {
      resolve(true);
    });
    
    request.on('error', () => {
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server not running on http://localhost:3000');
    console.log('💡 Please start your Next.js server first:');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running!');
  await runTests();
}

main().catch(console.error);
