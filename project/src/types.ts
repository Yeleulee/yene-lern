export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount?: string;
}

export interface UserVideo extends Video {
  status: LearningStatus;
  lastWatched?: string;
}

export type LearningStatus = 'to-learn' | 'in-progress' | 'completed'; 