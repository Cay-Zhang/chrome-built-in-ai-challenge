<div align="center">

<img src="https://github.com/user-attachments/assets/4dd2dc90-ccef-4533-8118-adfaa2dec7de" width="80" height="80">

# Contextual Lookup

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

[Demo on YouTube](https://youtu.be/3iORsVBdQR8)

</div>

> [!NOTE]
> This project is based on [Jonghakseo/chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite). It is tested on the latest Chrome Dev build.

## Overview
Navigating technical jargon, complex topics, or unfamiliar acronyms can be challenging, especially when conventional lookup methods fail to consider the surrounding context.
Contextual Lookup is a Chrome extension that addresses this gap by extracting and using contextual information like surrounding text, page metadata, and more, delivering tailored and relevant insights directly within the browser.

Built with the latest web technologies, Contextual Lookup offers a seamless user experience while providing flexibility with multiple AI integration options, including Chrome's native AI models and server-side solutions via OpenRouter.

## Installation
1. Download extension.zip from [releases](https://github.com/Cay-Zhang/chrome-built-in-ai-challenge/releases/tag/hackathon) and unzip
2. Open in browser - `chrome://extensions`
3. Check - `Developer mode`
4. Find and Click - `Load unpacked extension`
5. Select - the unzipped folder

To use the built-in AI model, ensure chrome flags are configured as below:
1. `chrome://flags/#optimization-guide-on-device-model` set to `Enabled BypassPerfRequirement`
2. `chrome://flags/#text-safety-classifier` set to `Disabled`
3. `chrome://flags/#prompt-api-for-gemini-nano` set to `Enabled`

To use server-side models, enter an OpenRouter API key in the extension **popup** (not settings page).

> [!NOTE]
> For [Google Chrome Built-in AI Challenge](https://googlechromeai.devpost.com/) judges — an OpenRouter API key for testing purposes is included in "Testing instructions for application".

## Usage
**Contextual Lookup** enhances the lookup experience by integrating relevant contextual information, such as surrounding text, page URL, and tab title, into the context of language models. Here’s how it works:

- **Selecting and Hovering**: Users can select text or code and hover over the thin bar that appears below the selection. The bar will gradually expand into the definition popover in a short time span.
- **Tailored Responses Based on Selection**
    - For **words or phrases**, the definition popover displays the meaning in context and includes one relevant example sentence.
    - For **acronyms**, it shows the expanded form and a concise, Wikipedia-style definition.
    - For **code**, it explains the effect of the selection in context and provides one illustrative code snippet.
- **Model Options**: Users can choose between Chrome's built-in AI model (browser support required) or server-side models like Gemini 1.5 Pro and Gemini 1.5 Flash-8B (OpenRouter API key required).
- **Contextual Search**: If the contextual definition isn’t satisfactory, users can click the search button in the popover. The extension generates a context-aware search query and opens a Google search page.
- **Acronym Detection**: Acronyms are automatically highlighted on web pages if the feature is enabled. Hovering over them activates the lookup function, streamlining understanding of domain-specific abbreviations.
