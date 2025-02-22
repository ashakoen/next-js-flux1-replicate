'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Archive, Loader2, Database, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GeneratedImage } from '@/types/types';

const BucketImageGrid = lazy(() => import('@/components/BucketImageGrid'));

interface ImageBucketCardProps {
    bucketImages: GeneratedImage[];
    onRemoveFromBucket: (timestamp: string) => void;
    onDownloadImage: (dataUrl: string, timestamp: string) => void;
    onDownloadAll: (includeCaptionFiles: boolean) => void; 
    onClearBucket: () => void;
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
    onDownloadAll,
    onClearBucket
}: ImageBucketCardProps) {
    const [storageUsage, setStorageUsage] = useState<number>(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [includeCaptionFiles, setIncludeCaptionFiles] = useState(false);

    const sortedBucketImages = [...bucketImages].sort((b, a) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const handleDownload = () => setShowDownloadDialog(true);

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
        <>
        <Card className="flex flex-col w-full h-[calc(100vh-8rem)] md:overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[#9b59b6] dark:text-[#fa71cd]">
                        Image Bucket
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {bucketImages.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-8 w-8 ${isConfirmingClear ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'}`}
                                            onClick={() => {
                                                if (isConfirmingClear) {
                                                    onClearBucket();
                                                    setIsConfirmingClear(false);
                                                } else {
                                                    setIsConfirmingClear(true);
                                                    setTimeout(() => setIsConfirmingClear(false), 3000);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {isConfirmingClear ? 'Click again to confirm' : 'Clear bucket'}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <Database className="h-3 w-3 mr-1" />
                                        {formatBytes(storageUsage)}
                                    </div>
                                    <div className="flex items-center">
                                        {bucketImages.length} {bucketImages.length === 1 ? 'image' : 'images'}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Storage used by IndexedDB</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>Save your favorite MagicBox creations here</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">
                {bucketImages.length > 0 ? (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    }>
                        <BucketImageGrid
                            bucketImages={sortedBucketImages}
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
                    <Button
                        className="w-full"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isDownloading ? 'Downloading...' : 'Download Images'}
                    </Button>
                </CardFooter>
            )}
        </Card>

<Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
<DialogContent>
    <DialogHeader>
        <DialogTitle>Download Bucket Images</DialogTitle>
        <DialogDescription>
            Choose your download options
        </DialogDescription>
    </DialogHeader>
    <div className="flex items-center space-x-2 py-4">
        <Checkbox
            id="caption-files"
            checked={includeCaptionFiles}
            onCheckedChange={(checked) => setIncludeCaptionFiles(checked as boolean)}
        />
        <label
            htmlFor="caption-files"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
            Include caption files for LoRA training
        </label>
    </div>
    <DialogFooter>
        <Button
            variant="outline"
            onClick={() => setShowDownloadDialog(false)}
        >
            Cancel
        </Button>
        <Button
            onClick={async () => {
                setIsDownloading(true);
                try {
                    await onDownloadAll(includeCaptionFiles);
                } finally {
                    setIsDownloading(false);
                    setShowDownloadDialog(false);
                }
            }}
            disabled={isDownloading}
        >
            {isDownloading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                </>
            ) : (
                'Download'
            )}
        </Button>
    </DialogFooter>
</DialogContent>
</Dialog>
</>
    );
}