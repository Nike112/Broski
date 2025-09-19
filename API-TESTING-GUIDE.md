# 🚀 API Testing Guide

## Quick Start

### 1. Start Your Server
```bash
npm run dev
```
Your server will be running on `http://localhost:3000`

### 2. Test Methods

## Method 1: Web Interface (Recommended)
Visit: `http://localhost:3000/api-test`

- Interactive web interface
- Pre-built test queries
- Real-time results
- Download Excel files directly

## Method 2: Command Line Script
```bash
node test-api.js
```

This will:
- Test 8 different queries automatically
- Generate Excel files for forecast queries
- Show JSON responses for general questions
- Provide a summary of all tests

## Method 3: Direct Browser Testing
Open these URLs in your browser:

```
http://localhost:3000/api/search?query=Generate%2011-month%20financial%20projections
http://localhost:3000/api/search?query=Show%20me%20our%20cash%20flow%20forecast
http://localhost:3000/api/search?query=What%20will%20our%20revenue%20look%20like
```

## Method 4: cURL Testing
```bash
# Test forecast query (should download Excel)
curl "http://localhost:3000/api/search?query=Generate%2011-month%20financial%20projections" -o forecast.xlsx

# Test general query (should return JSON)
curl "http://localhost:3000/api/search?query=What%20is%20MRR" | jq
```

## Method 5: JavaScript/Fetch Testing
```javascript
// Test in browser console or Node.js
fetch('/api/search?query=Generate 11-month financial projections')
  .then(response => {
    if (response.headers.get('content-type').includes('excel')) {
      return response.blob();
    } else {
      return response.json();
    }
  })
  .then(data => console.log(data));
```

## Expected Responses

### Excel Files (Forecast Queries)
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Behavior**: Automatically downloads as `.xlsx` file
- **Queries that trigger Excel**: 
  - "Generate X-month projections"
  - "Show forecast"
  - "Revenue forecast"
  - "Cash flow forecast"

### JSON Responses (General Queries)
- **Content-Type**: `application/json`
- **Behavior**: Returns structured data
- **Queries that trigger JSON**:
  - "What is MRR?"
  - "Explain burn rate"
  - "How do we calculate runway?"

## Test Queries

### Forecast Queries (Excel Output)
```
Generate 11-month financial projections
Show me our cash flow forecast for next 6 months
What will our revenue look like over the next 12 months?
Create a burn rate analysis
Generate customer acquisition forecast
Show me break-even analysis
What's our runway with current burn rate?
Project our MRR growth for next 8 months
```

### General Queries (JSON Output)
```
What is MRR?
Explain burn rate calculation
How do we calculate cash runway?
What's the difference between ARR and MRR?
How do we determine break-even point?
What factors affect customer acquisition cost?
```

## Troubleshooting

### Server Not Running
```
❌ Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Start your server with `npm run dev`

### API Not Found
```
❌ Error: 404 Not Found
```
**Solution**: Make sure you're using the correct endpoint `/api/search`

### Empty Response
```
❌ Error: No data returned
```
**Solution**: Check your query parameter is properly encoded

### Excel File Not Downloading
```
❌ Error: File not downloading
```
**Solution**: 
- Check browser download settings
- Try right-click → "Save link as"
- Use the web interface at `/api-test`

## Advanced Testing

### Custom Queries
Try these natural language variations:

```
"I need a 6-month revenue projection"
"Can you show me our burn rate?"
"What's our financial health?"
"Generate a forecast for the next year"
"Show me customer growth predictions"
"Create a cash flow analysis"
```

### Error Testing
Test error handling:

```
""
"Invalid query"
"Show me something random"
"Generate forecast for 100 years"
```

## Performance Testing

### Load Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl "http://localhost:3000/api/search?query=Generate%20forecast" &
done
wait
```

### Response Time Testing
```bash
# Measure response time
time curl "http://localhost:3000/api/search?query=Generate%20forecast"
```

## Integration Testing

### With Frontend
1. Start the main app: `npm run dev`
2. Go to the chat interface
3. Ask: "Generate a 6-month forecast"
4. Verify it triggers the API and shows results

### With External Tools
- **Postman**: Import the API endpoint
- **Insomnia**: Test with different query parameters
- **curl**: Command line testing
- **Browser DevTools**: Network tab monitoring

## Success Criteria

✅ **Excel Generation**: Forecast queries download Excel files
✅ **JSON Responses**: General queries return structured data
✅ **Error Handling**: Invalid queries return appropriate errors
✅ **Performance**: Responses under 5 seconds
✅ **Natural Language**: Handles various phrasings
✅ **Context Awareness**: Understands financial terminology

## Next Steps

1. **Test the web interface**: Visit `/api-test`
2. **Run the automated script**: `node test-api.js`
3. **Try custom queries**: Experiment with different phrasings
4. **Check Excel output**: Verify the generated files
5. **Test error cases**: Try invalid or edge case queries

Happy testing! 🚀
