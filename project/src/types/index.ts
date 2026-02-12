export type LearningStatus = 'to-learn' | 'in-progress' | 'completed';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

export interface UserVideo extends Video {
  status: LearningStatus;
  notes?: string;
  lastWatched?: string;
  progress?: number;
  completedSegmentIds?: string[];
  currentTimestamp?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  learningPreferences?: string[];
}

export interface VideoSummary {
  summary: string;
  nextTopics: string[];
  response?: string;
}