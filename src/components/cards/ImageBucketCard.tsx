'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Download, Trash2, Archive } from 'lucide-react';
import { GeneratedImage } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ImageBucketCardProps {
    bucketImages: GeneratedImage[];
    onRemoveFromBucket: (timestamp: string) => void;
    onDownloadImage: (dataUrl: string, timestamp: string) => void;
    onDownloadAll: () => void;
}

export default function ImageBucketCard({
    bucketImages,
    onRemoveFromBucket,
    onDownloadImage,
    onDownloadAll
}: ImageBucketCardProps) {
    return (
        <Card className="flex flex-col w-full h-[calc(100vh-8rem)] md:overflow-hidden">
            <CardHeader>
                <CardTitle className="text-[#9b59b6] dark:text-[#fa71cd]">
                    Image Bucket
                </CardTitle>
                <CardDescription>Save your favorite generations here</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">
                {bucketImages.length > 0 ? (
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
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                        <Archive className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Your bucket is empty
                            </p>
                            <p className="text-xs text-primary/70">
                            Add your favs here
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
            {bucketImages.length > 0 && (
                <CardFooter className="border-t pt-4">
                    <Button
                        className="w-full"
                        onClick={onDownloadAll}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download All Images
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}