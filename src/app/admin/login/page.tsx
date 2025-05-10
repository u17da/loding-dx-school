'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminLoginContent = dynamic(
  () => import('../../../components/admin/login/AdminLogin'),
  { ssr: false }
);

export default function AdminLoginPage() {
  return <AdminLoginContent />;
}
