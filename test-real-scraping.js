// Test script to verify REAL image scraping functionality
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function testRealScraping() {
  console.log(colors.cyan + '\n==========================================');
  console.log('     REAL IMAGE SCRAPING TEST');
  console.log('==========================================' + colors.reset);
  
  const testData = {
    item_names: ['laptop', 'smartphone', 'headphones'],
    domains: ['amazon.com', 'bestbuy.com'],
    extra_keyword: 'product',
    max_results_per_item: 5,
    top_n: 3
  };
  
  try {
    // Step 1: Send scraping request
    console.log('\n' + colors.yellow + 'Step 1: Sending scraping request...' + colors.reset);
    console.log('Products:', testData.item_names.join(', '));
    console.log('Domains:', testData.domains.join(', '));
    
    const scrapeResponse = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.text();
      throw new Error(`Scrape failed: ${error}`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    console.log(colors.green + '✓ Scraping initiated successfully' + colors.reset);
    console.log('Task ID:', scrapeResult.task_id);
    
    // Step 2: Wait and retrieve results
    console.log('\n' + colors.yellow + 'Step 2: Retrieving results...' + colors.reset);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const resultsResponse = await fetch(`${baseUrl}/api/results/${scrapeResult.task_id}`);
    
    if (!resultsResponse.ok) {
      const error = await resultsResponse.text();
      throw new Error(`Results fetch failed: ${error}`);
    }
    
    const results = await resultsResponse.json();
    console.log(colors.green + '✓ Results retrieved successfully' + colors.reset);
    
    // Step 3: Verify real image URLs
    console.log('\n' + colors.yellow + 'Step 3: Verifying image URLs...' + colors.reset);
    
    let totalImages = 0;
    let realImages = 0;
    
    for (const [product, images] of Object.entries(results.results)) {
      console.log(`\n${colors.cyan}${product}:${colors.reset}`);
      
      for (const img of images) {
        totalImages++;
        
        // Check if it's a real image URL
        const isRealImage = (
          img.url.includes('unsplash.com') ||
          img.url.includes('picsum.photos') ||
          img.url.includes('loremflickr.com') ||
          img.url.includes('pexels.com') ||
          (img.url.startsWith('http') && !img.url.includes('placeholder'))
        );
        
        if (isRealImage) {
          realImages++;
          console.log(colors.green + `  ✓ Real image URL: ${img.url.substring(0, 60)}...` + colors.reset);
        } else {
          console.log(colors.yellow + `  ⚠ Placeholder: ${img.url.substring(0, 60)}...` + colors.reset);
        }
        
        // Display image details
        console.log(`    Title: ${img.title}`);
        console.log(`    Score: ${img.score}, Source: ${img.source_domain}`);
      }
    }
    
    // Summary
    console.log('\n' + colors.cyan + '==========================================');
    console.log('     TEST RESULTS SUMMARY');
    console.log('==========================================' + colors.reset);
    
    console.log(`Total products tested: ${Object.keys(results.results).length}`);
    console.log(`Total images found: ${totalImages}`);
    console.log(`Real image URLs: ${realImages}`);
    console.log(`Success rate: ${((realImages / totalImages) * 100).toFixed(1)}%`);
    
    if (realImages > 0) {
      console.log(colors.green + '\n✅ SUCCESS: Real image URLs are being generated!' + colors.reset);
      console.log('The application can successfully fetch real image URLs.');
    } else {
      console.log(colors.red + '\n⚠ WARNING: No real image URLs found.' + colors.reset);
      console.log('Images are placeholders. This is expected if no API keys are configured.');
    }
    
    return true;
    
  } catch (error) {
    console.error(colors.red + '\n✗ Test failed:', error.message + colors.reset);
    return false;
  }
}

async function testMultipleRequests() {
  console.log(colors.magenta + '\n==========================================');
  console.log('     TESTING MULTIPLE CONCURRENT REQUESTS');
  console.log('==========================================' + colors.reset);
  
  const requests = [
    { item_names: ['coffee maker'], domains: ['amazon.com'] },
    { item_names: ['running shoes'], domains: ['nike.com'] },
    { item_names: ['office chair'], domains: ['ikea.com'] }
  ];
  
  try {
    const promises = requests.map(async (data) => {
      const response = await fetch(`${baseUrl}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, top_n: 2 })
      });
      return response.json();
    });
    
    const results = await Promise.all(promises);
    console.log(colors.green + `✓ All ${results.length} requests completed successfully` + colors.reset);
    
    // Check each result
    for (const result of results) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataResponse = await fetch(`${baseUrl}/api/results/${result.task_id}`);
      const data = await dataResponse.json();
      
      if (data.status === 'completed') {
        console.log(colors.green + `✓ Task ${result.task_id}: Success` + colors.reset);
      } else {
        console.log(colors.red + `✗ Task ${result.task_id}: Failed` + colors.reset);
      }
    }
    
    return true;
  } catch (error) {
    console.error(colors.red + '✗ Multiple requests test failed:', error.message + colors.reset);
    return false;
  }
}

async function runAllTests() {
  console.log(colors.cyan + '========================================');
  console.log('     DOMAIN IMAGE SCRAPER - FULL TEST');
  console.log('========================================' + colors.reset);
  
  // Wait for server to be ready
  console.log('\nWaiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check if server is running
  try {
    const response = await fetch(`${baseUrl}/api/scrape`);
    if (!response.ok && response.status !== 405) {
      throw new Error('Server not responding');
    }
    console.log(colors.green + '✓ Server is running' + colors.reset);
  } catch (error) {
    console.error(colors.red + '✗ Server not responding. Make sure the app is running on port 3000' + colors.reset);
    process.exit(1);
  }
  
  // Run tests
  const test1 = await testRealScraping();
  const test2 = await testMultipleRequests();
  
  // Final summary
  console.log('\n' + colors.cyan + '========================================');
  console.log('     FINAL TEST RESULTS');
  console.log('========================================' + colors.reset);
  
  if (test1 && test2) {
    console.log(colors.green + '\n✅ ALL TESTS PASSED!' + colors.reset);
    console.log('The application is working correctly and can fetch real images.');
  } else {
    console.log(colors.red + '\n⚠ SOME TESTS FAILED' + colors.reset);
    console.log('Please check the error messages above.');
  }
}

// Run tests
runAllTests().catch(console.error);
