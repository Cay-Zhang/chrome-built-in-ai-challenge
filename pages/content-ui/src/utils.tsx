export function injectStyles(shadowRoot: ShadowRoot, styles: string) {
  if (navigator.userAgent.includes('Firefox')) {
    /**
     * In the firefox environment, adoptedStyleSheets cannot be used due to the bug
     * @url https://bugzilla.mozilla.org/show_bug.cgi?id=1770592
     */
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    shadowRoot.appendChild(styleElement);
  } else {
    const globalStyleSheet = new CSSStyleSheet();
    globalStyleSheet.replaceSync(styles);
    shadowRoot.adoptedStyleSheets = [globalStyleSheet];
  }
}
