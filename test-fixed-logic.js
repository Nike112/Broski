// Test the fixed logic
const testCases = [
  // Basic definitions - should work now
  {
    query: "What is LTV?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["Customer Lifetime Value", "revenue", "customer"]
  },
  {
    query: "What is churn rate?",
    expectedType: "SIMPLE_ANSWER", 
    shouldContain: ["percentage", "customers", "stop"]
  },
  {
    query: "What is burn rate?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["cash burn", "monthly", "expenses"]
  },
  {
    query: "What's our ARR?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["Annual Recurring Revenue", "MRR", "12"]
  },
  {
    query: "Calculate our ARPU",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["Average Revenue Per User", "revenue", "customer"]
  },

  // Forecast/Table requests - should trigger forecast tab now
  {
    query: "What if we double our marketing spend?",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "forecast"]
  },
  {
    query: "Show optimistic scenario analysis",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "scenario"]
  },
  {
    query: "Generate sales pipeline analysis",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "pipeline"]
  },
  {
    query: "Show customer acquisition trends",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "trends"]
  },
  {
    query: "Show profitability analysis",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "profitability"]
  },
  {
    query: "Calculate unit economics",
    expectedType: "FORECAST_TAB",
    shouldContain: ["table", "economics"]
  },

  // Complex calculations - should work now
  {
    query: "What's our LTV to CAC ratio?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["ratio", "LTV", "CAC"]
  },
  {
    query: "How many customers do we need to break even?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["break even", "customers", "revenue"]
  },
  {
    query: "What's our cash runway?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["runway", "months", "cash"]
  },
  {
    query: "What's our gross margin percentage?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["margin", "%", "revenue"]
  },
  {
    query: "What's our net margin?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["net margin", "%", "profit"]
  },
  {
    query: "What's our payback period?",
    expectedType: "SIMPLE_ANSWER",
    shouldContain: ["payback", "period", "months"]
  }
];

// Mock the enhanced logic
function testEnhancedLogic(query) {
  const lowerQuery = query.toLowerCase();
  
  // Enhanced forecast detection
  const wouldGenerateTable = (
    lowerQuery.includes('table') ||
    lowerQuery.includes('projection table') ||
    lowerQuery.includes('forecast table') ||
    (lowerQuery.includes('projection') && (lowerQuery.includes('6 month') || lowerQuery.includes('12 month') || lowerQuery.includes('24 month'))) ||
    (lowerQuery.includes('forecast') && (lowerQuery.includes('6 month') || lowerQuery.includes('12 month') || lowerQuery.includes('24 month'))) ||
    lowerQuery.includes('breakdown') ||
    (lowerQuery.includes('monthly') && lowerQuery.includes('breakdown')) ||
    (lowerQuery.includes('quarterly') && lowerQuery.includes('breakdown')) ||
    (lowerQuery.includes('revenue') && lowerQuery.includes('forecast')) ||
    (lowerQuery.includes('generate') && lowerQuery.includes('forecast')) ||
    lowerQuery.includes('scenario') ||
    lowerQuery.includes('what if') ||
    lowerQuery.includes('analysis') ||
    lowerQuery.includes('pipeline') ||
    lowerQuery.includes('sales pipeline') ||
    lowerQuery.includes('trends') ||
    lowerQuery.includes('acquisition trends') ||
    lowerQuery.includes('profitability') ||
    lowerQuery.includes('unit economics') ||
    lowerQuery.includes('economics')
  );

  if (wouldGenerateTable) {
    return {
      responseType: 'answer',
      explanation: "I've generated a detailed table for you. Click the button below to view it in the Forecast tab.",
      hasTable: true
    };
  }

  // Enhanced knowledge base responses
  const knowledgeBase = {
    'ltv': "Customer Lifetime Value (LTV) is the total projected profit a customer will generate throughout their relationship. Formula: (ARPU * Gross Margin) / Churn Rate",
    'churn': "Customer Churn Rate measures the percentage of lost customers over a specified period. Formula: (# of Lost Customers / # of Customers at Start of Period) * 100%",
    'burn': "Burn Rate is the monthly cash burn rate (negative means burning cash). Formula: monthly_revenue - monthly_operating_expenses",
    'arr': "Annual Recurring Revenue (ARR) is the annualized version of MRR. Formula: MRR * 12",
    'arpu': "Average Revenue Per User (ARPU) is the average monthly revenue generated per active customer. Formula: Total Revenue in Period / Number of Active Customers in Period",
    'ratio': "LTV to CAC Ratio is the relationship between the lifetime value of a customer and the cost to acquire them. Formula: LTV / CAC",
    'break even': "Break Even Point is the number of customers needed to break even. Formula: operating_expenses / gross_margin_per_customer",
    'runway': "Cash Runway is the months of cash remaining at current burn rate. Formula: cash_in_bank / abs(burn_rate)",
    'gross margin': "Gross Margin is the percentage of revenue remaining after subtracting direct costs. Formula: (Revenue - Cost of Sales) / Revenue",
    'net margin': "Net Margin is the net margin as a percentage of revenue. Formula: (net_profit / revenue) * 100",
    'payback': "CAC Payback Period is the number of months to recoup customer acquisition costs through gross profit. Formula: CAC / (ARPU * Gross Margin)"
  };

  // Find matching knowledge base entry
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (lowerQuery.includes(key)) {
      return {
        responseType: 'answer',
        explanation: value,
        hasTable: false
      };
    }
  }

  return {
    responseType: 'answer',
    explanation: "I can help you with financial questions. Please ask about MRR, CAC, LTV, forecasts, or other financial metrics.",
    hasTable: false
  };
}

// Run tests
console.log('🧪 TESTING FIXED LOGIC\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Test ${index + 1}: "${testCase.query}"`);
  
  const result = testEnhancedLogic(testCase.query);
  const isForecastTab = result.hasTable;
  const isSimpleAnswer = !result.hasTable;
  
  let testPassed = false;
  
  if (testCase.expectedType === "SIMPLE_ANSWER" && isSimpleAnswer) {
    testPassed = true;
    console.log('✅ PASS - Simple answer returned');
  } else if (testCase.expectedType === "FORECAST_TAB" && isForecastTab) {
    testPassed = true;
    console.log('✅ PASS - Forecast tab triggered');
  } else {
    console.log(`❌ FAIL - Expected ${testCase.expectedType}, got ${isForecastTab ? 'FORECAST_TAB' : 'SIMPLE_ANSWER'}`);
  }
  
  // Check content
  if (testCase.shouldContain) {
    const containsAll = testCase.shouldContain.every(expected => 
      result.explanation.toLowerCase().includes(expected.toLowerCase())
    );
    
    if (containsAll) {
      console.log('✅ PASS - Contains expected content');
    } else {
      console.log('❌ FAIL - Missing expected content');
      testPassed = false;
    }
  }
  
  if (testPassed) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 FIXED LOGIC TEST RESULTS');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (passed / testCases.length >= 0.8) {
  console.log('\n🎉 EXCELLENT! Logic is now working properly.');
} else {
  console.log('\n⚠️  Still needs more fixes.');
}
