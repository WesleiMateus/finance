import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export const useGsapReveal = (delay = 0, duration = 0.8) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        elementRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
        }
      );
    });

    return () => ctx.revert();
  }, [delay, duration]);

  return elementRef;
};

export const useGsapStagger = (selector: string, delay = 0, stagger = 0.1) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          stagger,
          ease: 'power2.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector, delay, stagger]);

  return containerRef;
};
