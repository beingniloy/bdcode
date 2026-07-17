import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ModalProvider } from './contexts/ModalContext';
import { FileSystemProvider } from './contexts/FileSystemContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <SettingsProvider>
      <LayoutProvider>
        <ErrorBoundary>
          <ModalProvider>
            <FileSystemProvider>
              <App />
            </FileSystemProvider>
          </ModalProvider>
        </ErrorBoundary>
      </LayoutProvider>
    </SettingsProvider>
  </ErrorBoundary>
);
