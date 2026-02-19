// PATCH /api/admin/requests/[id] - Approve/Reject access request (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// PATCH - Approve or reject request
export async function PATCH(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, responseNotes } = body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        tree: { select: { id: true, name: true } },
      },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      );
    }

    if (accessRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${accessRequest.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: newStatus,
        responseNotes,
        respondedAt: new Date(),
        respondedBy: currentUser.id,
      },
    });

    // If approved, grant the appropriate permissions
    if (action === 'approve') {
      switch (accessRequest.requestType) {
        case 'basic_access':
          // Grant read permission (or write if requested)
          await prisma.permission.create({
            data: {
              userId: accessRequest.userId,
              treeId: accessRequest.treeId,
              resourceType: 'tree',
              resourceId: accessRequest.treeId,
              permissionType: accessRequest.requestedPermissionType || 'read',
              grantedBy: currentUser.id,
            },
          });
          break;

        case 'individual_link':
          // Create user-individual link
          if (accessRequest.resourceId) {
            await prisma.userIndividualLink.create({
              data: {
                userId: accessRequest.userId,
                treeId: accessRequest.treeId,
                individualXref: accessRequest.resourceId,
                verified: true, // Approved by admin
              },
            });
          }
          break;

        case 'maintainer_role':
          // Add as tree maintainer
          await prisma.treeMaintainer.create({
            data: {
              userId: accessRequest.userId,
              treeId: accessRequest.treeId,
              addedBy: currentUser.id,
            },
          });
          break;

        case 'owner_role':
          // Add as tree owner (non-primary)
          await prisma.treeOwner.create({
            data: {
              userId: accessRequest.userId,
              treeId: accessRequest.treeId,
              isPrimary: false,
              addedBy: currentUser.id,
            },
          });
          break;
      }
    }

    return NextResponse.json({
      request: updatedRequest,
      message: `Request ${newStatus} successfully`,
    });
  } catch (error) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}


