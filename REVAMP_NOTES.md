# PRTCL v0.10.0 "Fable" — Revamp Notes

Sessione del 2026-06-11. Revamp di tutti gli effetti + engine fix + landing.
Tutto testato: `tsc` pulito, 159/159 test verdi (incluso il nuovo test che compila
tutti i preset), build di produzione ok, smoke test visivo su tutti i 22 effetti
senza errori console.

## ⚙️ Engine

| Cosa | Dettaglio |
|---|---|
| **Fix buffer 100k** | `MAX_PARTICLES` in `ParticleSystem.tsx` era 30.000 mentre lo slider arriva a 100.000: tutto ciò che superava 30k era CPU bruciata che non renderizzava mai (Black Hole "100k" era in realtà 30k). Ora i buffer reggono 100k veri. |
| **Test di sicurezza** | Nuovo `src/test/presets.test.ts`: compila ogni preset, verifica posizioni/colori finiti su tempi+indici+estremi dei controlli, e che ogni override in `controls:` punti a un id dichiarato nel range. 66 assert. |

## ✨ Effetti — riscritti da zero

| Effetto | Cosa è cambiato |
|---|---|
| **Starfield** | Riscritto: ogni stella ora è una **scia di 6 punti** che si allunga con la velocità; **Hyperdrive Surge** periodico (integrale chiuso → niente teletrasporti); classi stellari per temperatura (blu-bianche, gialle, nane arancio, rare brillanti); strato di **polvere violacea in parallasse**; bloom. Nuovi controlli: Streak Length, Hyperdrive Surge, Star Tint. |
| **Nebula Organica** | Riscritta: **filamenti veri** via domain-warping a 2 ottave (la densità nasce dallo spostamento, non dal caso); **12 ammassi stellari** bianco-oro che brillano dentro al gas; rotazione differenziale (nucleo più veloce del bordo); **5 palette** a tendina (Orion, Carina, Lagoon, Ghost, PRTCL). |
| **Fireflies** | Riscritte: **sincronizzazione stile Kuramoto** (slider Synchrony: da caos a flash all'unisono, come le lucciole delle mangrovie); **onde di flash** che attraversano lo sciame (Flash Waves); volo Lissajous con bias verso il suolo; **nebbiolina teal** a terra; la rara lucciola blu (esistono davvero); bloom su sfondo Twilight. |

## 🔥 Effetti — potenziati

| Effetto | Cosa è cambiato |
|---|---|
| **Fractal Frequency** | **5 palette** (Spectral, Synthwave, Solar, Emerald, Glacier); **depth shading** rispetto alla camera (il lato vicino brilla, il lontano recede); **scintille bianche sulle creste** d'interferenza; bloom. Copia precompilata della landing sincronizzata. |
| **Hopf Fibration** | **Comete** che corrono lungo ogni fibra con coda esponenziale; **Sphere Drift**: la sfera base deriva e la fibrazione si rivolta lentamente su sé stessa; **4 palette** (Rainbow, PRTCL, Plasma, Aurum); bloom; camera arretrata per leggere i tori. |
| **Electromagnetic Field** | **Pacchetti di carica** bianchi che sprintano lungo le linee di campo (più veloci del flusso ambiente); **aurore ai poli** (verde a nord, viola a sud) con shimmer; inclinazione respirante del dipolo; bloom; auto-rotate 0.3. |
| **Hyperflower** | Petali più definiti (modulazione al cubo); **4 palette** (Iridescent, Orchid, Inferno, Jade) dove l'energia dei petali scolpisce luce e saturazione; bloom. |
| **Paper Fleet** | **Banking**: gli aeroplanini si inclinano in virata in proporzione alla forza centripeta, come carta vera. |

## 🎯 Effetti — ritocchi mirati

| Effetto | Cosa è cambiato |
|---|---|
| **Murmuration** | **Rotta di volo**: lo stormo percorre un circuito aereo lento e fa **bank nelle virate** (come sui tetti di Roma al tramonto). |
| **Cumulonimbus Storm** | **Double-strike**: i fulmini fanno il flicker reale (scarica + ri-scarica più debole 45ms dopo). |
| **4D Clifford Torus** | **7 comete** che si inseguono lungo l'avvolgimento del toro, code in decadimento. |
| **Black Hole** | Le stelle di sfondo brillanti ora **twinkellano** davvero. (Fisica intoccata: era appena stata riscritta in 4.12 — e ora i 100k sono 100k veri, vedi engine fix.) |
| **Text Wave** | **Onda incrociata diagonale** (interferenza angolo-angolo) + bob verticale: la superficie flette invece di restare piana. |
| **Text Dissolve** | **Ember rise**: le particelle dissolte salgono come scintille da un fuoco. |
| **Text Scatter** | Fix bug UX: il dropdown Palette mostrava i nomi delle palette di **Axiom** (id `palette` condiviso). Ora id dedicato `scatterPalette` con i nomi giusti (Aurora, PRTCL, Fire, Ocean). |

## 🧪 Integrazioni terze parti (solo dati, zero rischio sim)

| Effetto | Cosa è cambiato |
|---|---|
| **The Spirit** | **4 nuovi preset**: Ink Ritual (inchiostro su bianco osso), Sodium Ghost (ambra su indaco), Cherenkov (ciano elettrico, particelle triangolari), Acid Pop (brand lime+magenta su void). |
| **Volumetric Flow** | **2 nuovi preset**: Aurora Borealis (teal-verde, lento, ampio), Sakura Storm (petali rosa su prugna). |

## 🖥 Landing page

| Cosa | Dettaglio |
|---|---|
| **Hero** | "20,000" → **"100,000 particles. Absolutely no purpose."** (ora è vero, vedi engine fix). Spec sheet e chip versione aggiornati (PRTCL-010 · Fable v0.10.0). |
| **Nuova sezione § 04 — Specimen Index** | **Registro completo dei 22 effetti** in stile lab-notebook: REF, nome, classe, particelle, field notes sornione. Ogni riga deep-linka in `/create#effect=...`. Puro HTML statico: ~1KB gzip, zero impatto Lighthouse, oro per la SEO. |
| **Showcase** | Sostituita la card Nebula con **Electromagnetic Field** (la più fotogenica post-revamp); conteggi e descrizioni aggiornati. |
| **FeatureBento / FinalCTA** | "60fps up to 100k particles"; counter finale a **6.000.000 particelle/s**; sezioni rinumerate. |

## 📦 Versioning

- `0.9.1 Bloom` → **`0.10.0 Fable`** (version.ts, package.json, structured data in index.html).

## 🧪 Da provare quando torni

1. **Fireflies** — il revamp più riuscito secondo me: gioca con Synchrony e Flash Waves.
2. **Electromagnetic Field** — guarda i pacchetti di carica coi poli in aurora.
3. **Starfield** — alza Warp Speed a 4 e Hyperdrive Surge a 1.
4. **Black Hole a 100k** — ora sono 100k veri; lascia rampare l'adaptive quality ~15s.
5. **Hopf** — palette Aurum (oro su nero) con Sphere Drift a 1.
6. **La Specimen Index** sulla landing — scrollala, è il registro di laboratorio definitivo.

Se qualcosa non ti convince visivamente: ogni modifica è un commit atomico sul file
del preset, facilissimo da ritoccare con Copy Params + `scripts/apply-preset.mjs`.
