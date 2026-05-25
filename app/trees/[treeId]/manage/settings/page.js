'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTreeSettings, useUpdateTreeSettings, useDeleteTree } from '@/hooks/queries/useTreeSettings';

function Section({ title, children }) {
  return (
    <section className="card bg-base-200 rounded-box p-6 space-y-4">
      <h2 className="text-base font-semibold text-base-content">{title}</h2>
      {children}
    </section>
  );
}

function FieldRow({ label, description, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-base-content">{label}</label>
      {description && <p className="text-xs text-base-content/50">{description}</p>}
      {children}
    </div>
  );
}

export default function TreeSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.treeId;

  const { data, isLoading } = useTreeSettings(treeId);
  const settings = data?.settings;
  const isOwner = data?.isOwner ?? false;

  const updateMutation = useUpdateTreeSettings(treeId);
  const deleteMutation = useDeleteTree(treeId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name ?? '');
      setDescription(settings.description ?? '');
      setIsPublic(settings.isPublic ?? false);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-base-200 rounded-box animate-pulse" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="alert alert-error">
        <span>Failed to load settings.</span>
      </div>
    );
  }

  async function handleSaveGeneral(e) {
    e.preventDefault();
    await updateMutation.mutateAsync({ name, description });
  }

  async function handleSaveAccess(e) {
    e.preventDefault();
    await updateMutation.mutateAsync({ isPublic });
  }

  async function handleDelete(e) {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirm !== settings.name) {
      setDeleteError('Tree name does not match. Please type the exact tree name to confirm.');
      return;
    }
    try {
      await deleteMutation.mutateAsync();
      router.replace('/my-trees');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete tree.');
    }
  }

  const isSaving = updateMutation.isPending;
  const saveError = updateMutation.error?.message;
  const saveSuccess = updateMutation.isSuccess;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-base-content">Tree Settings</h1>
        <p className="text-sm text-base-content/60 mt-1">Manage name, visibility, and other tree configuration.</p>
      </div>

      {saveError && (
        <div className="alert alert-error text-sm">
          <span>{saveError}</span>
        </div>
      )}
      {saveSuccess && (
        <div className="alert alert-success text-sm">
          <span>Settings saved.</span>
        </div>
      )}

      {/* General */}
      <Section title="General">
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <FieldRow label="Tree name" description="The display name shown across the site.">
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
            />
          </FieldRow>
          <FieldRow label="Description" description="Optional short description of this family tree.">
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </FieldRow>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              {isSaving ? <span className="loading loading-spinner loading-xs" /> : null}
              Save changes
            </button>
          </div>
        </form>
      </Section>

      {/* Access & Privacy */}
      <Section title="Access & Privacy">
        <form onSubmit={handleSaveAccess} className="space-y-4">
          <FieldRow
            label="Public tree"
            description="When enabled, anyone can browse this tree without signing in."
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="text-sm text-base-content/70">
                {isPublic ? 'Public — visible to everyone' : 'Private — members only'}
              </span>
            </label>
          </FieldRow>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              {isSaving ? <span className="loading loading-spinner loading-xs" /> : null}
              Save
            </button>
          </div>
        </form>
      </Section>

      {/* Danger Zone */}
      {isOwner && (
        <Section title="Danger Zone">
          <p className="text-sm text-base-content/70">
            Permanently delete this tree and all its data. This action cannot be undone.
          </p>
          <form onSubmit={handleDelete} className="space-y-3">
            <FieldRow
              label={`Type "${settings.name}" to confirm`}
              description="This permanently deletes all individuals, families, stories, media, and other data in this tree."
            >
              <input
                type="text"
                className="input input-bordered input-error w-full"
                value={deleteConfirm}
                onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                placeholder={settings.name}
                autoComplete="off"
              />
            </FieldRow>
            {deleteError && (
              <p className="text-sm text-error">{deleteError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-error btn-sm"
                disabled={deleteMutation.isPending || deleteConfirm !== settings.name}
              >
                {deleteMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                Delete this tree
              </button>
            </div>
          </form>
        </Section>
      )}
    </div>
  );
}
