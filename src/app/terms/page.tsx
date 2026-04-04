"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
        </div>

        {/* Prominent Disclaimer Box */}
        <div className="bg-status-warningBg border-2 border-accent rounded-card p-4 mb-6">
          <p className="text-body-sm font-bold text-text-primary leading-relaxed">
            IMPORTANT: GlucoScan is for informational purposes only. It is not a
            medical device and does not provide medical advice.
          </p>
        </div>

        {/* Last Updated */}
        <p className="text-caption text-text-muted mb-4">
          Last Updated: April 4, 2026
        </p>

        {/* Acceptance of Terms */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Acceptance of Terms
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            By accessing or using GlucoScan, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not
            use the application.
          </p>
        </Card>

        {/* Description of Service */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Description of Service
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            GlucoScan provides estimated glycemic impact information based on
            nutritional data from packaged food products. Results are
            approximations based on general nutritional information and published
            glycemic index data.
          </p>
        </Card>

        {/* Medical Disclaimer */}
        <Card className="mb-4 border-2 border-accent">
          <div className="bg-status-warningBg -m-4 p-4 rounded-card">
            <h2 className="text-body-lg font-bold text-text-primary mb-3">
              Medical Disclaimer
            </h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">*</span>
                <span className="text-body-sm text-text-primary leading-relaxed">
                  This app does NOT provide medical advice
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">*</span>
                <span className="text-body-sm text-text-primary leading-relaxed">
                  Results are estimated and may not be accurate for all
                  individuals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">*</span>
                <span className="text-body-sm text-text-primary leading-relaxed">
                  Always consult your doctor, endocrinologist, or registered
                  dietitian
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">*</span>
                <span className="text-body-sm text-text-primary leading-relaxed">
                  Never make medication or insulin adjustments based on this app
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">*</span>
                <span className="text-body-sm text-text-primary leading-relaxed">
                  This app is not a substitute for professional medical guidance
                </span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Accuracy Limitations */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Accuracy Limitations
          </h2>
          <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-2">
            <li>
              Glycemic index values are estimates based on published data
            </li>
            <li>Individual responses to foods vary significantly</li>
            <li>Product formulations may change without notice</li>
            <li>Barcode database may contain errors</li>
            <li>
              Nutritional calculations are approximations and should not be
              relied upon as precise measurements
            </li>
          </ul>
        </Card>

        {/* Data and Privacy */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Data and Privacy
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            Your use of GlucoScan is also governed by our Privacy Policy, which
            describes how we collect, use, and store your data. Please review the
            Privacy Policy for full details on data handling practices.
          </p>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-3">
            Limitation of Liability
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed mb-2">
            GlucoScan and its developers shall not be held liable for any
            decisions made based on information provided by this application.
            This includes, but is not limited to:
          </p>
          <ul className="list-disc list-inside text-body-sm text-text-secondary leading-relaxed space-y-2">
            <li>Dietary choices influenced by app results</li>
            <li>
              Health outcomes related to food consumption decisions
            </li>
            <li>Inaccuracies in nutritional data or glycemic estimates</li>
            <li>
              Loss of data stored in browser localStorage or sessionStorage
            </li>
          </ul>
          <p className="text-body-sm text-text-secondary leading-relaxed mt-2">
            The application is provided &quot;as is&quot; without warranties of
            any kind, either express or implied.
          </p>
        </Card>

        {/* Changes to Terms */}
        <Card className="mb-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            Changes to Terms
          </h2>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            We reserve the right to modify these Terms of Service at any time.
            Changes will be effective immediately upon posting to this page.
            Continued use of GlucoScan after changes constitutes acceptance of
            the updated terms. We encourage you to review these terms
            periodically.
          </p>
        </Card>
      </div>
    </div>
  );
}
