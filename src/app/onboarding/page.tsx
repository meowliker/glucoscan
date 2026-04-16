"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Camera, BarChart3, ChevronRight, Check } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

const slides = [
  {
    title: "What is GlucoScan",
    description:
      "Estimate the glycemic impact of packaged foods by taking a photo or searching by name.",
    icon: "scan",
  },
  {
    title: "How It Works",
    description:
      "Point your camera at any food product and tap capture. Our AI identifies the product and researches its nutrition data instantly.",
    icon: "camera",
  },
  {
    title: "Understanding Your Score",
    description:
      "Get a 0-10 impact score — green for low, yellow for moderate, red for high estimated glycemic impact. Enter your blood sugar level for a personalized assessment.",
    icon: "chart",
  },
] as const;

const DISCLAIMER_TEXT =
  "GlucoScan provides general nutritional information only. It is not a medical device and does not provide medical advice. Always consult your doctor or dietitian before making dietary decisions based on this app.";

function SlideIcon({ type, className }: { type: string; className?: string }) {
  const iconProps = { className: className ?? "w-16 h-16 text-primary", strokeWidth: 1.5 };
  switch (type) {
    case "scan":
      return <ScanLine {...iconProps} />;
    case "camera":
      return <Camera {...iconProps} />;
    case "chart":
      return <BarChart3 {...iconProps} />;
    default:
      return null;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const isLastSlide = currentSlide === slides.length - 1;

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || index === currentSlide) return;
      setDirection(index > currentSlide ? "right" : "left");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
      }, 200);
    },
    [currentSlide, isAnimating]
  );

  const handleNext = useCallback(() => {
    if (isLastSlide) return;
    goToSlide(currentSlide + 1);
  }, [currentSlide, isLastSlide, goToSlide]);

  const handleGetStarted = useCallback(() => {
    if (!disclaimerAccepted) return;
    completeOnboarding();
    router.push("/");
  }, [disclaimerAccepted, completeOnboarding, router]);

  const slide = slides[currentSlide];

  const animationClass = isAnimating
    ? direction === "right"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-10 max-w-lg mx-auto">
      {/* Skip button */}
      {!isLastSlide && (
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => goToSlide(slides.length - 1)}
            className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip
          </button>
        </div>
      )}
      {isLastSlide && <div className="w-full h-5" />}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div
          className={`flex flex-col items-center text-center transition-all duration-200 ease-in-out ${animationClass}`}
        >
          {/* Icon container */}
          <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <SlideIcon type={slide.icon} />
          </div>

          {/* Title */}
          <h1 className="text-h2 text-text-primary mb-4">{slide.title}</h1>

          {/* Description */}
          <p className="text-body-lg text-text-secondary max-w-sm leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Disclaimer section - only on last slide */}
        {isLastSlide && (
          <div
            className={`mt-10 w-full transition-all duration-300 ease-in-out ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="bg-surface border border-border rounded-card p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="pt-0.5">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      disclaimerAccepted
                        ? "bg-primary border-primary"
                        : "border-text-muted bg-white"
                    }`}
                    onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        setDisclaimerAccepted(!disclaimerAccepted);
                      }
                    }}
                    role="checkbox"
                    aria-checked={disclaimerAccepted}
                    tabIndex={0}
                  >
                    {disclaimerAccepted && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span
                  className="text-caption text-text-secondary leading-relaxed select-none"
                  onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                >
                  {DISCLAIMER_TEXT}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom section: dots + button */}
      <div className="w-full flex flex-col items-center gap-6 mt-8">
        {/* Dot navigation */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? "w-8 h-2.5 bg-primary"
                  : "w-2.5 h-2.5 bg-text-muted/40 hover:bg-text-muted/60"
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        {isLastSlide ? (
          <button
            type="button"
            onClick={handleGetStarted}
            disabled={!disclaimerAccepted}
            className="w-full h-12 rounded-button font-semibold text-body-lg bg-primary text-text-onPrimary
              hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              flex items-center justify-center gap-2"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-12 rounded-button font-semibold text-body-lg bg-primary text-text-onPrimary
              hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              transition-all duration-200
              flex items-center justify-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
