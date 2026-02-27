# Name Model Analysis: UI vs Database vs ligneous-gedcom-lib

## Summary

The new **Name UI** uses a **name-block model**: each "Name" is a self-contained unit with primary checkbox, name type, and its own given names + surnames. The **database** and **ligneous-gedcom-lib** use a **flat model** and do **not** fully support this structure.

---

## 1. Database Model (Prisma)

### Current Schema

| Table | Purpose |
|-------|---------|
| `GedcomIndividualGivenName` | Links individual → given name. Fields: `position`, `isPrimary`. **No `nameType` or block grouping.** |
| `GedcomIndividualSurname` | Links individual → surname. Fields: `nameType`, `isPrimary`. |

### What the DB Supports

- **Surnames**: Each surname has its own `nameType` (birth, maiden, married, etc.) and `isPrimary`. The unique constraint is `(individualId, surnameId, nameType)`.
- **Given names**: One flat list per individual. No type, no grouping by “name form.”

### What the DB Does NOT Support

- **Name blocks/forms**: There is no entity that groups `(type, primary, [given names], [surnames])` together.
- **Given names per block**: All given names belong to the individual. You cannot model “Mary Ann Wilson (maiden)” vs “Maria Wilhelm (birth)” as different given-name sets for different name forms.

### Implication

The UI’s name-block model can only be approximated in the DB:

- **Surnames**: Each block’s surnames are stored with that block’s `nameType` and `isPrimary`.
- **Given names**: Only the primary block’s given names are stored. Other blocks’ given names are dropped on save (or treated as duplicates of the primary block’s given names).

---

## 2. ligneous-gedcom-lib

### Current Behavior

In `enricher/enricher.go` → `extractIndividualNames`:

```go
nameRecs := indi.ChildrenByTag("NAME")
nameRec := nameRecs[0]  // Only the FIRST NAME is processed
```

- **Only the first `NAME` structure is used.** Additional `NAME` tags are ignored.
- **`IndividualSurnameLink`**: `IndividualXref`, `SurnameIndex`, `NameType`, `IsPrimary`. Name type is hardcoded to `"birth"` for this single name.
- **`IndividualGivenNameLink`**: `IndividualXref`, `GivenNameIndex`, `Position`, `IsPrimary`. No name-type or block grouping.

### GEDCOM Structure (What the Lib Reads)

GEDCOM allows:

```
1 NAME Mary Ann /Wilson/
2 TYPE maiden
1 NAME Mary Ann /Smith/
2 TYPE married
```

Each `NAME` is a full name form with optional `TYPE` and optional pieces (`GIVN`, `SURN`, etc.).

### What the Lib Does NOT Do

- Does **not** iterate over all `NAME` structures.
- Does **not** read `TYPE` from each `NAME`.
- Does **not** produce multiple name blocks (one per `NAME`).

### What Would Be Needed

To support the name-block model, the enricher would need to:

1. Loop over all `indi.ChildrenByTag("NAME")`.
2. For each `NAME`, read its `TYPE` (e.g. maiden, married).
3. Emit multiple `IndividualSurnameLink` and `IndividualGivenNameLink` with a **name form ID** or similar grouping, so the importer can create distinct blocks.

That would also require schema and import changes.

---

## 3. UI → API Mapping (Current)

The UI sends name blocks. The edit form **flattens** them for the existing PATCH API:

| UI Model | API Payload |
|----------|-------------|
| Primary block’s given names | `givenNames: [{ value }]` |
| All blocks’ surnames (each with block’s `nameType` and `isPrimary`) | `surnames: [{ value, nameType, isPrimary }]` |
| Non-primary blocks’ given names | **Discarded** (only primary block’s given names are sent) |

When loading from the API:

- Surnames are grouped by `nameType` into blocks.
- Given names (shared, no type in DB) are duplicated into each block for display.
- The primary block is the one whose surnames have `isPrimary: true`.

---

## 4. Recommendations

1. **Database**: Add a `GedcomNameForm` (or similar) entity that groups `(individualId, nameType, isPrimary)` and has child links to given names and surnames for that form. Then `GedcomIndividualGivenName` and `GedcomIndividualSurname` would reference the name form instead of (or in addition to) the individual.

2. **ligneous-gedcom-lib**: Extend the enricher to handle multiple `NAME` structures, read `TYPE`, and emit structured data (e.g. `IndividualNameForms` with nested given/surname links) that the importer can map to name forms.

3. **Until then**: The UI works with the existing backend by flattening name blocks. Users can create multiple blocks (e.g. maiden, married), but given names are shared and only the primary block’s given names persist; other blocks contribute only their surnames and type.
