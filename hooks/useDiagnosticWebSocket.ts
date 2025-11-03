import { useCallback, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';

/**
 * Hook to listen for diagnostic text payload via WebSocket messages
 *
 * The backend sends diagnostic text as a separate message with:
 * {
 *   "type": "diagnostic:text",
 *   "payload": {...},
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 *
 * This keeps diagnostic text completely separate from the LLM stream
 */
export function useDiagnosticWebSocket(onDiagnosticText: (payload: unknown) => void) {
  const room = useRoomContext();
  const messageHandlerRef = useRef<((event: unknown) => void) | null>(null);

  const setupWebSocketListener = useCallback(() => {
    if (!room) {
      console.warn('🔌 Room not available for WebSocket setup');
      return;
    }

    try {
      // LiveKit exposes the underlying socket through the engine
      // We listen for custom messages sent by the agent
      const engine = (room as unknown as { engine?: Record<string, unknown> }).engine;
      if (!engine) {
        console.warn('⚠️ LiveKit engine not available');
        return;
      }

      const handleMessage = (event: unknown) => {
        try {
          let data: unknown = event;

          // Check if event has a data property
          if (event && typeof event === 'object' && 'data' in event) {
            const eventData = (event as { data: unknown }).data;
            data = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
          } else if (typeof event === 'string') {
            data = JSON.parse(event);
          }

          // Check if this is a diagnostic text message
          if (
            data &&
            typeof data === 'object' &&
            'type' in data &&
            (data as Record<string, unknown>).type === 'diagnostic:text'
          ) {
            console.log('📨 Received diagnostic text via message', data);

            try {
              // Parse the payload if it's a JSON string
              let payload = (data as Record<string, unknown>).payload;
              if (typeof payload === 'string') {
                payload = JSON.parse(payload);
              }

              onDiagnosticText(payload);
            } catch (parseError) {
              console.error('Failed to parse diagnostic payload:', parseError);
              // Still pass raw payload
              onDiagnosticText((data as Record<string, unknown>).payload);
            }
          }
        } catch (e) {
          // Ignore non-JSON or non-diagnostic messages
        }
      };

      messageHandlerRef.current = handleMessage;

      // Try to attach to LiveKit connection events
      const engineWithWs = engine as {
        _ws?: WebSocket;
        client?: {
          on: (event: string, handler: (event: unknown) => void) => void;
          off: (event: string, handler: (event: unknown) => void) => void;
        };
      };
      if (engineWithWs._ws) {
        // Direct WebSocket reference
        engineWithWs._ws.addEventListener('message', (e) => handleMessage(e));
        console.log('✅ Diagnostic message listener attached (direct ws)');
      } else if (engineWithWs.client) {
        // LiveKit client connection
        engineWithWs.client.on('message', handleMessage);
        console.log('✅ Diagnostic message listener attached (client)');
      }

      return () => {
        if (messageHandlerRef.current) {
          if (engineWithWs._ws) {
            engineWithWs._ws.removeEventListener('message', (e) => messageHandlerRef.current?.(e));
          } else if (engineWithWs.client) {
            engineWithWs.client.off('message', messageHandlerRef.current);
          }
          console.log('❌ Diagnostic message listener removed');
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not set up message listener:', error);
      return undefined;
    }
  }, [room, onDiagnosticText]);

  useEffect(() => {
    const cleanup = setupWebSocketListener();
    return () => cleanup?.();
  }, [setupWebSocketListener]);
}

/**
 * Alternative approach: Listen to raw WebSocket events if available
 * This is a fallback if the above approach doesn't work with the specific
 * LiveKit version or configuration
 */
export function useDiagnosticWebSocketDirect(onDiagnosticText: (payload: unknown) => void) {
  useEffect(() => {
    try {
      // Try to access WebSocket through window if it's exposed
      if (typeof window !== 'undefined') {
        const windowWithWs = window as unknown as { __liveKitWebSocket?: WebSocket };
        const ws = windowWithWs.__liveKitWebSocket;

        if (ws) {
          const handleMessage = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data) as Record<string, unknown>;
              if (data.type === 'diagnostic:text') {
                console.log('📨 Received diagnostic text via direct WebSocket', data);

                let payload = data.payload;
                if (typeof payload === 'string') {
                  payload = JSON.parse(payload);
                }

                onDiagnosticText(payload);
              }
            } catch (e) {
              // Ignore non-diagnostic messages
            }
          };

          ws.addEventListener('message', handleMessage);
          console.log('✅ Direct WebSocket listener attached');

          return () => {
            ws.removeEventListener('message', handleMessage);
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Direct WebSocket approach not available:', error);
    }
  }, [onDiagnosticText]);
}
