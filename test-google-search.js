// Test Google Image Search implementation
const http = require('http');

function testGoogleSearch() {
  console.log('========================================');
  console.log('  GOOGLE IMAGE SEARCH TEST (with Domain Filtering)');
  console.log('========================================\n');
  
  const testData = {
    item_names: ['iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Pro M3'],
    domains: ['apple.com', 'amazon.com', 'bestbuy.com'],
    max_results_per_item: 10,
    top_n: 3
  };
  
  console.log('Test Configuration:');
  console.log('Products:', testData.item_names.join(', '));
  console.log('Domains:', testData.domains.join(', '));
  console.log('---\n');
  
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
        
        // Get results after 3 seconds
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
                console.log('           SEARCH RESULTS');
                console.log('========================================\n');
                
                let totalCorrect = 0;
                let totalImages = 0;
                
                for (const [product, images] of Object.entries(results.results)) {
                  console.log(`📦 ${product}:`);
                  console.log(`   Found ${images.length} images\n`);
                  
                  for (const img of images) {
                    totalImages++;
                    
                    // Check if domain matches
                    const matchedDomain = img.matched_domain || '';
                    const isFromCorrectDomain = testData.domains.some(d => 
                      matchedDomain === d || img.source_domain?.includes(d)
                    );
                    
                    if (isFromCorrectDomain) {
                      totalCorrect++;
                      console.log(`   ✅ Image ${img.rank}:`);
                      console.log(`      Domain: ${matchedDomain || img.source_domain} ✓`);
                    } else {
                      console.log(`   ⚠️  Image ${img.rank}:`);
                      console.log(`      Domain: ${img.source_domain} (not in filter list)`);
                    }
                    
                    console.log(`      Title: ${img.title}`);
                    console.log(`      Score: ${(img.score * 100).toFixed(1)}%`);
                    console.log(`      URL: ${img.url.substring(0, 60)}...`);
                    
                    if (img.source_url) {
                      console.log(`      Source: ${img.source_url.substring(0, 60)}...`);
                    }
                    console.log('');
                  }
                }
                
                console.log('========================================');
                console.log('           TEST SUMMARY');
                console.log('========================================');
                console.log(`Total products tested: ${Object.keys(results.results).length}`);
                console.log(`Total images found: ${totalImages}`);
                console.log(`Images from correct domains: ${totalCorrect}/${totalImages}`);
                console.log(`Domain filtering accuracy: ${totalImages > 0 ? ((totalCorrect/totalImages) * 100).toFixed(1) : 0}%`);
                
                if (totalCorrect === totalImages && totalImages > 0) {
                  console.log('\n🎉 SUCCESS: All images are from the specified domains!');
                  console.log('The domain filtering is working correctly.');
                } else if (totalCorrect > 0) {
                  console.log('\n⚠️  PARTIAL SUCCESS: Some images are from correct domains.');
                  console.log('This might be running in demo mode without SerpAPI key.');
                } else {
                  console.log('\n⚠️  DEMO MODE: No real domain filtering applied.');
                  console.log('To enable real Google Image search with domain filtering:');
                  console.log('1. Get a free API key from https://serpapi.com/users/sign_up');
                  console.log('2. Set SERPAPI_KEY in your .env.local file');
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
          
        }, 3000);
        
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
console.log('Starting test on http://localhost:3000\n');
testGoogleSearch();
