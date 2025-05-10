'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminEditContent = dynamic(
  () => import('../../../../components/admin/edit/AdminEdit'),
  { ssr: false }
);

export default function AdminEditPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <AdminEditContent caseId={id} />;
}
