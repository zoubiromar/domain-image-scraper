# QA Debug Logging Enabled

## ✅ What Was Added

The main QA page (`/qa`) now has **built-in debug logging** that shows exactly what's happening during processing. This will help identify the JSON parse error.

---

## 🔍 How to Use Debug Logs

### Step 1: Run Your QA Process
1. Go to `/qa` page
2. Upload your CSV
3. Configure your settings (Name QA, Image QA, or both)
4. Click "Start QA"

### Step 2: Check Debug Logs
After you get an error (or success), you'll see a new section appear:

```
┌─────────────────────────────────────┐
│ Debug Logs              [Show Details]│
└─────────────────────────────────────┘
```

Click **"Show Details"** to expand the debug panel.

### Step 3: Review the Logs
You'll see a timeline of what happened:

```
[10:23:45] Starting processing for 3 rows
[10:23:45] Name QA: false, Image QA: true, Model: gpt-4o
[10:23:46] Response status: 200, OK: true
[10:23:47] Response received (45234 chars)
[10:23:47] ❌ FAILED TO PARSE JSON RESPONSE
[10:23:47] Response preview: <!DOCTYPE html>...
```

This tells you **exactly** where it failed and what the response was.

---

## 📊 What the Debug Logs Show

### ✅ Successful Processing:
```
[10:23:45] Starting processing for 10 rows
[10:23:45] Name QA: true, Image QA: false, Model: gpt-4o-mini
[10:23:46] Response status: 200, OK: true
[10:23:47] Response received (15234 chars)
[10:23:47] Response parsed successfully as JSON
[10:23:47] ✅ Processing complete. 10 rows processed
[10:23:47] 💰 Total cost: $0.0045
```

### ❌ Error Cases:

#### Case 1: Invalid API Key
```
[10:23:45] Starting processing for 10 rows
[10:23:46] Response status: 401, OK: false
[10:23:47] Response received (342 chars)
[10:23:47] ❌ FAILED TO PARSE JSON RESPONSE
[10:23:47] Response preview: <!DOCTYPE html><html>...Unauthorized...
```
**Fix**: Check your API key

#### Case 2: Request Too Large
```
[10:23:45] Starting processing for 100 rows
[10:23:46] Response status: 413, OK: false
[10:23:47] Response received (256 chars)
[10:23:47] ❌ FAILED TO PARSE JSON RESPONSE
[10:23:47] Response preview: Request Entity Too Large...
```
**Fix**: Reduce the number of rows or batch size

#### Case 3: Timeout
```
[10:23:45] Starting processing for 200 rows
[10:28:45] Response status: 504, OK: false
[10:28:46] ❌ API returned error: Gateway Timeout
```
**Fix**: Process fewer rows at once

---

## 🎯 Enhanced Error Messages

The error alert now includes:
```
Error: Server returned invalid JSON. Response preview: <!DOCTYPE html>...

Check the Debug Logs section below for details.
```

This directs you to the debug panel where you can see:
- Full error message
- Response preview
- When it occurred
- What was being processed

---

## 🔧 Debug Features

### 1. **Timestamped Logs**
Every log entry has a timestamp:
```
[10:23:45] Starting processing...
[10:23:46] Response received...
[10:23:47] Processing complete...
```

### 2. **Response Preview**
When JSON parsing fails, shows first 200 characters of the response:
```
Response preview: <!DOCTYPE html><html lang="en"><head><title>Error 401</title></head><body>Unauthorized: Invalid API key</body></html>
```

### 3. **Success Indicators**
Uses emojis for quick visual scanning:
- ✅ = Success
- ❌ = Error
- 💰 = Cost information

### 4. **Collapsible Panel**
- Starts collapsed to save space
- Click "Show Details" to expand
- Click "Hide Details" to collapse

---

## 🧪 How to Debug Your Issue

### Step 1: Try Your Image QA Again
1. Go to `/qa` page
2. Upload your CSV with the test items
3. Map the columns:
   - Cleaned Item Name → `itemName`
   - Size → `l4_size`
   - Image URLs → `photoURL`
4. **Uncheck** "Name & Text QA"
5. **Check** "Image QA"
6. Enter your API key
7. Select "Process first 1 rows" (test with just 1 row first)
8. Click "Start QA"

### Step 2: When Error Appears
1. Look for the new **"Debug Logs"** section
2. Click **"Show Details"**
3. Look at the logs, especially:
   - Response status (should be 200)
   - Response preview (should be JSON, not HTML)
   - Any error messages

### Step 3: Share the Debug Logs
Copy the debug logs and share them with me. They'll look like:
```
[10:23:45] Starting processing for 1 rows
[10:23:45] Name QA: false, Image QA: true, Model: gpt-4o
[10:23:46] Response status: 200, OK: true
[10:23:47] Response received (1234 chars)
[10:23:47] ❌ FAILED TO PARSE JSON RESPONSE
[10:23:47] Response preview: ...
```

This will tell me **exactly** what's happening.

---

## 💡 Most Likely Causes

Based on your debug page success, the issue is likely:

### 1. **Different Request Format**
The debug page tests 1 row, but the main page sends multiple rows. Something about the batch request format might be wrong.

### 2. **Timeout on Main Page**
Processing multiple rows might exceed Vercel's timeout, causing it to return an HTML error page.

### 3. **Memory Limit**
Large CSV files might exceed memory limits, causing Vercel to crash and return an error page.

### 4. **Missing Validation**
The main page might be sending malformed data that the API rejects.

---

## 🚀 What to Try Now

### Test 1: Single Row
1. Process just **1 row** with Image QA
2. Check the debug logs
3. If it works → The issue is with batch size

### Test 2: Name QA Only
1. Process **10 rows** with Name QA only
2. Check the debug logs
3. If it works → The issue is specific to Image QA batching

### Test 3: Both QA Types
1. Process **1 row** with both Name QA and Image QA
2. Check the debug logs
3. If it fails → The issue is with combining both QA types

---

## 📝 Summary

**Added to Main QA Page:**
- ✅ In-page debug logging panel
- ✅ Timestamped log entries
- ✅ Response preview on errors
- ✅ Collapsible debug panel
- ✅ Better error messages in alerts

**How This Helps:**
- You'll see exactly what the server returns
- No need to open browser console
- Easy to share debug info
- Identifies the exact failure point

**Next Step:**
Try running your QA again and check the Debug Logs section. Share what you see in the logs! 🔍

