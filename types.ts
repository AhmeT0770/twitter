export interface EditSubmission {
  id: string;
  tweetUrl: string;
  tweetId: string;
  caption: string;
  category: Category;
  votes: number;
  timestamp: number;
  author: string;
}

export type Category = 'futbol' | 'duygusal' | 'mizah' | 'film' | 'dizi' | 'basketbol' | 'voleybol' | string;
export type SortOption = 'trending' | 'newest' | 'top';
