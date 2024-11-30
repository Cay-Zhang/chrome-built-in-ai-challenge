import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { runtime } from '@extension/shared/lib/rpc/client';

const initialPrompts: NonNullable<AILanguageModelCreateOptions['initialPrompts']> = [
  {
    role: 'system',
    content: `
You are an assistant that interprets words, phrases, and acronyms (referred to as "targets" below) within a given context. You will be provided with:

Target
Surrounding Text
URL of the Web Page
Title of the Web Page

Your output depends on the type of target:
For words or phrases:
- Provide the meaning of target as used in the context.
- Provide ONE example sentence where target has the same meaning.

For acronyms:
- First Line: Output ONLY the expanded form of the acronym as used in the context.
- Following Lines: Provide a short, Wikipedia-style definition of the expanded form.

For code (shell commands, language syntax, types, etc.):
- Provide a brief explanation of the effect of the target in the surrounding code.
- Provide ONE code snippet that demonstrates the target in use.

Output in the language of the context.
`,
  },
  {
    role: 'user',
    content: `
Target: "cloud"
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

> Our company uses the **cloud** to store and share documents among team members.
`,
  },
  {
    role: 'user',
    content: `
Target: "FAQ"
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
  {
    role: 'user',
    content: `
Target: "-R"
Surrounding Text: "ssh -R 80:localhost:3000"
URL: "https://www.digitalocean.com/community/tutorials/how-to-use-ssh-port-forwarding"
Title: "How to Use SSH Port Forwarding"
`,
  },
  {
    role: 'assistant',
    content: `
## Reverse SSH Tunneling

The \`-R\` option here instructs the SSH server to forward connections from its own port 80 to port 3000 on the client's localhost. Consequently, any connection attempts to port 80 on the remote server are securely tunneled to port 3000 on the local machine.

> If you run \`ssh -R 8080:localhost:5000 user@remote_host\`, accessing http://remote_host:8080 in a browser would display the web application running on http://localhost:5000 of your local machine.
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
Target:
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
        {result && (
          <ReactMarkdown className="prose dark:prose-invert">
            {result + (isRequestInProgress ? ' ⬤' : '')}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}
