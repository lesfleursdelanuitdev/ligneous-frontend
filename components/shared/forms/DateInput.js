'use client';

/**
 * Fine-grained date input for GEDCOM dates.
 * Qualifier (ABT, CAL, EST, BEFORE, AFTER), optional month/day, required year.
 * No sequence qualifiers (FROM...TO, BETWEEN...AND).
 */
const QUALIFIERS = [
  { value: '', label: 'Exact' },
  { value: 'ABT', label: 'About (ABT)' },
  { value: 'CAL', label: 'Calculated (CAL)' },
  { value: 'EST', label: 'Estimated (EST)' },
  { value: 'BEFORE', label: 'Before' },
  { value: 'AFTER', label: 'After' },
];

const DATE_TYPE_TO_QUALIFIER = {
  EXACT: '',
  ABOUT: 'ABT',
  CALCULATED: 'CAL',
  ESTIMATED: 'EST',
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  BETWEEN: '',
  FROM_TO: '',
  UNKNOWN: '',
};

const MONTHS = [
  { value: '', label: '—' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const FIELD_CLASS = 'date-field';

const DAY_OPTIONS = [{ value: '', label: '—' }, ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))];

/**
 * Parse a date object from API (GedcomDate) into qualifier, month, day, year.
 * @param {Object} date - { dateType?, year?, month?, day?, original? }
 * @returns {{ qualifier: string, month: string, day: string, year: string }}
 */
export function parseDateForInput(date) {
  if (!date) return { qualifier: '', month: '', day: '', year: '' };
  const qualifier = DATE_TYPE_TO_QUALIFIER[date.dateType] ?? '';
  const month = date.month != null ? String(date.month) : '';
  const day = date.day != null ? String(date.day) : '';
  const year = date.year != null ? String(date.year) : '';
  return { qualifier, month, day, year };
}

export default function DateInput({
  date,
  qualifier: qualifierProp,
  month: monthProp,
  day: dayProp,
  year: yearProp,
  onChange,
  label = 'Date',
  id,
  required = true,
  className = '',
}) {
  const parsed = date ? parseDateForInput(date) : {
    qualifier: qualifierProp ?? '',
    month: monthProp ?? '',
    day: dayProp ?? '',
    year: yearProp ?? '',
  };
  const baseId = id || `date-${Math.random().toString(36).slice(2)}`;

  const handleChange = (field, value) => {
    if (onChange) {
      onChange({
        ...parsed,
        [field]: value,
      });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50 block">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      )}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs text-base-content/60" htmlFor={`${baseId}-qualifier`}>
            Qualifier
          </label>
          <select
            id={`${baseId}-qualifier`}
            className={FIELD_CLASS}
            defaultValue={parsed.qualifier}
            onChange={(e) => handleChange('qualifier', e.target.value)}
          >
            {QUALIFIERS.map((q) => (
              <option key={q.value || 'exact'} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-32 shrink-0 space-y-1">
            <label className="text-xs text-base-content/60 block" htmlFor={`${baseId}-month`}>
              Month
            </label>
            <select
              id={`${baseId}-month`}
              className={FIELD_CLASS}
              defaultValue={parsed.month}
              onChange={(e) => handleChange('month', e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m.value || 'm'} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="w-20 shrink-0 space-y-1">
            <label className="text-xs text-base-content/60 block" htmlFor={`${baseId}-day`}>
              Day
            </label>
            <select
              id={`${baseId}-day`}
              className={FIELD_CLASS}
              defaultValue={parsed.day}
              onChange={(e) => handleChange('day', e.target.value)}
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value || 'd'} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="w-24 shrink-0 space-y-1">
            <label className="text-xs text-base-content/60 block" htmlFor={`${baseId}-year`}>
              Year
            </label>
            <input
              id={`${baseId}-year`}
              type="number"
              min="1"
              max="9999"
              className={FIELD_CLASS}
              defaultValue={parsed.year}
              onChange={(e) => handleChange('year', e.target.value)}
              placeholder="Year"
              required={required}
              aria-required={required}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
