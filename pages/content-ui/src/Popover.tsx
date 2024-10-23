import { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      setIsLoading(true);
      setResult('');

      try {
        const model = await ai.languageModel.create();
        const prompt = `What does "${acronym}" mean in "${context}"? If it is an acronym, ONLY output the expanded phrase. Respond in English.`;
        console.log(prompt);
        const stream = model.promptStreaming(prompt);
        const reader = stream.getReader();

        let value = '';
        while (true) {
          const { done, value: _value } = await reader.read();
          if (done) {
            break;
          } else {
            value = _value;
          }
          setResult(value);
        }
        console.log(value);
      } catch (error) {
        console.error('Error:', error);
        setResult('An error occurred while processing the request.');
      } finally {
        setIsLoading(false);
      }
    };

    lookup();
  }, [acronym, context]);

  return (
    <motion.div layout className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-lg">
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
      <div className="flex gap-1 text-center whitespace-nowrap overflow-x-auto">
        {isLoading ? 'Loading...' : result}
      </div>
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
