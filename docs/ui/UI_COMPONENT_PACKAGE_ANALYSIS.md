# UI Component Package Analysis

## Current State

### Theme System Architecture

**1. CSS Variables (in `globals.css`)**
- Defined in `:root` and `.dark` selectors
- Variables like `--color-bg-primary`, `--color-accent`, `--color-text-primary`
- Comprehensive color system with light/dark variants
- Additional variables for shadows, transitions, z-index layers

**2. Theme Provider (React Context)**
- `ThemeProvider` manages theme state (light/dark/system)
- Persists to localStorage
- Applies `.dark` class to document root
- Listens to system preference changes

**3. Component Theme Usage - INCONSISTENT**

**Old Components (e.g., `NotificationPanel`, `DashboardLayout`):**
```javascript
// Uses CSS variables
className="bg-[var(--color-bg-primary)]"
className="text-[var(--color-text-primary)]"
```

**New Components (just created):**
```javascript
// Uses Tailwind utility classes
className="bg-gray-100 dark:bg-gray-800"
className="text-gray-900 dark:text-gray-100"
```

**Problem:** New components don't leverage the existing CSS variable system, creating:
- Visual inconsistency if theme colors change
- Duplication of color definitions
- Harder to maintain brand colors

---

## Should We Extract to a Separate Package?

### ✅ **Arguments FOR a Separate Package**

**1. Reusability Across Projects**
- Could use in other genealogy projects
- CLI tools could use same components
- Future mobile apps could share design system
- Admin dashboards, documentation sites, etc.

**2. Versioning & Distribution**
- Independent versioning (semver)
- Can publish to npm/private registry
- Other projects can pin specific versions
- Easier to track breaking changes

**3. Separation of Concerns**
- UI components are domain-agnostic
- Business logic stays in main app
- Clearer boundaries
- Easier to test in isolation

**4. Team Collaboration**
- Design team can work on package independently
- Frontend devs can consume stable versions
- Can have separate CI/CD pipelines

**5. Performance**
- Can be tree-shaken more effectively
- Smaller bundle if only importing what's needed
- Can be optimized separately

### ❌ **Arguments AGAINST a Separate Package**

**1. Theming Complexity**
- **Current issue:** Components use Tailwind classes, not CSS variables
- **Problem:** Package would need to either:
  - Bundle its own theme system (duplication)
  - Require consuming app to provide theme (coupling)
  - Use Tailwind config (limits flexibility)

**2. Build & Tooling Overhead**
- Need separate build configuration
- TypeScript/JavaScript compilation
- CSS bundling strategy
- Storybook/component docs setup
- Testing infrastructure

**3. Development Friction**
- Can't make quick changes in consuming app
- Need to publish new version for each change
- Link/local development more complex
- Slower iteration cycle

**4. Dependency Management**
- Version conflicts between projects
- Need to maintain compatibility
- Breaking changes affect all consumers
- Update propagation complexity

**5. Current Inconsistency**
- Components aren't using existing theme system
- Would need refactoring before extraction
- Theme integration is tightly coupled to app

**6. Over-Engineering Risk**
- Only one project currently using components
- Premature optimization
- YAGNI principle (You Aren't Gonna Need It)

---

## Theme Integration Options

### Option 1: CSS Variables (Recommended for Package)

**Approach:**
- Package components use CSS variables
- Consuming app provides CSS variable definitions
- Package includes default theme, but allows override

**Pros:**
- Flexible theming
- No Tailwind dependency in package
- Easy to customize per project
- Works with any CSS framework

**Cons:**
- Need to document required CSS variables
- Consuming app must set up theme
- Less "plug and play"

**Example:**
```javascript
// Package component
<div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">

// Consuming app globals.css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0f172a;
}
```

### Option 2: Tailwind Config Extension

**Approach:**
- Package uses Tailwind classes
- Consuming app extends Tailwind config with package's theme
- Package exports Tailwind preset

**Pros:**
- Familiar Tailwind API
- Good DX with autocomplete
- Can use Tailwind utilities

**Cons:**
- Requires Tailwind in consuming app
- Less flexible than CSS variables
- Harder to customize deeply

**Example:**
```javascript
// Package component
<div className="bg-primary text-primary-foreground">

// Consuming app tailwind.config.js
module.exports = {
  presets: [require('@ligneous/ui-components/tailwind-preset')],
}
```

### Option 3: Theme Provider Pattern

**Approach:**
- Package includes `ThemeProvider` component
- Theme config passed as props
- Components use theme context

**Pros:**
- Runtime theme switching
- Type-safe theme configuration
- Can have multiple themes

**Cons:**
- More complex implementation
- Requires React context
- Performance overhead

**Example:**
```javascript
// Consuming app
<ThemeProvider theme={customTheme}>
  <PersonCard person={person} />
</ThemeProvider>
```

### Option 4: Hybrid (CSS Variables + Tailwind)

**Approach:**
- Package uses CSS variables for colors
- Uses Tailwind for layout/spacing
- Consuming app provides CSS variables

**Pros:**
- Best of both worlds
- Flexible colors, convenient utilities
- Works with existing setup

**Cons:**
- Requires both systems
- More complex setup

---

## Recommendation

### **Phase 1: Fix Current Inconsistency (Do This First)**

**Before extracting, we should:**

1. **Refactor new components to use CSS variables**
   - Replace `bg-gray-100` with `bg-[var(--color-bg-secondary)]`
   - Replace `text-gray-900` with `text-[var(--color-text-primary)]`
   - Maintain dark mode via `.dark` class on root

2. **Create a theme mapping utility**
   - Map Tailwind classes to CSS variables
   - Or create Tailwind plugin that uses CSS variables

3. **Standardize on one approach**
   - Either all CSS variables OR all Tailwind with CSS variable values

### **Phase 2: Evaluate Package Extraction**

**Extract to package IF:**
- ✅ You have 2+ projects that need these components
- ✅ Components are stable and well-tested
- ✅ You have bandwidth for package maintenance
- ✅ You need independent versioning

**Keep in monorepo IF:**
- ❌ Only one project uses them
- ❌ Components are still evolving rapidly
- ❌ Tight coupling to app-specific logic
- ❌ Development speed is priority

### **Phase 3: Package Structure (If Extracting)**

```
@ligneous/ui-components/
├── src/
│   ├── components/        # All UI components
│   ├── theme/            # Theme provider & context
│   ├── styles/           # CSS variables definitions
│   └── utils/            # Helper functions
├── dist/                 # Built files
├── tailwind-preset.js    # Optional Tailwind preset
├── package.json
└── README.md
```

**Package Dependencies:**
- `react`, `react-dom` (peer dependencies)
- `tailwindcss` (optional, if using Tailwind approach)
- No other dependencies (keep it lean)

**Consuming App Setup:**
```javascript
// 1. Install package
npm install @ligneous/ui-components

// 2. Import CSS variables
import '@ligneous/ui-components/dist/theme.css'

// 3. Use components
import { PersonCard, TreeCard } from '@ligneous/ui-components'
```

---

## Immediate Action Items

### 1. **Fix Theme Inconsistency** (High Priority)
- [ ] Audit all new components
- [ ] Replace Tailwind color classes with CSS variables
- [ ] Test light/dark mode switching
- [ ] Ensure visual consistency

### 2. **Create Theme Utility** (Medium Priority)
- [ ] Create Tailwind plugin that maps to CSS variables
- [ ] OR create utility functions for common patterns
- [ ] Document theme variable usage

### 3. **Evaluate Package Need** (Low Priority)
- [ ] Wait until 2nd project needs components
- [ ] Monitor component stability
- [ ] Assess maintenance overhead

---

## Conclusion

**Current Recommendation: DON'T extract yet**

**Reasons:**
1. Components are newly created and may need iteration
2. Theme system is inconsistent (needs fixing first)
3. Only one project currently uses them
4. Development speed > reusability at this stage

**But DO:**
1. Fix theme inconsistency immediately
2. Standardize on CSS variables approach
3. Keep components in shared folder (already done)
4. Re-evaluate extraction when you have 2+ projects

**If extracting later:**
- Use CSS variables approach (most flexible)
- Keep package lean (minimal dependencies)
- Provide clear theming documentation
- Include default theme that can be overridden

