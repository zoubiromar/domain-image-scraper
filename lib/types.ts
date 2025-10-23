export interface ImageResult {
  rank: number;
  url: string;
  thumbnail: string;
  title: string;
  source_domain: string;
  matched_domain?: string;
  source_page?: string;
  score: number;
  confidence: number;
}

export interface ProductResult {
  product_name: string;
  images: ImageResult[];
  total_found: number;
  search_domain: string;
}

export interface ScrapingResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Record<string, ImageResult[]>;
  products?: ProductResult[];
  error?: string;
  timestamp?: string;
  task_id?: string;
}

export interface SearchRequest {
  item_names: string[];
  domains: string[];
  extra_keyword?: string;
  max_images?: number;
  top_n?: number;
}

export interface ApiResponse {
  task_id: string;
  status: string;
  message?: string;
  error?: string;
}
