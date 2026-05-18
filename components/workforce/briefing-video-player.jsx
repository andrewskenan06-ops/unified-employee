'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useMemo } from 'react';

function isHls(url) {
  if (!url) return false;
  return /\.m3u8(\?|$)/i.test(url) || url.includes('stream.mux.com');
}

function playbackIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)\.m3u8/);
  return m ? m[1] : null;
}

export function BriefingVideoPlayer({ videoUrl, playbackId, className, autoPlay = false, onEnded, onPlay, onTimeUpdate }) {
  const resolvedPlaybackId = useMemo(
    () => playbackId || playbackIdFromUrl(videoUrl),
    [playbackId, videoUrl]
  );

  if (resolvedPlaybackId) {
    return (
      <MuxPlayer
        playbackId={resolvedPlaybackId}
        streamType="on-demand"
        autoPlay={autoPlay}
        playsInline
        className={className}
        onEnded={onEnded}
        onPlay={onPlay}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (onTimeUpdate && el.duration > 0) onTimeUpdate(el.currentTime, el.duration);
        }}
      />
    );
  }

  if (videoUrl && isHls(videoUrl)) {
    return (
      <MuxPlayer
        src={videoUrl}
        streamType="on-demand"
        autoPlay={autoPlay}
        playsInline
        className={className}
        onEnded={onEnded}
        onPlay={onPlay}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (onTimeUpdate && el.duration > 0) onTimeUpdate(el.currentTime, el.duration);
        }}
      />
    );
  }

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        className={className}
        onEnded={onEnded}
        onPlay={onPlay}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (onTimeUpdate && el.duration > 0) onTimeUpdate(el.currentTime, el.duration);
        }}
      />
    );
  }

  return null;
}
