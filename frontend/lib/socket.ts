'use client';

import { useEffect, useRef, useState } from 'react';

export function useAuralisSocket(onMessage?: (data: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Use API_BASE_URL to determine WebSocket URL
    // Replace http:// with ws:// and https:// with wss://
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ Connected to Auralis WebSocket');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    socket.onclose = () => {
      console.log('❌ Disconnected from Auralis WebSocket');
      setConnected(false);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const send = (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return { connected, send };
}
