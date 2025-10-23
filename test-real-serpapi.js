// Test with real SerpAPI key
const http = require('http');

function testRealSerpAPI() {
  console.log('========================================');
  console.log('  TESTING WITH REAL SERPAPI KEY');
  console.log('========================================\n');
  
  const testData = {
    item_names: ['iPhone 15 Pro', 'MacBook Pro M3', 'AirPods Pro'],
    domains: ['apple.com', 'amazon.com']
  };
  
  console.log('Products:', testData.item_names.join(', '));
  console.log('Domains:', testData.domains.join(', '));
  console.log('Expected: Best image for each product from specified domains\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/scrape',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const postData = JSON.stringify(testData);
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (!result.task_id) {
          console.error('❌ No task ID received');
          return;
        }
        
        console.log('✓ Task created:', result.task_id);
        console.log('Waiting for results...\n');
        
        // Get results after 5 seconds (to allow for API calls)
        setTimeout(() => {
          const resultsOptions = {
            ...options,
            path: `/api/results/${result.task_id}`,
            method: 'GET'
          };
          
          const resultsReq = http.request(resultsOptions, (resultsRes) => {
            let resultsData = '';
            resultsRes.on('data', (chunk) => resultsData += chunk);
            
            resultsRes.on('end', () => {
              try {
                const results = JSON.parse(resultsData);
                
                if (results.status !== 'completed') {
                  console.error('❌ Results not completed');
                  return;
                }
                
                console.log('✅ Results retrieved successfully\n');
                console.log('========================================');
                console.log('           RESULTS');
                console.log('========================================\n');
                
                let foundCount = 0;
                let correctDomainCount = 0;
                
                for (const [product, image] of Object.entries(results.results)) {
                  console.log(`📦 ${product}:`);
                  
                  if (image) {
                    foundCount++;
                    
                    // Check if it's from correct domain
                    const isCorrectDomain = testData.domains.some(d => 
                      image.matched_domain === d || 
                      image.source_domain?.includes(d)
                    );
                    
                    if (isCorrectDomain) {
                      correctDomainCount++;
                      console.log(`   ✅ Image found from ${image.matched_domain || image.source_domain}`);
                    } else {
                      console.log(`   ⚠️  Image from ${image.source_domain} (not in filter)`);
                    }
                    
                    console.log(`   Score: ${(image.score * 100).toFixed(1)}%`);
                    console.log(`   URL: ${image.url.substring(0, 60)}...`);
                    
                    // Check if it's a real URL or placeholder
                    if (image.url.includes('placeholder')) {
                      console.log(`   ⚠️  This is a placeholder image`);
                    } else {
                      console.log(`   ✓ This appears to be a real image URL`);
                    }
                    
                    if (image.source_url) {
                      console.log(`   Source: ${image.source_url.substring(0, 60)}...`);
                    }
                  } else {
                    console.log(`   ❌ No image found`);
                  }
                  console.log('');
                }
                
                console.log('========================================');
                console.log('           SUMMARY');
                console.log('========================================');
                console.log(`Products tested: ${Object.keys(results.results).length}`);
                console.log(`Images found: ${foundCount}/${Object.keys(results.results).length}`);
                console.log(`From correct domains: ${correctDomainCount}/${foundCount}`);
                
                if (correctDomainCount === foundCount && foundCount > 0) {
                  console.log('\n🎉 SUCCESS: All images are from specified domains!');
                  console.log('SerpAPI is working correctly with domain filtering.');
                } else {
                  console.log('\n⚠️  Some issues detected. Check if SerpAPI key is valid.');
                }
                
              } catch (e) {
                console.error('Error parsing results:', e.message);
              }
            });
          });
          
          resultsReq.on('error', (e) => {
            console.error('Error fetching results:', e.message);
          });
          resultsReq.end();
          
        }, 5000);
        
      } catch (e) {
        console.error('Error parsing response:', e.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('Request failed:', e.message);
  });
  
  req.write(postData);
  req.end();
}

// Run test
console.log('Testing with real SerpAPI key...\n');
testRealSerpAPI();
