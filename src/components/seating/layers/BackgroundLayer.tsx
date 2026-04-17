import React from 'react';

interface BackgroundLayerProps {
  backgroundImage: string | null;
  imageOpacity: number;
}

/**
 * BackgroundLayer
 *
 * Renders the venue background image behind all other canvas content.
 * Returns null when no image has been set so there is zero DOM overhead in the
 * common case where the user has not uploaded an image.
 *
 * - pointer-events: none — image never captures mouse/touch events.
 * - z-index: 10 — sits above the canvas background colour but below all
 *   interactive content (boundaries at z-1, this at z-10, rooms at z-20+).
 */
export const BackgroundLayer = ({ backgroundImage, imageOpacity }: BackgroundLayerProps) => {
  if (!backgroundImage) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top left',
        opacity: imageOpacity,
        zIndex: 10,
      }}
      aria-hidden="true"
    />
  );
};
