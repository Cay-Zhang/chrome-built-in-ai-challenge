import { useEffect, useState } from 'react';
import wiki, { Page } from 'wikijs';
import { motion } from 'framer-motion';

interface PageSection {
  title: string;
  content: string;
  items?: PageSection[];
}

async function isCorrectPage({ page, acronym }: { page: Page; acronym: string }): Promise<boolean> {
  const isNotDisambiguationPage = !(await page.categories()).includes('Category:Disambiguation pages');
  const summary = await page.summary();
  const summaryIncludesAcronym = summary.match(new RegExp(`\\b${acronym}\\b`, 'i'));
  return Boolean(isNotDisambiguationPage && summaryIncludesAcronym);
}

export function Wiki({ acronym, context }: { acronym: string; context: string }) {
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
        if (await isCorrectPage({ page, acronym })) {
          const summary = await page.summary();
          setWikiContent([{ title: `Summary (${page.title})`, content: summary }]);
        } else {
          const acronymPage: Page & { title: string } = (await wiki({
            apiUrl: 'https://en.wikipedia.org/w/api.php',
          }).find(acronym)) as any;
          if (await isCorrectPage({ page: acronymPage, acronym })) {
            const summary = await page.summary();
            setWikiContent([{ title: `Summary (${page.title})`, content: summary }]);
          } else {
            const content = (await acronymPage.content()) as any as PageSection[];
            setWikiContent(content);
          }
        }
      } catch (error) {
        console.error('Error finding wiki page for acronym', error);
      }
    };

    lookup();
  }, [acronym, context]);

  return (
    <motion.div layout>
      <div className="flex gap-1 text-center whitespace-nowrap overflow-x-auto">{isLoading ? acronym : result}</div>
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
