"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import axios from "axios";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store/useAppStore";
import { lookupNutritionByName } from "@/lib/api/nutritionAI";
import {
  calculateGlycemicResult,
  getPersonalizedAssessment,
} from "@/lib/utils/glCalculator";
import type { FoodProduct } from "@/types";

type PageState = "camera" | "loading" | "error" | "permission" | "https";

export default function ScannerPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("camera");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingText, setLoadingText] = useState("Identifying product...");

  const mountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    bloodSugar,
    bloodSugarUnit,
    setCurrentProduct,
    setCurrentResult,
    setCurrentAssessment,
    addToHistory,
  } = useAppStore();

  // ─── Camera Logic ───

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setState("camera");

    // Check if we're in a secure context (HTTPS or localhost)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState("https");
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState("https");
      return;
    }

    try {
      // Try rear camera first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        // Fallback: try any camera (for devices where facingMode fails)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("NotAllowedError") ||
        msg.includes("Permission") ||
        msg.includes("denied")
      ) {
        setState("permission");
      } else if (
        msg.includes("NotFoundError") ||
        msg.includes("DevicesNotFound")
      ) {
        setState("error");
        setErrorMessage(
          "No camera found on this device. Try using the Search feature instead."
        );
      } else if (msg.includes("NotReadableError") || msg.includes("TrackStartError")) {
        setState("error");
        setErrorMessage(
          "Camera is in use by another app. Close other camera apps and try again."
        );
      } else {
        setState("error");
        setErrorMessage(
          "Could not access camera. Please check your browser settings and try again."
        );
      }
    }
  }, []);

  // ─── Handle Product Found ───

  const goToResult = useCallback(
    (product: FoodProduct) => {
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
      addToHistory(product, result, assessment ?? undefined);
      router.push("/result");
    },
    [
      bloodSugar,
      bloodSugarUnit,
      addToHistory,
      router,
      setCurrentAssessment,
      setCurrentProduct,
      setCurrentResult,
    ]
  );

  // ─── Capture & Identify ───

  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

    stopCamera();
    setState("loading");
    setLoadingText("Identifying product...");

    try {
      // Step 1: AI Vision identifies product name from photo
      const visionResponse = await axios.post("/api/vision", {
        image: imageBase64,
      });
      const { productName, brand } = visionResponse.data;

      if (!productName) {
        setState("error");
        setErrorMessage(
          "Could not identify the product. Try holding the camera closer to the label."
        );
        return;
      }

      // Step 2: AI researches accurate nutrition data
      setLoadingText(`Found "${productName}" — researching nutrition...`);

      const product = await lookupNutritionByName(
        productName,
        brand || undefined
      );

      if (product && mountedRef.current) {
        goToResult(product);
        return;
      }

      // Fallback
      setState("error");
      setErrorMessage(
        `Identified "${productName}" but could not retrieve nutrition data. Try searching by name or entering manually.`
      );
    } catch {
      if (!mountedRef.current) return;
      setState("error");
      setErrorMessage("Failed to identify food. Please try again.");
    }
  }, [stopCamera, goToResult]);

  // ─── Lifecycle ───

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setErrorMessage("");
    startCamera();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-h2 text-text-primary">Identify Food</h1>
        </div>

        {/* Camera State */}
        {state === "camera" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <Camera size={18} />
              <p className="text-body-sm">
                Point at the food product or its label
              </p>
            </div>

            <div className="relative rounded-card overflow-hidden border border-border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-card"
                style={{ minHeight: 300 }}
              />
              {/* Capture button */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={captureAndIdentify}
                  className="w-full flex items-center justify-center gap-2 bg-white text-text-primary font-semibold py-3 rounded-button shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera size={20} />
                  Capture &amp; Identify
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="text-center pt-1">
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

        {/* Loading State */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 size={48} className="text-primary animate-spin" />
            <p className="text-body-lg text-text-secondary font-medium text-center px-4">
              {loadingText}
            </p>
          </div>
        )}

        {/* HTTPS Required */}
        {state === "https" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-status-warningBg flex items-center justify-center">
              <AlertCircle size={32} className="text-status-warning" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-h3 text-text-primary">
                HTTPS Required
              </h2>
              <p className="text-body-sm text-text-secondary max-w-xs">
                Camera access requires a secure connection (HTTPS). You&apos;re currently on an insecure connection.
              </p>
              <div className="bg-gray-100 rounded-button p-3 mt-3">
                <p className="text-caption text-text-muted text-left">
                  <strong className="text-text-primary">On mobile:</strong> Deploy to Vercel for HTTPS, or use a tunneling tool like ngrok.
                </p>
                <p className="text-caption text-text-muted text-left mt-2">
                  <strong className="text-text-primary">On desktop:</strong> Use <code className="bg-gray-200 px-1 rounded">localhost:3000</code> (camera works on localhost).
                </p>
              </div>
            </div>
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push("/search")}
              >
                Search by Name Instead
              </Button>
            </div>
          </div>
        )}

        {/* Permission Denied */}
        {state === "permission" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-status-warningBg flex items-center justify-center">
              <Camera size={32} className="text-status-warning" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-h3 text-text-primary">
                Camera Permission Required
              </h2>
              <p className="text-body-sm text-text-secondary max-w-xs">
                GlucoScan needs camera access. Please allow camera access in
                your browser settings and try again.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button variant="primary" fullWidth onClick={handleRetry}>
                Try Again
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push("/search")}
              >
                Search by Name Instead
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-status-errorBg flex items-center justify-center">
              <AlertCircle size={32} className="text-status-error" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-h3 text-text-primary">
                Identification Failed
              </h2>
              <p className="text-body-sm text-text-secondary max-w-xs">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 max-w-xs">
              <Button variant="primary" fullWidth onClick={handleRetry}>
                Try Again
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push("/search")}
              >
                Search by Name
              </Button>
              <Button
                variant="ghost"
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
