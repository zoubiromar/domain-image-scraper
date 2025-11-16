# QA Error Fix - JSON Parse Error Resolution

## 🐛 The Problem

Users were getting this error when running Product QA:
```
Error: Unexpected token 'R', "Request En"... is not valid JSON
```

This error occurred when the OpenAI API returned an HTML error page or non-JSON response instead of valid JSON. The code was trying to blindly parse the response as JSON, causing it to crash.

---

## ✅ The Solution

### 1. **Improved Error Handling in Name QA**

**Before (would crash):**
```typescript
const data = await response.json();
const resultJson = JSON.parse(data.choices[0].message.content);
```

**After (handles errors gracefully):**
```typescript
// Read as text first
const responseText = await response.text();

// Try to parse as JSON
try {
  data = JSON.parse(responseText);
} catch (jsonError) {
  console.error('Invalid JSON response');
  console.error('Response preview:', responseText.substring(0, 200));
  // Return error result instead of crashing
  return { score: 1, errorTypes: ['API Error'], ... };
}

// Validate response structure
if (!data.choices || !data.choices[0] || !data.choices[0].message) {
  // Handle unexpected structure
}

// Try to parse message content
try {
  resultJson = JSON.parse(messageContent);
} catch (contentError) {
  // Handle malformed AI response
}
```

### 2. **Enhanced Image QA Error Handling**

- Added image size check (18MB limit)
- Better error text extraction
- Detailed console logging
- Graceful failure instead of crashes

### 3. **Created Debug Tools**

**New Debug Page:** `/qa-debug`
- Test single QA requests
- See full API request/response
- Identify problematic data
- Check API key validity
- View detailed error messages

**New Debug API:** `/api/qa-debug`
- Executes a single Name QA request
- Returns full diagnostic information
- Shows payload size
- Displays response preview
- Helps identify root cause

---

## 🔧 Common Causes of This Error

### 1. **Invalid API Key**
- **Symptom**: HTTP 401 Unauthorized
- **Response**: HTML error page from OpenAI
- **Solution**: Verify your API key is correct and active

### 2. **Request Too Large**
- **Symptom**: HTTP 413 Request Entity Too Large
- **Response**: HTML error from server
- **Solution**: Reduce batch size or simplify input data

### 3. **Rate Limiting**
- **Symptom**: HTTP 429 Too Many Requests
- **Response**: JSON error from OpenAI
- **Solution**: Add delays between batches, reduce concurrency

### 4. **Malformed Response**
- **Symptom**: AI returns non-JSON text
- **Response**: Plain text instead of JSON object
- **Solution**: Check `response_format` parameter, update prompt

### 5. **Network Issues**
- **Symptom**: Timeout or connection error
- **Response**: No response or partial response
- **Solution**: Retry logic, check network connectivity

---

## 🧪 How to Use the Debug Tool

### Step 1: Access Debug Page
Navigate to: `/qa-debug` (or `https://your-app.vercel.app/qa-debug`)

### Step 2: Fill in Test Data
Use one of your problematic rows:
- **Item Name**: `Bar harbor Lobster bisque 429 ml`
- **Size**: `429 ml`
- **Raw Data**: `Bar harbor Lobster bisque 429 ml`
- **Model**: `gpt-4o-mini` (cheaper for testing)
- **API Key**: Your OpenAI key

### Step 3: Test the Request
1. Click **"Test QA Request"**
2. Open browser console (F12) → Console tab
3. Check the logs for detailed information

### Step 4: Analyze Results

**If successful:**
```json
{
  "status": "success",
  "parsedResult": {
    "score": 10,
    "errorTypes": [],
    "comments": "No issues found",
    "suggestion": ""
  }
}
```

**If error:**
```json
{
  "status": "error",
  "error": "Response is not valid JSON",
  "responseStatus": 401,
  "responsePreview": "<!DOCTYPE html>...",
  "payloadSize": 15234
}
```

This tells you:
- What the actual error was
- HTTP status code
- Preview of the error response
- Size of your payload

---

## 📊 Console Logging

The improved error handling now logs detailed information:

### Name QA Logs:
```
[Name QA] Row 1: Bar harbor Lobster bisque 429 ml
[Name QA] Invalid JSON response for Row 1: ...
Response preview: <!DOCTYPE html><html>...
```

### Image QA Logs:
```
[Image QA] Image too large: 22.5MB for https://...
[Image QA] Vision API Error: Request Entity Too Large
[Image QA] Error processing image: Failed to fetch
```

---

## 🔍 Debugging Steps

### Step 1: Check API Key
1. Go to `/qa-debug`
2. Enter your API key
3. Test with default values
4. If it fails with 401, your API key is invalid

### Step 2: Check Data Size
1. Look at the `payloadSize` in the debug response
2. If it's > 100KB, your data might be too large
3. Try with shorter item names or smaller batches

### Step 3: Check Image URLs
1. If Image QA fails, check the console for image size warnings
2. Verify image URLs are publicly accessible
3. Check for CORS issues

### Step 4: Check Model Availability
1. Some models may not be available on your OpenAI account
2. Try `gpt-4o-mini` or `gpt-4o` first
3. Check OpenAI status page for outages

---

## 🛡️ Error Prevention

The code now prevents crashes by:

1. ✅ **Reading response as text first** (instead of assuming it's JSON)
2. ✅ **Trying to parse JSON with try-catch**
3. ✅ **Checking response structure before accessing properties**
4. ✅ **Handling missing data gracefully**
5. ✅ **Logging errors with context** (row number, item name)
6. ✅ **Continuing processing even if one row fails**
7. ✅ **Checking image sizes before processing**

### What This Means:
- ❌ Before: One bad row crashes entire batch
- ✅ After: Bad rows get error markers, rest continue processing

---

## 🚀 Next Steps

### After Deployment:

1. **Test with Debug Page**
   - Go to `/qa-debug`
   - Test a single row from your CSV
   - Check if API key works
   - Verify response format

2. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Run QA process
   - Look for detailed error messages

3. **Start Small**
   - Process 5-10 rows first
   - Verify it works
   - Then scale up to larger batches

4. **Monitor Logs**
   - Check which rows fail
   - Look for patterns (e.g., all image QA fails)
   - Adjust batch size if needed

---

## 💡 Tips for Successful QA

### For Name QA:
- ✅ Use `gpt-4o-mini` for cost efficiency
- ✅ Start with small batches (10-20 rows)
- ✅ Ensure all required columns are mapped
- ✅ Check that rawData column has data

### For Image QA:
- ✅ Verify image URLs are accessible (public, no auth)
- ✅ Check image sizes (<18MB each)
- ✅ Be patient (slower than Name QA)
- ✅ Monitor console for fetch errors

### Combined QA:
- ✅ Run Name QA first to test
- ✅ Then add Image QA for second pass
- ✅ Watch costs carefully (Image QA is expensive)

---

## 📝 Summary

**Fixed:**
- ✅ JSON parse errors
- ✅ Unexpected response handling
- ✅ Better error messages
- ✅ Image size validation
- ✅ Detailed logging

**Added:**
- ✅ Debug page (`/qa-debug`)
- ✅ Debug API endpoint
- ✅ Comprehensive error logging
- ✅ Graceful error recovery

**Result:**
- The QA process now handles errors gracefully
- Bad rows get marked as errors but don't crash the whole process
- You can debug issues easily with the new debug page

Try the debug page first to verify your API key and test data format! 🔍

