# Image Scraper Suite

Three-tool web app for product catalog work: a domain-restricted image scraper, an AI-powered catalog matcher, and a listing QA helper.

[Live demo](https://domain-image-scraper.vercel.app)

## What it does

### Tool 1: Domain-restricted image scraper
Given a product name and a target e-commerce domain (e.g., `metro.ca`, `walmart.ca`), the scraper uses SerpAPI to perform a Google Images search restricted to that domain and returns ranked candidate images. Multi-factor scoring filters out low-quality matches and de-duplicates results.

Use case: you have a product entry in a catalog and you need an image URL from a specific retailer's site.

### Tool 2: Catalog matcher
Given a product name (which may contain spelling variations, abbreviations, or partial info), the matcher finds the best candidate in a catalog database using a three-stage pipeline:

1. Fuzzy pre-filter (fast lexical narrowing against the SQLite catalog)
2. OpenAI text embeddings for semantic candidate retrieval (k-NN over the top fuzzy candidates)
3. GPT-4o-mini for final verification of the top candidates ("is this the same product?")

The verification step is what makes the matcher resilient to noise. Fuzzy gets you to the right shelf, embeddings get you to the right neighborhood, and GPT-4o-mini confirms the actual match.

Use case: you have a noisy list of product names (from a vendor submission, OCR output, or third-party feed) and you need to map them to canonical entries in an existing catalog. Returns the matched product with image URL, UPC, and photo ID.

### Tool 3: Listing QA
Given a CSV of product listings, the QA helper runs two GPT-based checks per row:

- Name and text QA against configurable style rules (length, formatting, brand position, bilingual structure for FR/EN catalogs)
- Image QA using GPT-4o vision: does the image actually depict the product the name describes, with the right pack size and count?

Results include a 1-10 score, error type tags, comments, and a suggested correction. Costs are tracked per run.

## Architecture

- **Frontend:** Next.js 14 (App Router, TypeScript), Tailwind CSS
- **Image scraper backend:** Next.js API routes calling SerpAPI's Google Images endpoint
- **Matcher backend:** Next.js API routes, OpenAI Embeddings (`text-embedding-3-small`), better-sqlite3 for the catalog index, OpenAI Chat Completions (`gpt-4o-mini`) for verification
- **QA backend:** Next.js API routes calling OpenAI Chat Completions and GPT-4o vision, batching 30 rows per request
- **Job system:** long-running jobs are persisted to Vercel Blob with a localStorage cache, so users can close the tab and come back to a job URL
- **Deployment:** Vercel

## Local development

```bash
# Install
npm install

# Environment: create .env.local with these
# OPENAI_API_KEY=...
# SERP_API_KEY=...
# DATABASE_BLOB_URL=...    # only needed for the matcher in production

# Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

### Catalog data (matcher only)

The matcher reads a SQLite database at `public/database/products.db`. To build it, place XLSX files in `data/` and run `npm run build-db`. Expected schema in each XLSX:

| Column | Description |
|---|---|
| `upc` | Product UPC |
| `item_name` | Display name |
| `primary_photo_url` | Image URL |
| `primary_photo_id` | Photo identifier |

Two tables are built: `alcohol_products` and `grocery_products`. Substitute any product catalog with this schema.

In production, the matcher loads the SQLite file from a Vercel Blob URL set via `DATABASE_BLOB_URL`. The blob file is cached to `/tmp` on cold start.

### API keys
- `OPENAI_API_KEY`: matcher and QA. The matcher UI also accepts a per-session key entered in the browser.
- `SERP_API_KEY`: domain image scraper.

## Notes

This is a personal project demonstrating AI-assisted catalog work patterns: embedding retrieval, GPT verification, vision QA, and a small job-tracking layer over Vercel Blob. The matching and QA logic is generic. No proprietary data is included in this repo; the catalog file is gitignored and must be supplied by the user.

## License

MIT
