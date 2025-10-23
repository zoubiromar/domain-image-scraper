# Domain Image Scraper 🔍🖼️

A smart image scraping application that finds product images from specific e-commerce domains using advanced search techniques. Built with Next.js 14 and optimized for Vercel deployment.

![Domain Image Scraper](https://via.placeholder.com/1200x600/3b82f6/ffffff?text=Domain+Image+Scraper)

## 🌟 Features

- **Domain-Specific Search**: Target specific e-commerce domains for accurate results
- **Batch Processing**: Search multiple products at once
- **Smart Ranking**: Images are scored and ranked by relevance
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Fast Performance**: Optimized for speed with Next.js 14 and Vercel
- **API Routes**: RESTful API endpoints for integration

## 🚀 Live Demo

[View Live Demo](https://domain-image-scraper.vercel.app)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Language**: TypeScript
- **Icons**: React Icons

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/domain-image-scraper.git
cd domain-image-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚢 Deployment

### Deploy to Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/domain-image-scraper)

### Manual Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect Next.js and deploy

## 📡 API Endpoints

### POST /api/scrape
Start a new scraping task

**Request Body:**
```json
{
  "item_names": ["iPhone 15", "Samsung Galaxy S24"],
  "domains": ["amazon.com", "bestbuy.com"],
  "extra_keyword": "official",
  "max_results_per_item": 10,
  "top_n": 3
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "status": "completed",
  "message": "Scraping completed successfully"
}
```

### GET /api/results/{task_id}
Get results for a specific task

**Response:**
```json
{
  "status": "completed",
  "results": {
    "iPhone 15": [
      {
        "rank": 1,
        "url": "https://...",
        "title": "iPhone 15 - Product Image",
        "score": 0.95,
        "confidence": 0.90
      }
    ]
  }
}
```

## 🎨 Features in Detail

### Smart Domain Filtering
- Supports CDN domain detection
- Intelligently maps subdomains to main domains
- Filters results by specified e-commerce sites

### Batch Processing
- Process multiple products simultaneously
- Configurable result limits
- Automatic deduplication

### Ranking Algorithm
- Scores images based on relevance
- Considers title, URL, and metadata
- Returns top N results per product

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Add any API keys or configuration here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Customization

Modify `tailwind.config.ts` to customize the theme:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

## 📝 Current Limitations

- **Mock Data**: Currently using mock data for demonstration
- **Real Scraping**: Playwright integration pending (Windows compatibility issues)
- **Rate Limiting**: No rate limiting implemented yet
- **Storage**: Results stored in memory (not persistent)

## 🚧 Roadmap

- [ ] Implement real Google Images scraping
- [ ] Add Redis for result caching
- [ ] Implement user authentication
- [ ] Add export functionality (CSV, JSON)
- [ ] Create browser extension
- [ ] Add webhook support
- [ ] Implement rate limiting

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)

## 📧 Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/yourusername/domain-image-scraper](https://github.com/yourusername/domain-image-scraper)

---

Made with ❤️ by [Your Name]
