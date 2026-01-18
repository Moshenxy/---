import $ from 'jquery';
import screenfull from 'screenfull';

let originalStyles: { [selector: string]: { [key: string]: string } } = {};

// --- 浏览器全屏 (Browser Fullscreen) ---

function toggleBrowserFullscreen() {
  if (screenfull.isEnabled) {
    screenfull.toggle();
  } else {
    console.warn('浏览器不支持或不允许全屏功能。');
  }
}

function onBrowserFullscreenChange(callback: (isFullscreen: boolean) => void) {
  if (screenfull.isEnabled) {
    screenfull.on('change', () => {
      callback(screenfull.isFullscreen);
    });
  }
}

// --- 网页全屏 (Web Fullscreen) ---

function getIframeSelector(): string | null {
  const iframes = parent.document.getElementsByTagName('iframe');
  for (let i = 0; i < iframes.length; i++) {
    if (iframes[i].contentWindow === window) {
      const iframe = iframes[i];
      if (iframe.id) {
        return `#${iframe.id}`;
      }
      const src = iframe.getAttribute('src');
      if (src) {
        const srcFileName = src.split('/').pop();
        if (srcFileName) {
          return `iframe[src*="${srcFileName}"]`;
        }
      }
      return null;
    }
  }
  return null;
}

function enterWebFullscreen() {
  const iframeSelector = getIframeSelector();
  if (!iframeSelector) {
    console.warn('无法找到应用 iframe，无法进入网页全屏模式。');
    return;
  }

  const elementsToModify: { [key: string]: JQuery.PlainObject } = {
    [iframeSelector]: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '99999',
      border: 'none',
      borderRadius: '0',
    },
    '#top-settings-holder': { display: 'none' },
    '#form_sheld > :not(#chat)': { display: 'none' },
    '#top-bar': { display: 'none' },
    '#chat': { height: '100vh', maxHeight: '100vh' },
    '#chat_fullscreen_button': { display: 'none' },
  };

  originalStyles = {};
  for (const selector in elementsToModify) {
    const $element = $(selector, parent.document);
    if ($element.length > 0) {
      originalStyles[selector] = {};
      const newStyles = elementsToModify[selector as keyof typeof elementsToModify];
      for (const prop in newStyles) {
        originalStyles[selector][prop] = $element.css(prop);
      }
      $element.css(newStyles);
    }
  }
  $(parent.document.documentElement).addClass('web-fullscreen-active');
  $(parent.document.body).addClass('web-fullscreen-active');
}

function exitWebFullscreen() {
  for (const selector in originalStyles) {
    const $element = $(selector, parent.document);
    if ($element.length > 0) {
      $element.css(originalStyles[selector]);
    }
  }
  originalStyles = {};
  $(parent.document.documentElement).removeClass('web-fullscreen-active');
  $(parent.document.body).removeClass('web-fullscreen-active');
}

export const fullscreenService = {
  // 网页全屏
  enterWeb: enterWebFullscreen,
  exitWeb: exitWebFullscreen,
  // 浏览器全屏
  toggleBrowser: toggleBrowserFullscreen,
  onBrowserChange: onBrowserFullscreenChange,
  get isBrowserFullscreen() {
    return screenfull.isEnabled && screenfull.isFullscreen;
  },
};