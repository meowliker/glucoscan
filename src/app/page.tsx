"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ScanLine,
  Search,
  Settings,
  ChevronRight,
  Activity,
  Droplets,
  PenLine,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function HomePage() {
  const router = useRouter();
  const settings = useAppStore((s) => s.settings);
  const history = useAppStore((s) => s.history);
  const bloodSugar = useAppStore((s) => s.bloodSugar);
  const bloodSugarUnit = useAppStore((s) => s.bloodSugarUnit);
  const setBloodSugar = useAppStore((s) => s.setBloodSugar);
  const setBloodSugarUnit = useAppStore((s) => s.setBloodSugarUnit);
  const loadHistory = useAppStore((s) => s.loadHistory);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const loadBloodSugar = useAppStore((s) => s.loadBloodSugar);

  useEffect(() => {
    loadSettings();
    loadHistory();
    loadBloodSugar();
  }, [loadSettings, loadHistory, loadBloodSugar]);

  useEffect(() => {
    if (!settings.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [settings.onboardingComplete, router]);

  const recentScans = history.slice(0, 5);

  const todayStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const todayScans = history.filter((item) => item.timestamp >= todayTimestamp);
    const count = todayScans.length;
    const avgScore =
      count > 0
        ? todayScans.reduce((sum, item) => sum + item.result.impactScore, 0) / count
        : 0;

    return { count, avgScore: Math.round(avgScore * 10) / 10 };
  }, [history]);

  const handleBloodSugarChange = (value: string) => {
    if (value === "") {
      setBloodSugar(null);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setBloodSugar(num);
    }
  };

  const toggleUnit = () => {
    if (bloodSugarUnit === "mg/dL") {
      setBloodSugarUnit("mmol/L");
      if (bloodSugar !== null) {
        setBloodSugar(Math.round((bloodSugar / 18) * 10) / 10);
      }
    } else {
      setBloodSugarUnit("mg/dL");
      if (bloodSugar !== null) {
        setBloodSugar(Math.round(bloodSugar * 18));
      }
    }
  };

  if (!settings.onboardingComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Droplets className="w-7 h-7 text-primary" />
            <h1 className="text-h2 text-text-primary">GlucoScan</h1>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </Link>
        </header>

        {/* Blood Sugar Input Card */}
        <Card className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="text-body-lg font-semibold text-text-primary">
              Current Blood Sugar
            </h2>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder={bloodSugarUnit === "mg/dL" ? "e.g. 120" : "e.g. 6.7"}
              value={bloodSugar ?? ""}
              onChange={(e) => handleBloodSugarChange(e.target.value)}
              className="flex-1 h-12 px-4 rounded-button border border-border bg-white text-text-primary
                text-body-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                placeholder:text-text-muted"
              aria-label="Blood sugar value"
            />
            <button
              type="button"
              onClick={toggleUnit}
              className="h-12 px-4 rounded-button border-2 border-primary text-primary font-semibold
                text-body-sm hover:bg-primary/5 transition-colors whitespace-nowrap"
            >
              {bloodSugarUnit}
            </button>
          </div>
          <p className="text-caption text-text-muted">
            Optional &mdash; helps personalize your results
          </p>
          <p className="text-caption text-text-muted mt-1 italic">
            Blood sugar data is not stored permanently
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push("/scanner")}
          >
            <ScanLine className="w-5 h-5 mr-2" />
            Scan Food
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => router.push("/search")}
          >
            <Search className="w-5 h-5 mr-2" />
            Search by Name
          </Button>
          <Link
            href="/manual-entry"
            className="flex items-center justify-center gap-2 text-body-sm text-text-secondary
              hover:text-primary transition-colors py-2"
          >
            <PenLine className="w-4 h-4" />
            Enter Manually
          </Link>
        </div>

        {/* Today's Stats */}
        <Card className="mb-5">
          <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Today&apos;s Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-h2 text-primary">{todayStats.count}</p>
              <p className="text-caption text-text-muted">Scans Today</p>
            </div>
            <div className="text-center">
              <p className="text-h2 text-primary">
                {todayStats.count > 0 ? todayStats.avgScore : "--"}
              </p>
              <p className="text-caption text-text-muted">Avg GL Score</p>
            </div>
          </div>
        </Card>

        {/* Recent Scans */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-body-lg font-semibold text-text-primary">
              Recent Scans
            </h2>
            {history.length > 0 && (
              <Link
                href="/history"
                className="flex items-center gap-1 text-body-sm text-primary hover:text-primary/80 transition-colors"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {recentScans.length === 0 ? (
            <Card>
              <p className="text-body-sm text-text-muted text-center py-4">
                No scans yet. Scan a food barcode or search by name to get started.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {recentScans.map((item) => (
                <Link key={item.id} href={`/result?id=${item.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-body-sm font-semibold text-text-primary truncate">
                          {item.product.name}
                        </p>
                        <p className="text-caption text-text-muted">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge level={item.result.impactLevel}>
                          {item.result.impactScore.toFixed(1)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
