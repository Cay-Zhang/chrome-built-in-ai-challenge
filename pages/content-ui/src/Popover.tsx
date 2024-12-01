import { useState, useRef, useMemo, useCallback } from 'react';
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
  AnimateChangeInHeight,
} from '@extension/ui';
import { openRouterLanguageModel, useStorage } from '@extension/shared';
import { exampleThemeStorage, Model, modelStorage, openRouterApiKeyStorage } from '@extension/storage';
import { motion } from 'framer-motion';
import { Wiki } from './Wiki';
import { AI } from './AI';
import { GoogleButton } from './GoogleButton';
import { Check, ChevronsUpDown, X } from 'lucide-react';

const models: { model: Model; label: string }[] = [
  { model: '_builtin', label: 'Built-in' },
  { model: 'google/gemini-flash-1.5-8b', label: 'Gemini 1.5 Flash-8B' },
  { model: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
  { model: 'chatgpt-4o-latest', label: 'ChatGPT 4o' },
  { model: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
];

function PopoverContent({ close, acronym, context }: { close: () => void; acronym: string; context: string }) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className="bg-background/80 flex min-w-[400px] flex-col items-center gap-4 p-4">
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
        className="flex justify-between w-full">
        <ShadcnPopover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
              {models.find(({ model: m }) => m === model)?.label ?? 'Select model'}
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

        <div className="flex gap-1">
          {aiWithSelectedModel && <GoogleButton acronym={acronym} context={context} ai={aiWithSelectedModel} />}
          <Button
            variant="ghost"
            size="icon"
            className="p-1"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              close();
            }}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>
      <motion.div
        layout="position"
        className="px-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0, delay: 0.5 }}>
        {aiWithSelectedModel ? (
          <AI acronym={acronym} context={context} ai={aiWithSelectedModel} />
        ) : (
          <div className="text-center">
            {model === '_builtin' ? 'Built-in AI model is not available.' : 'Enter API key to use AI.'}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Popover(props: {
  close: () => void;
  acronym: string;
  context: string;
  expandImmediately: boolean;
}) {
  const theme = useStorage(exampleThemeStorage);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const popoverContainerRef = useRef<HTMLDivElement>(null);
  const expansionTimeoutRef = useRef<number>();

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
    expansionTimeoutRef.current = window.setTimeout(() => requestAnimationFrame(() => setIsExpanded(true)), 500);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (expansionTimeoutRef.current) window.clearTimeout(expansionTimeoutRef.current);
  }, []);

  // delay expansion for AnimateChangeInHeight to work properly
  useState(
    () => props.expandImmediately && requestAnimationFrame(() => requestAnimationFrame(() => setIsExpanded(true))),
  );

  return (
    <PopoverContainerContext.Provider value={{ containerRef: popoverContainerRef }}>
      <div ref={popoverContainerRef} className={theme === 'dark' ? 'text-foreground dark' : 'text-foreground'}>
        <div
          className="pb-2 pl-2 pr-2 w-full flex justify-center"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}>
          <motion.div
            layout
            initial={{ opacity: 0, y: 4, scaleX: 0.2 }}
            animate={{ opacity: 1, y: 4, scaleX: 1 }}
            style={{
              width: isExpanded
                ? 'auto'
                : !isHovering
                  ? 'clamp(50px, calc(100% + 20px), 320px)'
                  : 'calc(clamp(50px, calc(100% + 20px), 320px) * 1.25)',
            }}
            className={`backdrop-blur-lg ${isExpanded || props.expandImmediately ? 'bg-foreground/0' : 'bg-foreground/75'} rounded-2xl border border-border/20 shadow-lg overflow-hidden transition-colors duration-200 flex-shrink-0`}
            transition={{
              default: { type: 'spring', duration: 0.5, bounce: 0.1 },
              opacity: { duration: 0.5 },
              layout: isExpanded
                ? { type: 'spring', duration: 0.5, bounce: 0.1 }
                : { ease: [0.95, 0.05, 0.795, 0.035], duration: 0.5 },
            }}>
            <AnimateChangeInHeight
              transition={
                isExpanded
                  ? { type: 'spring', duration: 0.5, bounce: 0.1 }
                  : { ease: [0.95, 0.05, 0.795, 0.035], duration: 0.5 }
              }>
              {isExpanded ? (
                <PopoverContent acronym={props.acronym} context={props.context} close={props.close} />
              ) : (
                <div style={{ height: isHovering ? '20px' : '8px' }} />
              )}
            </AnimateChangeInHeight>
          </motion.div>
        </div>
      </div>
    </PopoverContainerContext.Provider>
  );
}
