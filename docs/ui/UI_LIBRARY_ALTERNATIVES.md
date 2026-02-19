# UI Library Alternatives: What Else to Consider

**Date:** 2026-02-18  
**Context:** See [UI_LIBRARY_ANALYSIS.md](./UI_LIBRARY_ANALYSIS.md) for why we’re considering a library.  
**Stack:** Next.js 16, React 19, Tailwind 4.

This doc compares **alternatives to shadcn** so you can choose or shortlist. No coding—analysis only.

---

## 1. How to Compare

Relevant dimensions for your stack:

- **Distribution:** Copy-paste (you own source) vs npm dependency (they own upgrades).
- **Styling:** Tailwind-native vs own system (CSS-in-JS, CSS modules) vs Tailwind plugin (class names only).
- **Tailwind 4 / React 19:** Explicit support or known to work.
- **Surface area:** Primitives only (buttons, inputs, overlays) vs full suite (tables, date pickers, etc.).
- **Accessibility:** Built-in (Radix/React Aria/Headless) vs minimal.
- **Maintenance:** Who maintains behavior and a11y—you or the library.

---

## 2. Categories and Options

### A. Copy-paste, Tailwind-styled (like shadcn)

You add component source into the repo and style with Tailwind. Full control; you own the code.

| Library | Description | Tailwind 4 / React 19 | Pros | Cons |
|--------|-------------|------------------------|------|------|
| **shadcn/ui** | Radix primitives + Tailwind; CLI adds components to your repo. | ✅ Official Tailwind v4 + React 19 support (2025). | Huge adoption, great docs, a11y via Radix, you own the code. Fits your stack. | Theming uses its own variables (mapping needed). |
| **Park UI** | Radix + styling (Panda CSS / Radix Colors); **npm package**, not copy-paste. | Check docs (Panda/Tailwind). | Consistent design system, Radix a11y. | Not copy-paste; different styling (Panda/Radix Colors). Less “pure Tailwind” than shadcn. |
| **Tailwind UI** (paid) | Official Tailwind Labs components; copy-paste HTML/React. | Works with Tailwind 4. | Official, polished, marketing/app/dashboard sections. | Paid; more page/section templates than small primitives (buttons, inputs). |
| **Flowbite** | Tailwind-based components; can use as npm or copy-paste. | Tailwind 3–oriented; v4 may need checks. | Lots of components, free tier. | Quality and API less consistent than shadcn/Radix; some bloat. |
| **Untitled UI React** | Copy-paste components; React 19, Tailwind 4, React Aria. | ✅ Stated React 19 + Tailwind 4.1. | Modern stack, a11y via React Aria, you own code. | Smaller ecosystem than shadcn; less community examples. |

**Takeaway:** For copy-paste + Tailwind, **shadcn** is the default choice with explicit Tailwind 4 + React 19 support. **Untitled UI React** is a viable alternative if you prefer React Aria over Radix.

---

### B. Headless (unstyled); you add Tailwind

Only behavior and a11y; no visual design. You style everything with Tailwind (or your CSS). No shared “Button/Input” look—you build it once on top of the primitive.

| Library | Description | Tailwind 4 / React 19 | Pros | Cons |
|--------|-------------|------------------------|------|------|
| **Radix UI** | Unstyled primitives (Dialog, Dropdown, Select, etc.). | Works with any CSS/React 19. | Best-in-class a11y, minimal API, no styling opinion. Used by shadcn. | You must build and maintain all styling (buttons, inputs, cards) yourself. |
| **Headless UI** (Tailwind Labs) | Unstyled components (Listbox, Combobox, Dialog, etc.); optional Tailwind plugin for state variants (`ui-open`, etc.). | v2 active; Tailwind 4 works with plugin. | From Tailwind team, fits Tailwind workflow, good a11y. | Smaller set than Radix; you still own every visual (Button, Input, etc.). |
| **React Aria** (Adobe) | Unstyled hooks + components; a11y and behavior only. | React 19 compatible. | Very strong a11y, used in enterprise. | Lower-level; more wiring than Radix/Headless. |
| **Ark UI** | Headless primitives (Chakra team); Radix-like. | React 19. | Good a11y, flexible. | Smaller community than Radix; you own all styling. |

**Takeaway:** If you want **maximum control** and are happy to define one Button/Input/Card in your repo and reuse them, **Radix** or **Headless UI** are solid. **Headless UI** aligns with Tailwind and has a Tailwind plugin. You’ll write more “wrapper” components than with shadcn.

---

### C. Full UI library (npm, styled)

Heavy dependency; they ship design and behavior. Often a distinct look; Tailwind is “alongside” rather than the main styling engine.

| Library | Description | Tailwind 4 / React 19 | Pros | Cons |
|--------|-------------|------------------------|------|------|
| **Mantine** | 100+ components, hooks, forms, charts. Own styling (CSS modules). | Can coexist with Tailwind; typically disable Tailwind preflight or layer carefully. | Very complete, good a11y, forms/dates/tables. | Own design system; not “Tailwind-first.” Heavier; two styling mental models. |
| **Chakra UI** | Styled components; v3 can work with Tailwind. | v3 has Tailwind integration. | Good DX, theming, a11y. | Historically own styling; Tailwind is add-on. |
| **MUI (Material UI)** | Material Design; very large. | Tailwind v4 integration documented (layer setup). | Huge ecosystem, production-ready. | Heavy, Material look, big bundle unless tree-shaken. |
| **Joy UI** (MUI) | Lighter MUI alternative; unstyled base + themes. | Same MUI ecosystem. | Lighter than Material UI, still comprehensive. | Ties you to MUI ecosystem. |
| **Ant Design** | Enterprise-oriented, lots of components. | React 19 support. | Very complete, common in enterprise. | Heavy, distinct look, less “Tailwind-native.” |

**Takeaway:** These **reduce custom code** by giving you everything out of the box, but they’re **not Tailwind-first** and add a second design/styling system. Best if you want a full suite and can accept their look or invest in theming. **Mantine** is often the best fit for “full library + good a11y” without Material.

---

### D. Tailwind plugin (classes only)

No React components; you get **utility-like class names** (e.g. `btn`, `card`, `modal`). Behavior (open/close, focus) is still your React code.

| Library | Description | Tailwind 4 / React 19 | Pros | Cons |
|--------|-------------|------------------------|------|------|
| **DaisyUI** | Tailwind plugin; semantic classes (`btn`, `btn-primary`, `modal`). Optional **react-daisyui** for wrapper components. | Works with Tailwind 4. | Zero JS from plugin; small; many themes. | No built-in behavior (dropdowns, modals)—you still do state and a11y. Complements primitives; doesn’t replace Radix/shadcn. |
| **Preline** | Tailwind plugin + some JS for dropdowns/collapse. | Tailwind 3; v4 may need check. | Simple, free. | Limited set; less robust a11y than Radix/Headless. |

**Takeaway:** **DaisyUI** is useful for **consistent class names** (buttons, cards, alerts) and theming, but **does not** give you dropdown/modal/dialog behavior or a11y. You’d still want Headless UI or Radix (or shadcn) for overlays and complex controls. Can be used **together** with shadcn or Headless UI.

---

## 3. Short Comparison Table

| Option | Model | Tailwind 4 | Reduces your code | Best if you want |
|--------|--------|------------|--------------------|-------------------|
| **shadcn/ui** | Copy-paste, Radix + Tailwind | ✅ | Yes (primitives + overlays) | Tailwind-native, own source, strong a11y. |
| **Untitled UI React** | Copy-paste, React Aria + Tailwind | ✅ | Yes | Same as above but React Aria instead of Radix. |
| **Radix UI** | Headless npm | ✅ (any CSS) | Partially (behavior only) | Max control; you build one Button/Input and style with Tailwind. |
| **Headless UI** | Headless npm + Tailwind plugin | ✅ | Partially (behavior only) | Tailwind-team option; you build visuals. |
| **Park UI** | npm, Radix + Panda/Radix Colors | Check | Yes | Design system in a box; less “pure Tailwind.” |
| **Mantine** | npm, full styled | Alongside Tailwind | Yes (whole UI layer) | Full suite; accept second styling system. |
| **Chakra UI v3** | npm, can use Tailwind | Yes | Yes | Full library with Tailwind integration. |
| **DaisyUI** | Tailwind plugin | ✅ | Only styling (classes) | Theming + class names; pair with headless for behavior. |
| **Tailwind UI** | Copy-paste (paid) | ✅ | Yes (sections/pages) | Official Tailwind; more templates than primitives. |

---

## 4. Suggested Shortlist for Your Stack

Given **Next 16, React 19, Tailwind 4**, and the goal to **reduce maintained code** for buttons, inputs, dropdowns, and overlays:

1. **shadcn/ui** – First choice: copy-paste, Tailwind 4 + React 19 supported, Radix a11y, you keep full control. Only downside is aligning your CSS variables with its theme.
2. **Headless UI** – If you prefer an npm primitive layer and want to define a single Button/Input/Dropdown in your repo and style them all with Tailwind. Slightly more “glue” code than shadcn.
3. **Radix UI** – If you want headless only and no copy-paste; you build and maintain one set of styled wrappers (Button, Input, etc.) on top of Radix.
4. **DaisyUI (plugin)** – Not a replacement for shadcn/Headless/Radix; use **in addition** if you want semantic class names (`btn`, `card`) and built-in themes without adding React component dependencies for simple elements.
5. **Mantine** – Only if you decide you want a **full** UI suite (tables, dates, rich text) and are okay with a second styling system and more weight.

**Avoid for “reduce primitives + Tailwind-first”:** Heavy, opinionated suites (Ant Design, full MUI) unless you explicitly want that ecosystem; they don’t reduce *Tailwind* maintenance, they replace it with their own.

---

## 5. Summary

- **shadcn** remains the strongest fit for Tailwind 4 + React 19 and “copy-paste primitives + overlays.”
- **Headless UI** and **Radix** are the main **headless** options if you want to own all styling and minimize dependencies.
- **Mantine** / **Chakra** are **full-library** options if you want more than primitives and accept non–Tailwind-first styling.
- **DaisyUI** is a **Tailwind plugin** for look and theming; combine with a headless or shadcn-like layer for behavior and a11y.

No coding in this doc—use it to pick 1–2 options to try (e.g. shadcn + DaisyUI for theming, or Headless UI alone) and then validate with a small pilot (e.g. Button + one dropdown).

---

## 6. Headless UI vs DaisyUI (and Using Both)

### What each one is

| | **Headless UI** | **DaisyUI** |
|---|-----------------|-------------|
| **What it is** | npm package of **unstyled React components** (dropdowns, dialogs, listboxes, etc.). Behavior + a11y only; you add Tailwind (or any CSS). | **Tailwind plugin** that adds **semantic utility classes** (`btn`, `btn-primary`, `card`, `modal`, `dropdown`, etc.). No React components; no open/close or focus logic. |
| **Who makes it** | Tailwind Labs | Community (saadeghi/daisyui) |
| **Tailwind 4** | ✅ v2 works with Tailwind 4; optional `@headlessui/tailwindcss` plugin for state variants (`ui-open`, `ui-selected`, etc.) | ✅ DaisyUI 4 built for Tailwind 4 (OKLCH colors, etc.) |
| **React 19** | ✅ Supported | N/A (CSS only); your React is unchanged. |
| **Bundle** | JS: you ship the components you use (tree-shakeable). | No JS from DaisyUI itself (CSS/plugin only). Optional `react-daisyui` if you want wrapper components. |

### What you get from each

**Headless UI** gives you:

- **Behavior and a11y:** open/close state, focus trap, Escape, Arrow keys, click-outside, positioning (Floating UI in v2).
- **Components:** Dialog (modal), Listbox (select), Combobox (autocomplete), Menu (dropdown), Popover, Tabs, Disclosure, etc. v2 also has primitives like Button, Input, Textarea, Checkbox, Switch, Radio Group, Fieldset—still unstyled.
- **No visuals:** You apply Tailwind (or your own classes) to the elements they render. You define what a “primary button” or “dropdown panel” looks like once, then reuse.

So Headless UI **reduces** the code you write for dropdowns, modals, and form behavior; it **does not** give you a ready-made look. You still need one shared Button, Input, and Card in your app (or use raw Tailwind on Headless components).

**DaisyUI** gives you:

- **Semantic class names:** `btn`, `btn-primary`, `btn-sm`, `input`, `input-bordered`, `card`, `card-title`, `modal`, `dropdown`, `alert`, `badge`, `table`, etc.
- **Theming:** Many built-in themes (light/dark, colors) and easy customization via CSS variables.
- **No behavior:** It does **not** handle dropdown open/close, modal show/hide, focus, or keyboard. You still write the React state and event handlers (or use Headless UI / Radix for that).

So DaisyUI **reduces** repeated Tailwind class strings and gives consistent look and theme; it **does not** replace Headless UI (or Radix/shadcn) for overlays and complex controls.

### Can you use only one?

- **Headless UI only:** Yes. You get dropdowns, dialogs, and form behavior. You style everything with Tailwind (or your own CSS). You’ll define your own “primary button” and “input” styles (or a small set of wrapper components). More control; a bit more one-time setup.
- **DaisyUI only:** For **simple** UIs (buttons, cards, alerts, static modals you wire yourself), yes. For **dropdowns, comboboxes, accessible modals**, no—you’d still implement state and a11y yourself. So DaisyUI alone doesn’t solve the “custom dropdown and modal” maintenance problem.

### Using Headless UI + DaisyUI together

They target different layers and work well together:

1. **DaisyUI** for look and theme: use `btn btn-primary`, `input input-bordered`, `card`, `modal`, `dropdown` (the **class names** for the container and inner elements).
2. **Headless UI** for behavior: use `Listbox`, `Dialog`, `Menu`, `Combobox` to get open/close, focus, keyboard, and positioning. Style the **elements** Headless renders with DaisyUI classes (and any extra Tailwind you need).

Example idea (conceptual): a dropdown could be Headless UI `Listbox` (behavior) with DaisyUI classes on the button and list container (`btn`, `dropdown-content`, etc.). You get one source of truth for “how dropdowns behave” (Headless) and one for “how they look” (DaisyUI).

**Benefits of combining them:**

- **Headless UI** removes custom click-outside, focus trap, and keyboard logic (e.g. from your current SortDropdown and TopBar menu).
- **DaisyUI** gives you consistent buttons, inputs, and cards without writing long Tailwind strings; theming (including dark mode) is built in.
- You avoid bringing in Radix or shadcn; stack stays Tailwind-native with one npm dependency (Headless) and one plugin (DaisyUI).

**Caveats:**

- You must **map** Headless’s structure to DaisyUI’s class expectations (e.g. `Listbox.Button` gets `btn`, `Listbox.Options` gets the dropdown panel classes). Usually a thin wrapper or clear pattern per component type.
- DaisyUI’s `dropdown` and `modal` are **markup + classes**; you’d use Headless’s Menu/Dialog for the actual behavior and apply DaisyUI classes to the parts Headless renders. Don’t mix two behavior systems (e.g. DaisyUI’s modal toggle and Headless Dialog state).
- Your existing CSS variables (`--color-accent`, etc.) may need to align with DaisyUI’s theme variables if you want a single source of truth for colors.

### Summary: Headless UI vs DaisyUI

| Question | Headless UI | DaisyUI |
|----------|-------------|---------|
| Reduces dropdown/modal **behavior** code? | ✅ Yes | ❌ No |
| Reduces button/input/card **styling** code? | ❌ No (you style) | ✅ Yes (semantic classes) |
| Tailwind 4 / React 19 friendly? | ✅ Yes | ✅ Yes (Tailwind 4) |
| Use alone? | Yes (you own all styling) | Only for simple UIs; not for complex overlays. |
| Use together? | ✅ Yes—Headless for behavior, DaisyUI for look and theme. |

**Practical takeaway:** If you like Tailwind-native and want to avoid Radix/shadcn, **Headless UI + DaisyUI** is a solid pair: Headless for behavior and a11y, DaisyUI for consistent styling and theming. If you prefer “one place that does both behavior and style” and are fine with Radix, **shadcn** is still the single-box option.
