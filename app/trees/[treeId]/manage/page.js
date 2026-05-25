'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ManageIndexPage() {
  const router = useRouter();
  const params = useParams();
  const treeId = params?.treeId;

  useEffect(() => {
    if (treeId) {
      router.replace(`/trees/${treeId}/manage/members`);
    }
  }, [treeId, router]);

  return null;
}
