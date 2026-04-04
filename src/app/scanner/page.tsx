"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, AlertCircle, Loader2, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchProductByBarcode } from "@/lib/api/openFoodFacts";
import {
  calculateGlycemicResult,
  getPersonalizedAssessment,
} from "@/lib/utils/glCalculator";

type ScannerState = "scanning" | "loading" | "error";

export default function ScannerPage() {
  const router = useRouter();
  const [state, setState] = useState<ScannerState>("scanning");
  const [errorMessage, setErrorMessage] = useState("");
  const scannerRef = useRef<unknown>(null);
  const mountedRef = useRef(true);

  const {
    bloodSugar,
    bloodSugarUnit,
    setCurrentProduct,
    setCurrentResult,
    setCurrentAssessment,
  } = useAppStore();

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        (scannerRef.current as { clear: () => Promise<void> })
          .clear()
          .catch(() => {});
      } catch {
        // scanner may already be cleared
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (!mountedRef.current) return;

      cleanupScanner();
      setState("loading");

      try {
        const product = await fetchProductByBarcode(decodedText);

        if (!mountedRef.current) return;

        if (!product) {
          setState("error");
          setErrorMessage("Product not found in database");
          return;
        }

        const result = calculateGlycemicResult(
          product.nutrition,
          product.ingredients
        );

        let assessment = null;
        if (bloodSugar !== null) {
          assessment = getPersonalizedAssessment(
            bloodSugar,
            bloodSugarUnit,
            result.impactLevel
          );
        }

        setCurrentProduct(product);
        setCurrentResult(result);
        setCurrentAssessment(assessment);
        router.push("/result");
      } catch {
        if (!mountedRef.current) return;
        setState("error");
        setErrorMessage("Failed to look up product. Please try again.");
      }
    },
    [
      bloodSugar,
      bloodSugarUnit,
      cleanupScanner,
      router,
      setCurrentAssessment,
      setCurrentProduct,
      setCurrentResult,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;
    let scannerInstance: unknown = null;

    import("html5-qrcode").then(
      ({ Html5QrcodeScanner, Html5QrcodeSupportedFormats }) => {
        if (!mountedRef.current) return;

        const scanner = new Html5QrcodeScanner(
          "scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
            ],
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // scan error callback — ignored, fires on every non-match frame
          }
        );

        scannerInstance = scanner;
        scannerRef.current = scanner;
      }
    );

    return () => {
      mountedRef.current = false;
      if (scannerInstance) {
        try {
          (scannerInstance as { clear: () => Promise<void> })
            .clear()
            .catch(() => {});
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [handleScanSuccess]);

  const handleRetry = () => {
    setState("scanning");
    setErrorMessage("");

    import("html5-qrcode").then(
      ({ Html5QrcodeScanner, Html5QrcodeSupportedFormats }) => {
        if (!mountedRef.current) return;

        const scanner = new Html5QrcodeScanner(
          "scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
            ],
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        );

        scannerRef.current = scanner;
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-heading-md font-bold text-text-primary">
            Scan Barcode
          </h1>
        </div>

        {/* Scanner State: Scanning */}
        {state === "scanning" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-text-secondary mb-2">
              <Camera size={20} />
              <p className="text-body-sm">
                Point your camera at a product barcode
              </p>
            </div>

            <div
              id="scanner-container"
              className="rounded-card overflow-hidden border border-border"
            />

            <div className="text-center pt-2">
              <button
                onClick={() => router.push("/search")}
                className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors text-body-sm font-medium"
              >
                <Search size={16} />
                Or search by name instead
              </button>
            </div>
          </div>
        )}

        {/* Scanner State: Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2
              size={48}
              className="text-primary animate-spin"
            />
            <p className="text-body-lg text-text-secondary font-medium">
              Looking up product...
            </p>
          </div>
        )}

        {/* Scanner State: Error */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-status-errorBg flex items-center justify-center">
              <AlertCircle size={32} className="text-status-error" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-heading-sm font-bold text-text-primary">
                Lookup Failed
              </h2>
              <p className="text-body-sm text-text-secondary max-w-xs">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button
                variant="primary"
                fullWidth
                onClick={handleRetry}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push("/manual-entry")}
              >
                Enter Manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
