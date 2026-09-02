export interface FavoriteItem {
  contentType: string;
  contentId: string;
  title: string;
  imageUrl?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}
