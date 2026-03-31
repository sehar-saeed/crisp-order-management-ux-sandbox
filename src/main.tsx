import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import './index.css';
import App from './App';
import { MockSessionProvider } from './mock/SessionProvider';

ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockSessionProvider>
      <App />
    </MockSessionProvider>
  </StrictMode>,
);
