import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from "sonner";

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onCropComplete: (croppedBlob: Blob, cropData: { x: number; y: number; width: number; height: number }) => void;
}

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function CropModal({ isOpen, onClose, imageUrl, onCropComplete }: CropModalProps) {
  const [selection, setSelection] = useState<Selection>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getMousePosition = useCallback((clientX: number, clientY: number): Point | null => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Only return coordinates if within image bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      return { x, y };
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePosition(e.clientX, e.clientY);
    if (!pos) return;
    
    setStartPoint(pos);
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
    setIsDragging(true);
  }, [getMousePosition]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const pos = getMousePosition(e.clientX, e.clientY);
    if (!pos) return;

    const rect = imageRef.current.getBoundingClientRect();
    let newX = startPoint.x;
    let newY = startPoint.y;
    let newWidth = pos.x - startPoint.x;
    let newHeight = pos.y - startPoint.y;

    // Handle negative dimensions (when dragging left/up)
    if (newWidth < 0) {
      newX = pos.x;
      newWidth = Math.abs(newWidth);
    }
    if (newHeight < 0) {
      newY = pos.y;
      newHeight = Math.abs(newHeight);
    }

    // Constrain to image bounds
    newX = Math.max(0, Math.min(newX, rect.width));
    newY = Math.max(0, Math.min(newY, rect.height));
    newWidth = Math.min(newWidth, rect.width - newX);
    newHeight = Math.min(newHeight, rect.height - newY);

    setSelection({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  }, [isDragging, startPoint, getMousePosition]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleCropComplete = async () => {
    if (!imageRef.current || selection.width === 0 || selection.height === 0) return;

    setIsProcessing(true);
    try {
      const img = imageRef.current;
      
      // Scale the crop coordinates
      const scaledCrop = {
        x: Math.round(selection.x * (img.naturalWidth / img.width)),
        y: Math.round(selection.y * (img.naturalHeight / img.height)),
        width: Math.round(selection.width * (img.naturalWidth / img.width)),
        height: Math.round(selection.height * (img.naturalHeight / img.height))
      };

      const response = await fetch('/api/crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          cropData: scaledCrop
        }),
      });

      if (!response.ok) throw new Error('Failed to crop image');

      const blob = await response.blob();
      onCropComplete(blob, scaledCrop);
    } catch (error) {
      console.error('Failed to crop image:', error);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-4xl p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6">
          <div 
            ref={containerRef}
            className="relative bg-black/5 dark:bg-white/5 rounded-lg p-4"
          >
            {imageUrl && (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className="max-h-[60vh] max-w-[calc(90vw-3rem)] w-auto select-none"
                    onMouseDown={handleMouseDown}
                  />

                  {/* Overlay container */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Dark overlay with instruction text */}
                    {!isDragging && !selection.width && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                        <div className="text-center">
                          <p className="text-lg font-medium">Click and drag to select crop area</p>
                          <div className="mt-2 text-sm opacity-75">Release to complete selection</div>
                        </div>
                      </div>
                    )}

                    {/* Crop selection overlay */}
                    {(isDragging || selection.width > 0) && (
                      <>
                        {/* Dark overlay outside selection */}
                        <div className="absolute inset-0 bg-black/40">
                          <div
                            className="absolute bg-transparent"
                            style={{
                              left: selection.x,
                              top: selection.y,
                              width: selection.width,
                              height: selection.height,
                            }}
                          />
                        </div>

                        {/* Selection box with handles */}
                        <div 
                          className="absolute border-2 border-white"
                          style={{
                            left: selection.x,
                            top: selection.y,
                            width: selection.width,
                            height: selection.height,
                          }}
                        >
                          {/* Corner handles */}
                          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                          <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                          <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                          <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white rounded-full shadow-md" />

                          {/* Dimensions tooltip */}
                          <div className="absolute -translate-x-full -translate-y-full px-2 py-1 bg-black/75 text-white text-xs rounded-md whitespace-nowrap">
                            {Math.round(selection.width * (imageRef.current?.naturalWidth ?? 0) / (imageRef.current?.width ?? 1))}
                            {' × '}
                            {Math.round(selection.height * (imageRef.current?.naturalHeight ?? 0) / (imageRef.current?.height ?? 1))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCropComplete}
            disabled={selection.width === 0 || selection.height === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
