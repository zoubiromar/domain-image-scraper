# 🛡️ Progress Recovery System - Never Lose Your Work!

## 🎯 Critical Feature: Automatic Progress Saving

The Product QA system now **automatically saves progress** after every batch, ensuring you never lose work even if timeouts, errors, or crashes occur.

---

## ✅ **What's New**

### 1. **Auto-Save After Each Batch**
- Every time a batch completes, results are saved to browser localStorage
- If error occurs halfway through, all completed batches are preserved
- Saved data includes: rows, costs, config, timestamp

### 2. **History Button** 📜
- Purple "History" button next to "Edit AI Prompts"
- Shows count of saved sessions (red badge)
- Click to view all saved sessions

### 3. **Session Recovery**
- Load any previous session with one click
- See timestamp, row count, cost, completion status
- Delete individual sessions or clear all

### 4. **Error Recovery**
- If timeout or error occurs, partial results are automatically shown
- Alert tells you how many rows were saved
- Results appear in the table ready for download
- Session saved in History for later access

---

## 🎨 **How It Works**

### Scenario 1: Successful Completion

```
Process 50 images (10 batches of 5)
  ↓
Batch 1 completes → Save (5 rows) 💾
Batch 2 completes → Save (10 rows) 💾
Batch 3 completes → Save (15 rows) 💾
...
Batch 10 completes → Save (50 rows) 💾
  ↓
Final save with "completed: true" ✅
  ↓
Download CSV or load from History later
```

### Scenario 2: Timeout/Error Halfway

```
Process 1000 images (200 batches of 5)
  ↓
Batch 1-50 complete → All saved 💾 (250 rows)
Batch 51 starts...
  ↓
⏰ TIMEOUT ERROR!
  ↓
Catch block triggers:
  ✅ 250 rows already saved
  ✅ Partial results displayed
  ✅ Session saved with "error: timeout"
  ✅ Download button available
  ✅ Costs calculated for 250 rows
  ↓
Alert: "Error occurred but 250 rows were saved!"
  ↓
You can:
  - Download the 250 rows as CSV
  - Load from History later
  - Resume processing the remaining 750 rows
```

---

## 🔘 **History Button Features**

### UI Location

```
┌──────────────────────────────────────────┐
│ Configuration        [History 3] [⚙️ Edit AI Prompts]│
└──────────────────────────────────────────┘
                         ↑
                    Click here!
```

### History Modal Shows:

```
┌────────────────────────────────────────────┐
│ 📜 Session History                     [X] │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 11/15/2025, 2:30:45 PM               │  │
│ │ 250 rows • $2.50 • ⚠️ Partial         │  │
│ │ Error: Function timeout...           │  │
│ │ Config: Image QA • Model: gpt-4o     │  │
│ │                     [Load] [Delete]  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 11/15/2025, 1:15:22 PM               │  │
│ │ 50 rows • $0.42 • ✅ Completed        │  │
│ │ Config: Image QA • Model: gpt-4o     │  │
│ │                     [Load] [Delete]  │  │
│ └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│ [Clear All History]            [Close]     │
└────────────────────────────────────────────┘
```

### Actions Available:

1. **Load** - Restores results and costs to the page
2. **Delete** - Removes that specific session
3. **Clear All History** - Deletes all saved sessions
4. **Close** - Closes the modal

---

## 💾 **What Gets Saved**

### Session Data Structure:

```json
{
  "timestamp": "2025-11-15T14:30:45.123Z",
  "processedRows": [...], // All QA results
  "costs": {
    "totalInputTokens": 125000,
    "totalOutputTokens": 5000,
    "totalCost": 2.50,
    "breakdown": { "gpt-4o": {...} }
  },
  "rowCount": 250,
  "completed": false,
  "error": "Function invocation timeout",
  "config": {
    "runNameQA": false,
    "runImageQA": true,
    "model": "gpt-4o",
    "itemNameCol": "itemName",
    "sizeCol": "l4_size"
  }
}
```

### Storage:
- **Location**: Browser localStorage
- **Key**: `qa_session_{timestamp}`
- **Size**: Depends on row count (typically <5MB for 1000 rows)
- **Persistence**: Survives page refresh, browser close
- **Limitation**: ~10MB total localStorage limit per domain

---

## 🎯 **Use Cases**

### Use Case 1: Recover from Timeout

**Situation**: Processing 1000 images, timeout at batch 50

**What Happens:**
1. Batches 1-50 complete (250 rows)
2. Batch 51 times out
3. Error alert shows: "250 rows were saved!"
4. **Results for 250 rows displayed**
5. **Download button available**
6. **Session saved in History**

**What You Can Do:**
- Download the 250 rows immediately
- Load from History later
- Process remaining 750 rows separately
- Combine CSV files manually

### Use Case 2: Resume Later

**Situation**: Start processing, need to close browser

**What Happens:**
1. Process 100 rows
2. All 100 saved to History
3. Close browser
4. Come back tomorrow
5. **Click History button**
6. **Load the session**
7. **Download the results**

### Use Case 3: Compare Different Runs

**Situation**: Testing different AI prompts

**What Happens:**
1. Run with default prompts → Saved
2. Edit prompts (more lenient)
3. Run again → Saved
4. **Click History**
5. See both sessions
6. Load each to compare results
7. Choose which you prefer

---

## 🔧 **Editable Prompts - Full Control**

### How Prompts Are Combined:

**Before (Append Mode - Old):**
```typescript
const prompt = DEFAULT_PROMPT + '\n\n' + CUSTOM_RULES;
// Custom rules added at end, defaults still apply
```

**After (Override Mode - New):**
```typescript
const rulesPrompt = customRules || DEFAULT_RULES;
const prompt = SYSTEM_PROMPT + '\n\n' + rulesPrompt;
// Your custom rules REPLACE the defaults completely
```

### What This Means:

**Example - Ignoring Size Mismatches:**

**Your Custom Image QA Rules:**
```
## Verification Rules

### 1. Product Match
Only flag if completely different product.

### 2. Size/Quantity Verification
DO NOT FLAG size mismatches under any circumstances.
Always return {"isMismatch": false} for size differences.
```

**Result:**
- Your rules **completely replace** the default size rules
- No size mismatches will be flagged
- System prompt (output format) still enforced
- Your custom rules have full control

---

## 📊 **Session History Details**

### Session Cards Show:

1. **Timestamp** - When the session was created
2. **Row Count** - How many rows were processed
3. **Cost** - Total API cost for that session
4. **Status**:
   - ✅ **Completed** - All batches finished successfully
   - ⚠️ **Partial** - Stopped due to error/timeout
5. **Error** (if any) - Brief error message
6. **Config** - What QA types and model were used
7. **Actions** - Load or Delete buttons

### Sorting:
- Newest sessions at top
- Sorted by timestamp (descending)

### Storage Management:
- Sessions persist across browser sessions
- Stored in localStorage (survives refresh/close)
- Clear old sessions manually when needed
- ~10MB storage limit (thousands of rows)

---

## 🧪 **How to Test**

### Test 1: Normal Completion

1. Process 10 images with Image QA
2. Wait for completion (~4-5 minutes)
3. See "💾 Final session saved" in debug logs
4. Click **History** button
5. See your session with ✅ Completed
6. Click **Load** to restore results
7. Click **Delete** to remove session

### Test 2: Error Recovery

1. Process 50 images with Image QA
2. Wait for ~5 batches (25 rows)
3. Close the browser tab (simulate crash)
4. Reopen the page
5. Click **History** button
6. See session with "⚠️ Partial - 25 rows"
7. Click **Load** to recover those 25 rows
8. Download CSV with partial results
9. Process remaining 25 rows separately

### Test 3: Timeout Recovery (Automatic)

1. Process 20 images with Image QA
2. Wait for timeout error (~10-15 minutes)
3. Error alert shows: "15 rows were saved!"
4. Results for 15 rows displayed below
5. Click Download CSV
6. Click History to see the saved session
7. Later: Process remaining 5 rows

---

## 💡 **Best Practices**

### For Large Batches:

**Strategy 1: Process in Chunks**
```
Total: 1000 images
Split into: 200 chunks of 5
Process 100 at a time (20 batches)
Check History after each 100
Download and clear
```

**Strategy 2: Overnight Processing**
```
Total: 500 images
Process all (100 batches)
Leave tab open overnight
Check History in morning
Download results
```

**Strategy 3: Progressive Processing**
```
Day 1: Process first 100 → Save
Day 2: Process next 100 → Save
Day 3: Process next 100 → Save
...
Load all from History
Combine CSV files
```

---

## ⚠️ **Important Notes**

### Session Persistence:
- ✅ Survives page refresh
- ✅ Survives browser close/reopen
- ✅ Survives computer restart
- ❌ Cleared if you clear browser data
- ❌ Cleared if you use Incognito mode
- ❌ Not shared across devices/browsers

### Storage Limits:
- Browser localStorage: ~10MB limit
- Each session: ~5-10KB per 100 rows
- Can store ~100,000 rows worth of sessions
- Clear old sessions if you hit limit

### What to Download:
- Always download CSV after processing
- Don't rely solely on History (browser storage)
- History is a **backup**, not permanent storage
- Download = permanent, History = temporary

---

## 🎉 **Summary**

**Progress Saving:**
- ✅ Auto-saves after each batch
- ✅ Saves on successful completion
- ✅ Saves partial results on error
- ✅ Saves to browser localStorage

**History System:**
- ✅ History button with session count badge
- ✅ View all saved sessions
- ✅ Load any session with one click
- ✅ Delete individual sessions
- ✅ Clear all history

**Error Recovery:**
- ✅ Partial results displayed on error
- ✅ Download button available
- ✅ Session saved for later access
- ✅ Helpful error message

**Editable Prompts:**
- ✅ Custom rules completely replace defaults
- ✅ Full control over verification logic
- ✅ System prompts (format) protected
- ✅ Reset to defaults anytime

---

## 🚀 **Try It Now!**

After Vercel deploys:

1. **Test Progress Saving:**
   - Process 10 images
   - Check debug logs for "💾 Progress saved"
   - Click **History** button
   - See your session

2. **Test Error Recovery:**
   - Process 50 images
   - Wait for completion (some batches will save)
   - If timeout, partial results shown
   - Click History to see saved session

3. **Test Custom Prompts:**
   - Click **⚙️ Edit AI Prompts**
   - Edit Image QA Rules to ignore all size mismatches
   - Save & Close
   - Process some rows
   - Verify no size flags appear

**Never lose progress again!** 🎊

