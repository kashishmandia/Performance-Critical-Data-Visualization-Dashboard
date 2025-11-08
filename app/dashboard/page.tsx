'use client';

import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { generateInitialDataset } from '@/lib/dataGenerator';
import { DataProvider } from '@/components/providers/DataProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import DashboardGuard from '@/components/DashboardGuard';

export default function DashboardPage() {
  // Generate initial data
  const initialData = generateInitialDataset(10000);

  return (
    <DashboardGuard>
      <ThemeProvider>
        <DataProvider initialData={initialData}>
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <Dashboard />
          </Suspense>
        </DataProvider>
      </ThemeProvider>
    </DashboardGuard>
  );
}

