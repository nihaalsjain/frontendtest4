'use client';

import { useEffect, useState } from 'react';
import type { ReceivedDataMessage } from '@livekit/components-core';
import { useDataChannel } from '@livekit/components-react';

/**
 * Custom hook to receive diagnostic report data via LiveKit data channel.
 * Subscribes to the 'diagnostic_report' topic and parses structured JSON.
 */
export interface DiagnosticData {
  content: string;
  web_sources: Array<{ url: string; title: string }>;
  youtube_videos: Array<{
    url: string;
    title: string;
    thumbnail: string;
    video_id: string;
  }>;
  has_external_sources?: boolean;
}

export const useDiagnosticData = () => {
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to 'diagnostic_report' topic via data channel
  const { message } = useDataChannel('diagnostic_report', (msg: ReceivedDataMessage) => {
    try {
      // msg.payload is Uint8Array, decode to string
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(msg.payload);

      const data = JSON.parse(jsonString) as DiagnosticData;

      console.log('📊 Diagnostic report received via data channel:', {
        content_length: data.content?.length || 0,
        web_sources: data.web_sources?.length || 0,
        youtube_videos: data.youtube_videos?.length || 0,
      });

      setDiagnosticReport(data);
      setError(null);
    } catch (e) {
      console.error('Failed to parse diagnostic data from data channel:', e);
      setError(e instanceof Error ? e.message : 'Failed to parse diagnostic data');
    }
  });

  // Also listen for message changes (LiveKit hook pattern)
  useEffect(() => {
    if (message) {
      try {
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(message.payload);
        const data = JSON.parse(jsonString) as DiagnosticData;
        setDiagnosticReport(data);
        setError(null);
      } catch (e) {
        console.error('Failed to parse latest diagnostic message:', e);
        setError(e instanceof Error ? e.message : 'Failed to parse diagnostic data');
      }
    }
  }, [message]);

  return { diagnosticReport, error };
};
