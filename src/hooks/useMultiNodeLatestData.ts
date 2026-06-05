import { useState, useEffect, useRef } from 'react';

export interface NodeValue {
  value: number | string | null;
  timestamp: number | null;
}

/**
 * Fetches the latest data for multiple nodes for a single variable in one batched API call.
 * Returns a Map<nodeId, NodeValue> with the results.
 */
export function useMultiNodeLatestData(
  nodeIds: string[],
  variable: string | undefined,
  pollIntervalMs = 0
): {
  data: Record<string, NodeValue>;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<Record<string, NodeValue>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    if (!variable || nodeIds.length === 0) {
      setData({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const res = await fetch('https://api.anedya.io/v1/data/latest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodeIds,
          variable,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const json = await res.json();
      // Anedya response: { success: true, data: { [nodeId]: { value, timestamp } } }
      if (json?.success && json?.data) {
        const result: Record<string, NodeValue> = {};
        for (const nodeId of nodeIds) {
          const nodeData = json.data[nodeId];
          result[nodeId] = {
            value: nodeData?.value ?? null,
            timestamp: nodeData?.timestamp ?? null,
          };
        }
        setData(result);
      } else {
        // All nulls
        const result: Record<string, NodeValue> = {};
        for (const nodeId of nodeIds) {
          result[nodeId] = { value: null, timestamp: null };
        }
        setData(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      // Keep previous data — cells will still show last known values
    } finally {
      setIsLoading(false);
    }
  };

  const nodeIdsKey = nodeIds.join(',');

  useEffect(() => {
    fetchData();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIdsKey, variable, pollIntervalMs]);

  return { data, isLoading, error };
}
