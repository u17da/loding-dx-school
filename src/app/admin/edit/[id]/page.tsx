'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminEditContent = dynamic(
  () => import('../../../../components/admin/edit/AdminEdit'),
  { ssr: false }
);

interface AdminEditPageProps {
  params: {
    id: string;
  };
}

export default function AdminEditPage({ params }: AdminEditPageProps) {
  return <AdminEditContent caseId={params.id} />;
}
