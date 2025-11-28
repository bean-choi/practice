export type FeedStatus = "PUBLIC" | "FRIEND" | "PRIVATE";

export interface Author {
  id: string;
  username: string;
}

export interface Feed {
  id: string;
  placeId: string;
  title: string;
  content: string;
  status: FeedStatus;
  imageKey?: string | null;
  author: Author;
  createdAt: string;
}
