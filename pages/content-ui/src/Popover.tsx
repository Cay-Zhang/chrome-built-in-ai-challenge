import { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Wiki } from './Wiki';

const AnimatedPopover = ({ isVisible, children }: { isVisible: boolean; children: React.ReactNode }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

function PopoverContent({
  removeFromDOM,
  acronym,
  context,
}: {
  removeFromDOM: () => void;
  acronym: string;
  context: string;
}) {
  const theme = useStorage(exampleThemeStorage);

  return (
    <motion.div layout className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-lg min-w-[400px]">
      <div className="self-end">
        <Button
          theme={theme}
          className="p-1"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            removeFromDOM();
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
      <Wiki acronym={acronym} context={context} />
    </motion.div>
  );
}

export default function Popover(props: { removeFromDOM: () => void; acronym: string; context: string }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(props.removeFromDOM, 300); // Delay removal to allow animation to complete
  };

  return (
    <AnimatedPopover isVisible={isVisible}>
      <PopoverContent {...props} removeFromDOM={handleClose} />
    </AnimatedPopover>
  );
}
