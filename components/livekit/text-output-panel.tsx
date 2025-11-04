'use client';

import React from 'react';
import { ExternalLink, FileText, Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TextOutputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  textContent: string; // May be plain text OR JSON string containing {content, web_sources, youtube_videos}
  className?: string;
}

export const TextOutputPanel: React.FC<TextOutputPanelProps> = ({
  isOpen,
  onClose,
  textContent,
  className,
}) => {
  // Parse text content to extract structured information
  const parseStructured = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      // Handle the new structured format with text_output
      if (parsed && parsed.content && typeof parsed.content === 'string') {
        return {
          mainContent: parsed.content,
          webSources: Array.isArray(parsed.web_sources) ? parsed.web_sources : [],
          youtubeVideos: Array.isArray(parsed.youtube_videos) ? parsed.youtube_videos : [],
          structured: true,
        };
      }
      // Handle legacy format
      if (parsed && parsed.text_output && typeof parsed.text_output.content === 'string') {
        return {
          mainContent: parsed.text_output.content,
          webSources: Array.isArray(parsed.text_output.web_sources)
            ? parsed.text_output.web_sources
            : [],
          youtubeVideos: Array.isArray(parsed.text_output.youtube_videos)
            ? parsed.text_output.youtube_videos
            : [],
          structured: true,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  const legacyParse = (content: string) => {
    if (!content) return { mainContent: '', webSources: [], youtubeVideos: [], structured: false };
    return { mainContent: content, webSources: [], youtubeVideos: [], structured: false };
  };

  const parsed = parseStructured(textContent) || legacyParse(textContent);

  // Debug: Log what we received from backend
  console.log('=== TextOutputPanel Debug Start ===');
  console.log('1. Raw textContent length:', textContent?.length);
  console.log('2. Parsed data:', {
    hasContent: !!parsed.mainContent,
    contentLength: parsed.mainContent?.length,
    webSourcesCount: parsed.webSources?.length,
    youtubeVideosCount: parsed.youtubeVideos?.length,
    structured: parsed.structured,
  });
  console.log('3. Raw youtube_videos array:', parsed.youtubeVideos);
  
  // Sanitize youtube video objects (remove stray HTML fragments)
  interface RawVideo {
    title?: string;
    url?: string;
    thumbnail?: string;
    thumbnail_hq?: string;
    thumbnail_max?: string;
    video_id?: string;
    [key: string]: unknown;
  }

  const sanitizeVideos = (
    arr: unknown[]
  ): { title: string; url: string; thumbnail?: string; video_id?: string }[] => {
    if (!Array.isArray(arr)) return [];

    const cleanedVideos = arr
      .filter((v): v is RawVideo => !!v && typeof v === 'object')
      .map((v) => {
        const cleanString = (s: unknown): string => {
          if (typeof s !== 'string') return '';

          // First, aggressively remove ALL HTML tags and attributes
          const cleaned = s
            .replace(/<[^>]+>/g, ' ') // Remove HTML tags
            .replace(/target="_blank"/g, '') // Remove target attributes
            .replace(/rel="[^"]*"/g, '') // Remove rel attributes
            .replace(/class="[^"]*"/g, '') // Remove class attributes
            .replace(/alt="[^"]*"/g, '') // Remove alt attributes
            .replace(/🎥\s*Watch Diagnostic Video/g, '') // Remove emoji text
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();

          // Extract YouTube URL if present
          const urlMatch = cleaned.match(
            /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)/
          );
          return urlMatch ? urlMatch[0] : cleaned;
        };

        const rawUrl = v.url;
        const rawTitle = v.title;

        // Clean URL and title
        const url = cleanString(rawUrl);
        const title = cleanString(rawTitle || 'Diagnostic Video');

        // Handle thumbnail - prefer video_id to construct thumbnail URL
        let video_id = v.video_id || '';
        if (!video_id && url) {
          // Extract video_id from URL
          const idMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          video_id = idMatch ? idMatch[1] : '';
        }

        // Always construct thumbnail from video_id for reliability
        const normalizedThumb = video_id
          ? `https://img.youtube.com/vi/${video_id}/mqdefault.jpg`
          : 'https://img.youtube.com/vi/default/mqdefault.jpg';

        return {
          title: title || 'Diagnostic Video',
          url: url || '',
          thumbnail: normalizedThumb,
          video_id,
        };
      })
      .filter((v) => {
        // Only filter out completely invalid entries
        const isValid = v.url && v.video_id && v.url.includes('youtube');
        if (!isValid) {
          console.warn('❌ Filtered out invalid YouTube video:', {
            url: v.url,
            video_id: v.video_id,
            title: v.title,
            hasUrl: !!v.url,
            hasVideoId: !!v.video_id,
            includesYoutube: v.url?.includes('youtube'),
          });
        }
        return isValid;
      });

    console.log('4. After sanitization, cleaned videos count:', cleanedVideos.length);
    console.log('5. Cleaned videos array:', cleanedVideos);
    console.log('=== TextOutputPanel Debug End ===');
    return cleanedVideos;
  };

  const { mainContent, webSources, youtubeVideos } = {
    ...parsed,
    youtubeVideos: sanitizeVideos(parsed.youtubeVideos),
  };

  console.log('6. Final youtubeVideos prop that will be rendered:', youtubeVideos);
  console.log('7. Will YouTube section render?', youtubeVideos.length > 0);

  // Format main content with better structure for diagnostic reports
  const formatMainContent = (content: string, hasStructuredVideos: boolean = false) => {
    // Content should already be properly decoded from backend, but handle any remaining issues
    let decodedContent = content;

    // Handle any remaining escaped sequences (fallback)
    decodedContent = decodedContent
      .replace(/\\n/g, '\n')
      .replace(/\\u2022/g, '•')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    let formattedContent = decodedContent
      // Format section headers (Category, Potential Root Causes, etc.)
      .replace(
        /\*\*([^*]+):\*\*/g,
        '<h3 class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-6 mb-3 border-b border-blue-200 dark:border-blue-800 pb-2">$1</h3>'
      )
      // Format single line category descriptions
      .replace(
        /\*\*Category:\*\*\s*([^\n]+)/g,
        '<div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4"><strong class="text-blue-700 dark:text-blue-300">Category:</strong> <span class="text-gray-800 dark:text-gray-200">$1</span></div>'
      )
      // Format bullet points with better styling
      .replace(
        /^• (.+)$/gm,
        '<div class="flex items-start mb-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded"><span class="text-blue-500 mr-3 mt-1 text-lg">•</span><span class="text-gray-800 dark:text-gray-200 leading-relaxed">$1</span></div>'
      );

    // Only process YouTube URLs in content if we don't have structured YouTube videos
    if (!hasStructuredVideos) {
      formattedContent = formattedContent
        // Convert YouTube URLs to clickable thumbnails with special styling (do this before general URL conversion)
        .replace(
          /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S*)/gi,
          (match, videoId) => {
            return `<div class="my-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <a href="${match}" target="_blank" rel="noopener noreferrer" class="block group">
                <div class="flex items-center space-x-3">
                  <div class="relative flex-shrink-0">
                    <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" 
                         alt="YouTube Thumbnail" 
                         class="w-20 h-15 object-cover rounded group-hover:shadow-lg transition-shadow"
                         onerror="this.src='https://img.youtube.com/vi/default/default.jpg'"/>
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded group-hover:bg-opacity-30 transition-all">
                      <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                      🎥 Watch Diagnostic Video
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${match}</p>
                  </div>
                </div>
              </a>
            </div>`;
          }
        );
    }

    // Always process regular URLs (but skip YouTube URLs if we have structured videos)
    if (hasStructuredVideos) {
      // Skip YouTube URLs when processing regular URLs
      formattedContent = formattedContent.replace(
        /(https?:\/\/(?!(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/))(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.-])*)?(?:\#(?:[\w.-])*)?)/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium break-all"><svg class="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>$1</a>'
      );
    } else {
      // Process all URLs normally
      formattedContent = formattedContent.replace(
        /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.-])*)?(?:\#(?:[\w.-])*)?)/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium break-all"><svg class="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>$1</a>'
      );
    }

    return (
      formattedContent
        // Convert line breaks
        .replace(/\n\n/g, '<div class="my-4"></div>')
        .replace(/\n/g, '<br>')
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'bg-background fixed top-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col border-l shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="bg-muted/30 flex flex-shrink-0 items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Diagnostic Report</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-muted rounded-lg p-2 transition-colors"
                aria-label="Close diagnostic report"
                title="Close diagnostic report"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Made scrollable */}
            <div className="diagnostic-scroll flex-1 overflow-y-auto">
              <div className="space-y-6 p-6">
                {/* Main Content - Diagnostic Report */}
                {mainContent && (
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMainContent(mainContent, youtubeVideos.length > 0),
                      }}
                      className="diagnostic-content"
                    />
                  </div>
                )}

                {/* Web Sources */}
                {webSources.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <h3 className="mb-3 flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Web Sources
                    </h3>
                    <div className="space-y-3">
                      {webSources.map((source: { title: string; url: string }, index: number) => (
                        <div key={index} className="border-l-2 border-blue-300 pl-3">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-medium text-blue-600 underline transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {source.title}
                          </a>
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {source.url}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Videos */}
                {youtubeVideos.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                    <h3 className="mb-3 flex items-center text-lg font-semibold text-red-600 dark:text-red-400">
                      <Play className="mr-2 h-5 w-5" />
                      Diagnostic Videos ({youtubeVideos.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {youtubeVideos.map(
                        (
                          video: {
                            title: string;
                            url: string;
                            thumbnail?: string;
                            video_id?: string;
                          },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                          >
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    video.thumbnail &&
                                    !video.thumbnail.includes('default/default.jpg')
                                      ? video.thumbnail
                                      : video.video_id
                                        ? `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
                                        : 'https://img.youtube.com/vi/default/mqdefault.jpg'
                                  }
                                  alt={video.title}
                                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    // Try alternative thumbnail URLs if the primary fails
                                    if (video.video_id && !target.src.includes('hqdefault')) {
                                      target.src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`;
                                    } else {
                                      target.src = 'https://img.youtube.com/vi/default/default.jpg';
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg">
                                    <Play className="ml-1 h-6 w-6 text-white" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-3">
                                <p className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                                  {video.title}
                                </p>
                              </div>
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
