import { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';
import wiki, { Page } from 'wikijs';

interface PageSection {
  title: string;
  content: string;
  items?: PageSection[];
}

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
  const [wikiContent, setWikiContent] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      setIsLoading(true);
      setResult('');
      setWikiContent([]);

      let value: string | null = '';
      try {
        const model = await ai.languageModel.create();
        const prompt = `What does "${acronym}" mean in "${context}"? If it is an acronym, ONLY output the expanded phrase. Respond in English.`;
        console.log(prompt);
        const stream = model.promptStreaming(prompt);
        const reader = stream.getReader();

        while (true) {
          const { done, value: _value } = await reader.read();
          if (done) {
            break;
          } else {
            value = _value;
          }
          setResult(value ?? '');
        }
        console.log(value);
      } catch (error) {
        value = null;
        console.error('Error:', error);
        setResult('An error occurred while processing the request.');
      } finally {
        setIsLoading(false);
      }

      // Search wiki for the acronym
      try {
        const page: Page & { title: string } = (await wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' }).find(
          value ?? acronym,
        )) as any;
        if (!(await page.categories()).includes('Category:Disambiguation pages')) {
          const summary = await page.summary();
          setWikiContent([{ title: `Summary (${page.title})`, content: summary }]);
        } else {
          const content = (await page.content()) as any as PageSection[];
          setWikiContent(content);
        }
      } catch (error) {
        console.error('Error finding wiki page for acronym', error);
      }
    };

    lookup();
  }, [acronym, context]);

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
      <div className="flex gap-1 text-center whitespace-nowrap overflow-x-auto">
        {isLoading ? 'Loading...' : result}
      </div>
      {wikiContent && (
        <div className="mt-2 text-sm text-gray-600 max-h-52 overflow-y-auto space-y-6">
          {wikiContent.map((section, i) => (
            <div key={i} className="mb-6">
              {section.title && <h3 className="font-medium mb-3">{section.title}</h3>}
              <p className="mb-4 whitespace-pre-wrap leading-relaxed">{section.content}</p>
              {section.items &&
                section.items.map((subsection, j) => (
                  <div key={j} className="ml-4 mb-4">
                    {subsection.title && <h4 className="font-medium mb-3">{subsection.title}</h4>}
                    <p className="leading-relaxed">{subsection.content}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
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
