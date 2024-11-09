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
    onImageSelect: (imageData: { url: string; file: File | null }) => void;
    selectedImage: { url: string; file: File | null } | null;
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

    const validateImage = async (file: File): Promise<boolean> => {
        if (disabled) return false;
        if (file.size > MAX_FILE_SIZE) {
            onError?.(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return false;
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            onError?.(`File type must be ${ACCEPTED_IMAGE_TYPES.map(type => type.split('/')[1]).join(', ')}`);
            return false;
        }

        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
                    onError?.(`Image dimensions must be ${MAX_DIMENSIONS}x${MAX_DIMENSIONS} or smaller`);
                    resolve(false);
                }
                resolve(true);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                onError?.('Failed to load image');
                resolve(false);
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
            const isValid = await validateImage(file);
            if (isValid) {
                processImageFile(file);
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (file) {
            const isValid = await validateImage(file);
            if (isValid) {
                processImageFile(file);
            }
        }
    };

    const processImageFile = (file: File) => {
        const url = URL.createObjectURL(file);
        onImageSelect({ url, file });
    };

    return (
        <Card className={`w-[310px] ${disabled ? 'opacity-50' : ''}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Input Image
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!selectedImage ? (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'}
                        ${disabled ? 'pointer-events-none' : 'hover:border-primary hover:bg-primary/5'}`}
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
                            className={`flex flex-col items-center gap-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <Upload className="w-6 h-6 text-gray-400" />
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
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
                    <div className="relative">
                        <div className="relative w-full aspect-square">
                            <Image
                                src={selectedImage.url}
                                alt="Selected image"
                                layout="fill"
                                objectFit="contain"
                                className="rounded-lg"
                            />
                        </div>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={onClearImage}
                            disabled={disabled}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}