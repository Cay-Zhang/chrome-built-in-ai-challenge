import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import '@extension/shared/lib/scheduler';
import Popover from './Popover';

const acronymMarkerSymbol = Symbol('acronym-marker');
let popoverId = 0;

function showAcronymPopover({
  structuredContainer,
  expandImmediately,
  acronym,
  context,
}: {
  structuredContainer: HTMLSpanElement;
  expandImmediately: boolean;
  acronym?: string;
  context?: string;
}) {
  if (structuredContainer.querySelector('.popover-container')) return;

  acronym ??= structuredContainer.textContent!;
  context ??= structuredContainer.parentElement?.textContent ?? acronym;

  const mark = structuredContainer.querySelector('mark');
  if (!mark) return;

  mark.style.anchorName = '--acronym' + popoverId;

  const shadowRootContainer = document.createElement('div');
  shadowRootContainer.setAttribute('popover', 'auto');
  shadowRootContainer.className = 'popover-container';
  shadowRootContainer.style.position = 'absolute';
  shadowRootContainer.style.positionAnchor = '--acronym' + popoverId;
  shadowRootContainer.style.positionArea = 'bottom';
  shadowRootContainer.style.minWidth = 'anchor-size(width)';
  shadowRootContainer.style.borderStyle = 'none';
  shadowRootContainer.style.backgroundColor = 'transparent';
  shadowRootContainer.style.margin = '0';
  shadowRootContainer.style.overflow = 'unset';
  // shadowRootContainer.style.positionTryFallbacks = 'flip-block';
  structuredContainer.appendChild(shadowRootContainer);
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
      acronym={acronym}
      context={context}
      removeFromDOM={() => requestAnimationFrame(() => structuredContainer.removeChild(shadowRootContainer))}
      expandImmediately={expandImmediately}
    />,
  );
}

// pure function to create structured containers for a list of ranges contained in one common text ancestor
function createStructuredContainers(ranges: Range[]) {
  if (ranges.length === 0) return null;

  const fragment = document.createDocumentFragment();
  const structuredContainers: HTMLSpanElement[] = [];

  const node = ranges[0].commonAncestorContainer as Text;
  const nodeValue = node.nodeValue ?? '';
  let lastIndex = 0;

  // Sort ranges by start offset
  const sortedRanges = [...ranges].sort((a, b) => a.startOffset - b.startOffset);

  for (const range of sortedRanges) {
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const text = nodeValue.slice(startOffset, endOffset);

    // Add text before the match
    if (startOffset > lastIndex) {
      fragment.appendChild(document.createTextNode(nodeValue.slice(lastIndex, startOffset)));
    }

    // Create the highlighted span
    const mark = document.createElement('mark');
    mark.textContent = text;
    mark.style.backgroundColor = 'yellow';
    mark.style.color = 'black';

    (mark.firstChild as Text as any)[acronymMarkerSymbol] = true;

    // Create a container for the mark
    const container = document.createElement('span');
    container.style.position = 'relative';
    container.appendChild(mark);

    fragment.appendChild(container);
    structuredContainers.push(container);

    lastIndex = endOffset;
  }

  // Add any remaining text after the last match
  if (lastIndex < nodeValue.length) {
    fragment.appendChild(document.createTextNode(nodeValue.slice(lastIndex)));
  }

  return {
    documentFragment: fragment,
    structuredContainers,
  };
}

// Function to find and highlight acronyms
async function highlightAcronyms() {
  const acronymRegex = /\b(?:[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g;
  const highlightedAcronyms = new Set();

  // Function to process a single text node
  function processTextNode(node: Text) {
    if ((node as any)[acronymMarkerSymbol]) return;

    const matches = Array.from(node.nodeValue?.matchAll(acronymRegex) ?? []);
    if (matches.length > 0 && node.parentNode) {
      // Create ranges for each match
      const ranges = matches.map(match => {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        return range;
      });

      const result = createStructuredContainers(ranges);
      if (!result) return;

      const { documentFragment, structuredContainers } = result;

      // Add event listeners to the structuredContainers
      structuredContainers.forEach((container, index) => {
        const match = matches[index][0];
        container.addEventListener('mouseenter', () =>
          showAcronymPopover({
            structuredContainer: container,
            expandImmediately: true,
            acronym: match,
            context: node.nodeValue ?? '',
          }),
        );

        if (!highlightedAcronyms.has(match)) {
          console.log('New acronym found:', match);
          highlightedAcronyms.add(match);
        }
      });

      requestAnimationFrame(() => node.parentNode?.replaceChild(documentFragment, node));
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

document.addEventListener('pointerup', e => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const result = createStructuredContainers([range]);
  if (!result) return;
  const { documentFragment, structuredContainers } = result;
  range.commonAncestorContainer.parentNode?.replaceChild(documentFragment, range.commonAncestorContainer);
  showAcronymPopover({ structuredContainer: structuredContainers[0], expandImmediately: false });
});
