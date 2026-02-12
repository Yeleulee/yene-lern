import { Video } from '../types';

const API_KEYS = [
  'AIzaSyA__NW-q90XocO9Wxcxz-xYvC-acXJQKXY',
  'AIzaSyDE4qHhXikmAEpW7GtcvC-42LMDR8pb4Kk',
  'AIzaSyCS8UqeBl8a48OvJ_lZbi-TNm4GMocDM_0',
  import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyAwsVUjEV1uLj8YACmVW8a7Fn1bipIcsJU'
].filter((key, index, self) => key && self.indexOf(key) === index);

const getApiKey = () => {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function searchVideos(query: string): Promise<Video[]> {
  try {
    const apiKey = getApiKey();
    // Add educational focus to the query
    const enhancedQuery = `${query} course tutorial educational`;

    // Add parameters to filter for longer videos (videoDuration=long means > 20 minutes)
    // and education-focused content (videoType=any, relevanceLanguage=en, videoCategoryId=27 for Education)
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(enhancedQuery)}&maxResults=12&type=video&videoDuration=long&relevanceLanguage=en&videoCategoryId=27&key=${apiKey}`);

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const data = await response.json();

    // Get additional details about the videos including duration
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${apiKey}`);

    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const detailsData = await detailsResponse.json();

    // Create a map of video details by ID
    const videoDetailsMap = detailsData.items.reduce((map: any, item: any) => {
      map[item.id] = item;
      return map;
    }, {});

    // Only return videos that are longer than 20 minutes (1200 seconds)
    return data.items
      .filter((item: any) => {
        const details = videoDetailsMap[item.id.videoId];
        if (!details) return false;

        // Parse duration string (PT1H20M30S format)
        const duration = details.contentDetails.duration;
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

        if (!matches) return false;

        const hours = parseInt(matches[1] || '0', 10);
        const minutes = parseInt(matches[2] || '0', 10);
        const seconds = parseInt(matches[3] || '0', 10);

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // Only include videos longer than 20 minutes
        return totalSeconds >= 1200;
      })
      .map((item: any) => {
        const details = videoDetailsMap[item.id.videoId];
        const snippet = item.snippet;

        return {
          id: item.id.videoId,
          title: snippet.title,
          description: snippet.description,
          thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
          channelTitle: snippet.channelTitle,
          publishedAt: snippet.publishedAt,
          viewCount: details?.statistics?.viewCount || '0',
          duration: details?.contentDetails?.duration || 'PT0S'
        };
      });
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function getVideoDetails(videoId: string): Promise<Video | null> {
  try {
    const apiKey = getApiKey();
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet&id=${videoId}&key=${apiKey}`
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
  const apiKey = getApiKey();
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=statistics,contentDetails&id=${videoId}&key=${apiKey}`
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