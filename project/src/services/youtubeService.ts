import { Video } from '../types';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyAwsVUjEV1uLj8YACmVW8a7Fn1bipIcsJU';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function searchVideos(query: string): Promise<Video[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(
        query
      )}&type=video&key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API error:', errorData);
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
}

export async function getVideoDetails(videoId: string): Promise<Video | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API error:', errorData);
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

// Get additional video information like duration, views, etc.
export async function getVideoStats(videoId: string): Promise<any> {
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=statistics,contentDetails&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    return {
      duration: data.items[0].contentDetails.duration,
      viewCount: data.items[0].statistics.viewCount,
      likeCount: data.items[0].statistics.likeCount
    };
  } catch (error) {
    console.error('Error fetching video stats:', error);
    return null;
  }
}