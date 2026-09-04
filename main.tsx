import React from 'react';
import ReactDOM from 'react-dom/client';
import { TrackerApp } from '@/components/tracker-app';
import '@/app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TrackerApp />
  </React.StrictMode>,
);
