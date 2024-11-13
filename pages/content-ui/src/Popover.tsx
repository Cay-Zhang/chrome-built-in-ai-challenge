import { useState, useRef, useMemo } from 'react';
import {
  Button,
  TabsTrigger,
  Tabs,
  TabsContent,
  TabsList,
  PopoverTrigger,
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  cn,
  Popover as ShadcnPopover,
  PopoverContent as ShadcnPopoverContent,
  PopoverContainerContext,
} from '@extension/ui';
import { openRouterLanguageModel, useStorage } from '@extension/shared';
import { exampleThemeStorage, Model, modelStorage, openRouterApiKeyStorage } from '@extension/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Wiki } from './Wiki';
import { AI } from './AI';
import { Check, ChevronsUpDown } from 'lucide-react';

const models: { model: Model; label: string }[] = [
  { model: 'chatgpt-4o-latest', label: 'ChatGPT 4o' },
  { model: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
  { model: '_builtin', label: 'Built-in' },
];

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
  const model = useStorage(modelStorage);
  const [open, setOpen] = useState(false);
  const aiWithSelectedModel = useMemo(() => {
    if (model === '_builtin' && !window.ai) return null;
    if (model !== '_builtin' && !openRouterApiKey) return null;
    return model === '_builtin'
      ? window.ai
      : {
          ...(window.ai ?? {}),
          languageModel: openRouterLanguageModel({
            model,
            apiKey: openRouterApiKey!,
          }),
        };
  }, [model, openRouterApiKey]);

  return (
    <motion.div
      layout
      className="bg-background flex min-w-[400px] flex-col items-center gap-2 rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between w-full">
        <ShadcnPopover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
              {models.find(({ model: m }) => m === model)!.label}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <ShadcnPopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {models.map(({ model: m, label }) => (
                    <CommandItem
                      key={m}
                      value={m}
                      onSelect={() => {
                        modelStorage.set(m);
                        setOpen(false);
                      }}>
                      <Check className={cn('mr-2 h-4 w-4', model === m ? 'opacity-100' : 'opacity-0')} />
                      {label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </ShadcnPopoverContent>
        </ShadcnPopover>

        <Button
          variant="secondary"
          className="p-1"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            removeFromDOM();
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
      {aiWithSelectedModel ? (
        <Tabs defaultValue="ai" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wiki">Wiki</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
          <TabsContent value="wiki">
            <Wiki acronym={acronym} context={context} ai={aiWithSelectedModel} />
          </TabsContent>
          <TabsContent value="ai">
            <AI acronym={acronym} context={context} ai={aiWithSelectedModel} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center">
          {model === '_builtin' ? 'Built-in AI model is not available.' : 'Enter API key to use AI.'}
        </div>
      )}
    </motion.div>
  );
}

export default function Popover(props: { removeFromDOM: () => void; acronym: string; context: string }) {
  const theme = useStorage(exampleThemeStorage);
  const [isVisible, setIsVisible] = useState(true);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(props.removeFromDOM, 300); // Delay removal to allow animation to complete
  };

  return (
    <PopoverContainerContext.Provider value={{ containerRef: popoverContainerRef }}>
      <div ref={popoverContainerRef} className={theme === 'dark' ? 'text-foreground dark' : 'text-foreground'}>
        <AnimatedPopover isVisible={isVisible}>
          <PopoverContent acronym={props.acronym} context={props.context} removeFromDOM={handleClose} />
        </AnimatedPopover>
      </div>
    </PopoverContainerContext.Provider>
  );
}
