// src/utils/videoUtils.ts
export const extractYoutubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.length === 11) return url;
  // 覆盖：standard, shortened, embed, shorts 等多种 YouTube 格式
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};
