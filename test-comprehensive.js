// Comprehensive Test Suite for AI Financial Agent
const testCases = [
  // Basic Financial Questions
  {
    query: "What is MRR?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["Monthly Recurring Revenue", "customers", "ARPU"]
  },
  {
    query: "What is CAC?",
    expectedType: "SIMPLE_ANSWER", 
    expectedContains: ["Customer Acquisition Cost", "Total Sales", "Marketing Expenses"]
  },
  {
    query: "What is LTV?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["Customer Lifetime Value", "revenue", "customer"]
  },
  {
    query: "What is churn rate?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["percentage", "customers", "stop using"]
  },
  {
    query: "What is burn rate?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["cash burn", "monthly", "expenses"]
  },

  // Calculation Questions
  {
    query: "Calculate our MRR",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["$", "customers", "ARPU"]
  },
  {
    query: "What's our current revenue?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["$", "revenue"]
  },
  {
    query: "Show me our customer count",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["customers", "large", "small"]
  },

  // Forecast/Table Requests
  {
    query: "Generate 12 month forecast",
    expectedType: "FORECAST_TAB",
    expectedContains: ["table", "forecast"]
  },
  {
    query: "Create revenue projection table",
    expectedType: "FORECAST_TAB",
    expectedContains: ["table", "projection"]
  },
  {
    query: "Show monthly breakdown",
    expectedType: "FORECAST_TAB",
    expectedContains: ["table", "breakdown"]
  },
  {
    query: "Generate 24-month revenue forecast",
    expectedType: "FORECAST_TAB",
    expectedContains: ["table", "forecast"]
  },
  {
    query: "Provide a projection table for 6 months",
    expectedType: "FORECAST_TAB",
    expectedContains: ["table", "projection"]
  },

  // Complex Business Questions
  {
    query: "What's our LTV to CAC ratio?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["ratio", "LTV", "CAC"]
  },
  {
    query: "How many customers do we need to break even?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["break even", "customers", "revenue"]
  },
  {
    query: "What's our cash runway?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["runway", "months", "cash"]
  },
  {
    query: "Show me our gross margin percentage",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["margin", "%", "revenue"]
  },

  // Scenario Analysis
  {
    query: "What if we double our marketing spend?",
    expectedType: "FORECAST_TAB",
    expectedContains: ["scenario", "marketing", "double"]
  },
  {
    query: "Show optimistic scenario analysis",
    expectedType: "FORECAST_TAB",
    expectedContains: ["scenario", "optimistic"]
  },

  // Sales Pipeline Questions
  {
    query: "Generate sales pipeline analysis",
    expectedType: "FORECAST_TAB",
    expectedContains: ["pipeline", "analysis"]
  },
  {
    query: "What's our sales conversion rate?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["conversion", "rate", "%"]
  },

  // Growth Questions
  {
    query: "What's our customer growth rate?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["growth", "rate", "%"]
  },
  {
    query: "Show customer acquisition trends",
    expectedType: "FORECAST_TAB",
    expectedContains: ["acquisition", "trends"]
  },

  // Revenue Questions
  {
    query: "What's our ARR?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["Annual Recurring Revenue", "MRR", "12"]
  },
  {
    query: "Calculate our ARPU",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["Average Revenue Per User", "revenue", "customer"]
  },

  // Profitability Questions
  {
    query: "What's our net margin?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["net margin", "%", "profit"]
  },
  {
    query: "Show profitability analysis",
    expectedType: "FORECAST_TAB",
    expectedContains: ["profitability", "analysis"]
  },

  // Unit Economics
  {
    query: "What's our payback period?",
    expectedType: "SIMPLE_ANSWER",
    expectedContains: ["payback", "period", "months"]
  },
  {
    query: "Calculate unit economics",
    expectedType: "FORECAST_TAB",
    expectedContains: ["unit economics", "CAC", "LTV"]
  }
];

// Mock the getFinancialForecast function for testing
async function testGetFinancialForecast(query, inputs) {
  const lowerQuery = query.toLowerCase();
  
  // Load financial formulas (mock)
  const formulas = {
    "mrr": {
      "name": "Monthly Recurring Revenue",
      "description": "Total predictable recurring income from all paying customers per month.",
      "formula": "# of paying customers * ARPU per month"
    },
    "cac": {
      "name": "Customer Acquisition Cost", 
      "description": "Total cost to acquire a new, paying customer.",
      "formula": "Total Sales & Marketing Expenses / # of New Customers Acquired"
    }
  };

  // Check if this would generate a huge table
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
    (lowerQuery.includes('generate') && lowerQuery.includes('forecast'))
  );

  if (wouldGenerateTable) {
    return {
      responseType: 'answer',
      explanation: "I've generated a detailed table for you. Click the button below to view it in the Forecast tab.",
      forecast: "mock_forecast_data",
      hasTable: true
    };
  }

  // Simple answer
  if (lowerQuery.includes('mrr')) {
    return {
      responseType: 'answer',
      explanation: "Monthly Recurring Revenue (MRR) is the total predictable recurring income from all paying customers per month. Formula: # of paying customers * ARPU per month",
      hasTable: false
    };
  }

  if (lowerQuery.includes('cac')) {
    return {
      responseType: 'answer', 
      explanation: "Customer Acquisition Cost (CAC) is the total cost to acquire a new, paying customer. Formula: Total Sales & Marketing Expenses / # of New Customers Acquired",
      hasTable: false
    };
  }

  return {
    responseType: 'answer',
    explanation: "I can help you with financial questions. Please ask about MRR, CAC, LTV, forecasts, or other financial metrics.",
    hasTable: false
  };
}

// Run comprehensive tests
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE AI AGENT TEST SUITE\n');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: "${testCase.query}"`);
    
    try {
      const result = await testGetFinancialForecast(testCase.query, {});
      
      // Check response type
      const isForecastTab = result.hasTable && result.forecast;
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
      if (testCase.expectedContains) {
        const containsAll = testCase.expectedContains.every(expected => 
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
        failures.push({
          query: testCase.query,
          expected: testCase.expectedType,
          actual: isForecastTab ? 'FORECAST_TAB' : 'SIMPLE_ANSWER',
          explanation: result.explanation
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
      failures.push({
        query: testCase.query,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failures.length > 0) {
    console.log('\n🚨 FAILURES TO FIX:');
    console.log('='.repeat(60));
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. Query: "${failure.query}"`);
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      } else {
        console.log(`   Expected: ${failure.expected}`);
        console.log(`   Got: ${failure.actual}`);
        console.log(`   Response: ${failure.explanation.substring(0, 100)}...`);
      }
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  if (failed > 0) {
    console.log('1. Fix forecast detection logic for complex queries');
    console.log('2. Enhance knowledge base coverage for all financial terms');
    console.log('3. Improve response generation for calculation questions');
    console.log('4. Add more sophisticated query classification');
  } else {
    console.log('🎉 All tests passed! AI agent is working perfectly.');
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);
