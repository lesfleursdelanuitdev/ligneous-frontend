'use client';

import { useState, useMemo, useEffect } from 'react';
import IndividualSection from '../view/IndividualSection';
import { useRouter } from 'next/navigation';
import DateInput from '@/components/shared/forms/DateInput';
import PlaceInput from '@/components/shared/forms/PlaceInput';
import NameBlock from '@/components/shared/forms/NameBlock';
import { Plus } from 'lucide-react';

const SEX_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'U', label: 'Unknown' },
  { value: 'X', label: 'Other' },
];

const GENDER_OPTIONS = [
  { value: '', label: '—' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
];

function newKey(prefix) {
  return `${prefix}-${Date.now()}`;
}

/** Convert individualNameForms API shape to name blocks. */
function individualToNameBlocks(individual) {
  const forms = individual.individualNameForms || [];

  if (forms.length === 0) {
    return [{
      key: newKey('nb'),
      isPrimary: true,
      nameType: 'birth',
      givenNames: [{ key: newKey('gn'), value: '' }],
      surnames: [{ key: newKey('sn'), value: '' }],
    }];
  }

  const primaryForm = forms.find((nf) => nf.isPrimary) || forms[0];
  const primaryGiven = (primaryForm?.givenNames || [])
    .sort((a, b) => (a.position ?? 1) - (b.position ?? 1))
    .map((gfn, idx) => ({ key: gfn.id || `gn-${idx}`, value: gfn.givenName?.givenName ?? '' }));

  return forms.map((nf, idx) => {
    const surnames = (nf.surnames || [])
      .sort((a, b) => (a.position ?? 1) - (b.position ?? 1))
      .map((sfn, i) => ({ key: sfn.id || `sn-${idx}-${i}`, value: sfn.surname?.surname ?? '' }));
    return {
      key: nf.id || newKey('nb'),
      isPrimary: Boolean(nf.isPrimary),
      nameType: nf.nameType || 'birth',
      givenNames: primaryGiven.length ? primaryGiven.map((g) => ({ ...g, key: g.key || newKey('gn') })) : [{ key: newKey('gn'), value: '' }],
      surnames: surnames.length ? surnames : [{ key: newKey('sn'), value: '' }],
    };
  });
}

/** Flatten name blocks to API payload. Primary block drives given names; all blocks contribute surnames with types. */
function nameBlocksToPayload(blocks) {
  const primary = blocks.find((b) => b.isPrimary) || blocks[0];
  const givenNames = (primary?.givenNames || [])
    .map((g) => ({ value: g.value?.trim() }))
    .filter((g) => g.value);

  const surnames = [];
  for (const block of blocks) {
    const nameType = block.nameType || 'birth';
    const isPrimary = block.isPrimary;
    for (const s of block.surnames || []) {
      const v = s.value?.trim();
      if (v) surnames.push({ value: v, nameType, isPrimary });
    }
  }

  return { givenNames, surnames };
}

export default function IndividualEditOverviewSection({ individual, treeId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const initialBlocks = useMemo(() => individualToNameBlocks(individual), [individual?.id]);

  const [nameBlocks, setNameBlocks] = useState(initialBlocks);

  useEffect(() => {
    setNameBlocks(individualToNameBlocks(individual));
  }, [individual?.id]);

  if (!individual) return null;

  const setBlock = (blockKey, updater) => {
    setNameBlocks((prev) =>
      prev.map((b) => (b.key === blockKey ? updater(b) : b))
    );
  };

  const setPrimaryBlock = (blockKey) => {
    setNameBlocks((prev) =>
      prev.map((b) => ({ ...b, isPrimary: b.key === blockKey }))
    );
  };

  const addBlock = () => {
    setNameBlocks((prev) => [
      ...prev,
      {
        key: newKey('nb'),
        isPrimary: false,
        nameType: 'birth',
        givenNames: [{ key: newKey('gn'), value: '' }],
        surnames: [{ key: newKey('sn'), value: '' }],
      },
    ]);
  };

  const removeBlock = (blockKey) => {
    setNameBlocks((prev) => {
      const next = prev.filter((b) => b.key !== blockKey);
      if (next.length === 0) {
        return [{
          key: newKey('nb'),
          isPrimary: true,
          nameType: 'birth',
          givenNames: [{ key: newKey('gn'), value: '' }],
          surnames: [{ key: newKey('sn'), value: '' }],
        }];
      }
      const wasPrimary = prev.find((b) => b.key === blockKey)?.isPrimary;
      if (wasPrimary) next[0].isPrimary = true;
      return next;
    });
  };

  const partListHandlers = (blockKey, partType) => {
    const getItems = (b) => (partType === 'given' ? b.givenNames : b.surnames);
    const setItems = (b, items) => (partType === 'given' ? { ...b, givenNames: items } : { ...b, surnames: items });

    const ensureNonEmpty = (items) => (items.length ? items : [{ key: newKey(partType === 'given' ? 'gn' : 'sn'), value: '' }]);

    return {
      onChange: (partKey, value) => {
        setBlock(blockKey, (b) => {
          const items = getItems(b).map((p) => (p.key === partKey ? { ...p, value } : p));
          return setItems(b, items);
        });
      },
      onAdd: () => {
        setBlock(blockKey, (b) => {
          const items = [...getItems(b), { key: newKey(partType === 'given' ? 'gn' : 'sn'), value: '' }];
          return setItems(b, items);
        });
      },
      onRemove: (partKey) => {
        setBlock(blockKey, (b) => {
          const items = ensureNonEmpty(getItems(b).filter((p) => p.key !== partKey));
          return setItems(b, items);
        });
      },
      onMoveUp: (partKey) => {
        setBlock(blockKey, (b) => {
          const items = [...getItems(b)];
          const i = items.findIndex((p) => p.key === partKey);
          if (i <= 0) return b;
          [items[i - 1], items[i]] = [items[i], items[i - 1]];
          return setItems(b, items);
        });
      },
      onMoveDown: (partKey) => {
        setBlock(blockKey, (b) => {
          const items = [...getItems(b)];
          const i = items.findIndex((p) => p.key === partKey);
          if (i < 0 || i >= items.length - 1) return b;
          [items[i], items[i + 1]] = [items[i + 1], items[i]];
          return setItems(b, items);
        });
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.target;
    const { givenNames, surnames } = nameBlocksToPayload(nameBlocks);
    const data = {
      givenNames,
      surnames,
      sex: form.sex?.value || null,
      gender: form.gender?.value || null,
      isLiving: form.isLiving?.value === 'true',
      occupation: form.occupation?.value?.trim() || null,
      religion: form.religion?.value?.trim() || null,
      nationality: form.nationality?.value?.trim() || null,
    };
    try {
      const res = await fetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(individual.xref)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <IndividualSection title="Overview" showBackToTop>
      <form onSubmit={handleSubmit} className="card border border-base-content/10 rounded-box bg-base-100">
        <div className="card-body p-6 space-y-0">
          {error && (
            <div className="alert alert-error text-sm mb-4">
              {error}
            </div>
          )}
          <div className="pb-4">
            <p className="text-xs text-base-content/50 font-mono">
              XREF: {individual.xref} &middot; UUID: {individual.id}
            </p>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Names
              </label>
              <button
                type="button"
                onClick={addBlock}
                className="btn btn-ghost btn-sm gap-1.5 text-primary"
              >
                <Plus size={20} />
                Add name
              </button>
            </div>
            <div className="space-y-4">
              {nameBlocks.map((block) => {
                const givenH = partListHandlers(block.key, 'given');
                const surnameH = partListHandlers(block.key, 'surnames');
                return (
                  <NameBlock
                    key={block.key}
                    block={block}
                    onPrimaryChange={setPrimaryBlock}
                    onTypeChange={(key, nameType) => setBlock(key, (b) => ({ ...b, nameType }))}
                    onGivenChange={givenH.onChange}
                    onGivenAdd={givenH.onAdd}
                    onGivenRemove={givenH.onRemove}
                    onGivenMoveUp={givenH.onMoveUp}
                    onGivenMoveDown={givenH.onMoveDown}
                    onSurnameChange={surnameH.onChange}
                    onSurnameAdd={surnameH.onAdd}
                    onSurnameRemove={surnameH.onRemove}
                    onSurnameMoveUp={surnameH.onMoveUp}
                    onSurnameMoveDown={surnameH.onMoveDown}
                    onRemove={removeBlock}
                    canRemove={nameBlocks.length > 1}
                  />
                );
              })}
            </div>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Birth sex
                </label>
                <select name="sex" className="dropdown-field" defaultValue={individual.sex ?? ''}>
                  {SEX_OPTIONS.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Gender
                </label>
                <select name="gender" className="dropdown-field" defaultValue={individual.gender ?? ''}>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Status
                </label>
                <select name="isLiving" className="dropdown-field" defaultValue={individual.isLiving ? 'true' : 'false'}>
                  <option value="true">Living</option>
                  <option value="false">Deceased</option>
                </select>
              </div>
            </div>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateInput
                date={
                  individual.birthDate ||
                  (individual.birthYear != null
                    ? { year: individual.birthYear, month: null, day: null }
                    : null)
                }
                label="Birth date"
                id="birth-date"
              />
              <PlaceInput
                place={individual.birthPlace}
                placeDisplay={individual.birthPlaceDisplay}
                label="Birth place"
                id="birth-place"
              />
            </div>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateInput
                date={individual.deathDate}
                label="Death date"
                id="death-date"
                required={false}
              />
              <PlaceInput
                place={individual.deathPlace}
                placeDisplay={individual.deathPlaceDisplay}
                label="Death place"
                id="death-place"
              />
            </div>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Occupation
                </label>
                <input
                  name="occupation"
                  type="text"
                  className="input input-bordered w-full"
                  defaultValue={individual.occupation ?? ''}
                  placeholder="Occupation"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Religion
                </label>
                <input
                  name="religion"
                  type="text"
                  className="input input-bordered w-full"
                  defaultValue={individual.religion ?? ''}
                  placeholder="Religion"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Nationality
                </label>
                <input
                  name="nationality"
                  type="text"
                  className="input input-bordered w-full"
                  defaultValue={individual.nationality ?? ''}
                  placeholder="Nationality"
                />
              </div>
            </div>
          </div>

          <div className="py-4 border-t border-base-content/10">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </IndividualSection>
  );
}
