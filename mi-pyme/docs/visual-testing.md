# Visual Testing Documentation

## Overview

This document describes the automated visual regression and accessibility testing suite for Mi-Pyme. The suite validates all views and components in both light and dark modes across multiple viewports, ensuring visual consistency, contrast compliance, and WCAG 2.1 AA accessibility standards.

## Stack

- **Playwright** - Browser automation, screenshots, and test orchestration
- **axe-core** - Accessibility testing (WCAG 2.1 AA)
- **pixelmatch** - Pixel-level visual diff comparison
- **Lighthouse CI** - Performance and accessibility auditing
- **Storybook** - Component isolation and documentation
- **GitHub Actions** - CI/CD pipeline

## Test Structure

```
visual-tests/
├── accessibility.test.ts          # Page-level accessibility tests
├── components.visual.test.ts      # Storybook component visual tests
├── comprehensive.visual.test.ts   # Full route matrix tests
├── snapshots/                     # Baseline screenshots
│   ├── baseline_*.png            # Reference images
├── diffs/                        # Diff images for failed tests
│   ├── diff_*.png                # Visual difference images
reports/
├── index.html                    # HTML summary report
├── summary.json                  # Machine-readable summary
test-results/
├── visual-results.json           # Playwright test results
├── a11y-results.json             # Accessibility test results
```

## Routes Tested

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, features, CTA, footer) |
| `/auth/login` | Login form |
| `/auth/registro` | Registration form |
| `/catalogo` | Product/service catalog with filters |
| `/carrito` | Shopping cart |
| `/reservas` | Booking/reservations |
| `/pedidos` | Order history |
| `/negocio` | Business dashboard |
| `/cliente` | Client dashboard |
| `/logistica` | Logistics dashboard |
| `/admin` | Admin panel |
| `/contacto` | Contact page |
| `/servicios` | Services listing |

## Viewports

| Name | Dimensions | Device |
|------|------------|--------|
| Mobile | 375×812 | iPhone X |
| Tablet | 768×1024 | iPad |
| Desktop | 1440×900 | Desktop HD |

## Modes

- **Light** - Default theme (`data-theme="light"`)
- **Dark** - Dark theme (`data-theme="dark"`)

## Commands

```bash
# Run all visual regression tests (13 routes × 3 viewports × 2 modes = 78 tests)
npm run test:visual:comprehensive

# Run accessibility tests only (5 pages × 2 modes = 10 tests)
npm run test:a11y

# Run Storybook component visual tests
npm run test:visual

# Run everything
npm run test:visual:all

# Run Lighthouse CI audits
npm run test:lighthouse

# Generate HTML/JSON reports
npm run test:reports

# Start Storybook for local development
npm run storybook

# Build Storybook for CI
npm run storybook:build
```

## CI Pipeline (GitHub Actions)

The workflow `.github/workflows/visual-tests.yml` runs on every push/PR:

1. **visual-tests** - Full visual regression + accessibility matrix
2. **lighthouse-ci** - Performance & accessibility audits
3. **storybook-tests** - Component-level visual tests
4. **summary** - Aggregates results, fails if any job fails

### Required Secrets

- `LHCI_GITHUB_APP_TOKEN` - For Lighthouse CI upload (optional)

## Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Visual diff ratio | ≤ 0.1% (1000 ppm) | Fail |
| Contrast (body text) | ≥ 4.5:1 | Fail (axe) |
| Contrast (headings) | ≥ 7:1 | Fail (axe) |
| Axe critical/serious violations | 0 | Fail |
| Lighthouse accessibility | ≥ 0.9 (90) | Error |
| Lighthouse performance | ≥ 0.5 (50) | Warn |
| FCP | ≤ 3000ms | Warn |
| LCP | ≤ 4000ms | Warn |
| CLS | ≤ 0.1 | Warn |
| TBT | ≤ 300ms | Warn |

## Baseline Management

### Creating Baselines (First Run)

On first run, tests will **pass automatically** and create baseline images in `visual-tests/snapshots/baseline_*.png`.

### Updating Baselines

When intentional visual changes are made:

```bash
# Option 1: Delete baselines and re-run
rm visual-tests/snapshots/baseline_*.png
npm run test:visual:comprehensive

# Option 2: Update specific baseline
cp visual-tests/snapshots/new_screenshot.png visual-tests/snapshots/baseline_new_screenshot.png
```

### Baseline Storage

- **Local**: `visual-tests/snapshots/` (gitignored)
- **CI**: Artifacts uploaded for 30 days
- **Review**: Download artifacts to inspect diffs

## Interpreting Results

### Visual Diff Report

Each failed visual test produces:
- `diff_*.png` - Red overlay showing pixel differences
- JSON attachment with `diffPixels`, `diffRatio`, `passed`

### Accessibility Report

Each test includes axe-core results:
- `violations` - Total violations
- `criticalViolations` - Critical + serious impact
- `details` - Full violation objects with selectors

### HTML Summary Report

Open `reports/index.html` for:
- Pass/fail counts by route, mode, viewport
- Color-coded status badges
- Timestamp

### JSON Summary

`reports/summary.json` for programmatic access:
```json
{
  "visual": { "passed": 72, "failed": 6, "byRoute": {...} },
  "accessibility": { "passed": 10, "failed": 0, "byRoute": {...} }
}
```

## Common Issues & Fixes

### Flaky Visual Tests

**Cause**: Dynamic content (timestamps, random IDs, animations)

**Fix**: 
- Disable animations: `await page.screenshot({ animations: "disabled" })`
- Mock dynamic data in test setup
- Use `waitForLoadState("networkidle")` before capture

### Contrast Failures in Dark Mode

**Cause**: Semi-transparent backgrounds (`bg-background/80`) over gradients

**Fix**: Use solid theme tokens:
```css
/* Bad */
.bg-background\/80 { background: var(--color-background); opacity: 0.8; }

/* Good */
.bg-background { background: var(--color-background); }
```

### FOUC (Flash of Unstyled Content)

**Cause**: Theme applied client-side after render

**Fix**: Inline script in `layout.tsx`:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (theme === 'dark' || (!theme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch (e) {}
      })();
    `,
  }}
/>
```

### Storybook Build Fails

**Cause**: Next.js 16 compatibility

**Fix**: Use Storybook v11 alpha with React 19 support:
```json
"@storybook/nextjs": "^11.0.0-alpha.0",
"@storybook/react": "^11.0.0-alpha.0",
```

## Local Development Workflow

1. **Start dev server**: `npm run dev`
2. **Run specific test**: `npx playwright test visual-tests/comprehensive.visual.test.ts -g "home - light mode - desktop" --headed`
3. **Debug visually**: `npx playwright test --ui`
4. **Update baselines**: Delete `visual-tests/snapshots/baseline_*.png` and re-run
5. **Generate reports**: `npm run test:reports` → open `reports/index.html`

## Adding New Routes

1. Add route to `ROUTES` array in `comprehensive.visual.test.ts`
2. Add route to Lighthouse CI config `.lighthouserc.js`
3. Run tests to create baselines
4. Commit baselines if intentional

## Adding New Components

1. Create Storybook story in `src/components/ui/*.stories.tsx`
2. Add component to `COMPONENTS` array in `comprehensive.visual.test.ts`
3. Run `npm run test:visual` to create baselines

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout
npx playwright test --timeout=120000
```

### Browser Not Found

```bash
npx playwright install --with-deps chromium
```

### Memory Issues

```bash
# Reduce workers
npx playwright test --workers=1
```

### Diff Ratio Too High

- Check for dynamic content
- Verify theme is applied correctly
- Ensure fonts are loaded (`document.fonts.ready`)

## Resources

- [Playwright Test Config](https://playwright.dev/docs/test-configuration)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Storybook Testing](https://storybook.js.org/docs/writing-tests/introduction)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)