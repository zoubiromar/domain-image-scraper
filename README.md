# Image Scraper Suite 🔍🛒

**Dual-tool solution**: AI-powered URPC matching + Domain-specific image scraping

Live at: [domain-image-scraper.vercel.app](https://domain-image-scraper.vercel.app)

---

## 🎯 Two Powerful Tools

### 1. 🛒 URPC Image Scraper (New!)
**AI-powered product matching** against 244K+ database

**Features**:
- Match Alcohol (104K items) & CnG (140K items) products
- AI verification with GPT-4o-mini (98% accuracy)
- Handles spelling variations ("Titos" = "Tito's")
- Batch processing with embeddings
- Auto-reject uncertain matches (AI Only mode)
- Returns: Image URL, UPC, Photo ID, Score

**Speed**:
- 50 products: ~5 seconds
- 100 products: ~10 seconds  
- No batch limit (vs 200 in Google Sheets version)

### 2. 🌐 Domain Web Scraper (Existing)
**Google Images search** from specific e-commerce domains

**Features**:
- Target specific domains (metro.ca, etc.)
- Multi-factor scoring & ranking
- Quality filtering (score >= 5.0)
- SerpAPI powered
- Batch processing

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build database (optional - only for URPC)
npm run build-db

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deployment to Vercel

**Simple Deploy** (Domain Scraper only):
```bash
git push origin main
```
Vercel auto-deploys. URPC matcher will show "database not found" until you add data files.

**Full Deploy** (Both tools):
See `URPC_DEPLOYMENT.md` for instructions on handling large database files.

---

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Radix UI
- **Database**: SQLite (better-sqlite3)
- **AI**: OpenAI (embeddings + GPT-4o-mini)
- **Matching**: Fuzzy + Semantic Embeddings + GPT
- **Deployment**: Vercel

---

## 📁 Project Structure

```
domain-image-scraper/
├── app/
│   ├── page.tsx              # Home page (tool selector)
│   ├── urpc/page.tsx         # URPC matcher page
│   ├── domain/page.tsx       # Domain scraper page
│   └── api/
│       ├── match/route.ts    # URPC matching API
│       └── scrape/route.ts   # Domain scraping API
├── lib/
│   ├── database.ts           # SQLite queries
│   ├── fuzzy-matcher.ts      # Pre-filter logic
│   ├── embedding-batcher.ts  # Batch embeddings (10x faster!)
│   ├── gpt-verifier.ts       # AI verification
│   └── matcher.ts            # Main matching pipeline
├── components/
│   ├── SimpleScraperForm.tsx # Domain scraper form
│   └── SimpleResultsDisplay.tsx # Results display
├── scripts/
│   └── build-database.ts     # XLSX → SQLite converter
├── data/                     # XLSX source files (not in git)
└── public/database/          # SQLite database (built on deploy)
```

---

## 🎨 Features

### URPC Matcher
- CSV upload with column mapping
- Product type selection (Alcohol/CnG)
- Review modes:
  - **Interactive**: Review uncertain matches
  - **AI Only**: Auto-reject score < 9
- Real-time progress updates
- Results export to CSV
- Preserves UPC leading zeros

### Domain Scraper
- Batch product search
- Domain filtering
- Image quality scoring
- Deduplication
- Results export

---

## 💰 Cost

**URPC Matcher**:
- ~$0.00015 per product (OpenAI)
- 100 products = ~$0.015 (1.5 cents)
- 1,000 products = ~$0.15 (15 cents)

**Domain Scraper**:
- Requires SerpAPI key
- ~$0.005 per product
- 100 searches/month free tier

---

## 🎯 Performance

### URPC Matcher vs Google Sheets:
| Metric | Google Sheets | Web App | Improvement |
|--------|--------------|---------|-------------|
| 50 products | ~40s | ~5s | **8x faster** |
| 100 products | ~80s | ~10s | **8x faster** |
| Max batch | 200 | Unlimited | **No limit** |

**Speed optimizations**:
- SQLite with indexes
- Batch embedding generation (100 at once)
- Parallel processing
- Pre-computed tokens

---

## 📝 Usage

### URPC Matcher:
1. Go to `/urpc`
2. Upload CSV with product names
3. Select column containing products
4. Choose Alcohol or CnG
5. Enter OpenAI API key
6. Select review mode
7. Click "Start Matching"
8. Download results

### Domain Scraper:
1. Go to `/domain`
2. Enter product names or upload CSV
3. Specify domains (optional)
4. Enter SerpAPI key
5. Click "Start Scraping"
6. Download results

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env.local` for development:

```env
# OpenAI API Key (can be entered in UI instead)
OPENAI_API_KEY=sk-...

# SerpAPI Key  
SERP_API_KEY=your_key_here
```

---

## 📊 Database

**URPC Database** (SQLite):
- Alcohol: 104,325 products
- CnG: 140,625 products
- Total: 136.84 MB
- Indexed for fast lookups

**Columns**:
- upc
- item_name
- primary_photo_url
- primary_photo_id
- normalized_name (pre-computed)
- tokens (pre-computed)

---

## 🚧 Known Limitations

- **Database size**: Too large for GitHub, requires external hosting or build-time generation
- **Vercel build time**: Database build may timeout on free tier
- **Rate limits**: OpenAI API rate limits apply
- **Max batch**: 200 products per request (UI limit)

---

## 🤝 Contributing

Contributions welcome! 

1. Fork the repo
2. Create feature branch
3. Make changes
4. Push and create PR

---

## 📄 License

MIT License

---

## 👤 Author

**Omar Zoubir**
- GitHub: [@zoubiromar](https://github.com/zoubiromar)
- Project: [domain-image-scraper](https://github.com/zoubiromar/domain-image-scraper)

---

Made with ❤️ using Next.js, OpenAI, and Vercel
