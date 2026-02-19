/**
 * Tree Upload API Route
 *
 * New flow (single database):
 * 1. Accept GEDCOM file upload
 * 2. Send to ligneous-gedcom-lib-api for parse + validate + enrich
 * 3. Import enriched data into the local database
 * 4. Create Tree + TreeOwner records
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { authenticateRequest } from '@/lib/middleware';
import { importEnrichedDocument } from '@/lib/import/gedcom-import';

const LIB_API_URL = process.env.LIB_API_URL || 'http://localhost:8091';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    const description = formData.get('description') || '';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Tree name is required' }, { status: 400 });
    }

    // 3. Send file to lib-api for parse + validate + enrich
    const libFormData = new FormData();
    libFormData.append('file', file);

    const libResponse = await fetch(
      `${LIB_API_URL}/api/v1/parse-validate-enrich?generateIds=true`,
      { method: 'POST', body: libFormData }
    );

    if (!libResponse.ok) {
      let errorMsg = 'Failed to process GEDCOM file';
      try {
        const errData = await libResponse.json();
        errorMsg = errData.error || errorMsg;
      } catch { /* use default */ }
      return NextResponse.json({ error: errorMsg }, { status: libResponse.status });
    }

    const result = await libResponse.json();

    // 4. Check validation results
    const validation = result.validation || {};
    if (validation.valid === false) {
      const errors = (validation.errors || []).filter((e) => e.severity === 'error');
      if (errors.length > 0) {
        return NextResponse.json({
          error: 'GEDCOM file has validation errors',
          validation: {
            valid: false,
            errorCount: errors.length,
            errors: errors.slice(0, 50),
          },
          warnings: result.warnings || [],
        }, { status: 422 });
      }
    }

    // 5. Import enriched data into the database
    const enriched = result.enriched;
    const stats = result.stats;

    const { gedcomFile, fileId } = await importEnrichedDocument(enriched, stats, {
      name,
      originalFilename: file.name || 'unknown.ged',
      fileSize: file.size || null,
    });

    // 6. Create Tree record
    const tree = await prisma.tree.create({
      data: {
        fileId,
        gedcomFileId: gedcomFile.id,
        name,
        description,
        isPublic,
      },
    });

    // 7. Make the uploader a tree owner (primary owner)
    await prisma.treeOwner.create({
      data: {
        treeId: tree.id,
        userId: user.id,
        isPrimary: true,
        addedBy: user.id,
      },
    });

    // 8. Return success
    return NextResponse.json({
      success: true,
      tree: {
        id: tree.id,
        fileId: tree.fileId,
        name: tree.name,
        description: tree.description,
        isPublic: tree.isPublic,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt,
        individualsCount: stats.individuals || 0,
        familiesCount: stats.families || 0,
        placesCount: stats.places || 0,
        eventsCount: stats.events || 0,
        notesCount: stats.notes || 0,
        sourcesCount: stats.sources || 0,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
