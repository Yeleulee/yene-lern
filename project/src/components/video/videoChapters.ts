export interface VideoChapter {
  id: string;
  startTime: number;
  endTime: number | null;
  title: string;
}

export function parseVideoChapters(
  description: string,
  videoId: string,
  duration = 0,
  includeFallback = false
): VideoChapter[] {
  const knownDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const chaptersByTime = new Map<number, string>();
  const timestampRegex = /^\s*\[?(\d+):([0-5]\d)(?::([0-5]\d))?\]?(?:\s*[-–—]\s*|\s+)(\S.*)\s*$/gm;
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(description || '')) !== null) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const third = match[3] === undefined ? undefined : Number(match[3]);
    const startTime = third === undefined
      ? first * 60 + second
      : first * 3600 + second * 60 + third;
    const title = match[4].trim();

    if (
      !title ||
      !Number.isSafeInteger(startTime) ||
      (knownDuration > 0 && startTime >= knownDuration) ||
      chaptersByTime.has(startTime)
    ) {
      continue;
    }

    chaptersByTime.set(startTime, title);
  }

  const starts = Array.from(chaptersByTime.entries())
    .sort(([firstTime], [secondTime]) => firstTime - secondTime);

  if (starts.length === 0 && includeFallback) {
    return [{
      id: `${videoId}-segment-0`,
      startTime: 0,
      endTime: knownDuration || null,
      title: 'Full video'
    }];
  }

  return starts.map(([startTime, title], index) => ({
    id: `${videoId}-segment-${startTime}`,
    startTime,
    endTime: starts[index + 1]?.[0] ?? (knownDuration || null),
    title
  }));
}
