'use client';

import { FaGithub, FaRocket } from 'react-icons/fa';

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaRocket className="text-2xl text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Domain Image Scraper
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              Powered by Vercel
            </span>
            <a
              href="https://github.com/zoubiromar/domain-image-scraper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaGithub className="text-2xl" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
