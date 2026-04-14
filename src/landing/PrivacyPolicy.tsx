import { LandingNav } from './LandingNav'
import { LandingFooter } from './LandingFooter'

const LAST_UPDATED = 'April 15, 2026'

export function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <LandingNav />
      <main className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">Privacy Policy</h1>
        <p className="text-text-muted text-xs uppercase tracking-[0.2em] mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="Who we are">
          <p>
            <strong className="text-text">PRTCL</strong> (
            <a href="https://prtcl.es" className="text-accent2 hover:underline">
              prtcl.es
            </a>
            ) is operated by <strong className="text-text">Netmilk Studio sagl</strong>, the data
            controller for any personal data processed via this website.
          </p>
          <p>
            For privacy-related requests, contact us at{' '}
            <a href="mailto:privacy@netmilk.studio" className="text-accent2 hover:underline">
              privacy@netmilk.studio
            </a>{' '}
            or open an issue at{' '}
            <a
              href="https://github.com/enuzzo/prtcl/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              github.com/enuzzo/prtcl/issues
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            We use <strong className="text-text">Google Analytics 4</strong> to understand how
            visitors use PRTCL — which effects are popular, which features people try, where
            visitors come from. Specifically, we collect:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-text-secondary">
            <li>Pages visited and time spent on each</li>
            <li>Anonymized IP address (last octet stripped before storage)</li>
            <li>Browser, operating system, device type</li>
            <li>Referrer (the page you came from)</li>
            <li>An anonymous identifier (cookie) used to distinguish unique visitors</li>
          </ul>
          <p>
            We <strong className="text-text">do not</strong> collect names, email addresses,
            payment data, or any directly identifying information. We do not sell data, run ads,
            or share data with advertisers. PRTCL has no user accounts.
          </p>
        </Section>

        <Section title="Legal basis">
          <p>
            We process analytics data on the basis of your <strong className="text-text">consent</strong>{' '}
            (Art. 6(1)(a) GDPR), collected via the cookie banner shown on your first visit. You can
            withdraw consent at any time (see &ldquo;Your rights&rdquo; below).
          </p>
          <p>
            Until you grant consent, Google Analytics operates in &ldquo;cookieless mode&rdquo; via{' '}
            <a
              href="https://support.google.com/analytics/answer/9976101"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              Google Consent Mode v2
            </a>
            : no cookies are set, and only aggregated, non-identifying signals are sent.
          </p>
        </Section>

        <Section title="Cookies we use">
          <p>Only after you click &ldquo;Accept&rdquo; on the cookie banner:</p>
          <ul className="list-disc pl-6 space-y-1 text-text-secondary">
            <li>
              <code className="text-accent">_ga</code> — Google Analytics, distinguishes unique
              visitors. Lifetime: 2 years.
            </li>
            <li>
              <code className="text-accent">_ga_SF2G49TH7J</code> — Google Analytics, persists
              session state for our specific property. Lifetime: 2 years.
            </li>
          </ul>
          <p>
            We also use one <strong className="text-text">technical cookie</strong>:{' '}
            <code className="text-accent">prtcl-consent</code> in localStorage, which records your
            consent decision so the banner does not reappear on every visit. This is exempt from
            consent under GDPR Art. 5(3) ePrivacy.
          </p>
        </Section>

        <Section title="Third parties">
          <p>
            Google Analytics is operated by <strong className="text-text">Google Ireland Limited</strong>.
            Data may be transferred to the United States under the{' '}
            <a
              href="https://commission.europa.eu/document/fa09cbad-dd7d-4684-ae60-be03fcb0fddf_en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              EU-US Data Privacy Framework
            </a>
            . Google&apos;s privacy policy:{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              policies.google.com/privacy
            </a>
            .
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Analytics data is retained for <strong className="text-text">14 months</strong> in
            Google Analytics, then automatically deleted. Aggregated reports may be kept longer.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-text-secondary">
            <li>Access the data we hold about you</li>
            <li>Request correction or deletion</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>
              <strong className="text-text">Withdraw consent</strong> at any time — click{' '}
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('prtcl-consent')
                  } catch {
                    /* ignore */
                  }
                  window.location.reload()
                }}
                className="text-accent2 underline hover:text-accent2-hover"
              >
                here to reset cookie preferences
              </button>{' '}
              and the banner will reappear.
            </li>
            <li>
              Lodge a complaint with a supervisory authority (e.g.{' '}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent2 hover:underline"
              >
                Garante Privacy
              </a>{' '}
              in Italy)
            </li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@netmilk.studio" className="text-accent2 hover:underline">
              privacy@netmilk.studio
            </a>
            . We respond within 30 days.
          </p>
        </Section>

        <Section title="Embeds on third-party sites">
          <p>
            PRTCL provides <code className="text-accent">/embed</code> snippets that other websites
            can include via <code className="text-accent">&lt;iframe&gt;</code>. These embeds do{' '}
            <strong className="text-text">not</strong> trigger our cookie banner — visitors of
            those host sites are subject to the host site&apos;s own privacy policy. We do not
            track visitors via embeds when they have not given consent on prtcl.es directly.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy; the &ldquo;Last updated&rdquo; date at the top will reflect
            the change. Material changes will be announced on{' '}
            <a
              href="https://github.com/enuzzo/prtcl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              our GitHub
            </a>
            .
          </p>
        </Section>
      </main>
      <LandingFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl md:text-2xl font-semibold text-text mb-4">{title}</h2>
      <div className="space-y-3 text-sm md:text-base text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  )
}
