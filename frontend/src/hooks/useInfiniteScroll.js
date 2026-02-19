import { useEffect, useRef } from 'react';

export const useInfiniteScroll = (callback, hasMore) => {
  const observerRef = useRef();
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    }, options);

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (currentRef && observerRef.current) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [callback, hasMore]);

  return loadMoreRef;
};
