import { NextResponse } from 'next/server';
import { resolveTreeAuthz } from '@/lib/authz';
import { buildEnrichedDocumentFromDB } from '@/lib/export/gedcom-export';

const LIB_API_URL = process.env.LIB_API_URL || 'http://localhost:8092';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'gedcom');
    if (error) return error;

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'gedcom';
    const filename = url.searchParams.get('filename') || 'export';

    if (!['gedcom', 'json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'gedcom', 'json', or 'csv'" },
        { status: 400 },
      );
    }

    const enriched = await buildEnrichedDocumentFromDB(fileUuid);

    const goResponse = await fetch(`${LIB_API_URL}/api/v1/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enriched, format, filename }),
    });

    if (!goResponse.ok) {
      const errBody = await goResponse.text();
      console.error('Export API error:', errBody);
      return NextResponse.json(
        { error: 'Export failed', detail: errBody },
        { status: 502 },
      );
    }

    const contentType = goResponse.headers.get('content-type') || 'application/octet-stream';
    const disposition = goResponse.headers.get('content-disposition') || '';
    const body = await goResponse.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition || `attachment; filename="${filename}.${formatToExt(format)}"`,
      },
    });
  } catch (err) {
    console.error('Export route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatToExt(format) {
  switch (format) {
    case 'gedcom': return 'ged';
    case 'json': return 'json';
    case 'csv': return 'csv';
    default: return 'dat';
  }
}
