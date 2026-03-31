import React from 'react';
import { useInView } from 'react-intersection-observer';
import { AeroVideoPlayer } from './AeroVideoPlayer';

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
        <AeroVideoPlayer {...props} />
      ) : (
        <div className="w-full h-full bg-[#050505] rounded-xl" />
      )}
    </div>
  );
};
