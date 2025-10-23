// Simple test to verify API functionality
const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/scrape',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const postData = JSON.stringify({
    item_names: ['test product'],
    domains: ['example.com'],
    top_n: 2
  });
  
  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.task_id) {
          console.log('✓ API is working! Task ID:', parsed.task_id);
          
          // Now test results endpoint
          setTimeout(() => {
            const resultsOptions = {
              ...options,
              path: `/api/results/${parsed.task_id}`,
              method: 'GET'
            };
            
            const resultsReq = http.request(resultsOptions, (resultsRes) => {
              let resultsData = '';
              resultsRes.on('data', (chunk) => {
                resultsData += chunk;
              });
              resultsRes.on('end', () => {
                console.log('Results:', resultsData.substring(0, 200) + '...');
                const results = JSON.parse(resultsData);
                if (results.results) {
                  console.log('✓ Results retrieved successfully!');
                  console.log('Products found:', Object.keys(results.results));
                  
                  // Check for real images
                  for (const [product, images] of Object.entries(results.results)) {
                    console.log(`\n${product}: ${images.length} images`);
                    if (images[0]) {
                      console.log('  First image URL:', images[0].url);
                      console.log('  Is real image:', !images[0].url.includes('placeholder'));
                    }
                  }
                }
              });
            });
            resultsReq.end();
          }, 2000);
        }
      } catch (e) {
        console.log('Error parsing response:', e);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

console.log('Testing API at http://localhost:3000/api/scrape');
testAPI();
