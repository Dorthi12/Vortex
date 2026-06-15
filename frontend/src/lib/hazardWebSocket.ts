'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useHazardStore } from '@/store/useHazardStore';

const WS_URL =
  process.env.NEXT_PUBLIC_HAZARD_WS_URL || 'ws://localhost:8000/ws/hazard/telemetry';

export function useHazardWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setTelemetry, setWsConnected, triggerAlert } = useHazardStore();

  const startSimulation = useCallback(() => {
    // Clear any existing simulation timer
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }
    // Simulate telemetry updates every 8 seconds when WS is unavailable
    simulationTimerRef.current = setInterval(() => {
      setTelemetry({
        riverLevel: 7.5 + Math.random() * 1.5,
        rainfall: 30 + Math.random() * 40,
        shelterOccupancyPct: 60 + Math.random() * 20,
        activeSirens: Math.floor(Math.random() * 3) + 1,
        lastUpdated: new Date().toISOString(),
      });
    }, 8000);
  }, [setTelemetry]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Stop simulation if it was running
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          simulationTimerRef.current = null;
        }
        console.log('[HazardWS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TELEMETRY') {
            setTelemetry(data.payload);
          } else if (data.type === 'ALERT') {
            triggerAlert(data.payload);
          }
        } catch (e) {
          console.warn('[HazardWS] Parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Start simulation as fallback
        startSimulation();
        // Reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      // If WS unavailable, simulate telemetry updates locally
      console.warn('[HazardWS] Could not connect, using simulated telemetry');
      startSimulation();
    }
  }, [setTelemetry, setWsConnected, triggerAlert, startSimulation]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [connect]);

  const sendCommand = useCallback((command: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  return { sendCommand };
}
