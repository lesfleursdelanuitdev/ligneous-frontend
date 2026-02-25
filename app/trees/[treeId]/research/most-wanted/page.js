'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { Badge } from '@/components/shared/ui/badges';
import { useMostWantedThreads } from '@/hooks/queries/useMostWantedThreads';
import { useToggleThreadResolved, useCreateThread } from '@/hooks/mutations/useThreadMutations';
import { MessageCircle, CheckCircle, CircleDot, Plus, ChevronRight } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function MostWantedListPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.treeId;
  const { data, isLoading: loading, error: queryError } = useMostWantedThreads(treeId);
  const threads = data?.threads || [];
  const error = queryError?.message || null;

  const toggleResolved = useToggleThreadResolved(treeId);
  const createThread = useCreateThread(treeId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');

  const handleMarkResolved = (threadId, isClosed) => {
    toggleResolved.mutate({ threadId, isClosed });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const title = addTitle.trim();
    if (!title) return;
    const description = (() => {
      const d = addDescription.trim();
      if (!d || d === '<p></p>') return undefined;
      if (d.replace(/<[^>]*>/g, '').trim() === '') return undefined;
      return d;
    })();
    createThread.mutate({ title, description }, {
      onSuccess: (data) => {
        setShowAddForm(false);
        setAddTitle('');
        setAddDescription('');
        if (data.thread?.id) {
          router.push(`/trees/${treeId}/research/most-wanted/${data.thread.id}`);
        }
      },
    });
  };

  if (!treeId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Most wanted">
        <p className="text-base-content/60">Missing tree ID.</p>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title="Most wanted"
      subtitle="Brick walls and research priorities. Each thread can have multiple topic discussions."
      breadcrumbs={[
        { label: 'Tree overview', href: `/trees/${treeId}` },
        { label: 'Brick wall' },
      ]}
      actions={
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary gap-2"
        >
          <Plus />
          Add brick wall
        </button>
      }
    >
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : threads.length === 0 ? (
          <BaseCard>
            <div className="text-center py-12 text-base-content/70">
              <div className="flex justify-center mb-2">
                <MessageCircle />
              </div>
              <p className="font-medium">No brick walls yet</p>
              <p className="text-sm mt-1">Add a most-wanted item to start discussing research priorities.</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary btn-sm mt-4"
              >
                Add brick wall
              </button>
            </div>
          </BaseCard>
        ) : (
          <ul className="space-y-4">
            {threads.map((thread) => (
              <li key={thread.id}>
                <BaseCard hoverable className="p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {thread.isClosed && (
                        <Badge variant="default" size="sm">
                          Resolved
                        </Badge>
                      )}
                      <span className="text-xs text-base-content/50">
                        {thread.postCount} topic{thread.postCount !== 1 ? 's' : ''} · {thread.commentCount} comment{thread.commentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Link
                      href={`/trees/${treeId}/research/most-wanted/${thread.id}`}
                      className="font-semibold text-base-content hover:underline block"
                    >
                      {thread.title}
                    </Link>
                    {thread.description && (
                      <div
                        className="text-sm text-base-content/70 mt-1 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: thread.description }}
                      />
                    )}
                    {thread.creator && (
                      <p className="text-xs text-base-content/50 mt-2">
                        {thread.creator.name || thread.creator.username}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-base-content/10">
                    <button
                      type="button"
                      onClick={() => handleMarkResolved(thread.id, !thread.isClosed)}
                      className="btn btn-ghost btn-sm inline-flex items-center justify-center p-2"
                      title={thread.isClosed ? 'Reopen' : 'Mark resolved'}
                    >
                      {thread.isClosed ? (
                        <CircleDot size={20} />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                    </button>
                    <Link
                      href={`/trees/${treeId}/research/most-wanted/${thread.id}`}
                      className="btn btn-primary btn-sm inline-flex items-center justify-center p-2"
                      title="Open"
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </BaseCard>
              </li>
            ))}
          </ul>
        )}

      <Dialog open={showAddForm} onClose={() => !createThread.isPending && setShowAddForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto w-full max-w-md rounded-lg bg-base-100 p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold">Add brick wall</DialogTitle>
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="mw-title" className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  id="mw-title"
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="e.g. Augustino Gracis – where was he originally from?"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label htmlFor="mw-desc" className="label">
                  <span className="label-text">Description (optional)</span>
                </label>
                <RichTextEditor
                  value={addDescription}
                  onChange={setAddDescription}
                  placeholder="Any extra context..."
                  minHeight="100px"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddForm(false)}
                  disabled={createThread.isPending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createThread.isPending}>
                  {createThread.isPending ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </DashboardMainContentLayout>
  );
}
