"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/images/logo-white.png"
      : "/images/logo-black.png"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          {mounted ? (
            <Image
              src={logoSrc}
              alt="Rent Scout"
              width={140}
              height={36}
              className="h-9 w-auto object-contain mb-6"
              priority
            />
          ) : (
            <div className="h-9 w-36 bg-muted rounded animate-pulse mb-6" />
          )}
          <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: June 19, 2026
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10 space-y-8 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Rent Scout (&quot;the Service&quot;), you agree to be bound by these
              Terms &amp; Conditions. If you do not agree to all the terms, you may not access or
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              Rent Scout is an AI-powered rental discovery platform that aggregates listings from
              various third-party sources including Facebook Marketplace, Zillow, WhatsApp groups,
              Apartments.com, Craigslist, and other platforms. The Service uses artificial
              intelligence to score, evaluate, and flag potential rental opportunities and scam risks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 18 years of age to use the Service.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. AI-Generated Content Disclaimer</h2>
            <p>
              Rent Scout uses artificial intelligence to analyse and score rental listings. AI scores,
              scam risk assessments, and recommendations are provided for informational purposes only
              and should not be relied upon as the sole basis for any rental decision. We do not
              guarantee the accuracy, completeness, or reliability of any AI-generated analysis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Third-Party Listings</h2>
            <p>
              Rent Scout aggregates listings from third-party sources. We do not own, control, or
              verify the accuracy of these listings. We are not responsible for the content,
              availability, or legitimacy of any third-party listing. Users should independently
              verify all listing information before entering into any rental agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Privacy &amp; Data Collection</h2>
            <p>
              We collect and process personal data necessary to provide the Service, including your
              email address, name, search preferences, and usage data. Your data is handled in
              accordance with our Privacy Policy. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>Using the Service for any unlawful purpose.</li>
              <li>Attempting to reverse-engineer, decompile, or disassemble the Service.</li>
              <li>Scraping, crawling, or using automated means to access the Service beyond its intended use.</li>
              <li>Interfering with or disrupting the integrity or performance of the Service.</li>
              <li>Impersonating another person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Rent Scout and its operators shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages, including but
              not limited to loss of profits, data, or goodwill, arising out of or in connection with
              your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Modifications to the Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service (or any part
              thereof) at any time, with or without notice. We shall not be liable to you or any
              third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. Any changes will be
              posted on this page with an updated revision date. Continued use of the Service after
              changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact</h2>
            <p>
              If you have any questions about these Terms &amp; Conditions, please contact us at{" "}
              <a
                href="mailto:support@rentscout.app"
                className="text-orange-500 hover:underline dark:text-orange-400"
              >
                support@rentscout.app
              </a>.
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:underline dark:text-orange-400"
          >
            <ArrowLeft className="size-3.5" />
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
