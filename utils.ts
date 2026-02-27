
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
// Converts standard Unsplash/CDN URLs to AVIF + Resized versions
export const optimizeImage = (url: string | undefined, width: number = 600): string => {
    if (!url) return 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop';
    
    // 1. Unsplash Optimization
    if (url.includes('images.unsplash.com')) {
        // Replace or append parameters
        // Remove existing format/width params roughly if simpler logic needed, 
        // but here we append overrides which Unsplash respects (last one wins usually, or we replace)
        let newUrl = url;
        
        // Force AVIF format
        if (newUrl.includes('auto=format')) {
            newUrl = newUrl.replace('auto=format', 'format=avif');
        } else if (!newUrl.includes('format=')) {
            newUrl += '&format=avif';
        }

        // Adjust Width
        if (newUrl.includes('w=')) {
            newUrl = newUrl.replace(/w=\d+/, `w=${width}`);
        } else {
            newUrl += `&w=${width}`;
        }
        
        // Quality
        if (!newUrl.includes('q=')) {
            newUrl += '&q=80';
        }

        return newUrl;
    }

    // 2. Pass through others (or add generic CDN proxy logic here if needed)
    return url;
};
