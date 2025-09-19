# 📊 Excel Generation Prompts - Financial Projections

## 🎯 **Prompts That Generate Excel Sheets**

### **Basic Financial Projections**
```
"Generate 11-month financial projections for SaaS company"
"Create financial model with 1 sales person and $200k marketing spend"
"Show me 6-month projections with current business parameters"
"Generate financial forecast with 45% conversion rate and $1500 CAC"
```

### **Customized Projections**
```
"Create projections for 8 months with 2 sales people and $300k marketing"
"Generate forecast with 50% conversion rate and $1200 CAC for 12 months"
"Show financial model with 3 sales people and $250k marketing spend"
"Create projections with 40% conversion rate for 10 months"
```

### **Scenario-Based Projections**
```
"Generate optimistic scenario: 3 sales people, $400k marketing, 60% conversion"
"Create conservative forecast: 1 sales person, $150k marketing, 35% conversion"
"Show aggressive growth: 5 sales people, $500k marketing, 55% conversion"
"Generate baseline scenario with standard parameters for 11 months"
```

### **Parameter-Specific Prompts**
```
"Create projections with $16,500 large customer ARPU and $5,000 SMB ARPU"
"Generate forecast with 1.5 customers per sales person per month"
"Show model with $1,500 CAC and 45% demo-to-customer conversion"
"Create projections with $200,000 monthly marketing spend"
```

---

## 📋 **Excel Output Structure**

The API will generate an Excel file with the following structure:

### **Sheet: Financial Projections**

| **Section** | **Rows** | **Description** |
|-------------|----------|-----------------|
| **Large Customer Metrics** | 1-6 | Sales team, customer acquisition, revenue |
| **Digital Marketing & CAC** | 8-9 | Marketing spend and acquisition costs |
| **Sales Enquiries & Conversions** | 11-12 | Lead generation and conversion rates |
| **SMB Customer Metrics** | 14-16 | Small/medium customer acquisition and revenue |
| **Total Revenues** | 18-21 | Combined revenue from both segments |

### **Columns: M1, M2, M3, ..., M11**
- Each column represents a month
- Shows cumulative and monthly metrics
- Calculates total revenues and growth

---

## 🚀 **API Usage Examples**

### **Basic Request**
```bash
GET /api/search?query=Generate 11-month financial projections
```

### **Customized Request**
```bash
GET /api/search?query=Create projections for 8 months with 2 sales people and $300k marketing
```

### **Parameter-Specific Request**
```bash
GET /api/search?query=Generate forecast with 50% conversion rate and $1200 CAC for 12 months
```

---

## 📊 **Expected Excel Output**

### **Large Customer Metrics**
- **# of sales people**: 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6
- **# of large customer accounts onboarded per month**: 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6
- **Cumulative # of paying customers**: 1, 3, 5, 7, 10, 14, 19, 25, 32, 40, 49
- **Average revenue per customer**: $16,500 (constant)
- **Revenue from large clients**: $16,667, $50,000, $83,333, $116,667, $166,667, $233,333, $316,667, $416,667, $533,333, $666,667, $816,667

### **SMB Customer Metrics**
- **Digital Marketing spend per month**: $200,000 (constant)
- **Average CAC**: $1,250 (constant)
- **# of sales enquiries**: 160 (constant)
- **% conversions from demo to sign ups**: 45% (constant)
- **# of paying customers onboarded**: 72 (constant)
- **Cumulative number of paying customers**: 72, 144, 216, 288, 360, 432, 504, 576, 648, 720, 792
- **Average revenue per customer**: $5,000 (constant)
- **Revenue from small and medium clients**: $360,000, $720,000, $1,080,000, $1,440,000, $1,800,000, $2,160,000, $2,520,000, $2,880,000, $3,240,000, $3,600,000, $3,960,000

### **Total Revenues**
- **Total Revenues ($ per month)**: $376,667, $770,000, $1,163,333, $1,556,667, $1,966,667, $2,393,333, $2,836,667, $3,296,667, $3,773,333, $4,266,667, $4,776,667
- **Total Revenues ($ Mn per month)**: 0.38, 0.77, 1.16, 1.56, 1.97, 2.39, 2.84, 3.30, 3.77, 4.27, 4.78

---

## 🎯 **Business Logic Implementation**

### **Large Customers (Sales-Led)**
- Sales people added monthly (1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6)
- Each sales person signs 1.5 customers per month
- Revenue = Cumulative customers × $16,500 ARPU

### **SMB Customers (Marketing-Led)**
- Fixed marketing spend: $200,000/month
- CAC: $1,250 per customer
- Inquiries = Marketing spend ÷ CAC = 160/month
- Conversion rate: 45%
- New customers = Inquiries × 45% = 72/month
- Revenue = Cumulative customers × $5,000 ARPU

### **Growth Patterns**
- **Large customers**: Accelerating growth (more sales people)
- **SMB customers**: Linear growth (consistent marketing)
- **Total revenue**: Compound growth from both segments

---

## 🔧 **Technical Implementation**

### **API Endpoint**
```
GET /api/search?query={your_query}
```

### **Response**
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **File**: Downloadable Excel file
- **Filename**: `financial-projections-{timestamp}.xlsx`

### **Query Parsing**
The API automatically extracts:
- Number of months
- Sales people count
- Marketing spend amount
- CAC value
- Conversion rate percentage
- ARPU values

### **Default Parameters**
- **Months**: 11
- **Sales people**: 1 (growing monthly)
- **Marketing spend**: $200,000
- **CAC**: $1,500
- **Conversion rate**: 45%
- **Large ARPU**: $16,500
- **SMB ARPU**: $5,000

---

## 🎨 **Customization Examples**

### **Startup Scenario**
```
"Generate 6-month projections for early-stage startup with 1 sales person and $100k marketing"
```

### **Growth Stage**
```
"Create 12-month forecast for growth company with 3 sales people and $400k marketing spend"
```

### **Mature Company**
```
"Show 8-month projections for mature SaaS with 5 sales people and $600k marketing budget"
```

### **High-Conversion Scenario**
```
"Generate forecast with 60% conversion rate and $1,000 CAC for 10 months"
```

---

## 📈 **Advanced Features**

### **Scenario Analysis**
- Optimistic, realistic, pessimistic projections
- Monte Carlo simulations
- Sensitivity analysis
- Risk assessment

### **External Data Integration**
- Market growth factors
- Economic indicators
- Competitive benchmarks
- Industry averages

### **Real-time Learning**
- Model accuracy tracking
- Performance monitoring
- Continuous improvement
- Adaptive algorithms

This system provides enterprise-grade financial modeling with the exact Excel structure you need, making it perfect for your problem statement! 🚀
