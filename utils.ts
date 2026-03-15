
export const getCategoryColor = (category: string) => {
  if (category === 'TEXT_GEN') return '#00F0FF'; 
  if (category === 'IMAGE_GEN') return '#CCFF00'; 
  if (category === 'VIDEO_GEN') return '#FF0055'; 
  if (category === 'CODING') return '#FF9900'; 
  if (category === 'SECURITY') return '#FF003C'; 
  return '#00FF41'; 
};

export const isPlaceholder = (url?: string) => {
    if (!url) return true;
    return url.includes('unsplash') || url.includes('placeholder') || url.length < 50;
};

// ⚡ Protocol V20.0: Image Optimization Matrix
// Converts standard URLs to WebP versions
export const optimizeImage = (url: string | undefined, width: number = 800): string => {
    if (!url) return 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop';
    
    // If it's already a relative path or data URI, return as is
    if (url.startsWith('/') || url.startsWith('data:')) return url;

    // [MOBILE_DOWNSIZE_PROTOCOL]
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const finalWidth = isMobile ? Math.min(width, 640) : width;
    const quality = isMobile ? 60 : 80;

    // Append format and width parameters for CDN-based optimization
    return `${url}${url.includes('?') ? '&' : '?'}format=webp&width=${finalWidth}&quality=${quality}`;
};

export const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (videoUrl: string, quality: 'max' | 'hq' | 'mq' = 'max') => {
    const id = getYouTubeId(videoUrl);
    if (!id) return null;
    const filename = quality === 'max' ? 'maxresdefault' : quality === 'hq' ? 'hqdefault' : 'mqdefault';
    return `https://img.youtube.com/vi/${id}/${filename}.jpg`;
};

export const toSlug = (name: string): string => {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

export const isUUID = (str: string): boolean => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(str);
};
