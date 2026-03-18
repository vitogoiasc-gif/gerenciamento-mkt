/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './store';
import Layout from './components/Layout';
import CalendarPage from './pages/Calendar';
import Kanban from './pages/Kanban';
import ContentList from './pages/ContentList';
import Deliveries from './pages/Deliveries';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              duration: 5000,
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<CalendarPage />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="list" element={<ContentList />} />
            <Route path="deliveries" element={<Deliveries />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}