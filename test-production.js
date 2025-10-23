// Test script for production deployment
// Replace YOUR_VERCEL_URL with your actual Vercel deployment URL

const https = require('https');
const PRODUCTION_URL = 'YOUR_VERCEL_URL'; // e.g., 'domain-image-scraper.vercel.app'

function testProduction() {
  const postData = JSON.stringify({
    item_names: ['laptop', 'smartphone'],
    domains: ['amazon.com'],
    top_n: 2
  });

  const options = {
    hostname: PRODUCTION_URL,
    port: 443,
    path: '/api/scrape',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Production Test Result:', result);
        
        if (result.task_id) {
          console.log('✅ Production deployment is working!');
          console.log('Task ID:', result.task_id);
          
          // Test results endpoint
          setTimeout(() => {
            const resultsOptions = {
              ...options,
              path: `/api/results/${result.task_id}`,
              method: 'GET'
            };
            
            const resultsReq = https.request(resultsOptions, (resultsRes) => {
              let resultsData = '';
              resultsRes.on('data', (chunk) => resultsData += chunk);
              resultsRes.on('end', () => {
                const results = JSON.parse(resultsData);
                console.log('Results retrieved:', Object.keys(results.results || {}));
                console.log('✅ Production API fully functional!');
              });
            });
            resultsReq.end();
          }, 3000);
        }
      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('Testing production deployment...');
console.log('URL:', PRODUCTION_URL);
testProduction();
