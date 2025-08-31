/**
 * Cache Debug Component - Shows cache statistics and provides management controls
 * Only visible in development mode or when explicitly enabled
 */

"use client";

import { useState, useEffect } from "react";

export default function CacheDebug({ show = true }) {
  const [cacheStats, setCacheStats] = useState({
    cacheSize: 0,
    entries: [],
    pendingRequests: 0,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHitRate: 0,
    averageResponseTime: 0,
    apiCallsPerMinute: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastApiCall: null,
    alerts: [],
  });

  useEffect(() => {
    if (!show) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const startTime = Date.now();
        const response = await fetch("/api/cache");
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const stats = await response.json();
          setCacheStats(stats);

          // Calculate performance metrics inline
          setPerformanceMetrics((prevMetrics) => {
            const currentTime = Date.now();
            const totalRequests = prevMetrics.totalRequests + 1;
            const cacheHits =
              stats.cacheSize > 0
                ? prevMetrics.cacheHits + 1
                : prevMetrics.cacheHits;
            const cacheMisses = totalRequests - cacheHits;
            const cacheHitRate =
              totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

            // Calculate API calls per minute
            const timeSinceStart =
              currentTime - (prevMetrics.lastApiCall || currentTime);
            const minutesSinceStart = Math.max(timeSinceStart / 60000, 1);
            const apiCallsPerMinute = Math.round(
              cacheMisses / minutesSinceStart
            );

            // Calculate alerts
            const alerts = [];
            if (apiCallsPerMinute > 8) {
              alerts.push({
                type: "warning",
                message: `High API usage: ${apiCallsPerMinute} calls/minute`,
              });
            }
            if (responseTime > 500) {
              alerts.push({
                type: "error",
                message: `Slow response: ${responseTime}ms`,
              });
            }
            if (cacheHitRate < 95 && totalRequests > 10) {
              alerts.push({
                type: "warning",
                message: `Low cache hit rate: ${cacheHitRate.toFixed(1)}%`,
              });
            }

            return {
              cacheHitRate,
              averageResponseTime:
                (prevMetrics.averageResponseTime + responseTime) / 2,
              apiCallsPerMinute,
              totalRequests,
              cacheHits,
              cacheMisses,
              lastApiCall: currentTime,
              alerts,
            };
          });
        }
      } catch (error) {
        console.error("Failed to fetch cache stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [show]); // Only depend on 'show' prop

  const clearCache = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/cache", { method: "DELETE" });
      setCacheStats({ cacheSize: 0, entries: [], pendingRequests: 0 });
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const warmupCache = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cache-warmup", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        console.log("Cache warmed up:", result.warmed);
        // Refresh stats after warmup
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Failed to warmup cache:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 text-white ${
          performanceMetrics.alerts.length > 0
            ? "bg-red-600 hover:bg-red-700 animate-pulse"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={isLoading}
      >
        💾 Cache: {cacheStats.cacheSize}
        {performanceMetrics.alerts.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-1 rounded-full">
            {performanceMetrics.alerts.length}
          </span>
        )}
        {isLoading && (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {showDetails && (
        <div className="absolute bottom-12 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-lg min-w-80 max-w-96">
          <h3 className="font-bold mb-2">Cache Status</h3>

          {/* Basic Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              Entries:{" "}
              <span className="text-green-400">{cacheStats.cacheSize}</span>
            </div>
            <div>
              Pending:{" "}
              <span className="text-yellow-400">
                {cacheStats.pendingRequests || 0}
              </span>
            </div>
            <div>
              Hit Rate:{" "}
              <span className="text-blue-400">
                {performanceMetrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            <div>
              Avg Response:{" "}
              <span className="text-purple-400">
                {performanceMetrics.averageResponseTime.toFixed(0)}ms
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t border-gray-600 pt-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-300 mb-1">
              Performance
            </h4>
            <div className="text-xs space-y-1">
              <div>
                Total Requests:{" "}
                <span className="text-blue-300">
                  {performanceMetrics.totalRequests}
                </span>
              </div>
              <div>
                Cache Hits:{" "}
                <span className="text-green-300">
                  {performanceMetrics.cacheHits}
                </span>
              </div>
              <div>
                Cache Misses:{" "}
                <span className="text-red-300">
                  {performanceMetrics.cacheMisses}
                </span>
              </div>
              <div>
                API Calls/min:{" "}
                <span className="text-orange-300">
                  {performanceMetrics.apiCallsPerMinute}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {performanceMetrics.alerts.length > 0 && (
            <div className="border-t border-gray-600 pt-2 mb-3">
              <h4 className="text-sm font-semibold text-red-300 mb-1">
                ⚠️ Alerts
              </h4>
              <div className="text-xs space-y-1">
                {performanceMetrics.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-1 rounded ${
                      alert.type === "error"
                        ? "bg-red-900/50 text-red-200"
                        : "bg-yellow-900/50 text-yellow-200"
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cached Keys */}
          {cacheStats.entries?.length > 0 && (
            <div className="border-t border-gray-600 pt-2 mb-3">
              <p className="text-sm text-gray-300 mb-1">Cached keys:</p>
              <ul className="text-xs max-h-24 overflow-y-auto space-y-1">
                {cacheStats.entries.map((key, i) => (
                  <li key={i} className="text-green-400 break-all">
                    • {key}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={clearCache}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Clearing..." : "Clear Cache"}
            </button>

            <button
              onClick={warmupCache}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Warming..." : "Warmup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Cache Status Indicator - Minimal indicator for production
 * Shows different UI based on environment
 */
export function CacheIndicator() {
  const [stats, setStats] = useState({ cacheSize: 0 });
  const [showDebug, setShowDebug] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Only fetch stats in development
    if (!isDevelopment) return;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/cache");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch cache stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [isDevelopment]);

  // Don't render anything in production
  if (!isDevelopment) {
    return null;
  }

  // In development, show full debug functionality
  return (
    <>
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg z-40 text-xs transition-colors"
        title={`Cache entries: ${stats.cacheSize}`}
      >
        💾 {stats.cacheSize}
      </button>

      <CacheDebug show={showDebug} />
    </>
  );
}
