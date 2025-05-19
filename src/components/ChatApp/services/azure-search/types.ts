export interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url?: string;
  source: string;
  score: number;
  metadata?: Record<string, any>;
}
