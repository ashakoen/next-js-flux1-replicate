'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Image from 'next/image';
import { ArrowUpToLine, Info, Download, Loader2, RefreshCw, Box, Upload, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GeneratedImage, UpscaleParams } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { WandSparkles } from 'lucide-react';
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


interface GeneratedImagesCardProps {
    images: GeneratedImage[];
    setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
    onDownloadImage: (url: string) => void;
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
        const interval = setInterval(() => {
            setImages(prevImages => {
                const filteredImages = prevImages.filter(image => {
                    if (!image.timestamp) return true;
                    const { shouldRemove } = getImageExpiry(image.timestamp);
                    return !shouldRemove;
                });

                if (filteredImages.length !== prevImages.length) {
                    localStorage.setItem('generatedImages', JSON.stringify(filteredImages));
                }
                return filteredImages;
            });
        }, CLEANUP_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [setImages, getImageExpiry]);

    return (


        <Card className="flex flex-col w-full h-[calc(100vh-8rem)] md:overflow-hidden">
            <CardHeader className="relative">
                <div className="absolute top-4 right-4 opacity-60 h-0 overflow-visible">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.0" x="0" y="0" width="2400" height="2287.816323824348" viewBox="125.60858390808106 82.68358085632325 88.78283981323243 84.63284591674805" preserveAspectRatio="xMidYMid meet" colorInterpolationFilters="sRGB" className="w-10 h-10"><g><defs><linearGradient id="92" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#fa71cd"></stop> <stop offset="100%" stopColor="#9b59b6"></stop></linearGradient><linearGradient id="93" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f9d423"></stop> <stop offset="100%" stopColor="#f83600"></stop></linearGradient><linearGradient id="94" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0064d2"></stop> <stop offset="100%" stopColor="#1cb0f6"></stop></linearGradient><linearGradient id="95" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f00978"></stop> <stop offset="100%" stopColor="#3f51b1"></stop></linearGradient><linearGradient id="96" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7873f5"></stop> <stop offset="100%" stopColor="#ec77ab"></stop></linearGradient><linearGradient id="97" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f9d423"></stop> <stop offset="100%" stopColor="#e14fad"></stop></linearGradient><linearGradient id="98" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#009efd"></stop> <stop offset="100%" stopColor="#2af598"></stop></linearGradient><linearGradient id="99" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ffcc00"></stop> <stop offset="100%" stopColor="#00b140"></stop></linearGradient><linearGradient id="100" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#d51007"></stop> <stop offset="100%" stopColor="#ff8177"></stop></linearGradient><linearGradient id="102" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a2b6df"></stop> <stop offset="100%" stopColor="#0c3483"></stop></linearGradient><linearGradient id="103" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7ac5d8"></stop> <stop offset="100%" stopColor="#eea2a2"></stop></linearGradient><linearGradient id="104" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00ecbc"></stop> <stop offset="100%" stopColor="#007adf"></stop></linearGradient><linearGradient id="105" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#b88746"></stop> <stop offset="100%" stopColor="#fdf5a6"></stop></linearGradient></defs><g fill="#9b59b6" className="basesvg" transform="translate(126.47900009155273,83.55399703979492)"><g fillRule="nonzero" stroke="#9b59b6" className="tp-name" transform="translate(0,0)"><g transform="scale(1.7800000000000007)"><g><path d="M0 0.6L0-1.7 3.3-1.7 3.3 0.6 0 0.6ZM1.7-3.3L1.7-3.3Q0.9-3.3 0.45-2.85 0-2.4 0-1.7L0-1.7 0-1.7Q0-0.9 0.45-0.45 0.9 0 1.7 0L1.7 0 1.7 0Q2.4 0 2.85-0.45 3.3-0.9 3.3-1.7L3.3-1.7 3.3-1.7Q3.3-2.4 2.85-2.85 2.4-3.3 1.7-3.3L1.7-3.3ZM1.7-1L1.7-1Q0.9-1 0.45-0.55 0-0.1 0 0.6L0 0.6 0 0.6Q0 1.4 0.45 1.85 0.9 2.3 1.7 2.3L1.7 2.3 1.7 2.3Q2.4 2.3 2.85 1.85 3.3 1.4 3.3 0.6L3.3 0.6 3.3 0.6Q3.3-0.1 2.85-0.55 2.4-1 1.7-1L1.7-1ZM6.3-34.4L6.3-1.7 9.6-1.7 9.6-34.4 6.3-34.4ZM8-3.3L8-3.3Q7.2-3.3 6.75-2.85 6.3-2.4 6.3-1.7L6.3-1.7 6.3-1.7Q6.3-0.9 6.75-0.45 7.2 0 8 0L8 0 8 0Q8.7 0 9.15-0.45 9.6-0.9 9.6-1.7L9.6-1.7 9.6-1.7Q9.6-2.4 9.15-2.85 8.7-3.3 8-3.3L8-3.3ZM8-36L8-36Q7.2-36 6.75-35.55 6.3-35.1 6.3-34.4L6.3-34.4 6.3-34.4Q6.3-33.6 6.75-33.15 7.2-32.7 8-32.7L8-32.7 8-32.7Q8.7-32.7 9.15-33.15 9.6-33.6 9.6-34.4L9.6-34.4 9.6-34.4Q9.6-35.1 9.15-35.55 8.7-36 8-36L8-36ZM12.6-12.4L12.6-1.7 15.9-1.7 15.9-12.4 12.6-12.4ZM14.3-3.3L14.3-3.3Q13.5-3.3 13.05-2.85 12.6-2.4 12.6-1.7L12.6-1.7 12.6-1.7Q12.6-0.9 13.05-0.45 13.5 0 14.3 0L14.3 0 14.3 0Q15 0 15.45-0.45 15.9-0.9 15.9-1.7L15.9-1.7 15.9-1.7Q15.9-2.4 15.45-2.85 15-3.3 14.3-3.3L14.3-3.3ZM14.3-14L14.3-14Q13.5-14 13.05-13.55 12.6-13.1 12.6-12.4L12.6-12.4 12.6-12.4Q12.6-11.6 13.05-11.15 13.5-10.7 14.3-10.7L14.3-10.7 14.3-10.7Q15-10.7 15.45-11.15 15.9-11.6 15.9-12.4L15.9-12.4 15.9-12.4Q15.9-13.1 15.45-13.55 15-14 14.3-14L14.3-14ZM18.9 0.6L18.9-1.7 22.2-1.7 22.2 0.6 18.9 0.6ZM20.6-3.3L20.6-3.3Q19.8-3.3 19.35-2.85 18.9-2.4 18.9-1.7L18.9-1.7 18.9-1.7Q18.9-0.9 19.35-0.45 19.8 0 20.6 0L20.6 0 20.6 0Q21.3 0 21.75-0.45 22.2-0.9 22.2-1.7L22.2-1.7 22.2-1.7Q22.2-2.4 21.75-2.85 21.3-3.3 20.6-3.3L20.6-3.3ZM20.6-1L20.6-1Q19.8-1 19.35-0.55 18.9-0.1 18.9 0.6L18.9 0.6 18.9 0.6Q18.9 1.4 19.35 1.85 19.8 2.3 20.6 2.3L20.6 2.3 20.6 2.3Q21.3 2.3 21.75 1.85 22.2 1.4 22.2 0.6L22.2 0.6 22.2 0.6Q22.2-0.1 21.75-0.55 21.3-1 20.6-1L20.6-1Z" transform="translate(0, 36)" strokeWidth="1.5" strokeLinejoin="round"></path></g> <g fill="#444" stroke="#444" transform="translate(26.700000762939453,0)"><g transform="scale(1)"><path d="M0-18.4L0-1.7 3.3-1.7 3.3-18.4 0-18.4ZM1.7-3.3L1.7-3.3Q0.9-3.3 0.45-2.85 0-2.4 0-1.7L0-1.7 0-1.7Q0-0.9 0.45-0.45 0.9 0 1.7 0L1.7 0 1.7 0Q2.4 0 2.85-0.45 3.3-0.9 3.3-1.7L3.3-1.7 3.3-1.7Q3.3-2.4 2.85-2.85 2.4-3.3 1.7-3.3L1.7-3.3ZM1.7-20L1.7-20Q0.9-20 0.45-19.55 0-19.1 0-18.4L0-18.4 0-18.4Q0-17.6 0.45-17.15 0.9-16.7 1.7-16.7L1.7-16.7 1.7-16.7Q2.4-16.7 2.85-17.15 3.3-17.6 3.3-18.4L3.3-18.4 3.3-18.4Q3.3-19.1 2.85-19.55 2.4-20 1.7-20L1.7-20ZM6.3-26.4L6.3-1.7 9.6-1.7 9.6-26.4 6.3-26.4ZM8-3.3L8-3.3Q7.2-3.3 6.75-2.85 6.3-2.4 6.3-1.7L6.3-1.7 6.3-1.7Q6.3-0.9 6.75-0.45 7.2 0 8 0L8 0 8 0Q8.7 0 9.15-0.45 9.6-0.9 9.6-1.7L9.6-1.7 9.6-1.7Q9.6-2.4 9.15-2.85 8.7-3.3 8-3.3L8-3.3ZM8-28L8-28Q7.2-28 6.75-27.55 6.3-27.1 6.3-26.4L6.3-26.4 6.3-26.4Q6.3-25.6 6.75-25.15 7.2-24.7 8-24.7L8-24.7 8-24.7Q8.7-24.7 9.15-25.15 9.6-25.6 9.6-26.4L9.6-26.4 9.6-26.4Q9.6-27.1 9.15-27.55 8.7-28 8-28L8-28ZM12.6-6.4L12.6-1.7 15.9-1.7 15.9-6.4 12.6-6.4ZM14.3-3.3L14.3-3.3Q13.5-3.3 13.05-2.85 12.6-2.4 12.6-1.7L12.6-1.7 12.6-1.7Q12.6-0.9 13.05-0.45 13.5 0 14.3 0L14.3 0 14.3 0Q15 0 15.45-0.45 15.9-0.9 15.9-1.7L15.9-1.7 15.9-1.7Q15.9-2.4 15.45-2.85 15-3.3 14.3-3.3L14.3-3.3ZM14.3-8L14.3-8Q13.5-8 13.05-7.55 12.6-7.1 12.6-6.4L12.6-6.4 12.6-6.4Q12.6-5.6 13.05-5.15 13.5-4.7 14.3-4.7L14.3-4.7 14.3-4.7Q15-4.7 15.45-5.15 15.9-5.6 15.9-6.4L15.9-6.4 15.9-6.4Q15.9-7.1 15.45-7.55 15-8 14.3-8L14.3-8ZM18.9-24.4L18.9-1.7 22.2-1.7 22.2-24.4 18.9-24.4ZM20.6-3.3L20.6-3.3Q19.8-3.3 19.35-2.85 18.9-2.4 18.9-1.7L18.9-1.7 18.9-1.7Q18.9-0.9 19.35-0.45 19.8 0 20.6 0L20.6 0 20.6 0Q21.3 0 21.75-0.45 22.2-0.9 22.2-1.7L22.2-1.7 22.2-1.7Q22.2-2.4 21.75-2.85 21.3-3.3 20.6-3.3L20.6-3.3ZM20.6-26L20.6-26Q19.8-26 19.35-25.55 18.9-25.1 18.9-24.4L18.9-24.4 18.9-24.4Q18.9-23.6 19.35-23.15 19.8-22.7 20.6-22.7L20.6-22.7 20.6-22.7Q21.3-22.7 21.75-23.15 22.2-23.6 22.2-24.4L22.2-24.4 22.2-24.4Q22.2-25.1 21.75-25.55 21.3-26 20.6-26L20.6-26Z" transform="translate(0, 36)" strokeWidth="1.5" strokeLinejoin="round"></path></g></g></g></g> <g fillRule="nonzero" className="tp-slogan" fill="#444" transform="translate(3.6910018920898438,74.92400360107422)"> <g transform="scale(1, 1)"><g transform="scale(1)"><path d="M2.39 0L0.37 0L3.32-7.73L5.41-7.73L8.36 0L6.35 0L5.65-1.75L3.07-1.75L2.39 0ZM4.36-5.87L3.34-3.18L5.39-3.18L4.36-5.87ZM13.27 0.12L13.27 0.12Q12.50 0.12 11.83 0.01Q11.17-0.11 10.69-0.32L10.69-0.32L10.69-1.97Q11.22-1.74 11.86-1.60Q12.50-1.45 13.08-1.45L13.08-1.45Q13.80-1.45 14.15-1.58Q14.50-1.72 14.50-2.16L14.50-2.16Q14.50-2.46 14.33-2.64Q14.16-2.82 13.77-2.96Q13.38-3.10 12.70-3.29L12.70-3.29Q11.91-3.53 11.44-3.82Q10.98-4.12 10.77-4.54Q10.57-4.96 10.57-5.57L10.57-5.57Q10.57-6.67 11.36-7.26Q12.15-7.85 13.70-7.85L13.70-7.85Q14.37-7.85 15.01-7.75Q15.64-7.64 16.04-7.51L16.04-7.51L16.04-5.86Q15.52-6.06 15.00-6.16Q14.48-6.25 13.99-6.25L13.99-6.25Q13.34-6.25 12.94-6.13Q12.54-6.01 12.54-5.58L12.54-5.58Q12.54-5.33 12.68-5.18Q12.82-5.03 13.18-4.91Q13.53-4.79 14.14-4.62L14.14-4.62Q15.09-4.37 15.60-4.01Q16.10-3.66 16.29-3.20Q16.48-2.74 16.48-2.16L16.48-2.16Q16.48-1.14 15.69-0.51Q14.90 0.12 13.27 0.12ZM21.40 0L19.47 0L19.47-7.73L21.40-7.73L21.40-4.67L24.42-4.67L24.42-7.73L26.36-7.73L26.36 0L24.42 0L24.42-3.06L21.40-3.06L21.40 0ZM31.36 0L29.34 0L32.29-7.73L34.38-7.73L37.33 0L35.32 0L34.62-1.75L32.04-1.75L31.36 0ZM33.32-5.87L32.30-3.18L34.36-3.18L33.32-5.87ZM46.83 0L44.90 0L44.90-7.73L46.83-7.73L46.83-4.73L49.49-7.73L51.70-7.73L48.94-4.57L51.87 0L49.80 0L47.74-3.34L46.83-2.34L46.83 0ZM57.68 0.12L57.68 0.12Q55.80 0.12 54.82-0.84Q53.83-1.80 53.83-3.83L53.83-3.83Q53.83-5.98 54.82-6.91Q55.80-7.85 57.68-7.85L57.68-7.85Q59.57-7.85 60.55-6.91Q61.54-5.98 61.54-3.83L61.54-3.83Q61.54-1.80 60.55-0.84Q59.57 0.12 57.68 0.12ZM57.68-1.52L57.68-1.52Q58.66-1.52 59.11-2.08Q59.56-2.64 59.56-3.83L59.56-3.83Q59.56-5.12 59.11-5.66Q58.66-6.19 57.68-6.19L57.68-6.19Q56.70-6.19 56.25-5.66Q55.80-5.12 55.80-3.83L55.80-3.83Q55.80-2.64 56.25-2.08Q56.70-1.52 57.68-1.52ZM70.22 0L64.52 0L64.52-7.73L70.22-7.73L70.22-6.24L66.45-6.24L66.45-4.62L69.78-4.62L69.78-3.11L66.45-3.11L66.45-1.49L70.22-1.49L70.22 0ZM75.08 0L73.14 0L73.14-7.73L74.80-7.73L78.09-3.11L78.09-7.73L80.03-7.73L80.03 0L78.36 0L75.08-4.61L75.08 0Z" transform="translate(-0.372, 7.848)"></path></g></g></g></g><defs v-gra="od"></defs></g></svg>
                </div>
                <div className="flex items-center gap-2">
                    <CardTitle
                        className="text-[#9b59b6] dark:text-[#fa71cd]"
                        style={{ marginTop: '-1px' }}
                    >
                        Image Generations
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
                <CardDescription>Your generations will show up here. Have fun!</CardDescription>
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
                                            onClick={() => {
                                                // Check if image is already in bucket
                                                const isAlreadyInBucket = bucketImages.some(
                                                    bucketImage => bucketImage.url === image.url
                                                );

                                                if (isAlreadyInBucket) {
                                                    toast.error('Image is already in bucket');
                                                    return;
                                                }

                                                onAddToBucket(image);
                                                //toast.success('Added to bucket');
                                            }}
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onDownloadWithConfig(image.url, image)}
                                        >
                                            <Box className="h-4 w-4" />
                                        </Button>

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

                                                                    {/* Status Indicators */}
                                                                    <div className="flex gap-4">
                                                                        {image.go_fast !== undefined && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className={`w-2 h-2 rounded-full ${image.go_fast ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                                                <span className="text-sm">Go Fast</span>
                                                                            </div>
                                                                        )}
                                                                        {(image.isImg2Img !== undefined || image.model?.includes('real-esrgan') || image.model?.includes('swinir')) && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                                <span className="text-sm">
                                                                                    {image.model?.includes('real-esrgan') || image.model?.includes('swinir')
                                                                                        ? 'Upscaled'
                                                                                        : 'Image to Image'
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
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
                                                                        disabled={isUpscaledImage}
                                                                    >
                                                                        Reuse Prompt
                                                                    </Button>

                                                                    {canUseAsInput(image.model, image.privateLoraName) && (
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
                                                                            disabled={isUpscaledImage}
                                                                        >
                                                                            <Upload className="w-3 h-3 mr-1" />
                                                                            Use as Input
                                                                        </Button>
                                                                    )}

                                                                    {canRegenerate(image.model, image.privateLoraName) && (
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
                                                                            disabled={isUpscaledImage}
                                                                        >
                                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                                            Regenerate
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            onDownloadImage(image.url);
                                                                            toast.success("Image downloading...");
                                                                        }}

                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        Download Image
                                                                    </Button>


                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => onDownloadWithConfig(image.url, image)}
                                                                        disabled={isUpscaledImage}
                                                                    >
                                                                        <Box className="w-3 h-3 mr-1" />
                                                                        Download IMG Pack
                                                                    </Button>

                                                                    <Button
                                                                        className="flex-1"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setShowUpscaleDialog(true)}
                                                                        disabled={isUpscaledImage}
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



                                        {canUseAsInput(image.model, image.privateLoraName) && (
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
                                            onClick={() => onDownloadImage(image.url)}
                                        >
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Download image</span>
                                        </Button>

                                        {canRegenerate(image.model, image.privateLoraName) && (
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
                    <div className="flex flex-col items-center justify-center pt-10 space-y-4">
                        {isGenerating ? (
                            <>
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
                            </>
                        ) : !isLoadingImages && images.length === 0 ? (
                            <>
                                <div className="text-center space-y-4">
                                    <div className="text-center space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Your canvas is empty for now
                                            </p>
                                            <p className="text-xs text-primary/70">
                                                Ready to create something amazing?!?
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Start by generating a new image</p>
                                            <p>or drop an image pack to restore settings</p>
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

    );
}