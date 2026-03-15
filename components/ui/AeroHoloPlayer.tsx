import React, { useState, useEffect } from 'react';

interface AeroHoloPlayerProps {
  url?: string;
}

const isMobileDevice = () => {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent))
  );
};

export default function AeroHoloPlayer({ url }: AeroHoloPlayerProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [iframeError, setIframeError] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // 只有在浏览器端 Hydration 完成后才切换状态
  React.useEffect(() => {
    setIsMounted(true);
    setIsMobile(isMobileDevice());
  }, []);

  // 服务端渲染和客户端首屏渲染：必须输出绝对一致的 DOM 骨架
  if (!isMounted || !url) {
    return (
      <div className="w-full aspect-video bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center justify-center">
         {/* 这里的样式和文字必须与你在服务端渲染时一模一样，防 #418 */}
         <span className="text-red-500/50 font-mono text-sm uppercase tracking-widest animate-pulse">
            {url ? 'INITIALIZING_VIDEO_LINK...' : 'VIDEO_SIGNAL_LOST'}
         </span>
      </div>
    );
  }

  let videoId = '';
  try {
    const secureUrl = url.replace('http:', 'https:');
    const parsedUrl = new URL(secureUrl);
    if (parsedUrl.hostname.includes('youtube.com')) {
      videoId = parsedUrl.searchParams.get('v') || '';
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.slice(1);
    } else {
      videoId = secureUrl.split('v=')[1]?.split('&')[0] || '';
    }
  } catch (e) {
    console.error("Invalid video URL", e);
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  }

  // 客户端真正接管后，渲染真实的视频组件
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.05)]">
      {iframeError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
          <span className="text-red-500/50 font-mono text-sm uppercase tracking-widest">
            NEURAL_LINK_OFFLINE
          </span>
        </div>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1${!isMobile ? '&mute=1' : ''}&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top'}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Holo Video Feed"
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  );
}
