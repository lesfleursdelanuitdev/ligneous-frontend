'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useTreeHealth } from '@/hooks/queries/useTreeHealth';

const CATEGORY_LABELS = {
  individuals: 'Individuals',
  families: 'Families',
  media: 'Media',
  events: 'Events',
};

function CheckCard({ result }) {
  const [open, setOpen] = useState(true);
  const showViewAll = result.count > result.records.length;

  return (
    <div className="rounded-box border border-base-content/10 bg-base-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-base-200/50 transition-colors"
      >
        <span className="shrink-0 text-base-content/40">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="flex-1 font-medium text-sm">{result.label}</span>
        <span className="badge badge-error badge-sm font-semibold">{result.count}</span>
        <span className="text-xs text-base-content/50 hidden sm:inline capitalize">
          {CATEGORY_LABELS[result.category] ?? result.category}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-base-content/60">{result.description}</p>

          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr>
                  <th>Xref</th>
                  <th>Name / label</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {result.records.map((rec) => (
                  <tr key={rec.id} className="hover">
                    <td className="font-mono text-base-content/60">{rec.xref}</td>
                    <td>{rec.displayLabel}</td>
                    <td>
                      <Link
                        href={rec.href}
                        className="btn btn-ghost btn-xs"
                        title="Open"
                      >
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showViewAll && (
            <p className="text-xs text-base-content/50">
              Showing {result.records.length} of {result.count} — visit the{' '}
              <span className="lowercase">{CATEGORY_LABELS[result.category] ?? result.category}</span>{' '}
              list to see all.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TreeHealthPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const { data, isLoading, error, refetch, isFetching } = useTreeHealth(treeId);

  const results = data?.results ?? [];
  const totalIssues = data?.totalIssues ?? 0;
  const checkedAt = data?.checkedAt ? new Date(data.checkedAt) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary shrink-0" />
            Tree Health
          </h1>
          {checkedAt && (
            <p className="text-xs text-base-content/50 mt-0.5">
              Last checked {checkedAt.toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-sm btn-outline gap-2"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Checking…' : 'Re-run checks'}
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Running health checks…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {totalIssues === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-box border border-base-content/10 bg-base-100">
              <ShieldCheck size={40} className="text-success" />
              <p className="font-semibold text-success">No issues found</p>
              <p className="text-sm text-base-content/60 text-center max-w-xs">
                All health checks passed. Your tree data looks clean.
              </p>
            </div>
          ) : (
            <>
              <div className="alert alert-warning py-3">
                <ShieldAlert size={18} />
                <span className="text-sm font-medium">
                  {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found across{' '}
                  {results.length} check{results.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {results.map((result) => (
                  <CheckCard key={result.id} result={result} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
