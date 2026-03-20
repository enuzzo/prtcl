# PRTCL SEO + Lighthouse 100 Optimization Guide

> Comprehensive, copy-paste-ready reference for prtcl.es landing page.
> Stack: React 19, Vite 6, Tailwind CSS 4, SiteGround (Apache).

---

## 1. META TAGS

Replace the current bare `<head>` in `index.html` with this complete set.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta -->
    <title>PRTCL — Free GPU Particle Effects Editor</title>
    <meta name="description" content="Create, customize, and export GPU-accelerated particle effects. Free, open-source, zero accounts. Runs in your browser." />
    <meta name="keywords" content="particle effects, WebGL, Three.js, particle editor, web effects, GPU particles, open source" />
    <meta name="author" content="Netmilk Studio" />
    <link rel="canonical" href="https://prtcl.es/" />
    <meta name="robots" content="index, follow" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://prtcl.es/" />
    <meta property="og:title" content="PRTCL — Free GPU Particle Effects Editor" />
    <meta property="og:description" content="Create, customize, and export GPU-accelerated particle effects. Free, open-source, runs in your browser." />
    <meta property="og:image" content="https://prtcl.es/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="PRTCL particle effects editor showing colorful GPU-accelerated particles" />
    <meta property="og:site_name" content="PRTCL" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://prtcl.es/" />
    <meta name="twitter:title" content="PRTCL — Free GPU Particle Effects Editor" />
    <meta name="twitter:description" content="Create, customize, and export GPU-accelerated particle effects. Free, open-source, runs in your browser." />
    <meta name="twitter:image" content="https://prtcl.es/og-image.png" />
    <meta name="twitter:image:alt" content="PRTCL particle effects editor showing colorful GPU-accelerated particles" />

    <!-- Theme / Mobile -->
    <meta name="theme-color" content="#08040E" />
    <meta name="color-scheme" content="dark" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="PRTCL" />

    <!-- Favicons (see Section 5 for generation) -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Preconnect to critical origins -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <!-- Preload critical font -->
    <link rel="preload" href="/fonts/InconsolataNerdFontMono-Regular.ttf" as="font" type="font/truetype" crossorigin />

    <!-- Structured Data (see Section 2) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": "https://prtcl.es/#app",
          "name": "PRTCL",
          "alternateName": "Particles",
          "url": "https://prtcl.es/create",
          "description": "Free, open-source web tool for creating, customizing, and exporting GPU-accelerated particle effects. No accounts required.",
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Web Browser",
          "browserRequirements": "Requires WebGL 2.0 support",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "GPU-accelerated particle rendering",
            "Real-time parameter tweaking",
            "Export to HTML, React, or iframe",
            "Hand tracking gesture control",
            "Audio-reactive particles",
            "Text-to-particle effects",
            "22 background presets"
          ],
          "screenshot": "https://prtcl.es/og-image.png",
          "softwareVersion": "0.6.0",
          "creator": {
            "@id": "https://prtcl.es/#org"
          },
          "license": "https://opensource.org/licenses/MIT",
          "isAccessibleForFree": true,
          "inLanguage": "en"
        },
        {
          "@type": "Organization",
          "@id": "https://prtcl.es/#org",
          "name": "Netmilk Studio",
          "url": "https://prtcl.es",
          "logo": "https://prtcl.es/img/netmilk-logo.svg",
          "sameAs": [
            "https://github.com/enuzzo/prtcl"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://prtcl.es/#website",
          "name": "PRTCL",
          "url": "https://prtcl.es",
          "publisher": {
            "@id": "https://prtcl.es/#org"
          },
          "inLanguage": "en"
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://prtcl.es/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://prtcl.es/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Editor",
              "item": "https://prtcl.es/create"
            }
          ]
        }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Notes on meta tags

- **Title**: 42 chars. "PRTCL" brand + primary keyword "GPU Particle Effects Editor" + "Free" as a differentiator.
- **Description**: 136 chars. Hits main intent keywords: create, customize, export, GPU-accelerated, free, open-source, browser.
- **Canonical**: Always trailing slash on root. Prevents duplicate indexing of `prtcl.es` vs `prtcl.es/`.
- **og:image**: Must be a real PNG at 1200x630px placed in `public/og-image.png`. See Section 6.
- **twitter:card**: `summary_large_image` for maximum visual real estate in shares.
- **theme-color**: Matches `--color-bg: #08040E` for browser chrome consistency.

---

## 2. STRUCTURED DATA (JSON-LD)

The full JSON-LD is embedded in the `index.html` above. Here is each schema explained:

### WebApplication

The primary schema. Google uses this for rich results when people search for tools. Key fields:

| Field | Value | Why |
|---|---|---|
| `applicationCategory` | `DesignApplication` | Maps to schema.org standard category. Alternatives: `MultimediaApplication` |
| `operatingSystem` | `Web Browser` | Signals it is a web app, not a native download |
| `browserRequirements` | `Requires WebGL 2.0 support` | Honest system requirements |
| `offers.price` | `0` | Triggers "Free" badge in search results |
| `isAccessibleForFree` | `true` | Reinforces free access |
| `license` | MIT URL | Signals open source |
| `featureList` | Array of capabilities | Can appear in knowledge panels |

### Organization (Netmilk Studio)

Minimal org schema. Referenced by the WebApplication via `creator`. Add `sameAs` links to social profiles as they are created.

### BreadcrumbList

Two levels: Home > Editor. Google displays these as clickable breadcrumbs in search results instead of the raw URL.

### Validation

After deploying, validate at:
- https://search.google.com/test/rich-results
- https://validator.schema.org/

---

## 3. SEMANTIC HTML STRUCTURE

### Landing page component skeleton

```tsx
// src/pages/LandingPage.tsx

export function LandingPage() {
  return (
    <>
      {/* Skip to main content — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                   focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg
                   focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      <header role="banner">
        <nav aria-label="Main navigation">
          {/* Logo, nav links */}
          <a href="/" aria-label="PRTCL home">
            {/* Logo SVG with role="img" and aria-hidden on decorative elements */}
          </a>
          <ul role="list">
            <li><a href="/create">Editor</a></li>
            <li><a href="https://github.com/enuzzo/prtcl">GitHub</a></li>
          </ul>
        </nav>
      </header>

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section aria-labelledby="hero-heading">
          <h1 id="hero-heading">
            GPU Particle Effects for Any Website
          </h1>
          <p>
            Create, customize, and export stunning particle animations.
            Free, open-source, zero accounts.
          </p>
          <a href="/create" role="button">
            Open Editor
          </a>
        </section>

        {/* Features Section */}
        <section aria-labelledby="features-heading">
          <h2 id="features-heading">Features</h2>

          <div role="list">
            <article role="listitem">
              <h3>Real-Time Editor</h3>
              <p>Tweak every parameter live. See changes instantly.</p>
            </article>
            <article role="listitem">
              <h3>One-Click Export</h3>
              <p>HTML, React, or iframe. Copy-paste into any site builder.</p>
            </article>
            {/* ... more feature cards */}
          </div>
        </section>

        {/* Showcase / Demo Section */}
        <section aria-labelledby="showcase-heading">
          <h2 id="showcase-heading">See It in Action</h2>
          {/* Lazy-loaded iframe demos or static screenshots */}
        </section>

        {/* How It Works */}
        <section aria-labelledby="how-heading">
          <h2 id="how-heading">How It Works</h2>
          <ol>
            <li>
              <h3>Pick an Effect</h3>
              <p>Choose from 17+ GPU-accelerated presets.</p>
            </li>
            <li>
              <h3>Customize</h3>
              <p>Adjust colors, speed, density, and more.</p>
            </li>
            <li>
              <h3>Export</h3>
              <p>Copy the code. Paste into your website. Done.</p>
            </li>
          </ol>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-heading">
          <h2 id="cta-heading">Start Creating</h2>
          <a href="/create" role="button">
            Launch PRTCL Editor
          </a>
        </section>
      </main>

      <footer role="contentinfo">
        <p>&copy; 2026 Netmilk Studio. MIT License.</p>
        <nav aria-label="Footer navigation">
          <a href="https://github.com/enuzzo/prtcl">GitHub</a>
        </nav>
      </footer>
    </>
  )
}
```

### Heading hierarchy rules

- Exactly **one `<h1>`** per page. Landing: product tagline. Editor: "PRTCL Editor" (can be visually hidden).
- `<h2>` for each major section.
- `<h3>` for subsections/feature cards.
- Never skip levels (no h1 -> h3).

### ARIA checklist

| Element | Attribute | Purpose |
|---|---|---|
| `<nav>` | `aria-label="Main navigation"` | Distinguishes from footer nav |
| `<section>` | `aria-labelledby="heading-id"` | Announces section purpose |
| Interactive buttons | `aria-label` if icon-only | Screen reader text for icon buttons |
| Canvas/WebGL | `role="img"` + `aria-label` | Particle canvas is decorative or described |
| Modals | `role="dialog"` + `aria-modal="true"` | Trap focus, announce dialog |
| Loading states | `aria-live="polite"` | Announce dynamic content changes |

### Tailwind `sr-only` for skip link

Tailwind 4 includes `sr-only` by default. The skip link uses `sr-only` + `focus:not-sr-only` so it only appears on keyboard focus.

---

## 4. LIGHTHOUSE 100 CHECKLIST

### 4A. Performance (Target: 100)

#### Core Web Vitals targets

| Metric | Good | Target |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | < 1.5s |
| FID / INP (Interaction to Next Paint) | < 100ms | < 50ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0 |

#### Code splitting strategy (critical for SPA)

```ts
// src/App.tsx — lazy load everything except the landing page

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'

// Heavy routes loaded on demand
const EditorLayout = lazy(() => import('./editor/EditorLayout').then(m => ({ default: m.EditorLayout })))
const EmbedView = lazy(() => import('./embed/EmbedView').then(m => ({ default: m.EmbedView })))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={
          <Suspense fallback={<LoadingScreen />}>
            <EditorLayout />
          </Suspense>
        } />
        <Route path="/embed" element={
          <Suspense fallback={null}>
            <EmbedView />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

**Why this matters**: The landing page must NOT load Three.js, React Three Fiber, Tweakpane, MediaPipe, or any editor code. With `lazy()`, Vite automatically code-splits these into separate chunks. The landing page bundle should be under 50KB gzipped (React + React Router + Tailwind CSS + landing page component).

#### Vite build optimization

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Isolate Three.js ecosystem (~600KB) into its own chunk
          'three': ['three'],
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          // Tweakpane separate (~40KB)
          'tweakpane': ['tweakpane'],
          // MediaPipe separate (~loaded lazily anyway)
          'mediapipe': ['@mediapipe/hands'],
        }
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers only (smaller output)
    target: 'es2022',
    // Increase chunk size warning (Three.js is large, that is expected)
    chunkSizeWarningLimit: 700,
  },
})
```

#### Font loading optimization

Current `src/index.css` already has `font-display: swap` -- good. Additional optimizations:

```html
<!-- In index.html <head> — preload the critical font -->
<link rel="preload"
      href="/fonts/InconsolataNerdFontMono-Regular.ttf"
      as="font"
      type="font/truetype"
      crossorigin />
```

For Google Fonts (loaded only for text effects), the lazy loading via `font-loader.ts` is already correct. No changes needed.

#### Image optimization

For the landing page:
- **og-image.png**: 1200x630, compress to < 100KB. Use WebP with PNG fallback.
- **Screenshots/demos**: Use `<picture>` with WebP + AVIF sources.
- **All images**: Include explicit `width` and `height` attributes to prevent CLS.
- **Below-fold images**: Add `loading="lazy"` and `decoding="async"`.

```html
<picture>
  <source srcset="/img/demo-fractal.avif" type="image/avif" />
  <source srcset="/img/demo-fractal.webp" type="image/webp" />
  <img
    src="/img/demo-fractal.png"
    alt="Fractal Frequency particle effect with 20,000 glowing particles"
    width="600"
    height="400"
    loading="lazy"
    decoding="async"
  />
</picture>
```

#### Critical rendering path

1. **Inline critical CSS**: Vite with Tailwind CSS 4 already tree-shakes unused styles. For the landing page, the CSS footprint will be minimal. If needed, use `vite-plugin-critical` to inline above-the-fold CSS.
2. **Defer non-critical JS**: The `type="module"` on the script tag already defers execution.
3. **No render-blocking resources**: The font preload + `font-display: swap` ensures text renders immediately with fallback.

#### Things that kill Lighthouse Performance

| Mistake | Fix |
|---|---|
| Loading Three.js on landing page | Code splitting with `lazy()` |
| Uncompressed images | WebP/AVIF + explicit dimensions |
| Render-blocking CSS | Vite CSS code splitting |
| Large unused JS | `manualChunks` to isolate heavy deps |
| No font preload | `<link rel="preload">` for Inconsolata |
| Layout shifts from late-loading content | Reserve space with explicit dimensions, use CSS `aspect-ratio` |
| Unoptimized animations | Use `transform` and `opacity` only (GPU composited). Never animate `width`, `height`, `top`, `left` |

### 4B. Accessibility (Target: 100)

| Requirement | Implementation |
|---|---|
| Skip-to-content link | See Section 3 skeleton |
| Color contrast ratio >= 4.5:1 | `#F9F4FF` on `#08040E` = 17.7:1 (excellent). `#A98ED1` on `#08040E` = 6.2:1 (passes AA). `#FF2BD6` on `#08040E` = 5.8:1 (passes AA). |
| All images have alt text | Every `<img>` needs descriptive `alt`. Decorative images: `alt=""` + `aria-hidden="true"` |
| Form labels | Any input needs `<label>` or `aria-label` |
| Focus indicators visible | Tailwind `focus-visible:ring-2 focus-visible:ring-accent2` on all interactive elements |
| Keyboard navigation works | Tab order follows visual order. Modals trap focus. |
| Language attribute | `<html lang="en">` (already present) |
| Valid heading hierarchy | See Section 3 |
| Touch targets >= 48x48px on mobile | Ensure buttons/links have `min-h-12 min-w-12` or equivalent padding |
| No auto-playing media | Audio/video must require user interaction (already the case) |
| Reduced motion | Respect `prefers-reduced-motion`: |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4C. Best Practices (Target: 100)

| Requirement | Status / Action |
|---|---|
| HTTPS | SiteGround provides free SSL. Ensure all resources use `https://` |
| No mixed content | Audit all CDN URLs (Three.js v0.170.0 in exports uses `https://`) |
| No `document.write()` | Not used |
| No deprecated APIs | Check: `event.returnValue`, synchronous XHR — not used |
| No browser errors in console | Test: no 404s, no CORS errors, no JS exceptions |
| Images have correct aspect ratio | Use CSS `aspect-ratio` or explicit `width`/`height` |
| Served with HTTP/2 | SiteGround supports HTTP/2 by default |
| CSP header (recommended) | Add via `.htaccess` (see below) |
| No vulnerable JS libraries | Run `npm audit` regularly |
| Permissions policy | Add header to restrict unused APIs |

#### Security headers for `.htaccess`

```apache
# Add to public/.htaccess

# Content Security Policy
<IfModule mod_headers.c>
  # CSP — restrictive but allows Three.js CDN for exports
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; media-src 'self' blob:; worker-src 'self' blob:; frame-src 'self'"

  # Prevent clickjacking
  Header set X-Frame-Options "SAMEORIGIN"

  # Prevent MIME sniffing
  Header set X-Content-Type-Options "nosniff"

  # Referrer policy
  Header set Referrer-Policy "strict-origin-when-cross-origin"

  # Permissions policy — disable unused browser features
  Header set Permissions-Policy "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()"
</IfModule>
```

**Note on `unsafe-eval`**: Required because the effect compiler uses `new Function()`. This is documented and sandboxed in `src/engine/compiler.ts`. The CSP allows it only for `'self'` origin scripts.

### 4D. SEO (Target: 100)

| Requirement | Implementation |
|---|---|
| `<title>` present and descriptive | "PRTCL -- Free GPU Particle Effects Editor" (42 chars) |
| `<meta name="description">` | 136 chars (see Section 1) |
| `<html lang="en">` | Already present |
| `<meta name="viewport">` | Already present |
| Canonical URL | `<link rel="canonical" href="https://prtcl.es/">` |
| `robots.txt` valid | See Section 7 |
| `sitemap.xml` present | See Section 7 |
| Status codes correct | 200 for valid pages, 404 for invalid |
| Links are crawlable | Use `<a href>` not `onClick` navigation for main links |
| Text is readable (font-size >= 12px) | Ensure body text is 14-16px minimum |
| Tap targets appropriately sized | >= 48px on mobile |
| No `noindex` on pages you want indexed | Only `/embed` should have `noindex` |
| Structured data valid | Validate with Google Rich Results Test |
| hreflang (if multilingual) | Not needed for v1 (English only) |

#### SPA-specific SEO considerations

React SPAs have a fundamental problem: the initial HTML is empty (`<div id="root"></div>`). Googlebot can render JavaScript, but:

1. **Pre-render the landing page**: Use `vite-plugin-ssr` or generate static HTML for `/` at build time. Alternative: use a lightweight SSR approach.

2. **Minimum viable approach** (recommended for v1): Since the landing page is largely static content, consider rendering it as a separate static HTML file or using Vite's multi-page setup:

```ts
// vite.config.ts — multi-page app approach
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        // If using a separate static landing page:
        // landing: 'landing.html',
      }
    }
  }
})
```

3. **Meta tags in `index.html` matter**: Since the landing page shares `index.html`, the meta tags there are what crawlers see first. This is why the complete meta set in Section 1 goes in `index.html` directly.

4. **Dynamic meta for `/create`**: If you want different meta for the editor page, use `react-helmet-async` or manually update `document.title` in the EditorLayout component:

```ts
// In EditorLayout.tsx useEffect
useEffect(() => {
  document.title = 'PRTCL Editor — Create Particle Effects'
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', 'Real-time GPU particle effects editor with 17+ presets. Export to HTML, React, or iframe.')
}, [])
```

---

## 5. FAVICONS + APPLE TOUCH ICON + WEB APP MANIFEST

### Required files in `public/`

Generate from a source SVG or high-res PNG of the PRTCL logo. Use https://realfavicongenerator.net/ or create manually:

| File | Size | Format | Purpose |
|---|---|---|---|
| `favicon.svg` | vector | SVG | Modern browsers (Chrome, Firefox, Edge) |
| `favicon-32x32.png` | 32x32 | PNG | Legacy browsers |
| `favicon-16x16.png` | 16x16 | PNG | Tab icon fallback |
| `apple-touch-icon.png` | 180x180 | PNG | iOS home screen |
| `favicon.ico` | 48x48 | ICO | Ultimate fallback (IE, some crawlers) |
| `android-chrome-192x192.png` | 192x192 | PNG | Android home screen |
| `android-chrome-512x512.png` | 512x512 | PNG | Android splash screen |
| `og-image.png` | 1200x630 | PNG | Social sharing (see Section 6) |

### `favicon.svg` with dark mode support

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    rect { fill: #08040E; }
    text { fill: #FF2BD6; font-family: monospace; font-size: 18px; font-weight: bold; }
    @media (prefers-color-scheme: light) {
      rect { fill: #F9F4FF; }
      text { fill: #FF2BD6; }
    }
  </style>
  <rect width="32" height="32" rx="6" />
  <text x="50%" y="55%" dominant-baseline="central" text-anchor="middle">P</text>
</svg>
```

### Web App Manifest

Create `public/site.webmanifest`:

```json
{
  "name": "PRTCL — Particle Effects Editor",
  "short_name": "PRTCL",
  "description": "Create, customize, and export GPU-accelerated particle effects.",
  "start_url": "/create",
  "display": "standalone",
  "background_color": "#08040E",
  "theme_color": "#08040E",
  "orientation": "any",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["design", "developer tools", "graphics"],
  "screenshots": [
    {
      "src": "/img/screenshot-editor.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "PRTCL particle effects editor"
    }
  ]
}
```

---

## 6. SOCIAL SHARING

### og:image specifications

| Platform | Recommended Size | Aspect Ratio | Max File Size |
|---|---|---|---|
| Facebook/Open Graph | 1200 x 630 | 1.91:1 | < 8MB (aim for < 100KB) |
| Twitter (summary_large_image) | 1200 x 628 | 2:1 (approx) | < 5MB |
| LinkedIn | 1200 x 627 | 1.91:1 | < 5MB |
| WhatsApp | 1200 x 630 | 1.91:1 | < 5MB |

**Create one image at 1200x630** and it works everywhere.

### og:image design recommendations

- Dark background (#08040E) matching the PRTCL theme
- PRTCL logo/wordmark prominently displayed
- Screenshot or render of a particle effect (Fractal Frequency is the default/hero)
- Accent color highlights (#FF2BD6 pink, #7CFF00 lime)
- Text: "PRTCL" + "Free GPU Particle Effects" or similar tagline
- No text in the outer 10% margins (gets cropped on some platforms)

### Twitter Card

Use `summary_large_image` (already set in Section 1). This shows a large preview image in the tweet, which is significantly more engaging than `summary` (small thumbnail).

### Debugging social previews

- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator (or just tweet the URL)
- **LinkedIn**: https://www.linkedin.com/post-inspector/

---

## 7. SITEMAP + ROBOTS

### `public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /embed

Sitemap: https://prtcl.es/sitemap.xml
```

**Notes**:
- `/embed` is disallowed because it is a stripped-down iframe target, not a user-facing page.
- No need to disallow `/create` -- it is the main product page and should be indexed.

### `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/svg"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://prtcl.es/</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://prtcl.es/create</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

**Note**: The `xmlns` should actually be `http://www.sitemaps.org/schemas/sitemap/0.9` -- see corrected version below:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://prtcl.es/</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://prtcl.es/create</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

### Google Search Console

After deploying:
1. Verify ownership via DNS TXT record or HTML file upload
2. Submit sitemap URL
3. Request indexing for `/` and `/create`

---

## 8. PERFORMANCE PATTERNS FOR REACT SPA LANDING PAGES

### 8A. Preventing Three.js from loading on the landing page

This is the single most important optimization. Three.js + R3F + drei is roughly 600-800KB minified. It must not load on `/`.

**Strategy: Route-level code splitting with React.lazy**

```tsx
// src/App.tsx

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'

// These imports are deferred — Vite creates separate chunks
const EditorLayout = lazy(() =>
  import('./editor/EditorLayout').then(m => ({ default: m.EditorLayout }))
)
const EmbedView = lazy(() =>
  import('./embed/EmbedView').then(m => ({ default: m.EmbedView }))
)
const SplashScreen = lazy(() =>
  import('./components/SplashScreen').then(m => ({ default: m.SplashScreen }))
)

function EditorRoute() {
  // Splash + editor logic stays here, but only loads when navigating to /create
  return (
    <Suspense fallback={<EditorLoadingScreen />}>
      <EditorWithSplash />
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — lightweight, no Three.js */}
        <Route path="/" element={<LandingPage />} />

        {/* Editor — heavy, lazy loaded */}
        <Route path="/create" element={<EditorRoute />} />

        {/* Embed — lazy loaded */}
        <Route path="/embed" element={
          <Suspense fallback={null}>
            <EmbedView />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

**Verify isolation**: After building, run `npx vite build` and check the `dist/assets/` output. You should see separate chunks:
- `index-[hash].js` — tiny (React + Router + Landing page)
- `EditorLayout-[hash].js` — large (editor code)
- `three-[hash].js` — Three.js (from manualChunks)
- `r3f-[hash].js` — R3F + drei

### 8B. Landing page effect showcase (without loading Three.js)

For showing particle effects on the landing page without importing Three.js:

**Option A: Static screenshots/videos (recommended for Lighthouse 100)**

```tsx
// Lightweight showcase with lazy-loaded video
function EffectShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {effects.map(effect => (
        <div key={effect.id} className="aspect-video relative rounded-lg overflow-hidden">
          <picture>
            <source srcset={`/img/effects/${effect.id}.avif`} type="image/avif" />
            <source srcset={`/img/effects/${effect.id}.webp`} type="image/webp" />
            <img
              src={`/img/effects/${effect.id}.jpg`}
              alt={effect.description}
              width={600}
              height={338}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </picture>
        </div>
      ))}
    </div>
  )
}
```

**Option B: Embedded iframes (lazy-loaded)**

Use the existing `/embed` route with `loading="lazy"` on the iframe:

```tsx
function LiveDemo({ effectId }: { effectId: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { rootMargin: '200px' } // Start loading 200px before viewport
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="aspect-video rounded-lg overflow-hidden bg-surface">
      {isVisible ? (
        <iframe
          src={`/embed?effect=${effectId}&ar=1`}
          title={`${effectId} particle effect demo`}
          className="w-full h-full border-0"
          loading="lazy"
          allow="autoplay"
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-elevated" />
      )}
    </div>
  )
}
```

**Option C: Canvas 2D hero animation (lightweight)**

Repurpose the SplashScreen's Canvas 2D particle system for a lightweight hero background. Canvas 2D has zero dependency on Three.js:

```tsx
// src/pages/HeroParticles.tsx — Canvas 2D, ~3KB, no Three.js
function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    // Simple 2D particle loop — similar to SplashScreen
    // ... (lightweight Canvas 2D implementation)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      role="img"
      aria-label="Animated particle background"
    />
  )
}
```

### 8C. Font display strategy

Current setup is already good (`font-display: swap` in `src/index.css`). Additional recommendations:

```css
/* In src/index.css — add fallback font metrics to minimize CLS */
@font-face {
  font-family: "Inconsolata";
  src: url("/fonts/InconsolataNerdFontMono-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  /* size-adjust helps match fallback metrics to reduce CLS */
  size-adjust: 100%;
}
```

For the landing page specifically, since Inconsolata is a monospace font and the fallback (`JetBrains Mono`, `monospace`) has similar metrics, CLS from font swap should be minimal.

**Do NOT load Google Fonts on the landing page**. They are only needed for text effects in the editor. The lazy loading in `src/text/font-loader.ts` already handles this correctly.

### 8D. Preconnect and preload recommendations

```html
<!-- Already in Section 1's index.html, but explained here -->

<!-- Preconnect: establish early connections to origins you WILL use -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload: fetch critical resources ASAP -->
<link rel="preload" href="/fonts/InconsolataNerdFontMono-Regular.ttf" as="font" type="font/truetype" crossorigin />
```

**Do NOT preload**:
- Three.js CDN (only needed in editor, loaded on demand)
- Google Fonts CSS (only needed for text effects)
- Effect preset code (loaded with editor chunk)

### 8E. SiteGround / Apache performance headers

Add to `public/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # SPA fallback — serve index.html for all non-file routes
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [QSA,L]
</IfModule>

# --- Compression ---
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# --- Caching ---
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML — short cache (SPA shell changes on deploy)
  ExpiresByType text/html "access plus 1 hour"

  # CSS/JS with content hash — aggressive cache
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"

  # Fonts — long cache
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"

  # Images — long cache
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"

  # JSON (manifests) — medium cache
  ExpiresByType application/json "access plus 1 week"
  ExpiresByType application/manifest+json "access plus 1 week"
</IfModule>

# --- Security Headers ---
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()"

  # Cache-Control for hashed assets (Vite adds content hash to filenames)
  <FilesMatch "\.[0-9a-f]{8}\.(js|css|woff2|ttf)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # No cache for HTML (always get fresh SPA shell)
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
</IfModule>

# --- MIME Types ---
<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
  AddType image/avif .avif
  AddType image/webp .webp
  AddType font/woff2 .woff2
</IfModule>
```

### 8F. Embed route meta (noindex)

For the `/embed` route, add a noindex meta tag dynamically:

```tsx
// In src/embed/EmbedView.tsx
useEffect(() => {
  // Prevent search engines from indexing the bare embed view
  let meta = document.querySelector('meta[name="robots"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', 'noindex, nofollow')

  return () => {
    // Restore default robots on unmount
    meta?.setAttribute('content', 'index, follow')
  }
}, [])
```

---

## 9. COMPLETE FILE CHECKLIST

Files to create/update in `public/`:

| File | Status | Action |
|---|---|---|
| `favicon.svg` | Missing | Create (see Section 5) |
| `favicon-32x32.png` | Missing | Generate from SVG |
| `favicon-16x16.png` | Missing | Generate from SVG |
| `favicon.ico` | Missing | Generate from SVG |
| `apple-touch-icon.png` | Missing | Generate 180x180 from SVG |
| `android-chrome-192x192.png` | Missing | Generate |
| `android-chrome-512x512.png` | Missing | Generate |
| `site.webmanifest` | Missing | Create (see Section 5) |
| `og-image.png` | Missing | Design + create (1200x630) |
| `robots.txt` | Missing | Create (see Section 7) |
| `sitemap.xml` | Missing | Create (see Section 7) |
| `.htaccess` | Exists | Update with caching + security headers |

Files to update in `src/`:

| File | Action |
|---|---|
| `index.html` (root) | Replace `<head>` with complete meta set |
| `vite.config.ts` | Add `manualChunks` and build optimizations |
| `src/App.tsx` | Add code splitting with `lazy()`, separate landing route |
| `src/index.css` | Add `prefers-reduced-motion` media query |
| `src/embed/EmbedView.tsx` | Add noindex meta tag |

---

## 10. QUICK VALIDATION COMMANDS

```bash
# Build and analyze bundle size
npm run build && npx vite-bundle-visualizer

# Run Lighthouse locally (install if needed: npm i -g lighthouse)
lighthouse https://prtcl.es --output=html --output-path=./lighthouse-report.html

# Validate HTML
npx html-validate dist/index.html

# Check structured data
# Visit: https://search.google.com/test/rich-results
# Paste: https://prtcl.es/

# Test social cards
# Visit: https://developers.facebook.com/tools/debug/
# Visit: https://cards-dev.twitter.com/validator

# Audit for accessibility
npx axe-core dist/index.html

# Check robots.txt
curl https://prtcl.es/robots.txt

# Verify sitemap
curl https://prtcl.es/sitemap.xml
```

---

## 11. PRIORITY ORDER FOR IMPLEMENTATION

1. **index.html meta tags** — immediate SEO impact, 5 minutes
2. **robots.txt + sitemap.xml** — required for crawling, 2 minutes
3. **Favicon set + manifest** — brand presence in tabs/bookmarks, 30 minutes
4. **Code splitting (lazy routes)** — biggest performance win, 1 hour
5. **vite.config.ts build optimization** — chunk isolation, 15 minutes
6. **.htaccess caching + headers** — performance + security, 15 minutes
7. **og:image creation** — social sharing, 1 hour (design time)
8. **Landing page semantic HTML** — accessibility + SEO, part of Phase 4
9. **JSON-LD structured data** — rich results, already in index.html from step 1
10. **prefers-reduced-motion** — accessibility polish, 5 minutes
