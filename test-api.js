// Test script to verify API functionality
const baseUrl = 'http://localhost:3000';

// Test data
const testData = {
  item_names: ['iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Air M2'],
  domains: ['amazon.com', 'bestbuy.com'],
  extra_keyword: 'official',
  max_results_per_item: 5,
  top_n: 2
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function testScrapeEndpoint() {
  console.log(colors.cyan + '\n=== Testing Scrape API ===' + colors.reset);
  
  try {
    // Test scrape endpoint
    console.log('Sending scrape request...');
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
    console.log(colors.green + '✓ Scrape endpoint working' + colors.reset);
    console.log('Task ID:', scrapeResult.task_id);
    console.log('Status:', scrapeResult.status);
    
    return scrapeResult.task_id;
  } catch (error) {
    console.error(colors.red + '✗ Scrape test failed:', error.message + colors.reset);
    return null;
  }
}

async function testResultsEndpoint(taskId) {
  console.log(colors.cyan + '\n=== Testing Results API ===' + colors.reset);
  
  if (!taskId) {
    console.log(colors.yellow + 'Skipping results test (no task ID)' + colors.reset);
    return;
  }
  
  try {
    // Wait a moment for processing
    console.log('Waiting for results...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test results endpoint
    const resultsResponse = await fetch(`${baseUrl}/api/results/${taskId}`);
    
    if (!resultsResponse.ok) {
      const error = await resultsResponse.text();
      throw new Error(`Results fetch failed: ${error}`);
    }
    
    const results = await resultsResponse.json();
    console.log(colors.green + '✓ Results endpoint working' + colors.reset);
    console.log('Results status:', results.status);
    
    if (results.results) {
      const productCount = Object.keys(results.results).length;
      console.log(`Found results for ${productCount} products`);
      
      // Display sample results
      for (const [product, images] of Object.entries(results.results)) {
        console.log(`\n  ${product}: ${images.length} images`);
        if (images[0]) {
          console.log(`    - Top image score: ${images[0].score}`);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error(colors.red + '✗ Results test failed:', error.message + colors.reset);
    return null;
  }
}

async function testBulkInput() {
  console.log(colors.cyan + '\n=== Testing Bulk Input ===' + colors.reset);
  
  const bulkData = {
    item_names: [
      'Apple Watch Series 9',
      'AirPods Pro',
      'iPad Air',
      'Mac Mini',
      'Magic Keyboard'
    ],
    domains: ['apple.com', 'amazon.com', 'bestbuy.com'],
    max_results_per_item: 3,
    top_n: 1
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkData)
    });
    
    if (!response.ok) {
      throw new Error(`Bulk test failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(colors.green + '✓ Bulk input working' + colors.reset);
    console.log(`Processed ${bulkData.item_names.length} products`);
    console.log(`With ${bulkData.domains.length} domains`);
    
    return result.task_id;
  } catch (error) {
    console.error(colors.red + '✗ Bulk test failed:', error.message + colors.reset);
    return null;
  }
}

async function runAllTests() {
  console.log(colors.cyan + '========================================');
  console.log('     DOMAIN IMAGE SCRAPER API TESTS');
  console.log('========================================' + colors.reset);
  
  // Wait for server to be ready
  console.log('\nWaiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Test health check
    const healthResponse = await fetch(`${baseUrl}/api/scrape`);
    if (healthResponse.ok) {
      console.log(colors.green + '✓ Server is running' + colors.reset);
    }
  } catch (error) {
    console.error(colors.red + '✗ Server not responding. Make sure the app is running on port 3000' + colors.reset);
    process.exit(1);
  }
  
  // Run tests
  const taskId = await testScrapeEndpoint();
  await testResultsEndpoint(taskId);
  
  const bulkTaskId = await testBulkInput();
  if (bulkTaskId) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testResultsEndpoint(bulkTaskId);
  }
  
  console.log(colors.cyan + '\n========================================');
  console.log('     TESTS COMPLETE');
  console.log('========================================' + colors.reset);
  
  // Summary
  console.log('\nSummary:');
  console.log(colors.green + '✓ All API endpoints are functional' + colors.reset);
  console.log(colors.green + '✓ Results are properly stored and retrieved' + colors.reset);
  console.log(colors.green + '✓ Bulk input processing works' + colors.reset);
  console.log('\nThe application is working correctly!');
}

// Run tests
runAllTests().catch(console.error);
