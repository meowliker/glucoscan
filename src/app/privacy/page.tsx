"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-h2 text-text-primary font-bold">
            Privacy Policy
          </h1>
        </div>

        {/* Last Updated */}
        <p className="text-caption text-text-muted mb-4">
          Last Updated: April 4, 2026
        </p>

        {/* Introduction */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Introduction
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            GlucoScan provides nutritional estimation tools to help you
            understand the potential glycemic impact of packaged foods. This
            policy explains what data is collected and how it is handled.
          </p>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Information We Collect
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">
                Scan History
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Product names and nutritional data are stored locally on your
                device in browser localStorage. This data never leaves your
                device unless you choose to clear it.
              </p>
            </div>
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">
                Blood Sugar Readings
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Temporarily stored in browser session only. Cleared when you
                close the tab. Never saved permanently.
              </p>
            </div>
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">
                What We Do Not Collect
              </h3>
              <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-1">
                <li>No personal identification information is collected</li>
                <li>
                  No data is transmitted to our servers except for AI insight
                  requests (which contain only product nutrition data, never
                  health data)
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How Data is Stored */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            How Data is Stored
          </h2>
          <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-2">
            <li>All data is stored locally on your device</li>
            <li>
              Blood sugar data uses sessionStorage only (cleared on tab close)
            </li>
            <li>
              Scan history uses localStorage (persists until you clear it)
            </li>
            <li>No cookies are used for tracking</li>
          </ul>
        </Card>

        {/* Third-Party Services */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Third-Party Services
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">
                Open Food Facts API
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Used to fetch product nutrition data. Subject to their privacy
                policy. Only product barcode or search terms are sent.
              </p>
            </div>
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">
                Claude AI API
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Product nutrition data (not health data) may be sent for
                generating insights. No personally identifiable information is
                shared.
              </p>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Your Rights
          </h2>
          <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-2">
            <li>Clear all scan history at any time through Settings</li>
            <li>
              Blood sugar data automatically clears when browser tab is closed
            </li>
            <li>No account creation required</li>
            <li>
              You have full control over your data at all times
            </li>
          </ul>
        </Card>

        {/* Data Protection */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Data Protection
          </h2>
          <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-2">
            <li>We follow data minimization principles</li>
            <li>Health data (blood sugar) is never stored permanently</li>
            <li>
              No data is sold or shared with third parties for marketing
            </li>
            <li>
              All processing occurs on your device or through encrypted API
              connections
            </li>
          </ul>
        </Card>

        {/* Contact */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Contact
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            If you have questions about this privacy policy or how your data is
            handled, please contact us through our support channels.
          </p>
        </Card>

        {/* Changes to This Policy */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Changes to This Policy
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            We may update this privacy policy from time to time. Any changes
            will be reflected on this page with an updated revision date. We
            encourage you to review this policy periodically.
          </p>
        </Card>
      </div>
    </div>
  );
}
