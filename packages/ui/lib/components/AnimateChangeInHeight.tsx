import { ComponentPropsWithoutRef, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { cn } from '../utils';
import { motion } from 'framer-motion';

export type AnimateChangeInHeightProps = PropsWithChildren<
  Omit<ComponentPropsWithoutRef<typeof motion.div>, 'style' | 'animate' | 'children'>
>;

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({ children, className, ...props }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      // We only have one entry, so we can use entries[0].
      const observedHeight = entries[0].contentRect.height;
      setHeight(observedHeight);
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <motion.div {...props} className={cn(className, 'overflow-hidden')} style={{ height }} animate={{ height }}>
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};
