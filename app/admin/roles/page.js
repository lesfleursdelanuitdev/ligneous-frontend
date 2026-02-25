'use client';

import { useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const DUMMY_ROLES = [
  { id: '1', name: 'Admin', description: 'Full platform access. Can manage users, trees, and system settings.', permissionCount: 12, userCount: 2 },
  { id: '2', name: 'Editor', description: 'Can create and edit trees, add individuals and families.', permissionCount: 8, userCount: 15 },
  { id: '3', name: 'Viewer', description: 'Read-only access to shared trees.', permissionCount: 4, userCount: 42 },
  { id: '4', name: 'Maintainer', description: 'Can edit trees they maintain. Manage media and sources.', permissionCount: 6, userCount: 8 },
  { id: '5', name: 'Moderator', description: 'Can moderate discussions and flag inappropriate content.', permissionCount: 5, userCount: 3 },
];

export default function AdminRolesPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });

  const [items, setItems] = useState(DUMMY_ROLES);
  const totalItems = DUMMY_ROLES.length;
  const loading = false;
  const error = null;
  const latestParams = useRef(null);

  const handleParamsChange = useCallback((params) => {
    latestParams.current = params;
    setItems(DUMMY_ROLES);
  }, []);

  if (!isReady) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperuser) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Manage Roles</h1>
            <p className="text-base-content/60 text-sm mt-1">Define and manage user roles and permissions</p>
          </div>
          <div className="text-sm text-base-content/60">
            Total: <span className="font-semibold text-base-content">{totalItems}</span> roles
          </div>
        </div>

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => handleParamsChange(latestParams.current) } : null}
          emptyState={{ title: 'No roles found', message: 'Create a role to get started.' }}
          defaultView="card"
          renderCard={(role) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base-content">{role.name}</h3>
                  <span className="badge badge-sm badge-primary">{role.permissionCount} permissions</span>
                </div>
                <p className="text-sm text-base-content/70 line-clamp-2">{role.description}</p>
                <div className="pt-2 border-t border-base-content/10 text-xs text-base-content/60">
                  {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
                </div>
              </div>
            </BaseCard>
          )}
          renderRow={(role) => (
            <>
              <td className="px-4 py-3">
                <span className="font-medium text-base-content">{role.name}</span>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/70 max-w-md">{role.description}</td>
              <td className="px-4 py-3 text-sm text-base-content/70">{role.permissionCount}</td>
              <td className="px-4 py-3 text-sm text-base-content/70">{role.userCount}</td>
            </>
          )}
          listHeaders={[
            { label: 'Role', key: 'name', sortable: true },
            { label: 'Description', key: 'description', sortable: false },
            { label: 'Permissions', key: 'permissionCount', sortable: true },
            { label: 'Users', key: 'userCount', sortable: true },
          ]}
          searchPlaceholder="Search roles..."
          searchLabel="Role name"
          sortOptions={[
            { value: 'name', label: 'Name' },
            { value: 'permissionCount', label: 'Permissions' },
            { value: 'userCount', label: 'Users' },
          ]}
          defaultSort="name"
          defaultSortDirection="asc"
          totalItems={totalItems}
          defaultPerPage={10}
          actions={[
            { key: 'view', label: 'View', href: (role) => `#` },
            { key: 'edit', label: 'Edit', href: (role) => `#` },
            { key: 'delete', label: 'Delete', variant: 'danger' },
          ]}
          addNewComponent={<AddNewPlaceholder title="Add Role" />}
          onParamsChange={handleParamsChange}
        />
      </div>
    </DashboardLayout>
  );
}
