import * as React from 'react';
import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';

// Types for structured content
interface WebSource {
  url: string;
  title: string;
}

interface YouTubeVideo {
  url: string;
  title: string;
  thumbnail: string;
  video_id: string;
}

interface StructuredTextData {
  content: string;
  web_sources?: WebSource[];
  youtube_videos?: YouTubeVideo[];
  has_external_sources?: boolean;
}

interface VoiceTextResponse {
  voice_output: string;
  text_output: StructuredTextData;
}

// Parse the special VOICE:content|||TEXT:content format
const parseStructuredMessage = (
  message: string
): { voice: string; text: string; isStructured: boolean } => {
  // First try to parse as direct JSON from backend
  try {
    const jsonData = JSON.parse(message) as VoiceTextResponse;
    if (jsonData.voice_output && jsonData.text_output) {
      return {
        voice: jsonData.voice_output,
        text: JSON.stringify(jsonData.text_output),
        isStructured: true,
      };
    }
  } catch {
    // Not direct JSON, try the VOICE|||TEXT format
  }

  // Try the VOICE|||TEXT format
  const structuredPattern = /^VOICE:([\s\S]*?)\|\|\|TEXT:([\s\S]*)$/;
  const match = message.match(structuredPattern);

  if (match) {
    const voiceContent = match[1];
    const textContent = match[2];

    return {
      voice: voiceContent,
      text: textContent,
      isStructured: true,
    };
  }

  return {
    voice: message,
    text: message,
    isStructured: false,
  };
};

// Create rich HTML content for structured text output
const createRichTextOutput = (textContent: string): string => {
  try {
    // Try to parse as JSON (structured diagnostic output)
    const structuredData: StructuredTextData = JSON.parse(textContent);

    let html = `<div class="structured-content">`;

    // Add main content with proper formatting
    let mainContent = structuredData.content || '';

    // Enhanced formatting for diagnostic reports
    mainContent = mainContent
      // Bold section headers
      .replace(
        /^(Category|Potential Causes|Diagnostic Steps|Possible Solutions):/gm,
        '<strong class="text-lg block mt-4 mb-2 text-blue-700">$1:</strong>'
      )
      // Format bullet points
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
      // Convert line breaks to HTML
      .replace(/\n/g, '<br>');

    html += `<div class="main-content text-gray-800 dark:text-gray-200">${mainContent}</div>`;

    // Add web sources if available
    if (structuredData.web_sources && structuredData.web_sources.length > 0) {
      html += `<div class="web-sources mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">`;
      html += `<h4 class="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center">
        <span class="mr-2">🌐</span>Web Sources
      </h4>`;
      html += `<div class="space-y-2">`;

      for (const source of structuredData.web_sources) {
        html += `<div class="border-l-2 border-blue-300 pl-3">`;
        html += `<a href="${source.url}" target="_blank" rel="noopener noreferrer" 
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
          underline text-sm font-medium block transition-colors">`;
        html += `${source.title || 'Web Source'}`;
        html += `</a>`;
        html += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">${source.url}</p>`;
        html += `</div>`;
      }

      html += `</div></div>`;
    }

    // Add YouTube videos if available
    if (structuredData.youtube_videos && structuredData.youtube_videos.length > 0) {
      html += `<div class="youtube-videos mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">`;
      html += `<h4 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
        <span class="mr-2">📺</span>YouTube Diagnostic Videos
      </h4>`;
      html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">`;

      for (const video of structuredData.youtube_videos) {
        html += `<div class="youtube-video-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">`;
        html += `<a href="${video.url}" target="_blank" rel="noopener noreferrer" class="block group">`;

        // Video thumbnail with play button overlay
        if (video.thumbnail) {
          html += `<div class="relative aspect-video bg-gray-100 dark:bg-gray-700">`;
          html += `<img src="${video.thumbnail}" alt="${video.title}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
            onerror="this.src='https://img.youtube.com/vi/${video.video_id}/default.jpg';" />`;
          html += `<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">`;
          html += `<div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">`;
          html += `<svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>`;
          html += `</div></div></div>`;
        }

        // Video title
        html += `<div class="p-3">`;
        html += `<p class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">`;
        html += `${video.title}`;
        html += `</p>`;
        html += `</div>`;

        html += `</a></div>`;
      }

      html += `</div></div>`;
    }

    html += `</div>`;
    return html;
  } catch {
    // Not JSON, treat as regular content
    const formatted = enhancedMessageFormatter(textContent);
    return typeof formatted === 'string' ? formatted : textContent;
  }
};

// Enhanced message formatter to handle URLs and structured content
const enhancedMessageFormatter = (message: string): string => {
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

  // Convert **text** to bold
  formattedMessage = formattedMessage.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Preserve line breaks
  formattedMessage = formattedMessage.replace(/\n/g, '<br>');

  return formattedMessage;
};

export const useChatMessage = (entry: ReceivedChatMessage, messageFormatter?: MessageFormatter) => {
  const formattedMessage = React.useMemo(() => {
    const rawMessage = entry.message;

    // Parse the message to check if it's structured
    const { text, isStructured } = parseStructuredMessage(rawMessage);

    if (isStructured) {
      // For structured messages, we only show the TEXT part in chat
      // The VOICE part is used by TTS (handled by LiveKit)
      return createRichTextOutput(text);
    }

    // For regular messages, use the provided formatter or enhanced formatter
    if (messageFormatter) {
      const result = messageFormatter(rawMessage);
      return typeof result === 'string' ? result : rawMessage;
    }

    return enhancedMessageFormatter(rawMessage);
  }, [entry.message, messageFormatter]);

  const hasBeenEdited = !!entry.editTimestamp;
  const time = new Date(entry.timestamp);
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  const name = entry.from?.name && entry.from.name !== '' ? entry.from.name : entry.from?.identity;

  return { message: formattedMessage, hasBeenEdited, time, locale, name };
};
