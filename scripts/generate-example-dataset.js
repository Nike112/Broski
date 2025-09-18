const XLSX = require('xlsx');

// Generate realistic SaaS business data
function generateSaaSData() {
  const data = [];
  const startDate = new Date('2023-01-01');
  
  // Initial values
  let revenue = 45000;
  let customers = 90;
  let newCustomers = 15;
  let churnedCustomers = 8;
  let arpu = 500;
  let churnRate = 8.9;
  let cac = 1200;
  
  // Growth trends
  const revenueGrowthRate = 0.08; // 8% monthly growth
  const customerGrowthRate = 0.06; // 6% monthly growth
  const churnIncreaseRate = 0.02; // 2% monthly increase in churn
  const cacIncreaseRate = 0.03; // 3% monthly increase in CAC
  
  for (let i = 0; i < 21; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    // Add some seasonality
    const month = currentDate.getMonth();
    const seasonalFactor = 1 + (Math.sin(month * Math.PI / 6) * 0.1); // ±10% seasonality
    
    // Calculate values with growth and seasonality
    revenue = Math.round(revenue * (1 + revenueGrowthRate) * seasonalFactor);
    customers = Math.round(customers * (1 + customerGrowthRate));
    newCustomers = Math.round(newCustomers * (1 + customerGrowthRate * 0.8));
    churnedCustomers = Math.round(customers * (churnRate / 100));
    arpu = Math.round(revenue / customers);
    churnRate = Math.min(churnRate * (1 + churnIncreaseRate), 30); // Cap at 30%
    cac = Math.round(cac * (1 + cacIncreaseRate));
    
    data.push([
      currentDate.toISOString().split('T')[0],
      revenue,
      customers,
      newCustomers,
      churnedCustomers,
      arpu,
      churnRate.toFixed(1),
      cac
    ]);
  }
  
  return data;
}

// Generate the Excel file
function createExampleDataset() {
  const header = ['Date', 'Revenue', 'Customers', 'New Customers', 'Churned Customers', 'ARPU', 'Churn Rate (%)', 'CAC'];
  const data = generateSaaSData();
  
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SaaS Business Data');
  
  // Save the file
  XLSX.writeFile(workbook, 'example-datasets/saas-business-dataset.xlsx');
  console.log('✅ Example dataset created: example-datasets/saas-business-dataset.xlsx');
}

// Generate multiple scenarios
function createMultipleScenarios() {
  const scenarios = [
    {
      name: 'High Growth Startup',
      description: 'Fast-growing SaaS startup with high customer acquisition',
      data: generateHighGrowthData()
    },
    {
      name: 'Mature SaaS Business',
      description: 'Established SaaS with steady growth and low churn',
      data: generateMatureBusinessData()
    },
    {
      name: 'Seasonal Business',
      description: 'Business with strong seasonal patterns',
      data: generateSeasonalData()
    }
  ];
  
  scenarios.forEach(scenario => {
    const header = ['Date', 'Revenue', 'Customers', 'New Customers', 'Churned Customers', 'ARPU', 'Churn Rate (%)', 'CAC'];
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...scenario.data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Business Data');
    
    const filename = `example-datasets/${scenario.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    console.log(`✅ Created: ${filename}`);
  });
}

function generateHighGrowthData() {
  const data = [];
  const startDate = new Date('2023-01-01');
  
  let revenue = 25000;
  let customers = 50;
  let newCustomers = 20;
  let churnedCustomers = 5;
  let arpu = 500;
  let churnRate = 10;
  let cac = 800;
  
  for (let i = 0; i < 18; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    // High growth rates
    revenue = Math.round(revenue * 1.15); // 15% monthly growth
    customers = Math.round(customers * 1.12); // 12% monthly growth
    newCustomers = Math.round(newCustomers * 1.1);
    churnedCustomers = Math.round(customers * (churnRate / 100));
    arpu = Math.round(revenue / customers);
    churnRate = Math.max(churnRate * 0.98, 5); // Decreasing churn
    cac = Math.round(cac * 1.02);
    
    data.push([
      currentDate.toISOString().split('T')[0],
      revenue,
      customers,
      newCustomers,
      churnedCustomers,
      arpu,
      churnRate.toFixed(1),
      cac
    ]);
  }
  
  return data;
}

function generateMatureBusinessData() {
  const data = [];
  const startDate = new Date('2023-01-01');
  
  let revenue = 150000;
  let customers = 500;
  let newCustomers = 25;
  let churnedCustomers = 10;
  let arpu = 300;
  let churnRate = 2;
  let cac = 2000;
  
  for (let i = 0; i < 18; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    // Steady, mature growth
    revenue = Math.round(revenue * 1.03); // 3% monthly growth
    customers = Math.round(customers * 1.02); // 2% monthly growth
    newCustomers = Math.round(newCustomers * 1.01);
    churnedCustomers = Math.round(customers * (churnRate / 100));
    arpu = Math.round(revenue / customers);
    churnRate = 2; // Stable low churn
    cac = Math.round(cac * 1.01);
    
    data.push([
      currentDate.toISOString().split('T')[0],
      revenue,
      customers,
      newCustomers,
      churnedCustomers,
      arpu,
      churnRate.toFixed(1),
      cac
    ]);
  }
  
  return data;
}

function generateSeasonalData() {
  const data = [];
  const startDate = new Date('2023-01-01');
  
  let revenue = 80000;
  let customers = 200;
  let newCustomers = 15;
  let churnedCustomers = 8;
  let arpu = 400;
  let churnRate = 4;
  let cac = 1500;
  
  for (let i = 0; i < 18; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    // Strong seasonal patterns
    const month = currentDate.getMonth();
    const seasonalFactor = 1 + (Math.sin(month * Math.PI / 6) * 0.3); // ±30% seasonality
    
    revenue = Math.round(revenue * 1.05 * seasonalFactor); // 5% base growth + seasonality
    customers = Math.round(customers * 1.04);
    newCustomers = Math.round(newCustomers * 1.03 * seasonalFactor);
    churnedCustomers = Math.round(customers * (churnRate / 100));
    arpu = Math.round(revenue / customers);
    churnRate = 4; // Stable churn
    cac = Math.round(cac * 1.02);
    
    data.push([
      currentDate.toISOString().split('T')[0],
      revenue,
      customers,
      newCustomers,
      churnedCustomers,
      arpu,
      churnRate.toFixed(1),
      cac
    ]);
  }
  
  return data;
}

// Run the script
createExampleDataset();
createMultipleScenarios();
