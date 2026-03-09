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
        <Toaster position="top-right" />
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
