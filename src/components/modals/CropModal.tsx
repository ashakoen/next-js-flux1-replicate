import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from "sonner";

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onCropComplete: (croppedBlob: Blob, cropData: Crop) => void;
}

export function CropModal({ isOpen, onClose, imageUrl, onCropComplete }: CropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const img = imgRef.current;
      
      // Calculate scaling factors
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      // Scale the crop coordinates
      const scaledCrop = {
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY)
      };

      // Ensure coordinates don't exceed image bounds
      const adjustedCrop = {
        x: Math.min(scaledCrop.x, img.naturalWidth - 1),
        y: Math.min(scaledCrop.y, img.naturalHeight - 1),
        width: Math.min(scaledCrop.width, img.naturalWidth - scaledCrop.x),
        height: Math.min(scaledCrop.height, img.naturalHeight - scaledCrop.y)
      };

      const response = await fetch('/api/crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          cropData: adjustedCrop
        }),
      });

      if (!response.ok) throw new Error('Failed to crop image');

      const blob = await response.blob();
      onCropComplete(blob, crop);
    } catch (error) {
      console.error('Failed to crop image:', error);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="mt-4 relative min-h-[300px] bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
          >
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                className="max-h-[60vh] mx-auto"
              />
            )}
          </ReactCrop>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCropComplete}
            disabled={!completedCrop?.width || !completedCrop?.height || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
