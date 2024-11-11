import { useState, useEffect } from 'react';
import { Button, TabsTrigger, Tabs, TabsContent, TabsList } from '@extension/ui';
import { openRouterLanguageModel, useStorage } from '@extension/shared';
import { exampleThemeStorage, openRouterApiKeyStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Wiki } from './Wiki';
import { AI } from './AI';

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
  const openRouterApiKey = useStorage(openRouterApiKeyStorage);
  return (
    <motion.div
      layout
      className="flex flex-col items-center gap-2 rounded-2xl bg-background p-4 shadow-lg min-w-[400px]">
      <div className="self-end">
        <Button
          variant="secondary"
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
      <Tabs defaultValue="ai" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>
        <TabsContent value="wiki">
          <Wiki acronym={acronym} context={context} />
        </TabsContent>
        <TabsContent value="ai">
          <AI
            acronym={acronym}
            context={context}
            ai={
              openRouterApiKey
                ? {
                    ...ai,
                    languageModel: openRouterLanguageModel({
                      model: 'chatgpt-4o-latest',
                      apiKey: openRouterApiKey,
                    }),
                  }
                : ai
            }
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default function Popover(props: { removeFromDOM: () => void; acronym: string; context: string }) {
  const theme = useStorage(exampleThemeStorage);
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(props.removeFromDOM, 300); // Delay removal to allow animation to complete
  };

  return (
    <div className={theme === 'dark' ? 'dark text-foreground' : 'text-foreground'}>
      <AnimatedPopover isVisible={isVisible}>
        <PopoverContent {...props} removeFromDOM={handleClose} />
      </AnimatedPopover>
    </div>
  );
}
