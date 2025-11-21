# 🔍 Database Diagnostic Instructions

## I've Added Diagnostic Tools to Find the Issue

**Code pushed to GitHub** - Vercel is deploying now.

---

## Step 1: Test the Diagnostic Endpoint

**Once Vercel finishes deploying**, visit this URL:

```
https://domain-image-scraper.vercel.app/api/test-db
```

**This will show you**:
- Whether DATABASE_BLOB_URL environment variable is accessible
- Whether the Blob URL can be fetched
- Whether better-sqlite3 can load the database
- Exact error messages if something fails
- Database statistics if it works

---

## Step 2: Share the Results With Me

**Copy the JSON output** you see and share it with me.

It will look something like:
```json
{
  "timestamp": "...",
  "environment": "production",
  "blobUrl": "Set (hidden)" or "NOT SET",
  "blobUrlValue": "https://cikjq7cnoxpkq7ue...",
  "status": "SUCCESS" or "FAILED",
  "error": "...",
  "alcoholProducts": 104325,
  "cngProducts": 140625
}
```

---

## Possible Issues & Solutions

### Issue 1: Environment Variable Not Accessible

**If you see**: `"blobUrl": "NOT SET"`

**Solution**: The DATABASE_BLOB_URL might not be set in the right scope:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Check that `DATABASE_BLOB_URL` is set for **Production**
3. Value should be: `https://cikjq7cnoxpkq7ue.public.blob.vercel-storage.com/products.db`
4. Redeploy after setting

### Issue 2: Blob Not Accessible (403/404)

**If you see**: `"fetchTest": { "status": 403 }`

**Solution**: The Blob might not be public:
1. Go to Vercel Dashboard → Storage → urpc-database
2. Click on products.db file
3. Check if it's set to **Public**
4. Or get a signed URL with token

### Issue 3: better-sqlite3 Not Available

**If you see**: `"error": "Cannot find module 'better-sqlite3'"`

**Solution**: The native module isn't building on Vercel:
1. We'll need to switch to a serverless-compatible database
2. Options: Turso, Supabase, or bundle pre-compiled binary

### Issue 4: File Too Large

**If you see**: Timeout or memory error

**Solution**: 136 MB download might timeout:
1. Upload smaller database
2. Or use edge-compatible database (Turso)

---

## Step 3: Based on Results

**Share the diagnostic output** and I'll:
1. Identify the exact issue
2. Provide the specific fix needed
3. Either implement it automatically or guide you through it

---

## Quick Check: Verify Environment Variable

**Right now, you can check** in Vercel Dashboard:

1. Go to: https://vercel.com/
2. Open your project: domain-image-scraper
3. Settings → Environment Variables
4. Look for: `DATABASE_BLOB_URL`

**Should be set to**:
```
https://cikjq7cnoxpkq7ue.public.blob.vercel-storage.com/products.db
```

**For environments**: Production ✓ Preview ✓ Development ✓

If it's not checked for Production, that's the issue!

---

**Wait for deployment to complete** (~2 minutes), then test:
```
https://domain-image-scraper.vercel.app/api/test-db
```

Share the results and I'll fix the issue immediately! 🔍



