import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSeating } from '@/hooks/useSeating';
import {
  compressImageToDataUrl,
  validateImageFile,
  validateImageMagicBytes,
  ImageDecodeError,
  ImageOutOfMemoryError,
} from '@/lib/imageUtils';
import { toast } from '@/hooks/use-toast';
import { Upload, RefreshCw, AlertTriangle } from 'lucide-react';

interface StepUploadImageProps {
  onNext: () => void;
}

const ASPECT_WARN_HIGH = 2.5; // very wide
const ASPECT_WARN_LOW = 0.4; // very tall

// Defaults used to wipe stale scale data when the user replaces their
// floor plan image. Keeps the rectangle centered at a sane starting size so
// the next scale calibration starts clean instead of reusing the old crop.
const DEFAULT_ROOM_OUTLINE = {
  x: 25,
  y: 20,
  width: 50,
  height: 50,
  realWorldWidth: 20,
  realWorldHeight: 20,
  isVisible: true,
};

export const StepUploadImage = ({ onNext }: StepUploadImageProps) => {
  const {
    backgroundImageState,
    setBackgroundImage,
    unlockReference,
    isReferenceLocked,
    updateRoomOutline,
  } = useSeating();

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  const hasImage = backgroundImageState.backgroundImage !== null;

  // Compute aspect warning whenever the preview image loads.
  useEffect(() => {
    if (!hasImage) {
      setAspectWarning(null);
      return;
    }
    const img = previewImgRef.current;
    if (!img) return;
    const check = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (!ratio || !isFinite(ratio)) return;
      if (ratio > ASPECT_WARN_HIGH) {
        setAspectWarning(
          'Your floor plan is very wide. Cropping it tighter will give you a clearer canvas.',
        );
      } else if (ratio < ASPECT_WARN_LOW) {
        setAspectWarning(
          'Your floor plan is very tall. Cropping it tighter will give you a clearer canvas.',
        );
      } else {
        setAspectWarning(null);
      }
    };
    if (img.complete && img.naturalWidth > 0) check();
    else img.addEventListener('load', check, { once: true });
  }, [backgroundImageState.backgroundImage, hasImage]);

  const handleFileSelect = async (file: File) => {
    const basicValidation = validateImageFile(file);
    if (!basicValidation.valid) {
      toast({ title: 'Invalid file', description: basicValidation.reason, variant: 'destructive' });
      return;
    }

    const magicBytesValid = await validateImageMagicBytes(file);
    if (!magicBytesValid) {
      toast({
        title: 'Invalid file',
        description: 'File content does not match a supported image format',
        variant: 'destructive',
      });
      return;
    }

    const isReplacement = hasImage;
    setIsUploading(true);
    try {
      if (isReplacement) {
        // New image means old scale rectangle + real-world dimensions no longer
        // line up. Clear both so the user re-calibrates instead of silently
        // inheriting the previous image's scale.
        if (isReferenceLocked) unlockReference();
        updateRoomOutline(DEFAULT_ROOM_OUTLINE);
      }
      const result = await compressImageToDataUrl(file);
      setBackgroundImage(result.dataUrl);
      if (result.compressed) {
        const fromMb = (file.size / (1024 * 1024)).toFixed(1);
        const toMb = (result.bytes / (1024 * 1024)).toFixed(1);
        toast({
          title: 'Image optimized',
          description: `Reduced from ${fromMb} MB to ${toMb} MB so it fits in browser storage.`,
        });
      } else if (isReplacement) {
        toast({
          title: 'New floor plan uploaded',
          description:
            'Your previous scale was cleared — calibrate the new image in the next step.',
        });
      } else {
        toast({ title: 'Image uploaded', description: 'Floor plan image set successfully' });
      }
    } catch (err) {
      if (err instanceof ImageDecodeError) {
        toast({
          title: 'Could not read this image',
          description:
            'The file looks like an image but the browser could not decode it. It may be corrupted — try a different export.',
          variant: 'destructive',
        });
      } else if (err instanceof ImageOutOfMemoryError) {
        toast({
          title: 'Image is too large for this device',
          description:
            'This device ran out of memory while optimizing the image. Try a smaller file (under 10 MB) or resize it first.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: 'Something went wrong while optimizing the image. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleReplace = () => {
    if (isReferenceLocked) unlockReference();
    setBackgroundImage(null);
    updateRoomOutline(DEFAULT_ROOM_OUTLINE);
    setAspectWarning(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Upload your venue floor plan</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload an image of your venue layout to place tables at real-world scale
        </p>
      </div>

      {!hasImage ? (
        <div
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <Upload className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <p className="mb-1 text-sm font-medium">
            {isUploading ? 'Optimizing...' : 'Drop your floor plan here or click to browse'}
          </p>
          <p className="text-muted-foreground text-xs">
            Supports JPEG, PNG, WebP up to 25MB — large images are auto-optimized
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-muted/30 relative overflow-hidden rounded-xl border">
            <img
              ref={previewImgRef}
              src={backgroundImageState.backgroundImage!}
              alt="Venue floor plan"
              className="max-h-[400px] w-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReplace}
              className="absolute top-2 right-2 gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>
          </div>

          {aspectWarning && (
            <div className="border-warning/30 bg-warning/10 text-warning flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{aspectWarning}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!hasImage}>
          Next: Set scale
        </Button>
      </div>
    </div>
  );
};
