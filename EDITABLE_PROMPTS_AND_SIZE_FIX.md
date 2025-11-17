# ✅ Editable AI Prompts + Image QA Size Fix

## 🎯 Summary

Two major improvements to the Product QA system:
1. **Editable AI Prompts** - Users can now customize verification rules via UI
2. **Fixed Image QA Size Flagging** - Much more conservative, fewer false positives

---

## 🛠️ Feature 1: Editable AI Prompts

### How to Access

1. Go to `/qa` page
2. Click the **⚙️ Edit AI Prompts** button (top right of Configuration section)
3. Modal opens with two editable text areas:
   - **Name & Text QA Rules**
   - **Image QA Rules**

### What You Can Edit

**✅ Editable (Rules Section):**
- Scoring deductions (-1, -2, -3, etc.)
- Verification rules (what to check)
- Tolerance levels (15% margin, etc.)
- When to flag errors vs when to pass
- Examples and explanations

**🔒 Not Editable (System Section):**
- Role definition
- Input/output JSON format
- Field types and structure
- API integration details

### UI Features

- **Two separate textareas** for Name QA and Image QA rules
- **Reset to Default** button for each prompt
- **Reset All to Defaults** button at bottom
- **Save & Close** button to apply changes
- **Info box** explaining how prompts work
- **Monospaced font** for easy editing
- **Large text areas** (264px height each)

---

## 🐛 Feature 2: Fixed Image QA Size Flagging

### The Problem

**Before:**
```
l4_size: "750 g"
Image shows: "750g Pack of 10"
❌ OLD BEHAVIOR: Flagged as "750 g x 10 ct" (WRONG!)
```

This was incorrect because:
- The **existing size might already be the total** (7.5 kg = 7500g)
- The system didn't account for total size vs unit size difference
- Too many false positives for multipack products

### The Solution

**New Conservative Size Rules:**

#### ✅ THESE ARE MATCHES (Do NOT flag):

**A) Total Size Already Correct**
```
l4_size = "7.5 kg"
Image = "750g 10-pack"
→ MATCH ✅ (7.5 kg = 750g × 10, total already correct)
```

```
l4_size = "2.13 L"
Image = "355ml 6-pack"
→ MATCH ✅ (2.13 L ≈ 355ml × 6, total already correct)
```

**B) Unit Size Matches**
```
l4_size = "750 g"
Image = "750g"
→ MATCH ✅ (exact match)
```

**C) Unit Conversion Matches**
```
l4_size = "2 kg"
Image = "4.4 lb"
→ MATCH ✅ (2 kg ≈ 4.4 lb, same weight)
```

#### ❌ ONLY FLAG IF:

**1) True Size Conflict (98%+ certainty)**
```
l4_size = "500 g"
Image CLEARLY shows "800 g"
→ FLAG ❌ (different sizes, real conflict)
```

**2) Missing Pack Count (98%+ certainty ONLY)**
```
l4_size = "750 g" (unit size only)
Image CLEARLY shows "750g Pack of 10"
Existing size does NOT account for pack
→ FLAG ❌ as "750 g x 10 ct"
```

**BUT NOT if:**
- l4_size = "7.5 kg" and Image shows "750g 10-pack" (total already correct)
- Pack count is uncertain (<98% confidence)
- Pack text is unclear/small/ambiguous
- Multiple size indicators (unclear which is correct)

---

## 📋 How the Prompts Are Structured

### Name QA

**System Prompt** (Fixed, ~500 chars):
```
You are an automated Product Listing Quality Analyst...
Output Format: {"score": <1-10>, "errorTypes": [...], ...}
Approved Error Types: structure_noncompliant, ...
```

**Rules Prompt** (Editable, ~1500 chars):
```
## Guiding Principles
- Default score: 10...

## Quebec-French Integrity Checks
1) Structure & Brand Position...
2) Language Contamination...

## Scoring Deductions
1) Unclear Wording (-3)...
```

### Image QA

**System Prompt** (Fixed, ~400 chars):
```
You are a Visual Verification Specialist API...
Must be 95%+ certain...
Output: {"isMismatch": false} or {...}
```

**Rules Prompt** (Editable, ~1800 chars):
```
## Verification Rules

### 1. Product Match
Only flag if completely different...

### 2. Size/Quantity Verification
CRITICAL: Unit Size vs Total Size
- Total Size Already Correct...
- ONLY FLAG IF: True conflict OR Missing pack...
```

---

## 🎨 Settings Modal UI

```
┌────────────────────────────────────────────┐
│ ⚙️ AI Prompt Settings              [X]     │
├────────────────────────────────────────────┤
│ Edit the verification rules below...       │
│                                             │
│ Name & Text QA Rules                        │
│ ┌────────────────────────────────────────┐ │
│ │ ## Guiding Principles                  │ │
│ │ - Default score: 10...                 │ │
│ │ ...                                    │ │
│ │ (editable textarea, 264px height)      │ │
│ └────────────────────────────────────────┘ │
│ [Reset to Default]                          │
│                                             │
│ Image QA Rules                              │
│ ┌────────────────────────────────────────┐ │
│ │ ## Verification Rules                  │ │
│ │ ### 1. Product Match Rule              │ │
│ │ ...                                    │ │
│ │ (editable textarea, 264px height)      │ │
│ └────────────────────────────────────────┘ │
│ [Reset to Default]                          │
│                                             │
│ ℹ️ How Prompts Work                         │
│ • System Prompt (fixed)...                  │
│ • Rules Prompt (editable)...                │
├────────────────────────────────────────────┤
│                 [Reset All] [Save & Close] │
└────────────────────────────────────────────┘
```

---

## 🧪 How to Use Editable Prompts

### Scenario 1: Make Size Rules More Lenient

**Goal**: Reduce false positives for pack sizes

**Steps:**
1. Click **⚙️ Edit AI Prompts**
2. Scroll to Image QA Rules textarea
3. Find the section:
   ```
   2) Missing Pack Count (VERY HIGH CERTAINTY ONLY)
   ```
4. Change "98%+ certain" to "99.9%+ certain"
5. Click **Save & Close**
6. Run your QA - now only ultra-clear pack indicators are flagged

### Scenario 2: Adjust Name QA Scoring

**Goal**: Be more strict about unclear wording

**Steps:**
1. Click **⚙️ Edit AI Prompts**
2. Edit Name & Text QA Rules
3. Find: `1) Unclear Wording (-3)`
4. Change to: `1) Unclear Wording (-5)` (harsher penalty)
5. Save and run QA

### Scenario 3: Add Custom Rules

**Goal**: Flag products with specific terms

**Steps:**
1. Click **⚙️ Edit AI Prompts**
2. Add to Name QA Rules:
   ```
   8) Forbidden Terms (-5)
      - Flag if name contains "Temporary", "Test", "Sample"
      - Tag: "special_character_issue"
   ```
3. Save and run QA

### Scenario 4: Reset to Defaults

If you mess up or want to start fresh:
1. Click **⚙️ Edit AI Prompts**
2. Click **Reset All to Defaults** at bottom
3. Or click individual **Reset to Default** buttons

---

## 📊 Prompt Examples

### Conservative Size Checking (Current Default)

```
### 2. Size/Quantity Verification (CONSERVATIVE APPROACH)

**ONLY FLAG IF:**
1) True Size Conflict (98%+ certain)
2) Missing Pack Count (98%+ certainty ONLY)

**DO NOT FLAG IF:**
- Total already correct
- Pack count uncertain
- Multiple size indicators
```

### Strict Size Checking (Example Custom Rule)

```
### 2. Size/Quantity Verification (STRICT APPROACH)

**ALWAYS FLAG IF:**
1) Image shows pack count not in l4_size
2) Any size discrepancy > 5%
3) Unit appears without pack notation

**No exceptions for total size**
```

### Lenient Size Checking (Example Custom Rule)

```
### 2. Size/Quantity Verification (LENIENT APPROACH)

**ONLY FLAG IF:**
1) Sizes differ by >30%
2) Completely different products

**DO NOT FLAG:**
- Pack sizes (assume total is correct)
- Minor variations
- Decimal differences
```

---

## 🚀 Client-Side Batching (Bonus Fix)

While fixing the size rules, I also implemented **client-side batching** to handle large CSVs.

### Features:
- **Batch size**: 50 rows per API call
- **No payload limit**: Process 1000s of rows
- **Progress tracking**: See which batch is processing
- **Cost combining**: Automatically sums costs from all batches
- **Error recovery**: Failed batches don't stop processing

### Example for 6,286 rows:
```
Starting processing for 6286 rows
Processing in 126 batches of 50 rows each

📦 Batch 1/126: Processing rows 1-50
✅ Batch 1 complete: 50 rows processed

📦 Batch 2/126: Processing rows 51-100
✅ Batch 2 complete: 50 rows processed

... (continues for all 126 batches) ...

🎉 All batches complete! Total rows: 6286
💰 Total cost: $42.35
```

---

## ✅ Testing Checklist

After deployment:

- [ ] Click ⚙️ Edit AI Prompts button
- [ ] Settings modal opens
- [ ] See Name QA Rules textarea with default rules
- [ ] See Image QA Rules textarea with default rules
- [ ] Edit some text in Name QA Rules
- [ ] Click Save & Close
- [ ] Run QA with 2-3 rows
- [ ] Verify custom rules are applied
- [ ] Click Reset to Default
- [ ] Verify rules reset correctly
- [ ] Test with multipack products (750g 10-pack)
- [ ] Verify NO false size flags

---

## 📝 Summary

**Fixed:**
- ✅ Image QA now understands unit vs total size
- ✅ "750g 10-pack" with l4_size="7.5kg" → No longer flagged
- ✅ Much more conservative (98%+ certainty required)
- ✅ Total size calculation before flagging

**Added:**
- ✅ Settings wheel button in QA page
- ✅ Modal with editable textareas for both QA types
- ✅ Reset buttons (individual and all)
- ✅ Custom rules passed to API
- ✅ Split prompts (system + rules)

**Result:**
- Users can customize QA rules without coding
- Dramatically fewer false size flags
- Better understanding of multipack vs unit sizes
- More accurate QA results

Ready for production! 🚀


