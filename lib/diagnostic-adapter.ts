/**
 * Backend Integration Guide: Exposing DiagnosticLLMAdapter to Frontend
 *
 * This file documents how to expose the LLM adapter to the frontend
 * so it can retrieve diagnostic text payloads via the new side-channel.
 */

// In your agent initialization or LiveKit worker (Python/backend):
//
// from workflows.diagnostic_workflow import DiagnosticLLMAdapter
//
// # Create the adapter
// llm_adapter = DiagnosticLLMAdapter(target_language="en")
//
// # Expose it globally (for frontend access)
// # This would be done in your agent's run() or initialization method
// window.__llmAdapter = llm_adapter  # Via bridge/inter-process communication
//

export interface DiagnosticTextPayload {
  content: string;
  web_sources?: Array<{
    url: string;
    title: string;
  }>;
  youtube_videos?: Array<{
    url: string;
    title: string;
    thumbnail: string;
    video_id: string;
  }>;
  has_external_sources?: boolean;
}

/**
 * Hook to retrieve diagnostic text from backend adapter
 * Usage:
 *
 * const { getDiagnosticText, loading, error } = useDiagnosticTextPayload();
 *
 * // After agent responds:
 * const payload = await getDiagnosticText();
 * if (payload) {
 *   setDiagnosticReport(payload);
 * }
 */
export async function getDiagnosticTextFromAdapter(): Promise<DiagnosticTextPayload | null> {
  try {
    if (typeof window === 'undefined') return null;

    const adapter = (
      window as unknown as { __llmAdapter?: { get_diagnostic_text_payload?: () => string | null } }
    ).__llmAdapter;
    if (!adapter || typeof adapter.get_diagnostic_text_payload !== 'function') {
      console.warn('⚠️ DiagnosticLLMAdapter not available in window context');
      return null;
    }

    const payload = adapter.get_diagnostic_text_payload();
    if (!payload) return null;

    // Parse if it's a JSON string
    if (typeof payload === 'string') {
      return JSON.parse(payload);
    }

    return payload;
  } catch (error) {
    console.error('Error retrieving diagnostic text from adapter:', error);
    return null;
  }
}

/**
 * Backend Setup Instructions:
 *
 * 1. In your agent worker or LiveKit plugin:
 *    - Create DiagnosticLLMAdapter instance
 *    - After each diagnostic response, ensure _diagnostic_text_payload is set
 *    - Expose adapter via window.__llmAdapter (requires bridge)
 *
 * 2. Alternative: HTTP API endpoint
 *    - Create REST endpoint: GET /api/diagnostic/text-payload
 *    - Call it from frontend instead of accessing window.__llmAdapter
 *    - More secure and recommended for production
 *
 * 3. WebSocket message handler
 *    - Emit diagnostic text via separate WebSocket message
 *    - Frontend listens for "diagnostic:text" event
 *    - Completely decoupled from LLM stream
 *
 * Example WebSocket approach (recommended):
 *
 * Backend (Python):
 *   websocket.send(json.dumps({
 *     "type": "diagnostic:text",
 *     "payload": self._diagnostic_text_payload
 *   }))
 *
 * Frontend (React):
 *   useEffect(() => {
 *     ws?.addEventListener('message', (event) => {
 *       const data = JSON.parse(event.data);
 *       if (data.type === 'diagnostic:text') {
 *         setDiagnosticTextPayload(JSON.parse(data.payload));
 *       }
 *     });
 *   }, [ws]);
 */
