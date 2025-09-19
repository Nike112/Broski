# 🤖 AI Financial Forecasting - Example Prompts & Usage Guide

## 📊 Available Example Datasets

### 1. **Sample SaaS Data** (`sample-saas-data.csv`)
- **Profile**: Steady growth SaaS company
- **Characteristics**: Consistent 15% monthly growth, stable customer acquisition
- **Best for**: Testing basic predictions, MRR calculations, growth forecasting

### 2. **Startup Growth Data** (`startup-growth-data.csv`)
- **Profile**: High-growth startup in expansion phase
- **Characteristics**: Exponential growth, rapid customer acquisition
- **Best for**: Testing aggressive growth scenarios, burn rate analysis

### 3. **Seasonal Business Data** (`seasonal-business-data.csv`)
- **Profile**: Business with strong seasonal patterns
- **Characteristics**: Q4 holiday spikes, summer dips, cyclical patterns
- **Best for**: Testing seasonality detection, holiday forecasting

### 4. **Volatile Startup Data** (`volatile-startup-data.csv`)
- **Profile**: Unpredictable startup with irregular growth
- **Characteristics**: High volatility, irregular customer acquisition
- **Best for**: Testing uncertainty handling, risk assessment

---

## 🎯 Example Prompts by Category

### **📈 Revenue & Growth Questions**

#### Basic Revenue Queries
```
"What is our current MRR?"
"How much revenue did we generate last month?"
"What's our monthly recurring revenue?"
"Show me our revenue trend over the past 6 months"
```

#### Growth Analysis
```
"What's our revenue growth rate?"
"How fast are we growing?"
"Are we growing faster than the industry average?"
"What's our compound monthly growth rate?"
```

#### Forecasting Requests
```
"Show me a 6-month revenue forecast"
"Predict our revenue for the next quarter"
"Give me monthly revenue projections"
"What will our revenue look like in 6 months?"
```

### **👥 Customer Metrics**

#### Customer Analysis
```
"How many customers do we have?"
"What's our customer growth rate?"
"How many new customers did we acquire last month?"
"What's our customer acquisition trend?"
```

#### Customer Forecasting
```
"Predict customer growth for the next 6 months"
"Show me customer acquisition forecast"
"How many customers will we have in 6 months?"
"Forecast our customer base growth"
```

### **💰 Financial Metrics & KPIs**

#### MRR & ARR
```
"What is our MRR?"
"Calculate our ARR"
"What's our annual recurring revenue?"
"How much MRR do we generate per month?"
```

#### LTV & CAC Analysis
```
"What's our customer lifetime value?"
"Calculate our LTV"
"What's our customer acquisition cost?"
"What's our LTV to CAC ratio?"
"Is our LTV/CAC ratio healthy?"
```

#### Churn Analysis
```
"What's our churn rate?"
"How many customers are we losing per month?"
"What's our customer retention rate?"
"Are we losing customers faster than we're gaining them?"
```

### **🔥 Cash Flow & Profitability**

#### Burn Rate Analysis
```
"What's our burn rate?"
"How much cash are we burning per month?"
"What's our monthly cash burn?"
"Are we burning cash or generating profit?"
```

#### Cash Runway
```
"How long is our cash runway?"
"How many months of cash do we have left?"
"When will we run out of money?"
"What's our cash runway at current burn rate?"
```

#### Break-Even Analysis
```
"When will we break even?"
"How many customers do we need to break even?"
"What's our break-even point?"
"When do we become profitable?"
```

#### Profitability Metrics
```
"What's our gross margin?"
"What's our net margin?"
"Are we profitable yet?"
"What's our monthly profit?"
```

### **📊 Advanced Forecasting**

#### Scenario Analysis
```
"Show me optimistic, realistic, and pessimistic scenarios"
"What happens if we grow 25% faster?"
"What if we lose 20% of our customers?"
"Run a stress test on our projections"
```

#### Monte Carlo Analysis
```
"Run Monte Carlo simulations on our forecast"
"Show me confidence intervals for our predictions"
"What's the probability we'll hit our targets?"
"Give me statistical analysis of our forecast"
```

#### Risk Assessment
```
"What are the risks to our forecast?"
"Identify potential problems with our projections"
"What could go wrong with our growth plan?"
"Assess the uncertainty in our predictions"
```

### **🎯 Business Intelligence**

#### Competitive Analysis
```
"How do we compare to industry benchmarks?"
"Are we growing faster than our competitors?"
"What's our market position?"
"How do our metrics compare to SaaS averages?"
```

#### Strategic Planning
```
"What should we focus on to improve growth?"
"Give me recommendations for our business"
"What are the key drivers of our success?"
"How can we improve our unit economics?"
```

#### Performance Monitoring
```
"How accurate have our past predictions been?"
"Are we on track to meet our goals?"
"What's our prediction accuracy?"
"How reliable are our forecasts?"
```

---

## 🚀 How to Use the Chatbot

### **Step 1: Upload Your Data**
1. Go to the dashboard
2. Upload one of the example CSV files or your own data
3. Ensure your CSV has columns: `date`, `revenue`, `customers`

### **Step 2: Configure Business Parameters**
Set up your business model in the dashboard:
- **Large Customers**: Number and ARPU ($16,500/month)
- **SMB Customers**: Number and ARPU ($3,000/month)
- **Operating Expenses**: Monthly operating costs
- **Cash in Bank**: Current cash balance
- **Gross Margin Rate**: Your gross margin percentage

### **Step 3: Ask Questions**
Simply type any of the example prompts above, and the AI will:
- Calculate the requested metrics
- Provide detailed explanations
- Show confidence levels
- Give actionable insights

### **Step 4: Get Forecasts**
For forecasting requests, the AI will:
- Generate predictions in the Forecast tab
- Show multiple scenarios
- Provide confidence intervals
- Include risk assessments

---

## 📋 Example Conversation Flow

### **Scenario 1: Basic Analysis**
```
User: "What's our current MRR?"
AI: "Your current MRR is $450,000 (92 customers × $4,891 average ARPU). This represents your predictable monthly subscription income and is crucial for cash flow planning."

User: "What's our burn rate?"
AI: "Your monthly burn rate is $135,000 (Operating Expenses - Gross Profit). At this rate, you have 3.3 months of cash runway remaining. ⚠️ Risk: Your cash runway of 3.3 months requires immediate attention."
```

### **Scenario 2: Forecasting**
```
User: "Show me a 6-month revenue forecast"
AI: "Check Forecast tab"

[Forecast tab shows detailed table with monthly projections, confidence intervals, and scenarios]
```

### **Scenario 3: Advanced Analysis**
```
User: "Run Monte Carlo simulations on our forecast"
AI: "I've run 1000 Monte Carlo simulations on your 6-month forecast. Here are the key findings:

📊 Statistical Analysis:
• 50th percentile (median): $2.8M total revenue
• 25th percentile: $2.4M total revenue  
• 75th percentile: $3.2M total revenue
• 95% confidence interval: $2.1M - $3.8M

🎯 Key Insights:
• 78% probability of exceeding $2.5M revenue
• 45% probability of exceeding $3.0M revenue
• Standard deviation: $425K (moderate uncertainty)

⚠️ Risk Factors:
• High revenue volatility detected
• Limited historical data reduces accuracy
• External market factors may impact results"
```

---

## 🎨 Customization Examples

### **For Different Business Types**

#### **Early Stage Startup**
```
"What's our burn rate and runway?"
"When will we need to raise funding?"
"How many customers do we need to break even?"
"What's our path to profitability?"
```

#### **Growth Stage Company**
```
"What's our LTV/CAC ratio?"
"Are we growing efficiently?"
"How do we compare to industry benchmarks?"
"What's our customer acquisition efficiency?"
```

#### **Mature SaaS Company**
```
"What's our net revenue retention?"
"How can we improve our unit economics?"
"What's our expansion revenue potential?"
"How do we optimize our pricing strategy?"
```

---

## 🔧 Technical Features to Test

### **Advanced ML Capabilities**
- **Neural Network Predictions**: Test with complex, non-linear data
- **LSTM Analysis**: Use with time-series data showing patterns
- **Ensemble Methods**: Compare different prediction approaches
- **Real-time Learning**: Update predictions with new data

### **Scenario Modeling**
- **Monte Carlo Simulations**: Test with volatile data
- **Stress Testing**: Try with economic downturn scenarios
- **Sensitivity Analysis**: Test impact of different assumptions
- **Risk Assessment**: Use with high-uncertainty data

### **External Data Integration**
- **Market Data**: Test with industry growth factors
- **Economic Indicators**: Include GDP, inflation impacts
- **Competitive Analysis**: Compare to sector benchmarks
- **Seasonality**: Test with cyclical business data

---

## 📈 Expected Results

### **High Confidence Predictions** (>80%)
- Steady growth companies with 12+ months of data
- Low volatility businesses
- Strong seasonal patterns
- Consistent customer acquisition

### **Medium Confidence Predictions** (60-80%)
- Growing companies with 6-12 months of data
- Moderate volatility
- Some seasonal patterns
- Variable customer acquisition

### **Lower Confidence Predictions** (<60%)
- New companies with <6 months of data
- High volatility businesses
- Irregular patterns
- Unpredictable customer acquisition

---

## 🎯 Pro Tips

1. **Start Simple**: Begin with basic metrics before complex forecasting
2. **Use Multiple Datasets**: Test with different business profiles
3. **Ask Follow-ups**: Request explanations and recommendations
4. **Test Scenarios**: Try optimistic/pessimistic cases
5. **Monitor Accuracy**: Compare predictions to actual results
6. **Leverage External Data**: Include market and economic factors
7. **Use Risk Assessment**: Always consider uncertainty levels

This comprehensive system provides enterprise-grade financial forecasting with advanced AI capabilities, making it suitable for startups, growth companies, and mature businesses alike.
