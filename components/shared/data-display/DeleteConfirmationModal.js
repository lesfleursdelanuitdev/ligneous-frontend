'use client';

import { useState } from 'react';
import { X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * DeleteConfirmationModal — Reusable modal for delete flows.
 * States: confirm → (pending) → success | error
 * - confirm: "Do you want to delete X?" Yes / No
 * - pending: "Deleting..."
 * - success: "Deleted successfully." Close
 * - error: "Failed to delete." Try again / Close
 */
export default function DeleteConfirmationModal({
  open,
  onClose,
  item,
  getConfirmMessage,
  performDelete,
}) {
  const [status, setStatus] = useState('confirm'); // 'confirm' | 'pending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setStatus('confirm');
    setErrorMessage('');
    onClose?.();
  };

  const handleNo = () => {
    handleClose();
  };

  const handleYes = async () => {
    if (!item || !performDelete) return;
    setStatus('pending');
    setErrorMessage('');
    try {
      await performDelete(item);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to delete. Please try again.');
      setStatus('error');
    }
  };

  const handleTryAgain = () => {
    handleYes(); // goes to pending and retries
  };

  if (!open) return null;

  const confirmContent = typeof getConfirmMessage === 'function'
    ? getConfirmMessage(item)
    : getConfirmMessage || 'Are you sure you want to delete this item?';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-base-100 rounded-box shadow-2xl overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
            <div className="flex items-center gap-2">
              <Trash2 size={20} className="text-error shrink-0" />
              <h2 id="delete-modal-title" className="text-base font-semibold text-base-content">
                {status === 'confirm' && 'Confirm Delete'}
                {status === 'pending' && 'Deleting...'}
                {status === 'success' && 'Deleted'}
                {status === 'error' && 'Delete Failed'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost btn-square btn-sm"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">
            {status === 'confirm' && (
              <>
                <div className="text-sm text-base-content/80">
                  {typeof confirmContent === 'string' ? (
                    <p>{confirmContent}</p>
                  ) : (
                    confirmContent
                  )}
                </div>
                <p className="text-xs text-base-content/50">This action cannot be undone.</p>
              </>
            )}

            {status === 'pending' && (
              <div className="flex items-center gap-3 py-4">
                <span className="loading loading-spinner loading-md text-primary" />
                <p className="text-sm text-base-content/70">Deleting...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-3 py-2">
                <CheckCircle size={24} className="text-success shrink-0" />
                <p className="text-sm text-base-content">Item deleted successfully.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-error shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error">Failed to delete</p>
                    <p className="text-sm text-base-content/80 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-base-content/10 flex justify-end gap-2">
            {status === 'confirm' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={handleNo}>
                  No
                </button>
                <button type="button" className="btn btn-error" onClick={handleYes}>
                  Yes, delete
                </button>
              </>
            )}
            {status === 'pending' && (
              <button type="button" className="btn btn-disabled" disabled>
                Deleting...
              </button>
            )}
            {status === 'success' && (
              <button type="button" className="btn btn-primary" onClick={handleClose}>
                Close
              </button>
            )}
            {status === 'error' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={handleClose}>
                  Close
                </button>
                <button type="button" className="btn btn-error" onClick={handleTryAgain}>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
