import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import platformLogo from './images/Tamani.png';

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? (() => {
  const link = document.createElement('link');
  link.rel = 'icon';
  document.head.appendChild(link);
  return link;
})();

const shortcutIcon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]') ?? (() => {
  const link = document.createElement('link');
  link.rel = 'shortcut icon';
  document.head.appendChild(link);
  return link;
})();

const iconHref = `${platformLogo}?v=${Date.now()}`;

favicon.type = 'image/png';
favicon.href = iconHref;
shortcutIcon.type = 'image/png';
shortcutIcon.href = iconHref;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
