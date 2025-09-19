#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test data
const testInputs = {
  largeCustomers: 5,
  smallMediumCustomers: 50,
  revPerLargeCustomer: 16500,
  revPerSmallMediumCustomer: 3000,
  salesExecutives: 5,
  salesExecutivesAddedPerMonth: 1,
  salesConversionPerExec: 1.5,
  avgSalesCycleMonths: 3,
  rampUpPeriodMonths: 3,
  annualChurnRate: 10,
  grossMarginRate: 70,
  marketingSpend: 10000,
  cac: 1500,
  conversionRate: 45,
  monthlyChurnRate: 2,
  operatingExpenses: 50000,
  cashInBank: 500000,
  operatingExpenseGrowthRate: 0
};

// Prompts that should generate complex tables
const testPrompts = [
  // Time-based forecasts
  "Generate a 6-month financial forecast",
  "Show me a 12-month revenue projection", 
  "Create a 2-year business forecast",
  "What's our 18-month growth projection?",
  "Generate quarterly forecasts for the next year",
  
  // Scenario-based forecasts
  "Show me optimistic, realistic, and pessimistic scenarios for 12 months",
  "What if we double our sales team? Show me the impact",
  "Generate a forecast assuming 20% churn rate",
  "What's our projection if CAC increases to $2000?",
  "Show me the impact of reducing marketing spend by 50%",
  
  // Customer analysis
  "Break down our customer acquisition by segment for 12 months",
  "Show me large vs SMB customer growth projections",
  "Generate a detailed customer cohort analysis",
  "What's our customer lifetime value progression?",
  "Show me churn impact on revenue over 18 months",
  
  // Revenue analysis
  "Generate detailed MRR breakdown by customer type",
  "Show me revenue growth with different ARPU scenarios",
  "What's our revenue projection with 15% price increase?",
  "Generate monthly recurring revenue forecast with seasonality",
  "Show me revenue impact of adding 5 enterprise customers",
  
  // Financial metrics
  "Generate cash flow projections for 12 months",
  "Show me burn rate analysis over time",
  "What's our break-even timeline with current metrics?",
  "Generate profitability forecast with different margins",
  "Show me cash runway under different growth scenarios",
  
  // Unit economics
  "Break down LTV/CAC ratio progression over 24 months",
  "Show me payback period analysis by customer segment",
  "Generate unit economics forecast with scaling",
  "What's our gross margin progression over time?",
  "Show me customer acquisition cost trends",
  
  // Team scaling
  "Show me revenue impact of hiring 10 more sales reps",
  "Generate forecast with 2x marketing team",
  "What's the impact of adding 5 enterprise sales executives?",
  "Show me growth with different sales productivity rates",
  "Generate projection with ramped vs new sales reps",
  
  // Advanced analysis
  "Show me revenue sensitivity to churn rate changes",
  "Generate forecast with CAC sensitivity analysis",
  "What's our revenue sensitivity to conversion rates?",
  "Show me impact of different sales cycle lengths",
  "Generate projection with pricing sensitivity",
  
  // Specific scenarios
  "Generate forecast for Series A fundraising scenario",
  "Show me revenue projections for investor presentation",
  "What's our 3-year growth plan with $2M funding?",
  "Generate forecast showing path to $10M ARR",
  "Show me revenue milestones for next 18 months",
  
  // Detailed breakdowns
  "Break down monthly metrics: MRR, churn, CAC, LTV",
  "Show me quarterly business review metrics",
  "Generate detailed KPI dashboard for 12 months",
  "What's our monthly operating metrics progression?",
  "Show me comprehensive business health indicators"
];

function makeRequest(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: prompt,
      inputs: testInputs
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            prompt,
            success: true,
            hasExplanation: !!response.explanation,
            hasForecast: !!response.forecast,
            responseType: response.responseType,
            explanation: response.explanation?.substring(0, 100) + '...'
          });
        } catch (error) {
          resolve({
            prompt,
            success: false,
            error: error.message,
            rawResponse: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        prompt,
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllPrompts() {
  console.log('🧪 Testing Complex Table Generation Prompts\n');
  console.log(`Testing ${testPrompts.length} prompts...\n`);
  
  const results = [];
  let successCount = 0;
  let forecastCount = 0;
  
  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    process.stdout.write(`[${i + 1}/${testPrompts.length}] Testing: "${prompt}"... `);
    
    const result = await makeRequest(prompt);
    results.push(result);
    
    if (result.success) {
      successCount++;
      if (result.responseType === 'forecast') {
        forecastCount++;
        console.log('✅ FORECAST');
      } else {
        console.log('✅ SUCCESS');
      }
    } else {
      console.log('❌ ERROR');
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total Prompts Tested: ${testPrompts.length}`);
  console.log(`Successful Responses: ${successCount}`);
  console.log(`Forecast Generations: ${forecastCount}`);
  console.log(`Success Rate: ${((successCount / testPrompts.length) * 100).toFixed(1)}%`);
  console.log(`Forecast Rate: ${((forecastCount / testPrompts.length) * 100).toFixed(1)}%`);
  
  console.log('\n❌ FAILED PROMPTS:');
  const failed = results.filter(r => !r.success);
  if (failed.length === 0) {
    console.log('🎉 All prompts worked successfully!');
  } else {
    failed.forEach(f => {
      console.log(`- "${f.prompt}"`);
      console.log(`  Error: ${f.error}`);
    });
  }
  
  console.log('\n📈 FORECAST PROMPTS:');
  const forecasts = results.filter(r => r.responseType === 'forecast');
  forecasts.forEach(f => {
    console.log(`✅ "${f.prompt}"`);
  });
  
  console.log('\n💬 CONVERSATIONAL PROMPTS:');
  const conversational = results.filter(r => r.success && r.responseType !== 'forecast');
  conversational.forEach(c => {
    console.log(`💬 "${c.prompt}"`);
  });
}

// Run the tests
testAllPrompts().catch(console.error);
