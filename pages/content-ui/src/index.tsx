import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import '@extension/shared/lib/scheduler';
import Popover from './Popover';

const acronymMarkerSymbol = Symbol('acronym-marker');
let popoverId = 0;

// Function to find and highlight acronyms
async function highlightAcronyms() {
  const acronymRegex = /\b(?:[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g;
  const highlightedAcronyms = new Set();

  // Function to process a single text node
  function processTextNode(node: Text) {
    if ((node as any)[acronymMarkerSymbol]) return;

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

        (mark.firstChild as Text as any)[acronymMarkerSymbol] = true;

        // Create a container for the mark and the React component
        const container = document.createElement('span');
        container.style.position = 'relative';
        container.appendChild(mark);

        // Add hover event listeners
        container.addEventListener('mouseenter', () => {
          // Guard clause to prevent adding the popover twice
          if (container.querySelector('.popover-container')) return;

          mark.style.anchorName = '--acronym' + popoverId;

          const shadowRootContainer = document.createElement('div');
          shadowRootContainer.setAttribute('popover', 'auto');
          shadowRootContainer.className = 'popover-container';
          shadowRootContainer.style.position = 'absolute';
          shadowRootContainer.style.positionAnchor = '--acronym' + popoverId;
          shadowRootContainer.style.positionArea = 'bottom';
          shadowRootContainer.style.borderStyle = 'none';
          shadowRootContainer.style.backgroundColor = 'transparent';
          shadowRootContainer.style.margin = '0';
          shadowRootContainer.style.overflow = 'unset';
          // shadowRootContainer.style.positionTryFallbacks = 'flip-block';
          container.appendChild(shadowRootContainer);
          shadowRootContainer.showPopover();

          popoverId += 1;

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

  // Function to process new nodes
  async function processNewNodes(nodes: Node[]) {
    for (const node of nodes) {
      // Skip our own elements
      if (node instanceof Element && (node.closest('mark') || node.classList.contains('popover-container'))) {
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node as Text);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process child text nodes
        const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let textNode = treeWalker.nextNode();
        while (textNode) {
          processTextNode(textNode as Text);
          await scheduler.yield({ priority: 'user-visible' });
          textNode = treeWalker.nextNode();
        }
      }
    }
  }

  // Initial processing
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null = treeWalker.nextNode();
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      processTextNode(currentNode as Text);
    }
    await scheduler.yield({ priority: 'user-visible' });
    currentNode = treeWalker.nextNode();
  }

  // Set up mutation observer for dynamic content
  const observer = new MutationObserver(mutations => {
    const newNodes: Node[] = [];

    for (const mutation of mutations) {
      // Handle added nodes
      if (mutation.type === 'childList') {
        newNodes.push(...Array.from(mutation.addedNodes));
      }
      // Handle text changes
      else if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
        newNodes.push(mutation.target);
      }
    }

    if (newNodes.length > 0) {
      scheduler.postTask(() => processNewNodes(newNodes), { priority: 'user-visible' });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Run the function when the content script loads
scheduler.postTask(highlightAcronyms, { priority: 'user-visible' });

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
