import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find the Mark of the Veil application root.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
