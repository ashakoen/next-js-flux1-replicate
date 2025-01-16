'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from 'lucide-react';
import { GeneratedImage } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';

interface BucketImageGridProps {
    bucketImages: GeneratedImage[];
    onRemoveFromBucket: (timestamp: string) => void;
    onDownloadImage: (dataUrl: string, timestamp: string) => void;
}

export default function BucketImageGrid({ bucketImages, onRemoveFromBucket, onDownloadImage }: BucketImageGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 auto-rows-fr">
            <AnimatePresence mode="popLayout">
                {bucketImages.map((image) => (
                    <motion.div
                        key={image.timestamp}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group aspect-square w-full"
                    >
                        <Image
                            src={image.url}
                            alt={image.prompt || 'Generated image'}
                            fill
                            className="rounded-lg object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1 sm:gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8"
                                onClick={() => onDownloadImage(image.url, image.timestamp)}
                            >
                                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8"
                                onClick={() => onRemoveFromBucket(image.timestamp)}
                            >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}