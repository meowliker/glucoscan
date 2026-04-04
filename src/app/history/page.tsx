"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Trash2, Calendar, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TrafficLight from "@/components/ui/TrafficLight";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  formatDateTime,
  isToday,
  isThisWeek,
} from "@/lib/utils/formatters";
import type { ScanHistoryItem, ImpactLevel } from "@/types";

type FilterTab = "today" | "week" | "all";

const IMPACT_LABELS: Record<ImpactLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export default function HistoryPage() {
  const router = useRouter();
  const {
    history,
    loadHistory,
    removeFromHistory,
    clearHistory,
    setCurrentProduct,
    setCurrentResult,
    setCurrentAssessment,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    switch (filter) {
      case "today":
        return history.filter((item) => isToday(item.timestamp));
      case "week":
        return history.filter((item) => isThisWeek(item.timestamp));
      case "all":
      default:
        return history;
    }
  }, [history, filter]);

  const weeklySummary = useMemo(() => {
    const weekItems = history.filter((item) => isThisWeek(item.timestamp));
    const totalScans = weekItems.length;
    const averageGL =
      totalScans > 0
        ? weekItems.reduce((sum, item) => sum + item.result.impactScore, 0) /
          totalScans
        : 0;
    return {
      totalScans,
      averageGL: Math.round(averageGL * 10) / 10,
    };
  }, [history]);

  const handleItemTap = (item: ScanHistoryItem) => {
    setCurrentProduct(item.product);
    setCurrentResult(item.result);
    setCurrentAssessment(item.assessment ?? null);
    router.push("/result");
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  };

  const handleClearAll = () => {
    clearHistory();
    setShowClearModal(false);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "all", label: "All Time" },
  ];

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
          <h1 className="text-h2 text-text-primary font-bold">Scan History</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 px-3 rounded-button text-body-sm font-semibold transition-colors ${
                filter === tab.key
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary border border-border hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Weekly Summary */}
        {weeklySummary.totalScans > 0 && (
          <Card className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-primary" />
              <h2 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider">
                Weekly Summary
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-h2 text-primary">
                  {weeklySummary.totalScans}
                </p>
                <p className="text-caption text-text-muted">Total Scans</p>
              </div>
              <div className="text-center">
                <p className="text-h2 text-primary">
                  {weeklySummary.averageGL}
                </p>
                <p className="text-caption text-text-muted">Avg GL Score</p>
              </div>
            </div>
          </Card>
        )}

        {/* History List */}
        {filteredHistory.length > 0 ? (
          <div className="flex flex-col gap-2 mb-6">
            {filteredHistory.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                onClick={() => handleItemTap(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <TrafficLight
                      level={
                        item.assessment
                          ? item.assessment.adjustedImpactLevel
                          : item.result.impactLevel
                      }
                      score={item.result.impactScore}
                      size="sm"
                      animated={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-text-primary truncate">
                        {item.product.name}
                      </p>
                      {item.product.brand && (
                        <p className="text-caption text-text-muted truncate">
                          {item.product.brand}
                        </p>
                      )}
                      <p className="text-caption text-text-muted">
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      level={
                        item.assessment
                          ? item.assessment.adjustedImpactLevel
                          : item.result.impactLevel
                      }
                      size="sm"
                    >
                      {IMPACT_LABELS[
                        item.assessment
                          ? item.assessment.adjustedImpactLevel
                          : item.result.impactLevel
                      ]}
                    </Badge>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors"
                      aria-label="Delete scan"
                    >
                      <Trash2 size={16} className="text-text-muted hover:text-status-error" />
                    </button>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock size={48} className="text-text-muted mb-4" />
            <p className="text-body-lg text-text-secondary mb-2">
              No scan history yet.
            </p>
            <p className="text-body-sm text-text-muted">
              Scan a food to get started!
            </p>
          </div>
        )}

        {/* Clear All History Button */}
        {history.length > 0 && (
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={() => setShowClearModal(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Clear All History
          </Button>
        )}

        {/* Confirmation Modal */}
        <Modal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Clear All History"
        >
          <p className="text-body-sm text-text-secondary mb-6">
            Are you sure you want to delete all scan history? This action cannot
            be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleClearAll}
            >
              Delete All
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
