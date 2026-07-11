// Shared TypeScript types for the Saroop Singh Archive project

export interface Article {
  title: string;
  date_text?: string;
  date?: string;
  source: string;
  location?: string;
  people?: string[];
  image: string;
  tags: string[];
  content: string;
}

export interface Clipping {
  filename: string;
  path: string;
  processed: boolean;
  articlePath?: string;
  metadata?: ClippingMetadata;
}

export interface ClippingMetadata {
  date?: string;
  newspaper?: string;
  headline?: string;
  people?: string[];
  location?: string;
}

export interface Restoration {
  originalPath: string;
  restoredPath: string;
  method: 'ai-upscale' | 'ai-enhance' | 'manual-restoration';
  quality: number;
  createdAt: string;
}

export interface Person {
  name: string;
  articles: string[];
  firstMention?: string;
  lastMention?: string;
}

export interface Newspaper {
  name: string;
  slug: string;
  location?: string;
  years: string[];
  articles: string[];
}