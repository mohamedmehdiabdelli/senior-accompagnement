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

favicon.type = 'image/png';
favicon.href = platformLogo;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
