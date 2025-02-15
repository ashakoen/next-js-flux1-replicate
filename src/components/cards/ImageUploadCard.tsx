'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

// Add constants for file restrictions
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSIONS = 4096; // Maximum width/height in pixels

interface ImageUploadCardProps {
  onImageSelect: (imageData: { 
      url: string; 
      file: File | null;
      dimensions: {
          width: number;
          height: number;
      }
  }) => void;
  selectedImage: { 
      url: string; 
      file: File | null;
      dimensions?: {
          width: number;
          height: number;
      }
  } | null;
  onClearImage: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function ImageUploadCard({
    onImageSelect,
    selectedImage,
    onClearImage,
    onError,
    disabled = false
}: ImageUploadCardProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragIn = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOut = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const validateImage = async (file: File): Promise<{ isValid: boolean; dimensions?: { width: number; height: number } }> => {
      if (disabled) return { isValid: false };
      if (file.size > MAX_FILE_SIZE) {
          onError?.(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
          return { isValid: false };
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        onError?.(`File type must be ${ACCEPTED_IMAGE_TYPES.map(type => type.split('/')[1]).join(', ')}`);
        return { isValid: false };
    }

    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
                onError?.(`Image dimensions must be ${MAX_DIMENSIONS}x${MAX_DIMENSIONS} or smaller`);
                resolve({ isValid: false });
            }
            resolve({ 
                isValid: true,
                dimensions: {
                    width: img.width,
                    height: img.height
                }
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            onError?.('Failed to load image');
            resolve({ isValid: false });
        };
    });
    };

const handleDrop = async (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const result = await validateImage(file);
        if (result.isValid && result.dimensions) {
            processImageFile(file, result.dimensions);
        }
    }
};

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
        const result = await validateImage(file);
        if (result.isValid && result.dimensions) {
            processImageFile(file, result.dimensions);
        }
    }
};

const processImageFile = (file: File, dimensions: { width: number; height: number }) => {
  const url = URL.createObjectURL(file);
  onImageSelect({ url, file, dimensions });
};
    return (
<Card
  className={`flex flex-col w-full h-[45vh] xl:h-[40vh] relative rounded-lg shadow-md ${
    disabled ? 'opacity-50' : ''
  } bg-muted`}
>
  <Button
    variant="destructive"
    size="icon"
    className={`absolute top-3 right-3 z-10 rounded-md shadow-sm ${
      !selectedImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'
    }`}
    onClick={onClearImage}
    disabled={disabled || !selectedImage}
  >
    <X className="w-4 h-4" />
  </Button>
  <CardHeader className="py-5">
    <CardTitle
      className="flex items-center gap-2 text-sm font-semibold text-foreground tracking-wide"
    >
      <ImageIcon className="w-5 h-5 text-accent" />
      Input Image
    </CardTitle>
  </CardHeader>
  <CardContent className="flex-1 overflow-hidden pr-6">
    {!selectedImage ? (
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors h-full bg-muted/30
        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground'}
        ${
          disabled
            ? 'pointer-events-none'
            : 'hover:border-accent hover:bg-accent/10'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={disabled}
        />
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center gap-4 ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">
              Click to upload
            </span>{' '}
            or drag and drop
            <div className="mt-2">
              PNG, JPG, WEBP (max. {MAX_FILE_SIZE / 1024 / 1024}MB)
            </div>
            <div className="mt-1">
              Max dimensions: {MAX_DIMENSIONS}x{MAX_DIMENSIONS}
            </div>
          </div>
        </label>
      </div>
    ) : (
      <div className="relative h-full">
        <div className="relative w-full h-full">
          <Image
            src={selectedImage.url}
            alt="Selected image"
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
          />
        </div>
      </div>
    )}
  </CardContent>
</Card>
    );
}