'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import { TextOutputPanel } from '@/components/livekit/text-output-panel';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import { useDiagnosticWebSocket } from '@/hooks/useDiagnosticWebSocket';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

export interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  /** UI language for labels/subtitles/etc. */
  language: 'en' | 'kn' | 'hi' | 'ta';
}

/** Full props including native <main> attributes */
export type SessionViewComponentProps = React.ComponentProps<'main'> & SessionViewProps;

export const SessionView = React.forwardRef<HTMLElement, SessionViewComponentProps>(
  ({ appConfig, disabled, sessionStarted, ...mainProps }, ref) => {
    const { state: agentState } = useVoiceAssistant();
    const [chatOpen, setChatOpen] = useState(false);
    const [textOutputOpen, setTextOutputOpen] = useState(false);
    const { messages, send } = useChatAndTranscription();
    const room = useRoomContext();
    const [diagnosticTextPayload, setDiagnosticTextPayload] = useState<string>('');

    useDebugMode({
      // FIX: NODE_ENV (not NODE_END)
      enabled: process.env.NODE_ENV !== 'production',
    });

    /**
     * Listen for diagnostic text via WebSocket (primary method).
     * Backend sends diagnostic text through a separate WebSocket message channel
     * with type: "diagnostic:text"
     */
    const handleDiagnosticTextFromWebSocket = useCallback((payload: unknown) => {
      try {
        setDiagnosticTextPayload(JSON.stringify(payload));
        console.log('✅ Diagnostic text received via WebSocket', payload);
      } catch (error) {
        console.error('Error processing WebSocket diagnostic text:', error);
      }
    }, []);

    // Initialize WebSocket listener for diagnostic text
    useDiagnosticWebSocket(handleDiagnosticTextFromWebSocket);

    /**
     * Fallback: Retrieve diagnostic text payload from backend LLM adapter.
     * This is called if WebSocket method doesn't receive data.
     * Ensures graceful degradation.
     */
    const retrieveDiagnosticTextPayload = useCallback(async () => {
      try {
        // Only attempt if we don't already have text from WebSocket
        if (diagnosticTextPayload) {
          console.log('✅ Diagnostic text already received via WebSocket');
          return;
        }

        // Access LLM adapter via global context as fallback
        if (typeof window !== 'undefined') {
          const windowWithAdapter = window as unknown as {
            __llmAdapter?: { get_diagnostic_text_payload?: () => string | null };
          };
          const adapter = windowWithAdapter.__llmAdapter;
          if (adapter?.get_diagnostic_text_payload) {
            const payload = adapter.get_diagnostic_text_payload();
            if (payload) {
              try {
                const parsed = JSON.parse(payload);
                setDiagnosticTextPayload(JSON.stringify(parsed));
                console.log('📋 Retrieved diagnostic text payload from backend (fallback)', parsed);
              } catch (e) {
                console.error('Failed to parse diagnostic payload:', e);
                setDiagnosticTextPayload(payload);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error retrieving diagnostic text payload (fallback):', error);
      }
    }, [diagnosticTextPayload]);

    /**
     * Watch for new messages and attempt to retrieve diagnostic text when agent responds.
     * This is a fallback for when WebSocket doesn't deliver the text.
     */
    useEffect(() => {
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        // If latest message is from agent (not local), try to fetch diagnostic text as fallback
        if (!latestMessage.from?.isLocal) {
          // Small delay to ensure backend has processed and stored the text
          const timer = setTimeout(() => {
            retrieveDiagnosticTextPayload();
          }, 500);
          return () => clearTimeout(timer);
        }
      }
    }, [messages, retrieveDiagnosticTextPayload]);

    async function handleSendMessage(message: string) {
      await send(message);
    }

    // Get the latest diagnostic structured content
    // Priority: 1) Retrieved from backend payload, 2) TEXT_ONLY chunks, 3) Legacy patterns
    const getLatestTextContent = (): string => {
      // 1. Prefer the backend-retrieved diagnostic text (most reliable)
      if (diagnosticTextPayload) {
        console.log('📋 Using backend-retrieved diagnostic payload');
        return diagnosticTextPayload;
      }

      // 2. Collect assistant (remote) messages only for fallback
      const assistantMessages = messages.filter(
        (m) => !m.from?.isLocal && typeof m.message === 'string'
      );
      if (!assistantMessages.length) return '';

      // 3. Fallback: Check for TEXT_ONLY: chunk in stream (new format backup)
      for (let i = assistantMessages.length - 1; i >= 0; i--) {
        const raw = assistantMessages[i].message as string;
        if (raw.startsWith('TEXT_ONLY:')) {
          const payload = raw.slice('TEXT_ONLY:'.length).trim();
          try {
            const parsed = JSON.parse(payload);
            // Ensure it's the expected text_output structure
            if (parsed && typeof parsed.content === 'string') {
              console.log('📋 Using TEXT_ONLY chunk from stream');
              return JSON.stringify(parsed);
            }
          } catch {
            return payload; // fallback raw diagnostic text
          }
        }
      }

      // 4. Backward compatibility: VOICE:...|||TEXT:{json}
      for (let i = assistantMessages.length - 1; i >= 0; i--) {
        const raw = assistantMessages[i].message as string;
        const voiceTextMatch = raw.match(/^VOICE:([\s\S]*?)\|\|\|TEXT:([\s\S]*)$/);
        if (voiceTextMatch) {
          const textSegment = voiceTextMatch[2];
          try {
            const parsedText = JSON.parse(textSegment);
            if (parsedText && typeof parsedText.content === 'string') {
              console.log('📋 Using VOICE|||TEXT fallback format');
              return JSON.stringify(parsedText);
            }
          } catch {
            return textSegment;
          }
        }
      }

      // 5. Legacy direct structured JSON with text_output wrapper
      for (let i = assistantMessages.length - 1; i >= 0; i--) {
        const raw = assistantMessages[i].message as string;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.text_output && typeof parsed.text_output.content === 'string') {
            console.log('📋 Using legacy text_output format');
            return JSON.stringify(parsed.text_output);
          }
        } catch {
          /* ignore */
        }
      }

      return '';
    };

    // Derive chat display messages (show voice_output if structured JSON)
    const displayMessages = messages
      .filter((m) => {
        // Filter out raw diagnostic chunks (TEXT_ONLY:) from chat display
        if (typeof m.message === 'string' && m.message.startsWith('TEXT_ONLY:')) return false;
        return true;
      })
      .map((m) => {
        if (typeof m.message === 'string') {
          // New streaming: voice summary already isolated (no change needed)
          // Backward compatibility: collapse VOICE|||TEXT to voice portion
          const match = m.message.match(/^VOICE:([\s\S]*?)\|\|\|TEXT:[\s\S]*$/);
          if (match) {
            return { ...m, message: match[1].trim() };
          }
          // Legacy full JSON structure
          try {
            const parsed = JSON.parse(m.message);
            if (parsed && parsed.voice_output && parsed.text_output) {
              return { ...m, message: parsed.voice_output };
            }
          } catch {
            /* ignore */
          }
        }
        return m;
      });

    useEffect(() => {
      if (sessionStarted) {
        const timeout = setTimeout(() => {
          if (!isAgentAvailable(agentState)) {
            const reason =
              agentState === 'connecting'
                ? 'Agent did not join the room. '
                : 'Agent connected but did not complete initializing. ';

            toastAlert({
              title: 'Session ended',
              description: (
                <p className="w-full">
                  {reason}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://docs.livekit.io/agents/start/voice-ai/"
                    className="whitespace-nowrap underline"
                  >
                    See quickstart guide
                  </a>
                  .
                </p>
              ),
            });
            room.disconnect();
          }
        }, 10_000);

        return () => clearTimeout(timeout);
      }
    }, [agentState, sessionStarted, room]);

    const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
    const capabilities = { supportsChatInput, supportsVideoInput, supportsScreenShare };

    return (
      <main
        ref={ref}
        // you can consume `language` here for localized strings if needed
        {...mainProps}
        inert={disabled}
        className={cn(!chatOpen && 'max-h-svh overflow-hidden', mainProps.className)}
      >
        <ChatMessageView
          className={cn(
            'mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
            chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
          )}
        >
          <div className="space-y-3 whitespace-pre-wrap">
            <AnimatePresence>
              {displayMessages.map((message: ReceivedChatMessage) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <ChatEntry hideName entry={message} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ChatMessageView>

        <div className="bg-background fixed top-0 right-0 left-0 h-32 md:h-36">
          {/* skrim */}
          <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
        </div>

        <MediaTiles chatOpen={chatOpen} />

        <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
          <motion.div
            key="control-bar"
            initial={{ opacity: 0, translateY: '100%' }}
            animate={{
              opacity: sessionStarted ? 1 : 0,
              translateY: sessionStarted ? '0%' : '100%',
            }}
            transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
          >
            <div className="relative z-10 mx-auto w-full max-w-2xl">
              {appConfig.isPreConnectBufferEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                    transition: {
                      ease: 'easeIn',
                      delay: messages.length > 0 ? 0 : 0.8,
                      duration: messages.length > 0 ? 0.2 : 0.5,
                    },
                  }}
                  aria-hidden={messages.length > 0}
                  className={cn(
                    'absolute inset-x-0 -top-12 text-center',
                    sessionStarted && messages.length === 0 && 'pointer-events-none'
                  )}
                >
                  <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                    {/* you can localize this using `language` */}
                    Agent is listening, ask it a question
                  </p>
                </motion.div>
              )}

              <AgentControlBar
                capabilities={capabilities}
                onChatOpenChange={setChatOpen}
                onTextOutputToggle={setTextOutputOpen}
                onSendMessage={handleSendMessage}
              />
            </div>
            {/* skrim */}
            <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
          </motion.div>
        </div>

        {/* Text Output Panel */}
        <TextOutputPanel
          isOpen={textOutputOpen}
          onClose={() => setTextOutputOpen(false)}
          textContent={getLatestTextContent()}
        />
      </main>
    );
  }
);
SessionView.displayName = 'SessionView';
