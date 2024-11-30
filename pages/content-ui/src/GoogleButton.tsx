import { useState } from 'react';
import { Button } from '@extension/ui';
import { runtime } from '@extension/shared/lib/rpc/client';
import { Search } from 'lucide-react';

const initialPrompts: NonNullable<AILanguageModelCreateOptions['initialPrompts']> = [
  {
    role: 'system',
    content: `
You are an assistant that generates search queries to find meanings of words, phrases, and acronyms (referred to as "targets" below) within a given context. You will be provided with:

Target
Surrounding Text
URL of the Web Page
Title of the Web Page

Your task is to generate a search query that will help find the meaning of the target in its specific context.
Example format: "<target> meaning in <domain>"

Output ONLY the search query, nothing else.
`,
  },
  {
    role: 'user',
    content: `
Target: "REST"
Surrounding Text: "The REST API allows developers to integrate our services into their applications."
URL: "https://developer.example.com/docs"
Title: "Developer Documentation"
`,
  },
  {
    role: 'assistant',
    content: 'REST meaning in software development',
  },
];

async function generatePrompt({
  acronym,
  context,
  pageUrl,
}: {
  acronym: string;
  context: string;
  pageUrl: string;
}): Promise<string> {
  return `
Target: "${acronym}"
Surrounding Text: "${context}"
URL: "${pageUrl}"
Title: "${(await runtime.getCurrentTabTitle()) ?? 'N/A'}"
`;
}

export function GoogleButton({ acronym, context, ai }: { acronym: string; context: string; ai: typeof window.ai }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const model = await ai.languageModel.create({
        initialPrompts,
      });
      const prompt = await generatePrompt({
        acronym,
        context,
        pageUrl: window.location.href,
      });
      console.log(prompt);
      const response = await model.prompt(prompt);

      if (response) {
        console.log('Search query:', response);
        const searchQuery = encodeURIComponent(response.trim());
        await runtime.createTab({
          url: `https://www.google.com/search?q=${searchQuery}`,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={isLoading} loading={isLoading} className="p-1">
      <Search className="h-5 w-5" />
    </Button>
  );
}
