export interface Article {
  id: string;
  title: string;
  url: string;
  source: 'medium' | 'hn';
  author?: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  score?: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  title: string;
  url: string;
  source: 'medium' | 'hn';
  tags: string[];
  status: 'read_later' | 'finished';
  savedAt: string;
  readAt?: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  searchedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  topics: string[];
  createdAt: string;
}
