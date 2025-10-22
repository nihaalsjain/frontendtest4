import * as React from 'react';
import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';

// Enhanced message formatter to handle URLs and structured content
const enhancedMessageFormatter: MessageFormatter = (message: string) => {
  // Handle YouTube links and web URLs
  let formattedMessage = message;

  // Convert markdown-style links to HTML
  formattedMessage = formattedMessage.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline">$1</a>'
  );

  // Convert plain URLs to clickable links
  formattedMessage = formattedMessage.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline">$1</a>'
  );

  // Handle YouTube video thumbnails and special formatting
  formattedMessage = formattedMessage.replace(
    /📺 \*\*YouTube Diagnostic Videos:\*\*/g,
    '<div class="mt-4"><h4 class="text-sm font-semibold text-red-600 mb-2">📺 YouTube Diagnostic Videos</h4></div>'
  );

  formattedMessage = formattedMessage.replace(
    /🌐 \*\*Web Sources:\*\*/g,
    '<div class="mt-4"><h4 class="text-sm font-semibold text-blue-600 mb-2">🌐 Web Sources</h4></div>'
  );

  // Convert **text** to bold
  formattedMessage = formattedMessage.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Preserve line breaks
  formattedMessage = formattedMessage.replace(/\n/g, '<br>');

  return formattedMessage;
};

export const useChatMessage = (entry: ReceivedChatMessage, messageFormatter?: MessageFormatter) => {
  const formattedMessage = React.useMemo(() => {
    if (messageFormatter) {
      const result = messageFormatter(entry.message);
      // If the formatter returns a ReactNode that's not a string, convert it back to string
      return typeof result === 'string' ? result : entry.message;
    }
    // Use our enhanced formatter which always returns a string
    return enhancedMessageFormatter(entry.message);
  }, [entry.message, messageFormatter]);

  const hasBeenEdited = !!entry.editTimestamp;
  const time = new Date(entry.timestamp);
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  const name = entry.from?.name && entry.from.name !== '' ? entry.from.name : entry.from?.identity;

  return { message: formattedMessage, hasBeenEdited, time, locale, name };
};
