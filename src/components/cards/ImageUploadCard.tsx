'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Wand2, Loader2, Copy, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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
  apiKey: string;
  handleSelectChange: (name: string, value: string) => void;
}

interface ImageState {
  isFlipped: boolean;
  description: string | null;
  isGeneratingDescription: boolean;
  isPolling: boolean;
}

export function ImageUploadCard({
    onImageSelect,
    selectedImage,
    onClearImage,
    onError,
    disabled = false,
    apiKey,
    handleSelectChange
}: ImageUploadCardProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [imageState, setImageState] = useState<ImageState>({
      isFlipped: false,
      description: null,
      isGeneratingDescription: false,
      isPolling: false
    });

    const isPollingRef = useRef(false);

    useEffect(() => {
      return () => {
        isPollingRef.current = false;
      };
    }, []);

    const pollForDescription = async (url: string) => {
      if (!isPollingRef.current) return;

      try {
        const response = await fetch('/api/replicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({
            getUrl: url,
          })
        });

        const data = await response.json();
        
        if (data.status === 'succeeded') {
          setImageState(prev => ({ 
            ...prev, 
            description: data.output.join(' '),
            isGeneratingDescription: false,
            isPolling: false
          }));
          isPollingRef.current = false;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Failed to generate description');
        } else {
          // Keep polling if still processing
          setTimeout(() => pollForDescription(url), 2000);
        }
      } catch (error) {
        console.error('Error polling for description:', error);
        onError?.('Failed to generate image description');
        setImageState(prev => ({ 
          ...prev, 
          isGeneratingDescription: false,
          isPolling: false 
        }));
        isPollingRef.current = false;
      }
    };

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
  // Reset image state when new image is uploaded
  setImageState({
    isFlipped: false,
    description: null,
    isGeneratingDescription: false,
    isPolling: false
  });
  isPollingRef.current = false;
  onImageSelect({ url, file, dimensions });
};

// Clear image state when image is removed
const handleClearImage = () => {
  setImageState({
    isFlipped: false,
    description: null,
    isGeneratingDescription: false,
    isPolling: false
  });
  isPollingRef.current = false;
  onClearImage();
};

    return (
<Card
  className={`flex flex-col w-full h-[45vh] xl:h-[40vh] relative rounded-lg shadow-md ${
    disabled ? 'opacity-50' : ''
  } bg-muted`}
>
  <div className="absolute top-3 right-3 z-10 flex gap-2">
    <Button
      variant="outline"
      size="icon"
      className={`rounded-md shadow-sm ${
        !selectedImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'
      }`}
      onClick={() => setImageState(prev => ({ ...prev, isFlipped: !prev.isFlipped }))}
      disabled={disabled || !selectedImage}
      title="Flip Horizontally"
    >
      <svg 
        className="w-4 h-4" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4" />
      </svg>
    </Button>
    <Button
      variant="destructive"
      size="icon"
      className={`rounded-md shadow-sm ${
        !selectedImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'
      }`}
      onClick={handleClearImage}
      disabled={disabled || !selectedImage}
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
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
      <div className="flex flex-col h-full gap-4">
        {imageState.description && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <ScrollArea className="h-[100px]">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground whitespace-pre-wrap">{imageState.description}</p>
                </div>
              </ScrollArea>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  navigator.clipboard.writeText(imageState.description || '');
                  toast.success('Description copied to clipboard');
                }}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleSelectChange('prompt', imageState.description || '')}
                title="Use as prompt"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="relative flex-1">
          <div className="relative w-full h-full">
            <Image
              src={selectedImage.url}
              alt="Selected image"
              layout="fill"
              objectFit="contain"
              className={`rounded-lg transition-transform duration-300 ${imageState.isFlipped ? 'scale-x-[-1]' : ''}`}
            />
          </div>
          <div className="absolute bottom-3 left-3 z-10">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm"
              onClick={async () => {
                if (!selectedImage?.url) return;
                
                setImageState(prev => ({ 
                  ...prev, 
                  isGeneratingDescription: true,
                  isPolling: true 
                }));
                isPollingRef.current = true;

                try {
                  // Convert blob URL to base64
                  const response = await fetch(selectedImage.url);
                  const blob = await response.blob();
                  const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                  });

                  // Send base64 data to API
                  const initialResponse = await fetch('/api/replicate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-API-Key': apiKey
                    },
                    body: JSON.stringify({
                      body: {
                        generateDescription: true,
                        image: base64
                      }
                    })
                  });

                  if (!initialResponse.ok) throw new Error('Failed to generate description');
                  
                  const data = await initialResponse.json();
                  // Start polling with the getUrl
                  pollForDescription(data.urls.get);
                } catch (error) {
                  console.error('Error generating description:', error);
                  onError?.('Failed to generate image description');
                  setImageState(prev => ({ 
                    ...prev, 
                    isGeneratingDescription: false,
                    isPolling: false 
                  }));
                  isPollingRef.current = false;
                }
              }}
              disabled={disabled || imageState.isGeneratingDescription}
            >
              {imageState.isGeneratingDescription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Describe Image
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )}
  </CardContent>
</Card>
    );
}
