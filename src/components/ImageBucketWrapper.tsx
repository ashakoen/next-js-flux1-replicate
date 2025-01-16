'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Archive, Loader2, Database } from 'lucide-react';
import { GeneratedImage } from '@/types/types';

const BucketImageGrid = lazy(() => import('@/components/BucketImageGrid'));

interface ImageBucketCardProps {
    bucketImages: GeneratedImage[];
    onRemoveFromBucket: (timestamp: string) => void;
    onDownloadImage: (dataUrl: string, timestamp: string) => void;
    onDownloadAll: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ImageBucketCard({
    bucketImages,
    onRemoveFromBucket,
    onDownloadImage,
    onDownloadAll
}: ImageBucketCardProps) {
    const [storageUsage, setStorageUsage] = useState<number>(0);

    useEffect(() => {
        const getStorageEstimate = async () => {
            try {
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    const estimate = await navigator.storage.estimate();
                    setStorageUsage(estimate.usage || 0);
                }
            } catch (error) {
                console.error('Error getting storage estimate:', error);
            }
        };

        getStorageEstimate();
    }, [bucketImages]);

    return (
        <Card className="flex flex-col w-full h-[calc(100vh-8rem)] md:overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[#9b59b6] dark:text-[#fa71cd]">
                        Image Bucket
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Database className="h-3 w-3 mr-1" />
                                    {formatBytes(storageUsage)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Storage used by IndexedDB</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>Save your favorite generations here</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">
                {bucketImages.length > 0 ? (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    }>
                        <BucketImageGrid
                            bucketImages={bucketImages}
                            onRemoveFromBucket={onRemoveFromBucket}
                            onDownloadImage={onDownloadImage}
                        />
                    </Suspense>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                        <Archive className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Your bucket is empty</p>
                            <p className="text-xs text-primary/70">Add your favs here</p>
                        </div>
                    </div>
                )}
            </CardContent>
            {bucketImages.length > 0 && (
                <CardFooter className="border-t pt-6">
                    <Button className="w-full" onClick={onDownloadAll}>
                        <Download className="mr-2 h-4 w-4" />
                        Download All Images
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}