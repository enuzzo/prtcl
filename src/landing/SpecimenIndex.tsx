/**
 * Specimen Index — the full catalog of all 22 effects as a lab-register
 * table. Pure static HTML: no Three.js, no iframes, no images. Every row
 * deep-links into the editor. SEO eats this up; Lighthouse doesn't notice it.
 */

interface Specimen {
  id: string
  name: string
  cls: 'math' | 'organic' | 'text' | 'abstract'
  particles: string
  note: string
}

const SPECIMENS: Specimen[] = [
  { id: 'frequency', name: 'Fractal Frequency', cls: 'math', particles: '24,000', note: 'Pulses whether you deserve it or not.' },
  { id: 'hopf-fibration', name: 'Hopf Fibration', cls: 'math', particles: '17,000', note: '4D topology with courier comets.' },
  { id: 'clifford-torus', name: '4D Clifford Torus', cls: 'math', particles: '23,000', note: 'Six rotation planes. You were issued three.' },
  { id: 'electromagnetic', name: 'Electromagnetic Field', cls: 'math', particles: '20,000', note: 'Maxwell, but make it neon.' },
  { id: 'perlin-noise', name: 'Perlin Noise', cls: 'math', particles: '12,000', note: 'An Academy Award-winning noise function.' },
  { id: 'hyperflower', name: 'Hyperflower', cls: 'math', particles: '23,000', note: 'Botany by spherical harmonics.' },
  { id: 'nebula-organica', name: 'Nebula Organica', cls: 'organic', particles: '26,000', note: 'Now with anatomy: filaments, star nurseries.' },
  { id: 'inside-nebula', name: 'Inside Nebula', cls: 'organic', particles: 'raymarched', note: 'You are inside it. It knows.' },
  { id: 'storm', name: 'Cumulonimbus Storm', cls: 'organic', particles: '16,000', note: 'Weather, indoors, on purpose.' },
  { id: 'fireflies', name: 'Fireflies', cls: 'organic', particles: '12,000', note: 'Synchronized lanterns. No survival instinct.' },
  { id: 'murmuration', name: 'Murmuration', cls: 'organic', particles: '16,000', note: 'Three rules, one emergent hallucination.' },
  { id: 'text-wave', name: 'Text Wave', cls: 'text', particles: '15,000', note: 'Your words, surfing trigonometry.' },
  { id: 'text-scatter', name: 'Text Scatter', cls: 'text', particles: '14,000', note: 'Dramatic disintegration, casual reform.' },
  { id: 'text-dissolve', name: 'Text Dissolve', cls: 'text', particles: '16,000', note: 'Separation anxiety, particle edition.' },
  { id: 'text-terrain', name: 'Text Terrain', cls: 'text', particles: '27,000', note: 'Typographic snowfall on a living landscape.' },
  { id: 'starfield', name: 'Starfield', cls: 'abstract', particles: '18,000', note: "1984's best trick, now with skid marks." },
  { id: 'black-hole', name: 'Black Hole', cls: 'abstract', particles: '100,000', note: 'Physics-adjacent. GPU-hostile.' },
  { id: 'axiom', name: 'Axiom', cls: 'abstract', particles: '37,000', note: 'Gradient descent dressed as philosophy.' },
  { id: 'paper-fleet', name: 'Paper Fleet', cls: 'abstract', particles: '10,000', note: 'Now banking into turns. Still unsupervised.' },
  { id: 'iridescence', name: 'Iridescence', cls: 'abstract', particles: 'shader', note: 'Liquid dimensions folding into themselves.' },
  { id: 'the-spirit', name: 'The Spirit', cls: 'abstract', particles: 'GPGPU', note: "Edan Kwan's apparition. Still refuses to calm down." },
  { id: 'volumetric-flow', name: 'Volumetric Flow', cls: 'abstract', particles: '131,072', note: "David Li's plume. Surprisingly convincing." },
]

const CLS_COLOR: Record<Specimen['cls'], string> = {
  math: 'text-accent',
  organic: 'text-accent2',
  text: 'text-info',
  abstract: 'text-warning',
}

export function SpecimenIndex() {
  return (
    <section
      className="relative py-24 md:py-32 px-6 md:px-10 bg-bg/90 backdrop-blur-sm overflow-hidden"
      aria-labelledby="index-heading"
    >
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section meta header */}
        <div className="flex items-baseline gap-3 text-[11px] tracking-[0.25em] uppercase text-text-muted mb-6">
          <span className="inline-block w-1.5 h-1.5 bg-warning translate-y-[1px]" aria-hidden="true" />
          <span className="text-warning">§ 04</span>
          <span className="opacity-40">·</span>
          <span>Full register</span>
          <span className="opacity-40 ml-auto hidden md:inline">rev. 0.10.0</span>
        </div>

        <h2
          id="index-heading"
          className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95] mb-4"
        >
          The complete index.
        </h2>
        <p className="text-text-muted text-xl md:text-2xl tracking-tight mb-12 md:mb-16">
          Every specimen, catalogued and mildly insulted.
        </p>

        {/* Column headers */}
        <div
          className="
            grid grid-cols-[64px_1fr_84px] sm:grid-cols-[72px_1.2fr_90px_90px] lg:grid-cols-[80px_1.1fr_100px_100px_1.4fr]
            gap-x-4 px-3 pb-3 border-b border-border
            text-[10px] tracking-[0.3em] uppercase text-text-muted
          "
          aria-hidden="true"
        >
          <span>Ref</span>
          <span>Specimen</span>
          <span className="hidden sm:block">Class</span>
          <span className="text-right">Particles</span>
          <span className="hidden lg:block">Field notes</span>
        </div>

        <ul className="divide-y divide-border/60">
          {SPECIMENS.map((s, idx) => (
            <li key={s.id}>
              <a
                href={`/create#effect=${s.id}`}
                className="
                  grid grid-cols-[64px_1fr_84px] sm:grid-cols-[72px_1.2fr_90px_90px] lg:grid-cols-[80px_1.1fr_100px_100px_1.4fr]
                  gap-x-4 items-baseline px-3 py-3
                  group hover:bg-surface/40 transition-colors duration-150
                "
              >
                <span className="text-[11px] tracking-[0.2em] text-text-muted tabular-nums group-hover:text-accent2 transition-colors duration-150">
                  {`SPC-${String(idx + 1).padStart(3, '0')}`}
                </span>
                <span className="text-sm font-bold tracking-tight text-text group-hover:text-accent2 transition-colors duration-150 truncate">
                  {s.name}
                </span>
                <span className={`hidden sm:block text-[10px] tracking-[0.2em] uppercase ${CLS_COLOR[s.cls]}`}>
                  {s.cls}
                </span>
                <span className="text-[11px] text-text-secondary tabular-nums text-right">
                  {s.particles}
                </span>
                <span className="hidden lg:block text-xs text-text-muted truncate">
                  {s.note}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[11px] text-text-muted/70 leading-relaxed">
          * Counts are factory defaults. The slider goes to 100,000. The adaptive-quality
          system will quietly protect your laptop from your ambitions.
        </p>
      </div>
    </section>
  )
}
