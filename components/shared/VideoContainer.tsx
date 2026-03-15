import React, { Suspense, lazy } from 'react';
import { useInView } from 'react-intersection-observer';

// 懒加载重型组件
const AeroVideoPlayer = lazy(() => import('./AeroVideoPlayer').then(m => ({ default: m.AeroVideoPlayer })));

export const VideoContainer: React.FC<any> = (props) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div ref={ref} className="w-full aspect-video">
      {isMounted && inView ? (
        <Suspense fallback={<div className="w-full h-full bg-[#050505] rounded-xl animate-pulse" />}>
          <AeroVideoPlayer {...props} />
        </Suspense>
      ) : (
        <div className="w-full h-full bg-[#050505] rounded-xl" />
      )}
    </div>
  );
};
