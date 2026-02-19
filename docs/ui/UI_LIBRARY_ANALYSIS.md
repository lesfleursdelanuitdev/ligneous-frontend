# UI Library Analysis: Should We Use shadcn (or Similar)?

**Date:** 2026-02-18  
**Scope:** `components/` directory and maintenance burden  
**Question:** Would a UI library like shadcn reduce the amount of code we need to maintain?

---

## 1. What We Have Today

### Stack
- **Next.js 16**, **React 19**, **Tailwind 4**
- No Radix UI, Headless UI, or shadcn
- Theming via CSS variables in `app/globals.css` (`--color-bg-primary`, `--color-accent`, etc.) and `ThemeContext` (light/dark/system)

### Component inventory (high level)

| Category | Count | Examples | Pattern |
|----------|--------|----------|--------|
| **Layout** | 4 | DashboardLayout, TopBar, MobileNav, DesktopSidebar | Custom layout + raw buttons/links |
| **Cards** | 20+ | BaseCard, PersonCard, FamilyCard, … | BaseCard + Tailwind variants; domain-specific content |
| **Shared UI** | ~15 | Badge, Avatar, EntityIcon, SearchBar, Pagination, SortDropdown, Breadcrumbs, ViewToggle | Hand-rolled with Tailwind; no shared Button/Input |
| **Feedback** | 4 | LoadingState, EmptyState, ErrorState, CardSkeleton | Small, focused |
| **Forms** | 1 | SearchBar | Single custom input (icon + clear); no generic Input/Select/Textarea |
| **Feature** | 10+ | CommentList, GlobalSearch, ExploreTrees, … | Domain logic; use shared pieces where they exist |

### Current patterns (where maintenance adds up)

1. **No shared Button**  
   Buttons are inline Tailwind everywhere (e.g. `className="px-3 py-2 rounded-lg bg-emerald-600 ..."` in CommentForm, Pagination, SortDropdown, TopBar). Changing primary/secondary/disabled styles means touching many files.

2. **No shared Input / Textarea**  
   SearchBar and CommentForm each define their own input/textarea styling and behavior. Any global change (e.g. focus ring, error state) is duplicated.

3. **Custom dropdowns**  
   SortDropdown and TopBar user menu both implement:
   - open/close state
   - click-outside (ref + `mousedown` listener)
   - No focus trap, no keyboard (Arrow keys, Escape)  
   So we maintain the same “dropdown behavior” in multiple places.

4. **Repeated styling**  
   Border, background, hover, disabled, and dark-mode classes are copy-pasted across cards, nav, and forms. Small design tweaks require many edits.

5. **Accessibility**  
   Focus management, ARIA, and keyboard behavior are ad hoc (e.g. BaseCard has role/tabIndex/onKeyDown; dropdowns do not). Building modals, tooltips, or comboboxes would mean writing more one-off a11y logic.

---

## 2. What a Library Like shadcn Would Provide

**shadcn/ui** is a set of copy-paste components (you own the source in your repo) built on **Radix UI** + **Tailwind**:

- **Primitives:** Button, Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch  
- **Overlays:** Dialog, DropdownMenu, Popover, Tooltip, Tabs  
- **Display:** Card, Badge, Skeleton, Separator  
- **Data:** Table (optional)  
- **Accessibility:** Radix handles focus trap, escape, arrows, ARIA, so we don’t maintain that ourselves.

So we’d get:
- One **Button** (variants: default, destructive, outline, ghost, link) instead of N inline button class strings.
- One **Input** / **Textarea** used in SearchBar, CommentForm, and future forms.
- **DropdownMenu** (and/or **Popover**) for SortDropdown and TopBar menu instead of custom ref + mousedown.
- **Dialog** when we need modals (e.g. confirm delete, settings).
- **Tooltip** and **Popover** when we need them, without building from scratch.

Domain components (PersonCard, CommentList, DataView, etc.) would stay; they’d just use these primitives instead of raw `<button>` / `<input>` and custom dropdown logic.

---

## 3. Would It Reduce Code We Maintain?

**Short answer: yes for primitives and behavior; no for domain structure.**

| Area | Today | With shadcn (or similar) | Net |
|------|--------|---------------------------|-----|
| **Buttons** | Many inline class strings | Single Button component + variants | **Less** duplicated styling and behavior |
| **Inputs / Textarea** | SearchBar + CommentForm + future forms each own styling | Shared Input/Textarea | **Less** form styling and focus/error logic |
| **Dropdowns / menus** | SortDropdown + TopBar menu (each with ref + click-outside) | DropdownMenu / Popover | **Less** custom dropdown and a11y code |
| **Badge** | Our Badge.js | Could replace with shadcn Badge or keep ours | **Neutral** (we have one already) |
| **Card** | BaseCard + variants | Could use shadcn Card or keep BaseCard | **Neutral** (optional) |
| **Dialogs / tooltips** | None yet | Add when needed without custom implementations | **Less** future code |
| **Domain components** | PersonCard, CommentList, etc. | Same; they consume primitives | **No change** in amount of domain code |

So:
- We’d **delete or shrink** a noticeable amount of one-off styling and dropdown/menu logic.
- We’d **add** the library’s source files (and Radix as a dependency) and maintain *those* in the repo, but they’re well-tested and only updated when we choose.
- The main gain is **future** work: new forms, dropdowns, modals, and tooltips don’t reimplement focus, keyboard, and ARIA.

**Verdict:** Yes, it would reduce the amount of *custom* UI code we maintain, especially for forms, buttons, and overlays (dropdowns, dialogs, tooltips). Domain components and layout stay; only the primitives they use change.

---

## 4. Trade-offs and Risks

### Tailwind 4
- We use **Tailwind 4**; much of the shadcn ecosystem targets **Tailwind 3** (e.g. `tailwind.config` and some class names).
- **Options:** Stay on Tailwind 4 and adapt shadcn components (or use a fork/version that supports v4), or temporarily use Tailwind 3 for the UI layer. Worth checking current shadcn/Tailwind 4 compatibility before committing.

### Theming
- We use custom CSS variables (`--color-bg-primary`, `--color-accent`, etc.) and a custom ThemeContext.
- shadcn also uses CSS variables (e.g. `--background`, `--foreground`, `--primary`). We’d need to **map** our variables to shadcn’s or adopt a small set of shadcn tokens and override with our palette. Doable, but a one-time alignment task.

### Migration effort
- **Incremental is possible:** Introduce Button and Input first; replace usages over time. Then DropdownMenu for SortDropdown and TopBar. No need to rewrite everything at once.
- **Risk:** Two systems in parallel (our Badge vs shadcn Badge, our cards vs shadcn Card) until we standardize. Clear “use primitives from `components/ui/`” rule avoids confusion.

### Bundle and dependencies
- Radix is tree-shakeable; we only bundle what we use. Typically small impact.
- We’d add `@radix-ui/*` (and optionally `class-variance-authority`, `clsx`, `tailwind-merge`) for the parts we adopt.

---

## 5. Recommendation

- **Consider adopting a UI library (e.g. shadcn) for primitives and overlays.**  
  It would reduce the code we maintain for buttons, inputs, dropdowns, and future dialogs/tooltips, and improve consistency and accessibility without reimplementing behavior in every feature.

- **Do it gradually:**
  1. Confirm Tailwind 4 compatibility (or decide to align on one Tailwind version for UI).
  2. Map our CSS variables to the library’s theme (or the other way around).
  3. Add a small set of primitives (e.g. Button, Input, Textarea, DropdownMenu).
  4. Use them in new code and in one or two refactors (e.g. CommentForm, SortDropdown) to validate.
  5. Then replace remaining one-off buttons/dropdowns over time and use Dialog/Tooltip when needed.

- **We would not remove domain components.**  
  PersonCard, CommentList, DataView, layout, and feature-specific pieces stay; they’d just use shared Button, Input, DropdownMenu, etc. So the *reduction* in maintainable code is in the primitive/overlay layer and in future feature work that would otherwise reimplement the same patterns again.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Would a UI library (e.g. shadcn) reduce code we maintain? | **Yes** for buttons, inputs, dropdowns, and future modals/tooltips; **no** for domain components (we’d keep those, using the library for primitives). |
| Where is the win? | Less duplicated styling and behavior, one place for a11y and keyboard handling, and less code when adding new forms and overlays. |
| Main cost? | Tailwind 4 alignment, theme variable mapping, and a gradual migration. |
| Recommendation | **Worth doing** if we’re adding more forms, menus, or modals; adopt incrementally and keep our domain structure intact. |
