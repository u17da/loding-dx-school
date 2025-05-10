'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminEditContent = dynamic(
  () => import('../../../../components/admin/edit/AdminEdit'),
  { ssr: false }
);

export default function AdminEditPage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminEditContent caseId={params.id} />;
}
