'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminDashboardContent = dynamic(
  () => import('../../components/admin/AdminDashboard'),
  { ssr: false }
);

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
