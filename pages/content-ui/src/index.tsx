import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import '@extension/shared/lib/scheduler';
import Popover from './Popover';

// Function to find and highlight acronyms
async function highlightAcronyms() {
  const acronymRegex = /\b[A-Z]{2,}\b/g;
  const highlightedAcronyms = new Set();

  // Function to process a single text node
  function processTextNode(node: Text) {
    const matches = node.nodeValue?.match(acronymRegex);
    if (matches && node.parentNode) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      const nodeValue = node.nodeValue ?? ''; // Use nullish coalescing
      nodeValue.replace(acronymRegex, (match, offset) => {
        // Add text before the match
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(nodeValue.slice(lastIndex, offset)));
        }
        // Create the highlighted span
        const mark = document.createElement('mark');
        mark.textContent = match;
        mark.style.backgroundColor = 'yellow';
        mark.style.color = 'black';

        // Create a container for the mark and the React component
        const container = document.createElement('span');
        container.style.position = 'relative';
        container.appendChild(mark);

        // Add hover event listeners
        container.addEventListener('mouseenter', () => {
          // Guard clause to prevent adding the popover twice
          if (container.querySelector('.popover-container')) return;

          const shadowRootContainer = document.createElement('div');
          shadowRootContainer.className = 'popover-container';
          shadowRootContainer.style.position = 'absolute';
          shadowRootContainer.style.top = '125%';
          shadowRootContainer.style.left = '0';
          shadowRootContainer.style.zIndex = '1000';
          container.appendChild(shadowRootContainer);

          const shadowRoot = shadowRootContainer.attachShadow({ mode: 'open' });

          // Add styles to the shadow DOM
          const style = document.createElement('style');
          style.innerHTML = tailwindcssOutput;
          shadowRoot.appendChild(style);

          const reactRoot = document.createElement('div');
          shadowRoot.appendChild(reactRoot);

          // Render the React component
          createRoot(reactRoot).render(
            <Popover
              acronym={match}
              context={nodeValue}
              removeFromDOM={() => requestAnimationFrame(() => container.removeChild(shadowRootContainer))}
            />,
          );
        });

        fragment.appendChild(container);

        lastIndex = offset + match.length;
        if (!highlightedAcronyms.has(match)) {
          console.log('New acronym found:', match);
          highlightedAcronyms.add(match);
        }
        return match;
      });
      // Add any remaining text after the last match
      if (lastIndex < nodeValue.length) {
        fragment.appendChild(document.createTextNode(nodeValue.slice(lastIndex)));
      }
      requestAnimationFrame(() => node.parentNode?.replaceChild(fragment, node));
    }
  }

  // Use TreeWalker to iterate through text nodes
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  let currentNode: Node | null = treeWalker.nextNode();
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      processTextNode(currentNode as Text);
    }

    // Yield to the main thread after processing each node
    await scheduler.yield({ priority: 'user-blocking' });

    currentNode = treeWalker.nextNode();
  }
}

// Run the function when the content script loads
scheduler.postTask(highlightAcronyms, { priority: 'user-visible' });

// Re-run the function when new nodes are added or text content changes
// this causes things to rerun forever...
// const observer = new MutationObserver(mutations => {
//   let shouldHighlight = false;
//   for (const mutation of mutations) {
//     if (mutation.type === 'childList') {
//       const addedNodes = Array.from(mutation.addedNodes);
//       if (addedNodes.some(node => node.nodeType === Node.ELEMENT_NODE && !(node as Element).closest('mark'))) {
//         shouldHighlight = true;
//         break;
//       }
//     } else if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
//       shouldHighlight = true;
//       break;
//     }
//   }
//   if (shouldHighlight) {
//     console.log('Mutation detected, re-running highlightAcronyms');
//     scheduler.postTask(highlightAcronyms, { priority: 'user-visible' });
//   }
// });
// observer.observe(document.body, { childList: true, subtree: true, characterData: true });

const root = document.createElement('div');
root.id = 'chrome-extension-boilerplate-react-vite-content-view-root';

document.body.append(root);

const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });

if (navigator.userAgent.includes('Firefox')) {
  /**
   * In the firefox environment, adoptedStyleSheets cannot be used due to the bug
   * @url https://bugzilla.mozilla.org/show_bug.cgi?id=1770592
   *
   * Injecting styles into the document, this may cause style conflicts with the host page
   */
  const styleElement = document.createElement('style');
  styleElement.innerHTML = tailwindcssOutput;
  shadowRoot.appendChild(styleElement);
} else {
  /** Inject styles into shadow dom */
  const globalStyleSheet = new CSSStyleSheet();
  globalStyleSheet.replaceSync(tailwindcssOutput);
  shadowRoot.adoptedStyleSheets = [globalStyleSheet];
}

shadowRoot.appendChild(rootIntoShadow);
createRoot(rootIntoShadow).render(<App />);
