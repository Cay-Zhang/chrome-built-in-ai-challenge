import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { runtime } from '@extension/shared/lib/rpc/client';

const initialPrompts: NonNullable<AILanguageModelCreateOptions['initialPrompts']> = [
  {
    role: 'system',
    content: `
You are an assistant that interprets words, phrases, and acronyms within a given context. You will be provided with:

Target Word/Phrase/Acronym
Surrounding Text
URL of the Web Page
Title of the Web Page

Your Task:
For words or phrases:
- Provide the meaning of the word or phrase as used in the context.
- Provide TWO example sentences where the word or phrase has the same meaning.

For acronyms:
- First Line: Output ONLY the expanded form of the acronym.
- Following Lines: Provide a short, Wikipedia-style definition of the expanded phrase.
`,
  },
  {
    role: 'user',
    content: `
Target Word/Phrase: "cloud"
Surrounding Text: "Many businesses are moving their data to the cloud to improve accessibility and security."
URL: "https://www.techinsights.com/cloud-computing"
Title: "The Future of Data Storage"
`,
  },
  {
    role: 'assistant',
    content: `
## Cloud computing services

Cloud computing services allow data and software to be stored and accessed over the internet rather than on local servers or personal devices.

**Example sentences:**

Our company uses the **cloud** to store and share documents among team members.
**Cloud** solutions have revolutionized the way we handle data backup and recovery.
`,
  },
  {
    role: 'user',
    content: `
Target Acronym: "FAQ"
Surrounding Text: "Before contacting support, please check the FAQ section for quick answers."
URL: "https://www.websitehelp.com/support"
Title: "Customer Support Resources"
`,
  },
  {
    role: 'assistant',
    content: `
## Frequently Asked Questions

A list of common questions and answers on a particular topic, intended to help people understand and navigate through common issues or inquiries.
`,
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
Target Word/Phrase/Acronym:
"${acronym}"

Surrounding Text:
"${context}"

URL of the Web Page:
"${pageUrl}"

Title of the Web Page:
"${(await runtime.getCurrentTabTitle()) ?? 'N/A'}"
`;
}

export function AI({ acronym, context, ai }: { acronym: string; context: string; ai: typeof window.ai }) {
  const [result, setResult] = useState('');
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      setIsRequestInProgress(true);
      setResult('');

      let value: string | null = '';
      try {
        const model = await ai.languageModel.create({
          initialPrompts,
        });
        const prompt = await generatePrompt({ acronym, context, pageUrl: window.location.href });
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
        setIsRequestInProgress(false);
      }
    };

    lookup();
  }, [acronym, context, ai]);

  return (
    <motion.div layout="position">
      <div className="flex gap-1">
        {!result ? acronym : <ReactMarkdown className="prose dark:prose-invert">{result}</ReactMarkdown>}
      </div>
    </motion.div>
  );
}
