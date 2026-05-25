import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { treeId, mediaId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'media');
    if (error) return error;

    const media = await prisma.gedcomMedia.findFirst({
      where: { fileUuid, id: mediaId },
      select: { id: true, xref: true, fileRef: true, form: true, title: true, description: true },
    });

    if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

    return NextResponse.json({
      id: media.id,
      title: media.title ?? null,
      description: media.description ?? null,
      fileRef: media.fileRef ?? null,
      form: media.form ?? null,
    });
  } catch (err) {
    console.error('Media detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
