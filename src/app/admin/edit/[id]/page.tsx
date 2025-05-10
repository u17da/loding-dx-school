'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Supabase initialization during build
const AdminEditContent = dynamic(
  () => import('../../../../components/admin/edit/AdminEdit'),
  { ssr: false }
);

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function AdminEditPage({ params }: Props) {
  return <AdminEditContent caseId={params.id} />;
}
