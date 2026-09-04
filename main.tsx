import React from 'react';
import ReactDOM from 'react-dom/client';
import { CloudTracker } from '@/components/cloud-tracker';
import '@/app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CloudTracker />
  </React.StrictMode>,
);
