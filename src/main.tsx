import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Provider as JotaiProvider } from 'jotai';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider>
    <BrowserRouter>
        <App />
    </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </JotaiProvider>
  </StrictMode>
);
