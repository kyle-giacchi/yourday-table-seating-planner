import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initErrorReporting } from '@/lib/errorReporting';

initErrorReporting();
createRoot(document.getElementById('root')!).render(<App />);
