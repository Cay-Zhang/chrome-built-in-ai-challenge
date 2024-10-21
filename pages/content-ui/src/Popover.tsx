import { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';

export default function Popover({
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
        const prompt = `What does "${acronym}" mean in "${context}"? If it is an acronym, ONLY output the expanded phrase.`;
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
    <div className="flex flex-col items-start gap-2 rounded bg-blue-100 px-2 py-1">
      <div className="flex gap-1 text-blue-500">{isLoading ? 'Loading...' : result}</div>
      <Button
        theme={theme}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          removeFromDOM();
        }}>
        Close
      </Button>
    </div>
  );
}
