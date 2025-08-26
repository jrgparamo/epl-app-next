/**
 * Cache Debug Component - Shows cache statistics and provides management controls
 * Only visible in development mode or when explicitly enabled
 */

"use client";

import { useState, useEffect } from "react";
import {
  getCacheStats,
  clearCache,
  clearCurrentMatchdayCache,
} from "../../lib/api";

export default function CacheDebug({ show = false }) {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(
    show || process.env.NODE_ENV === "development"
  );

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats(getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !stats) return null;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAge = (timestamp) => {
    if (!timestamp) return "N/A";
    const ageMs = Date.now() - timestamp;
    const ageMin = Math.floor(ageMs / 60000);
    return `${ageMin}m ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Cache Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      <div className="text-xs space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">Total:</span> {stats.totalEntries}
          </div>
          <div>
            <span className="text-gray-400">Valid:</span> {stats.validEntries}
          </div>
          <div>
            <span className="text-gray-400">Expired:</span>{" "}
            {stats.expiredEntries}
          </div>
          <div>
            <span className="text-gray-400">Hit Rate:</span>{" "}
            {stats.totalEntries > 0
              ? `${Math.round(
                  (stats.validEntries / stats.totalEntries) * 100
                )}%`
              : "0%"}
          </div>
        </div>

        {stats.oldestEntry && (
          <div className="pt-1 border-t border-gray-600">
            <div>
              <span className="text-gray-400">Oldest:</span>{" "}
              {formatAge(stats.oldestEntry)}
            </div>
            <div>
              <span className="text-gray-400">Newest:</span>{" "}
              {formatAge(stats.newestEntry)}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 mt-3">
        <button
          onClick={() => {
            clearCache();
            setStats(getCacheStats());
          }}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          Clear All
        </button>
        <button
          onClick={() => {
            clearCurrentMatchdayCache();
            setStats(getCacheStats());
          }}
          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
        >
          Clear MD
        </button>
        <button
          onClick={() => setStats(getCacheStats())}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

/**
 * Cache Status Indicator - Minimal indicator for production
 */
export function CacheIndicator() {
  const [stats, setStats] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <>
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-40 text-xs"
        title={`Cache: ${stats.validEntries}/${stats.totalEntries} entries`}
      >
        💾 {stats.validEntries}
      </button>

      <CacheDebug show={showDebug} />
    </>
  );
}
