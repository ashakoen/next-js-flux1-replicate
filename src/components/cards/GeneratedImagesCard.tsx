'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Image from 'next/image';
import { ArrowUpToLine, Info, Download, Loader2, RefreshCw, Box, Upload, Star, Crop } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GeneratedImage, UpscaleParams } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { CropModal } from '@/components/modals/CropModal';
import type { Crop as CropType } from 'react-image-crop';
import { WandSparkles } from 'lucide-react';
import { toast } from "sonner";
import { db } from '@/services/indexedDB';

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


interface GeneratedImagesCardProps {
    images: GeneratedImage[];
    setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
    onDownloadImage: (url: string, isBlob?: boolean) => Promise<void>;
    onDeleteImage: (timestamp: string) => void;
    clearGeneratedImages: () => void;
    isGenerating: boolean;
    numberOfOutputs: number;
    onRegenerateWithSeed: (seed: number, modelType: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3') => void;
    onUseAsInput: (url: string) => Promise<void>;
    model: string;
    onReusePrompt: (prompt: string) => void;
    onUpscaleImage: (params: UpscaleParams) => void;
    onDownloadWithConfig: (imageUrl: string, image: GeneratedImage) => void;
    onAddToBucket: (image: GeneratedImage) => void;
    bucketImages: GeneratedImage[];
    isLoadingImages: boolean;
}

export function GeneratedImagesCard({
    images,
    setImages,
    onDownloadImage,
    onDeleteImage,
    clearGeneratedImages,
    isLoadingImages,
    isGenerating,
    numberOfOutputs,
    onRegenerateWithSeed,
    onUseAsInput,
    model,
    onReusePrompt,
    onUpscaleImage,
    onDownloadWithConfig,
    onAddToBucket,
    bucketImages
}: GeneratedImagesCardProps & { onReusePrompt: (prompt: string) => void }) {
    const [showUpscaleDialog, setShowUpscaleDialog] = useState(false);
    const [faceEnhance, setFaceEnhance] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [openImageUrl, setOpenImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

    const [upscaleModel, setUpscaleModel] = useState<'real-esrgan' | 'swinir'>('real-esrgan');
    const [swinirTaskType, setSwinirTaskType] = useState<'Real-World Image Super-Resolution-Large' | 'Real-World Image Super-Resolution-Medium'>('Real-World Image Super-Resolution-Large');


    // Constants for timing
    const EXPIRY_TIME_MS = 3600000; // 1 hour
    const EXPIRY_TIME_MS_REMOVE = 60000;
    const TOTAL_REMOVAL_TIME = EXPIRY_TIME_MS + EXPIRY_TIME_MS_REMOVE;
    const CLEANUP_INTERVAL_MS = 60000;

    // For determining if image can be used as input (includes Recraft)
    const canUseAsInput = (model: string | undefined, privateLoraName?: string) => {
        if (!model) return false;

        // Allow for FLUX models, private LoRAs, and Recraft
        return model.includes('flux-dev') ||
            model.includes('flux-schnell') ||
            model.includes('flux-pro') ||
            model.includes('flux-pro-ultra') ||
            model.includes('recraft') ||
            model.includes('/');
    };


    const getImageExpiry = useCallback((timestamp: string) => {
        const imageTime = new Date(timestamp).getTime();
        const currentTime = Date.now();
        const timeLeft = Math.max(0, EXPIRY_TIME_MS - (currentTime - imageTime));
        const shouldRemove = (currentTime - imageTime) > TOTAL_REMOVAL_TIME;

        return {
            isExpired: timeLeft === 0,
            timeLeft,
            shouldRemove
        };
    }, [EXPIRY_TIME_MS, TOTAL_REMOVAL_TIME]);

    // For determining if image can be regenerated (excludes Recraft)
    const canRegenerate = (model: string | undefined, privateLoraName?: string) => {
        if (!model) return false;

        // Only allow for FLUX models and private LoRAs, but not Recraft
        return (model.includes('flux-dev') ||
            model.includes('flux-schnell') ||
            model.includes('flux-pro') ||
            model.includes('flux-pro-ultra') ||
            (model.includes('/') && !model.includes('recraft')));
    };

    useEffect(() => {
        // Only set loading to false if we have images or after a short delay
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Add a small delay to prevent flash

        return () => clearTimeout(timer);
    }, [images]);

    useEffect(() => {
        // Once images are loaded, set loading to false
        setIsLoading(false);
    }, [images]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isConfirming) {
            timeoutId = setTimeout(() => {
                setIsConfirming(false);
            }, 3000);
        }
        return () => clearTimeout(timeoutId);
    }, [isConfirming]);

    useEffect(() => {
        const interval = setInterval(async () => {
            await db.cleanupExpiredImages();
            const images = await db.getImages();
            setImages(images);
        }, CLEANUP_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [setImages]);

    return (
        <>
        <Card className="flex flex-col w-full h-[calc(100vh-8rem)] md:overflow-hidden">
            <CardHeader className="relative">

                <div className="flex items-center gap-2">
                    <CardTitle
                        className="text-[#9b59b6] dark:text-[#fa71cd]"
                        style={{ marginTop: '-1px' }}
                    >
                        Created Images
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Images expire after 1 hour.<br />Save to bucket or download to keep.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>Your Magix Box creations will show up here. Have fun!</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">


                {images.length > 0 ? (
                    <div className="h-full overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 3xl:grid-cols-4 gap-8 p-2 overflow-x-hidden">
                            <AnimatePresence mode="popLayout">
                                {/* Loading Placeholders */}
                                {isGenerating && Array.from({ length: numberOfOutputs }).map((_, index) => (
                                    <motion.div
                                        key={`placeholder-${index}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative group aspect-square w-full"
                                    >
                                        <div className="cursor-pointer">
                                            <div className="relative w-full pb-[100%] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <motion.div
                                                        className="flex flex-col items-center gap-2"
                                                        animate={{
                                                            scale: [1, 1.1, 1],
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                    >

                                                        <motion.div
                                                            animate={{
                                                                opacity: [0, 1, 0],
                                                                y: [-5, 0, -5]
                                                            }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity,
                                                            }}
                                                        >
                                                            <span className="text-3xl">
                                                                <WandSparkles className="w-8 h-8" stroke="#cccccc" />
                                                            </span>
                                                        </motion.div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}



                                {[...images].reverse().map((image, index) => (



                                    <motion.div
                                        key={image.url}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative group aspect-square w-full"
                                    >

                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async () => {
                                                try {
                                                    // Check if image is already in bucket
                                                    const isAlreadyInBucket = bucketImages.some(
                                                        bucketImage => bucketImage.url === image.url
                                                    );

                                                    if (isAlreadyInBucket) {
                                                        toast.error('Image is already in bucket');
                                                        return;
                                                    }

                                                    // If it's a blob URL (cropped image), convert to base64
                                                    if (image.url.startsWith('blob:')) {
                                                        const response = await fetch(image.url);
                                                        const blob = await response.blob();
                                                        const reader = new FileReader();
                                                        const base64Data = await new Promise<string>((resolve) => {
                                                            reader.onloadend = () => resolve(reader.result as string);
                                                            reader.readAsDataURL(blob);
                                                        });
                                                        
                                                        // Create a new image object with the base64 URL
                                                        const imageWithBase64 = {
                                                            ...image,
                                                            url: base64Data
                                                        };
                                                        onAddToBucket(imageWithBase64);
                                                    } else {
                                                        onAddToBucket(image);
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to add image to bucket:', error);
                                                    toast.error('Failed to add image to bucket');
                                                }
                                            }}
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>

                                        {!image.isEdited && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onDownloadWithConfig(image.url, image)}
                                            >
                                                <Box className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <Dialog open={openImageUrl === image.url} onOpenChange={(open) => setOpenImageUrl(open ? image.url : null)}>
                                            <DialogTrigger asChild>
                                                <div className="cursor-pointer">
                                                    <div className="relative w-full pb-[100%] transition-transform duration-200 transform group-hover:scale-105">
                                                        <Image
                                                            src={image.url}
                                                            alt={`Generated image ${index + 1}`}
                                                            layout="fill"
                                                            objectFit="cover"
                                                            className="rounded-lg shadow-md"
                                                        />
                                                        {(() => {
                                                            if (!image.timestamp) return null;
                                                            const { isExpired, timeLeft } = getImageExpiry(image.timestamp);
                                                            const showWarning = timeLeft > 0 && timeLeft < 300000;

                                                            return (
                                                                showWarning ? (
                                                                    <div className="absolute top-0 left-0 right-0 z-10 bg-red-500/80 text-white text-sm py-1 px-2 text-center rounded-t-lg">
                                                                        Expires Soon
                                                                    </div>
                                                                ) : isExpired ? (
                                                                    <div className="absolute top-0 left-0 right-0 z-10 bg-gray-500/80 text-white text-sm py-1 px-2 text-center rounded-t-lg">
                                                                        Expired!
                                                                    </div>
                                                                ) : null
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] p-0 overflow-y-auto"> {/* Increased max-width */}
                                                {(() => {
                                                    const isUpscaledImage = image.model?.includes('real-esrgan') || image.model?.includes('swinir');

                                                    return (
                                                        <div className="flex h-full">

                                                            <div className="relative bg-black/5 dark:bg-white/5 flex-1">{/* Changed to flex-[2] for better ratio */}
                                                                <div className="relative w-full h-full">
                                                                    <Image
                                                                        src={image.url}
                                                                        alt={`Generated image ${index + 1}`}
                                                                        layout="fill"
                                                                        objectFit="contain"
                                                                        className="rounded-l-lg"
                                                                        priority
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Right side - Details */}
                                                            <div className="w-[340px] flex flex-col bg-white dark:bg-gray-800 p-6 overflow-y-auto">  {/* Adjusted width constraints */}
                                                                <div className="mb-4">  {/* Removed the custom close button */}
                                                                    <h2 className="text-lg font-semibold">Image Details</h2>
                                                                </div>

                                                                {/* Main Details */}
                                                                <div className="space-y-6 w-full"> {/* Reduced spacing */}
                                                                    {/* Prompt Section */}
                                                                    {image.prompt && (
                                                                        <div className="space-y-1.5">
                                                                            <h3 className="text-sm font-medium text-gray-400">Prompt</h3>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{image.prompt}</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Model & Seed */}
                                                                    <div className={`grid ${(!image.seed || image.model?.includes('real-esrgan') || image.model?.includes('swinir')) ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                                                                        {image.model && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-400">Model</h3>
                                                                                <p className="text-sm mt-0.5 break-words">{image.model}</p>
                                                                            </div>
                                                                        )}
                                                                        {image.seed !== undefined && !image.model?.includes('real-esrgan') && !image.model?.includes('swinir') && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-400">Seed</h3>
                                                                                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                                                    {image.seed}
                                                                                </code>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Generation Settings */}
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        {image.aspect_ratio && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aspect Ratio</h3>
                                                                                <p className="text-sm mt-0.5">{image.aspect_ratio}</p>
                                                                            </div>
                                                                        )}
                                                                        {image.guidance_scale !== undefined && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Guidance Scale</h3>
                                                                                <p className="text-sm mt-0.5">{image.guidance_scale}</p>
                                                                            </div>
                                                                        )}
                                                                        {image.num_inference_steps !== undefined && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inference Steps</h3>
                                                                                <p className="text-sm mt-0.5">{image.num_inference_steps}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Luma Reference Images Section */}
                                                                        {image.image_reference_url && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Image Reference</h3>
                                                                                <p className="text-sm mt-0.5 break-words">{image.image_reference_url}</p>
                                                                                <p className="text-sm mt-0.5">Weight: {image.image_reference_weight}</p>
                                                                            </div>
                                                                        )}

                                                                        {image.style_reference_url && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Style Reference</h3>
                                                                                <p className="text-sm mt-0.5 break-words">{image.style_reference_url}</p>
                                                                                <p className="text-sm mt-0.5">Weight: {image.style_reference_weight}</p>
                                                                            </div>
                                                                        )}

                                                                        {image.character_reference_url && (
                                                                            <div>
                                                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Character Reference</h3>
                                                                                <p className="text-sm mt-0.5 break-words">{image.character_reference_url}</p>
                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                    {/* Processing History */}
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                        <span className="text-sm">
                                                                            {(() => {
                                                                                const history = [];
                                                                                if (image.isImg2Img) history.push('Image to Image');
                                                                                if (image.model?.includes('real-esrgan') || image.model?.includes('swinir')) history.push('Upscaled');
                                                                                if (image.isEdited) history.push('Cropped');
                                                                                if (image.go_fast) history.push('Go Fast');
                                                                                return history.length > 0 ? history.join(' → ') : 'Original';
                                                                            })()}
                                                                        </span>
                                                                    </div>

                                                                    {/* Version */}
                                                                    {image.version && (
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</h3>
                                                                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 block overflow-x-auto">
                                                                                {image.version}
                                                                            </code>
                                                                        </div>
                                                                    )}

                                                                    {/* Additional Fields */}
                                                                    {image.lora_scale !== undefined && (
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">LoRA Scale</h3>
                                                                            <p className="text-sm mt-0.5">{image.lora_scale}</p>
                                                                        </div>
                                                                    )}
                                                                    {image.privateLoraName && (
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Private LoRA</h3>
                                                                            <p className="text-sm mt-0.5">{image.privateLoraName}</p>
                                                                        </div>
                                                                    )}

                                                                    {image.extra_lora && (
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Extra LoRA</h3>
                                                                            <p className="text-sm mt-0.5">{image.extra_lora}</p>
                                                                        </div>
                                                                    )}
                                                                    {image.extra_lora_scale !== undefined && image.extra_lora && (
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Extra LoRA Scale</h3>
                                                                            <p className="text-sm mt-0.5">{image.extra_lora_scale}</p>
                                                                        </div>
                                                                    )}

                                                                    {(image.sourceImageUrl || image.maskDataUrl) && (
                                                                        <div className="space-y-4 border-t pt-4">
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Source Images</h3>

                                                                            {image.sourceImageUrl && (
                                                                                <div className="space-y-1.5">
                                                                                    <h4 className="text-sm font-medium text-gray-400">Input Image</h4>
                                                                                    <div className="relative h-20 w-20 rounded overflow-hidden">
                                                                                        <Image
                                                                                            src={image.sourceImageUrl}
                                                                                            alt="Source image"
                                                                                            layout="fill"
                                                                                            objectFit="cover"
                                                                                            className="rounded"
                                                                                        />
                                                                                    </div>
                                                                                    {image.prompt_strength && (
                                                                                        <p className="text-xs text-gray-500">Strength: {image.prompt_strength}</p>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {image.maskDataUrl && (
                                                                                <div className="space-y-1.5">
                                                                                    <h4 className="text-sm font-medium text-gray-400">Inpainting Mask</h4>
                                                                                    <div className="relative h-20 w-20 rounded overflow-hidden">
                                                                                        <div className="absolute inset-0 bg-gray-800/20" /> {/* Semi-transparent background */}
                                                                                        <Image
                                                                                            src={image.maskDataUrl}
                                                                                            alt="Inpainting mask"
                                                                                            layout="fill"
                                                                                            objectFit="cover"
                                                                                            className="rounded border border-white/40 dark:border-white/25" // Added border
                                                                                            style={{
                                                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light background to show white masks
                                                                                                mixBlendMode: 'normal'
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}


                                                                    {/* Luma Reference Images Section */}
                                                                    {(image.image_reference_url || image.style_reference_url || image.character_reference_url) && (
                                                                        <div className="space-y-4 border-t pt-4"> {/* Added border and padding for section separation */}
                                                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Luma Reference Images</h3>

                                                                            {image.image_reference_url && (
                                                                                <div className="space-y-1.5">
                                                                                    <h4 className="text-sm font-medium text-gray-400">Image Reference</h4>
                                                                                    <div className="relative h-20 w-20 rounded overflow-hidden">
                                                                                        <Image
                                                                                            src={image.image_reference_url}
                                                                                            alt="Reference image"
                                                                                            layout="fill"
                                                                                            objectFit="cover"
                                                                                            className="rounded"
                                                                                        />
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-500">Weight: {image.image_reference_weight}</p>
                                                                                </div>
                                                                            )}

                                                                            {image.style_reference_url && (
                                                                                <div className="space-y-1.5">
                                                                                    <h4 className="text-sm font-medium text-gray-400">Style Reference</h4>
                                                                                    <div className="relative h-20 w-20 rounded overflow-hidden">
                                                                                        <Image
                                                                                            src={image.style_reference_url}
                                                                                            alt="Style reference"
                                                                                            layout="fill"
                                                                                            objectFit="cover"
                                                                                            className="rounded"
                                                                                        />
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-500">Weight: {image.style_reference_weight}</p>
                                                                                </div>
                                                                            )}

                                                                            {image.character_reference_url && (
                                                                                <div className="space-y-1.5">
                                                                                    <h4 className="text-sm font-medium text-gray-400">Character Reference</h4>
                                                                                    <div className="relative h-20 w-20 rounded overflow-hidden">
                                                                                        <Image
                                                                                            src={image.character_reference_url}
                                                                                            alt="Character reference"
                                                                                            layout="fill"
                                                                                            objectFit="cover"
                                                                                            className="rounded"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                </div>



                                                                {/* Action Buttons */}
                                                                <div className="mt-auto pt-4 flex flex-col gap-2"> {/* Reduced gap and padding */}
                                                                    <Button

                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            onReusePrompt(image.prompt);
                                                                            setOpenImageUrl(null);
                                                                            toast.success("Prompt copied to input");
                                                                        }}
                                                                    >
                                                                        Reuse Prompt
                                                                    </Button>

                                                                    {canUseAsInput(image.model, image.privateLoraName) && !image.isEdited && (
                                                                        <Button
                                                                            className="flex-1"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await onUseAsInput(image.url);
                                                                                    setOpenImageUrl(null);  // Close modal
                                                                                    toast.success("Image set as input");  // Show toast
                                                                                } catch (error) {
                                                                                    console.error('Failed to use image as input:', error);
                                                                                }
                                                                            }}
                                                                            disabled={image.isEdited}
                                                                        >
                                                                            <Upload className="w-3 h-3 mr-1" />
                                                                            Use as Input
                                                                        </Button>
                                                                    )}

                                                                    {canRegenerate(image.model, image.privateLoraName) && !image.isEdited && (
                                                                        <Button
                                                                            className="flex-1"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                const currentSeed = parseInt(image.seed?.toString() || '0');
                                                                                const newSeed = currentSeed < 1000 ? currentSeed + 1 : currentSeed - 1;

                                                                                // Enhanced model type detection - matching the hover button logic
                                                                                let modelType: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3';

                                                                                if (image.model?.includes('flux')) {
                                                                                    if (image.model.includes('pro-ultra')) {
                                                                                        modelType = 'pro-ultra';
                                                                                    } else if (image.model.includes('pro')) {
                                                                                        modelType = 'pro';
                                                                                    } else if (image.model.includes('schnell')) {
                                                                                        modelType = 'schnell';
                                                                                    } else {
                                                                                        modelType = 'dev';
                                                                                    }
                                                                                } else if (image.model?.includes('recraftv3')) {
                                                                                    modelType = 'recraftv3';
                                                                                } else {
                                                                                    modelType = 'dev';
                                                                                }

                                                                                onRegenerateWithSeed(newSeed, modelType);
                                                                                setOpenImageUrl(null);
                                                                                toast.success("Regenerating with a lower seed value");
                                                                            }}
                                                                            disabled={image.isEdited}
                                                                        >
                                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                                            Regenerate
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            try {
                                                                                if (image.url.startsWith('blob:')) {
                                                                                    // For blob URLs, convert to base64
                                                                                    const response = await fetch(image.url);
                                                                                    const blob = await response.blob();
                                                                                    const reader = new FileReader();
                                                                                    const base64Data = await new Promise<string>((resolve) => {
                                                                                        reader.onloadend = () => resolve(reader.result as string);
                                                                                        reader.readAsDataURL(blob);
                                                                                    });
                                                                                    await onDownloadImage(base64Data);
                                                                                } else {
                                                                                    // For regular URLs, send as is
                                                                                    await onDownloadImage(image.url);
                                                                                }
                                                                                toast.success("Image downloading...");
                                                                            } catch (error) {
                                                                                console.error('Failed to download image:', error);
                                                                                toast.error('Failed to download image');
                                                                            }
                                                                        }}

                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        Download Image
                                                                    </Button>

                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            try {
                                                                                // Check if image is already in bucket
                                                                                const isAlreadyInBucket = bucketImages.some(
                                                                                    bucketImage => bucketImage.url === image.url
                                                                                );

                                                                                if (isAlreadyInBucket) {
                                                                                    toast.error('Image is already in bucket');
                                                                                    return;
                                                                                }

                                                                                // If it's a blob URL (cropped image), convert to base64
                                                                                if (image.url.startsWith('blob:')) {
                                                                                    const response = await fetch(image.url);
                                                                                    const blob = await response.blob();
                                                                                    const reader = new FileReader();
                                                                                    const base64Data = await new Promise<string>((resolve) => {
                                                                                        reader.onloadend = () => resolve(reader.result as string);
                                                                                        reader.readAsDataURL(blob);
                                                                                    });
                                                                                    
                                                                                    // Create a new image object with the base64 URL
                                                                                    const imageWithBase64 = {
                                                                                        ...image,
                                                                                        url: base64Data
                                                                                    };
                                                                                    onAddToBucket(imageWithBase64);
                                                                                } else {
                                                                                    onAddToBucket(image);
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Failed to add image to bucket:', error);
                                                                                toast.error('Failed to add image to bucket');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Star className="w-3 h-3 mr-1" />
                                                                        Add to Bucket
                                                                    </Button>


                                                                    {!image.isEdited && (
                                                                        <Button
                                                                            className="flex-1"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => onDownloadWithConfig(image.url, image)}
                                                                            disabled={image.isEdited}
                                                                        >
                                                                            <Box className="w-3 h-3 mr-1" />
                                                                            Download IMG Pack
                                                                        </Button>
                                                                    )}

                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setCropImageUrl(image.url);
                                                                            setShowCropModal(true);
                                                                            setOpenImageUrl(null);
                                                                        }}
                                                                    >
                                                                        <Crop className="w-3 h-3 mr-1" />
                                                                        Crop Image
                                                                    </Button>

                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setShowUpscaleDialog(true)}
                                                                    >
                                                                        <ArrowUpToLine className="w-3 h-3 mr-1" />
                                                                        Upscale
                                                                    </Button>
                                                                    <Dialog open={showUpscaleDialog} onOpenChange={setShowUpscaleDialog}>
                                                                        <DialogContent className="sm:max-w-[425px]">
                                                                            <DialogHeader>
                                                                                <DialogTitle>Upscale Settings</DialogTitle>
                                                                            </DialogHeader>

                                                                            <div className="space-y-4 py-4">
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="upscale-model">Upscale Model</Label>
                                                                                    <Select
                                                                                        defaultValue={upscaleModel}
                                                                                        onValueChange={(value) => {
                                                                                            if (value === 'real-esrgan' || value === 'swinir') {
                                                                                                setUpscaleModel(value);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <SelectTrigger>
                                                                                            <SelectValue placeholder="Select upscale model" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="real-esrgan">Real-ESRGAN</SelectItem>
                                                                                            <SelectItem value="swinir">SwinIR</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>

                                                                                {upscaleModel === 'real-esrgan' && (
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <Checkbox
                                                                                            id="face-enhance"
                                                                                            checked={faceEnhance}
                                                                                            onCheckedChange={(checked) => setFaceEnhance(checked as boolean)}
                                                                                        />
                                                                                        <Label htmlFor="face-enhance">Enhance faces</Label>
                                                                                    </div>
                                                                                )}

                                                                                {upscaleModel === 'swinir' && (
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="task-type">Processing Type</Label>
                                                                                        <Select
                                                                                            defaultValue="Real-World Image Super-Resolution-Large"
                                                                                            onValueChange={(value) => {
                                                                                                if (value === 'Real-World Image Super-Resolution-Large' || value === 'Real-World Image Super-Resolution-Medium') {
                                                                                                    setSwinirTaskType(value);
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select processing type" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="Real-World Image Super-Resolution-Large">Large</SelectItem>
                                                                                                <SelectItem value="Real-World Image Super-Resolution-Medium">Medium</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <DialogFooter>
                                                                                <Button variant="outline" onClick={() => setShowUpscaleDialog(false)}>Cancel</Button>
                                                                                <Button onClick={() => {
                                                                                    const upsizeParams = upscaleModel === 'real-esrgan' ? {
                                                                                        version: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
                                                                                        input: {
                                                                                            image: image.url,
                                                                                            scale: 2,
                                                                                            face_enhance: faceEnhance
                                                                                        }
                                                                                    } : {
                                                                                        version: "660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a",
                                                                                        input: {
                                                                                            image: image.url,
                                                                                            jpeg: 40,
                                                                                            noise: 15,
                                                                                            task_type: swinirTaskType
                                                                                        }
                                                                                    };

                                                                                    setShowUpscaleDialog(false);
                                                                                    setOpenImageUrl(null);
                                                                                    onUpscaleImage(upsizeParams);
                                                                                }}>
                                                                                    Start Upscale
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </DialogContent>
                                        </Dialog>



                                        {canUseAsInput(image.model, image.privateLoraName) && !image.isEdited && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                onClick={async () => {
                                                    try {
                                                        await onUseAsInput(image.url);
                                                    } catch (error) {
                                                        console.error('Failed to use image as input:', error);
                                                    }
                                                }}
                                            >
                                                <Upload className="h-4 w-4" />
                                                <span className="sr-only">Use as input image</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            onClick={async () => {
                                                try {
                                                    if (image.url.startsWith('blob:')) {
                                                        // For blob URLs, convert to base64
                                                        const response = await fetch(image.url);
                                                        const blob = await response.blob();
                                                        const reader = new FileReader();
                                                        const base64Data = await new Promise<string>((resolve) => {
                                                            reader.onloadend = () => resolve(reader.result as string);
                                                            reader.readAsDataURL(blob);
                                                        });
                                                        await onDownloadImage(base64Data);
                                                    } else {
                                                        // For regular URLs, send as is
                                                        await onDownloadImage(image.url);
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to download image:', error);
                                                    toast.error('Failed to download image');
                                                }
                                            }}
                                        >
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Download image</span>
                                        </Button>

                                        {canRegenerate(image.model, image.privateLoraName) && !image.isEdited && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                onClick={() => {
                                                    const currentSeed = parseInt(image.seed?.toString() || '0');
                                                    const newSeed = currentSeed < 1000 ? currentSeed + 1 : currentSeed - 1;

                                                    // Enhanced model type detection
                                                    let modelType: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3';

                                                    if (image.model?.includes('flux')) {
                                                        if (image.model.includes('pro-ultra')) {
                                                            modelType = 'pro-ultra';
                                                        } else if (image.model.includes('pro')) {
                                                            modelType = 'pro';
                                                        } else if (image.model.includes('schnell')) {
                                                            modelType = 'schnell';
                                                        } else {
                                                            modelType = 'dev';
                                                        }
                                                    } else if (image.model?.includes('recraftv3')) {
                                                        modelType = 'recraftv3';
                                                    } else {
                                                        modelType = 'dev';
                                                    }

                                                    onRegenerateWithSeed(newSeed, modelType);
                                                }}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Regenerate with {parseInt(image.seed?.toString() || '0') < 1000 ? "increased" : "decreased"} seed
                                                </span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            onClick={() => onDeleteImage(image.timestamp)}
                                        >
                                            <span className="sr-only">Delete image</span>
                                            &times;
                                        </Button>

                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-full pt-10 space-y-4">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-38rem)] space-y-4">
                                <motion.div
                                    className="flex flex-col items-center justify-center gap-4"
                                >
                                    <motion.div
                                        animate={{
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                        className="relative"
                                    >
                                        <Loader2 className="w-8 h-8 text-primary" />
                                        <motion.div
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                            animate={{
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <span className="text-lg">✨</span>
                                        </motion.div>
                                    </motion.div>
                                    <motion.p
                                        className="text-sm text-muted-foreground text-center"
                                        animate={{ opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        Generating your image...
                                    </motion.p>
                                </motion.div>
                            </div>
                        ) : !isLoadingImages && images.length === 0 ? (
                            <>
                                <div className="text-center space-y-4">
                                    <div className="text-center space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Your Magic Box canvas is empty for now
                                            </p>
                                            <p className="text-xs text-primary/70">
                                                Ready to create something amazing?!?
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Start by creating a new image</p>
                                            <p>or drop an image pack to restore a previous creation</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button
                    className={`btn-theme ${isConfirming ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => {
                        if (isConfirming) {
                            clearGeneratedImages();
                            setIsConfirming(false);
                        } else {
                            setIsConfirming(true);
                        }
                    }}
                    disabled={images.length === 0}
                >
                    {isConfirming ? 'Are you sure?' : 'Clear Generated Images'}
                </Button>
            </CardFooter>
        </Card>

            <CropModal
                isOpen={showCropModal}
                onClose={() => {
                    setShowCropModal(false);
                    setCropImageUrl(null);
                }}
                imageUrl={cropImageUrl}
                onCropComplete={async (croppedBlob, cropData) => {
                    try {
                        // Convert blob to base64
                        const reader = new FileReader();
                        const base64Data = await new Promise<string>((resolve) => {
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(croppedBlob);
                        });

                        const originalImage = images.find(img => img.url === cropImageUrl);
                        
                        if (originalImage) {
                            const newImage: GeneratedImage = {
                                ...originalImage,
                                url: base64Data,
                                timestamp: new Date().toISOString(),
                                isEdited: true,
                                originalUrl: originalImage.url,
                                sourceImageUrl: originalImage.url,
                                cropData: {
                                    x: cropData.x,
                                    y: cropData.y,
                                    width: cropData.width,
                                    height: cropData.height
                                }
                            };

                            // Save to IndexedDB
                            await db.saveImages([newImage]);
                            
                            // Update state
                            setImages(prev => [...prev, newImage]);
                            
                            setShowCropModal(false);
                            setCropImageUrl(null);
                            toast.success("Image cropped successfully");
                        }
                    } catch (error) {
                        console.error('Failed to save cropped image:', error);
                        toast.error('Failed to save cropped image');
                    }
                }}
            />
        </>
    );
}
