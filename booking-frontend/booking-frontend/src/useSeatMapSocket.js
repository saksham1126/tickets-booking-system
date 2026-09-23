import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * Opens a STOMP-over-WebSocket connection to the Spring backend and
 * subscribes to /topic/seatmap/{eventInstanceId}. Every message received
 * is a { seatInventoryId, status } update - we hand each one to the
 * caller via onUpdate, which merges it into the seat grid state.
 *
 * This is the same connection the standalone websocket-test.html page
 * used, just wired into a React component's lifecycle instead of a
 * plain <script> tag.
 */
export function useSeatMapSocket(eventInstanceId, onUpdate) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
      reconnectDelay: 3000, // auto-reconnect if the connection drops
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/seatmap/${eventInstanceId}`, (message) => {
          const update = JSON.parse(message.body);
          onUpdate(update);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventInstanceId]);

  return connected;
}
