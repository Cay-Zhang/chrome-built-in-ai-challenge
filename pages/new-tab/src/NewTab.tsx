import '@src/NewTab.css';
import '@src/NewTab.scss';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Button } from '@extension/ui';
import { t } from '@extension/i18n';
import { useState } from 'react';

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePromptSubmit = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const model = await ai.languageModel.create();
      const stream = model.promptStreaming(prompt);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult(value);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <h1>AI Prompt Page</h1>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="w-full p-2 mb-4 text-black"
        />
        <Button className="mb-4" onClick={handlePromptSubmit} disabled={isLoading} theme={theme}>
          {isLoading ? 'Processing...' : 'Submit Prompt'}
        </Button>
        <div className="result-container">
          <h2>Result:</h2>
          <p className="text-sm">{result}</p>
        </div>
        <Button className="mt-4" onClick={exampleThemeStorage.toggle} theme={theme}>
          {t('toggleTheme')}
        </Button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <div>{t('loading')}</div>), <div> Error Occur </div>);
