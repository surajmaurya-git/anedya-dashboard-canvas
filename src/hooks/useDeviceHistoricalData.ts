import { useState, useEffect, useRef, useCallback } from 'react';

export interface HistoricalRow {
  timestamp: number;
  values: Record<string, number | string | null>; // variableKey -> value
}

interface UseDeviceHistoricalDataOptions {
  nodeId: string | undefined;
  variables: { variableKey: string; label: string }[];
  pageSize?: number;
  pollIntervalMs?: number;
}

/**
 * Fetches historical data for a single device across multiple variables.
 * Results are page-based (prev/next).
 * Each page fetches the SAME time window for all variables and merges rows by timestamp.
 */
export function useDeviceHistoricalData({
  nodeId,
  variables,
  pageSize = 20,
  pollIntervalMs = 0,
}: UseDeviceHistoricalDataOptions) {
  const [rows, setRows] = useState<HistoricalRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-based
  const [totalRows, setTotalRows] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      if (!nodeId || variables.length === 0) {
        setRows([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
        const now = Math.floor(Date.now() / 1000);
        const from = 0; // all time
        const to = now;

        // Fetch all variables in parallel
        const results = await Promise.all(
          variables.map(async ({ variableKey }) => {
            const res = await fetch('https://api.anedya.io/v1/data/getData', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                nodes: [nodeId],
                variable: variableKey,
                from,
                to,
                order: 'desc',
                limit: pageSize * (targetPage + 1) + pageSize, // over-fetch to determine totalRows approx
              }),
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            const points: { timestamp: number; value: any }[] =
              json?.data?.[nodeId] ?? [];
            return { variableKey, points };
          })
        );

        // Determine total row count from the first variable (largest set)
        const maxPoints = Math.max(...results.map((r) => r.points.length), 0);
        setTotalRows(maxPoints);

        // Take the page slice from first variable's timestamps as the "anchor"
        const anchorPoints = results[0]?.points ?? [];
        const sliced = anchorPoints.slice(targetPage * pageSize, (targetPage + 1) * pageSize);

        // Build merged rows — each row is keyed by timestamp of the anchor variable
        const mergedRows: HistoricalRow[] = sliced.map((anchor) => {
          const values: Record<string, number | string | null> = {};
          for (const { variableKey, points } of results) {
            // Find the closest point within ±30s of the anchor timestamp
            const match = points.find(
              (p) => Math.abs(p.timestamp - anchor.timestamp) < 30
            );
            values[variableKey] = match?.value ?? null;
          }
          return { timestamp: anchor.timestamp, values };
        });

        setRows(mergedRows);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
        // Retain previous rows so table stays visible with last known values
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeId, variables.map((v) => v.variableKey).join(','), pageSize]
  );

  useEffect(() => {
    fetchPage(page);

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(() => fetchPage(page), pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPage, page, pollIntervalMs]);

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  return { rows, isLoading, error, page, totalPages, hasNext, hasPrev, goNext, goPrev };
}
