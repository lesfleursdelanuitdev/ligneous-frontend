'use client';

import { useState } from 'react';
import {
  useNaturalLanguageSearch,
  useNaturalLanguageSuggestions,
} from '@/hooks/queries/useNaturalLanguageSearch';

/**
 * Natural-language genealogy search backed by Groq + Python research API.
 * Uses the authenticated /api/research/trees/<treeId>/nl-search proxy route.
 *
 * Renders a prompt input, suggestion chips, the routed intent (so users can
 * understand how their question was interpreted), and a generic JSON result
 * preview. Specific result shapes are left to downstream renderers because the
 * Python intent catalog can grow over time without breaking this UI.
 */
export function NaturalLanguageSearchPanel({ treeId, defaultQuery = '' }) {
  const [query, setQuery] = useState(defaultQuery);

  const suggestions = useNaturalLanguageSuggestions(treeId);
  const search = useNaturalLanguageSearch(treeId);

  if (!treeId) {
    return (
      <div className="card p-6 text-sm text-[var(--color-text-muted)]">
        Pick a tree to use natural-language search.
      </div>
    );
  }

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    const trimmed = query.trim();
    if (!trimmed) return;
    search.mutate({ query: trimmed });
  };

  const handleSuggestion = (text) => {
    setQuery(text);
    search.mutate({ query: text });
  };

  const data = search.data;
  const error = search.error?.message;

  return (
    <div className="card p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
            AI search
          </span>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Ask a question about this tree
          </h2>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Ask in plain English. Examples: &ldquo;most common surnames&rdquo;,
          &ldquo;how have first names changed by decade?&rdquo;, &ldquo;surnames like Gonsalves&rdquo;.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={2}
          placeholder="What would you like to know about this tree?"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-base text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(suggestions.data?.suggestions ?? []).slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={search.isPending || !query.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {search.isPending ? 'Searching…' : 'Ask'}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {data && <NaturalLanguageSearchResult data={data} />}
    </div>
  );
}

function NaturalLanguageSearchResult({ data }) {
  const { intent, confidence, rationale, result, meta } = data ?? {};
  const elapsedMs = meta?.elapsed_ms;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 font-medium text-[var(--color-text-secondary)]">
          intent: {intent || 'unknown'}
        </span>
        {typeof confidence === 'number' && (
          <span>confidence: {(confidence * 100).toFixed(0)}%</span>
        )}
        {meta?.source && <span>source: {meta.source}</span>}
        {meta?.model && <span>model: {meta.model}</span>}
        {typeof elapsedMs === 'number' && <span>{elapsedMs} ms</span>}
      </div>
      {rationale && (
        <p className="text-sm italic text-[var(--color-text-muted)]">{rationale}</p>
      )}
      <NaturalLanguageResultBody intent={intent} result={result} />
    </div>
  );
}

function NaturalLanguageResultBody({ intent, result }) {
  if (!result || typeof result !== 'object') {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">No result returned.</p>
    );
  }

  if (Array.isArray(result.top_given_names)) {
    return <RowsTable title="Top given names" rows={result.top_given_names} columns={['name', 'frequency']} />;
  }
  if (Array.isArray(result.top_surnames)) {
    return <RowsTable title="Top surnames" rows={result.top_surnames} columns={['name', 'frequency']} />;
  }
  if (Array.isArray(result.matches)) {
    return <RowsTable title="Matches" rows={result.matches} columns={['name', 'frequency']} />;
  }
  if (Array.isArray(result.names)) {
    return <RowsTable title={`Top ${result.sex || ''} names`} rows={result.names} columns={['name', 'count']} />;
  }
  if (Array.isArray(result.by_decade)) {
    return <RowsTable title="Names by decade" rows={result.by_decade} columns={['name', 'decade', 'count']} />;
  }
  if (Array.isArray(result.soundex_groups)) {
    return (
      <RowsTable
        title="Surname Soundex groups"
        rows={result.soundex_groups}
        columns={['soundex', 'name_count', 'total_frequency']}
      />
    );
  }
  if (result.summary && typeof result.summary === 'object') {
    return <SummaryGrid summary={result.summary} />;
  }
  if (intent === 'unsupported' && Array.isArray(result.supported_intents)) {
    return (
      <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
        {result.note && <p>{result.note}</p>}
        <p>Try one of these intents:</p>
        <ul className="list-inside list-disc">
          {result.supported_intents.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <pre className="overflow-auto rounded-lg bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-secondary)]">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function RowsTable({ title, rows, columns }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        {title}: no rows returned.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-bg-secondary)] text-left text-xs uppercase text-[var(--color-text-muted)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="text-[var(--color-text-secondary)]">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2">
                    {formatCell(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryGrid({ summary }) {
  const entries = Object.entries(summary);
  if (!entries.length) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">No summary data.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-[var(--color-border)] p-3">
          <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            {key}
          </div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {formatCell(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatCell(value) {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export default NaturalLanguageSearchPanel;
