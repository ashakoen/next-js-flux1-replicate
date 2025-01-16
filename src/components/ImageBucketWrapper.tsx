'use client';

import { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Archive, Loader2 } from 'lucide-react';
import { GeneratedImage } from '@/types/types';

const BucketImageGrid = lazy(() => import('@/components/BucketImageGrid'));

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
                <CardFooter className="border-t pt-4">
                    <Button className="w-full" onClick={onDownloadAll}>
                        <Download className="mr-2 h-4 w-4" />
                        Download All Images
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}