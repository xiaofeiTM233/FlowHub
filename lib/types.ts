// lib/types.ts

export type PostType = 'pending' | 'approved' | 'rejected';

interface Sender {
  platform: string[];
  userid: number;
  nickname: string;
  nick: boolean;
}

interface Content {
  text: string;
  images: string[];
}

interface ReviewStat {
  approve: number;
  reject: number;
}

interface ReviewEntry {
  mid: string;
  reason: string;
}

interface Review {
  approve: ReviewEntry[];
  reject: ReviewEntry[];
  comments: ReviewEntry[];
  stat: ReviewStat;
}

export interface Post {
  _id: string;
  type: PostType;
  timestamp: number;
  sender: Sender;
  content: Content;
  review: Review;
}

export interface PostsApiResponse {
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}