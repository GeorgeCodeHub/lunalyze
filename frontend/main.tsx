import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-pixel/400.css';
import './styles/global.css';
import { watchInputModality } from './inputModality';
import { watchPointerLight } from './pointerLight';
import { queryClient } from './queryClient';

watchInputModality(); // the focus outline is for the keyboard: see styles/global.css
watchPointerLight(); // the light inside a button follows the mouse: see Section.module.css, .lit

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
