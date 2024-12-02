'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Image from 'next/image';
import { Download, Loader2, RefreshCw, Upload } from 'lucide-react';
import { GeneratedImage } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { WandSparkles } from 'lucide-react';

interface GeneratedImagesCardProps {
    images: GeneratedImage[];
    onDownloadImage: (imageUrl: string) => Promise<void>;
    onDeleteImage: (imageUrl: string) => void;
    clearGeneratedImages: () => void;
    onRegenerateWithSeed: (newSeed: number, modelType?: 'dev' | 'schnell' | 'pro' | 'recraftv3') => void;
    onUseAsInput: (imageUrl: string) => Promise<void>;
    isGenerating: boolean;
    numberOfOutputs: number;
    model: string;
}

export function GeneratedImagesCard({
    images,
    onDownloadImage,
    onDeleteImage,
    clearGeneratedImages,
    isGenerating,
    numberOfOutputs,
    onRegenerateWithSeed,
    onUseAsInput,
    model
}: GeneratedImagesCardProps) {

    const [isConfirming, setIsConfirming] = useState(false);
    const isFluxModel = (model: string | undefined, privateLoraName?: string) => {
        if (!model) return false;

        // If it's a direct FLUX model
        if (model.includes('flux-dev') || model.includes('flux-schnell') || model.includes('flux-pro')) {
            return true;
        }

        // If the model looks like a private LoRA path (contains a slash but isn't recraft)
        if (model.includes('/') && !model.includes('recraft')) {
            return true;
        }

        return false;
    };

    // For determining if image can be used as input (includes Recraft)
    const canUseAsInput = (model: string | undefined, privateLoraName?: string) => {
        if (!model) return false;

        // Allow for FLUX models, private LoRAs, and Recraft
        return model.includes('flux-dev') ||
            model.includes('flux-schnell') ||
            model.includes('flux-pro') ||
            model.includes('recraft') ||
            model.includes('/');
    };

    // For determining if image can be regenerated (excludes Recraft)
    const canRegenerate = (model: string | undefined, privateLoraName?: string) => {
        if (!model) return false;

        // Only allow for FLUX models and private LoRAs, but not Recraft
        return (model.includes('flux-dev') ||
            model.includes('flux-schnell') ||
            model.includes('flux-pro') ||
            (model.includes('/') && !model.includes('recraft')));
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isConfirming) {
            timeoutId = setTimeout(() => {
                setIsConfirming(false);
            }, 3000);
        }
        return () => clearTimeout(timeoutId);
    }, [isConfirming]);

    return (
        <Card className="flex flex-col w-full h-full">
            <CardHeader className="relative">
                <CardTitle>Your Image Generations</CardTitle>
                <CardDescription>Your generations will show up here. Have fun! </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {images.length > 0 ? (
                    <div className="h-full overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-2">
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
                                        className="relative group aspect-square w-full "
                                    >

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="cursor-pointer">
                                                    <div className="relative w-full pb-[100%]">
                                                        <Image
                                                            src={image.url}
                                                            alt={`Generated image ${index + 1}`}
                                                            layout="fill"
                                                            objectFit="cover"
                                                            className="rounded-lg shadow-md transition-transform duration-200 transform group-hover:scale-105"
                                                        />
                                                    </div>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] p-0 overflow-hidden"> {/* Increased max-width */}
                                            <div className="flex h-full">
                                                    {/* Left side - Image */}
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
                                                            <div className="space-y-1.5">
                                                                <h3 className="text-sm font-medium text-gray-400">Prompt</h3>
                                                                <p className="text-sm text-gray-600 dark:text-gray-300">{image.prompt}</p>
                                                            </div>

                                                            {/* Model & Seed */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {image.model && (
                                                                    <div>
                                                                        <h3 className="text-sm font-medium text-gray-400">Model</h3>
                                                                        <p className="text-sm mt-0.5 break-words">{image.model}</p>
                                                                    </div>
                                                                )}
                                                                {image.seed !== undefined && (
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
                                                            </div>

                                                            {/* Status Indicators */}
                                                            <div className="flex gap-4">
                                                                {image.go_fast !== undefined && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`w-2 h-2 rounded-full ${image.go_fast ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                                        <span className="text-sm">Go Fast</span>
                                                                    </div>
                                                                )}
                                                                {image.isImg2Img !== undefined && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`w-2 h-2 rounded-full ${image.isImg2Img ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                                        <span className="text-sm">Image to Image</span>
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
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="mt-auto pt-4 flex flex-col gap-2"> {/* Reduced gap and padding */}
                                                            {canUseAsInput(image.model, image.privateLoraName) && (
                                                                <Button
                                                                    className="flex-1"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await onUseAsInput(image.url);
                                                                        } catch (error) {
                                                                            console.error('Failed to use image as input:', error);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Upload className="w-3 h-3 mr-1" />
                                                                    Use as Input
                                                                </Button>
                                                            )}
                                                            <Button
                                                                className="flex-1"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => onDownloadImage(image.url)}
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Download
                                                            </Button>
                                                            {canRegenerate(image.model, image.privateLoraName) && (
                                                                <Button
                                                                    className="flex-1"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const currentSeed = parseInt(image.seed?.toString() || '0');
                                                                        const newSeed = currentSeed < 1000 ? currentSeed + 1 : currentSeed - 1;
                                                                        const isSchnell = image.model?.includes('schnell');
                                                                        const modelType = isSchnell
                                                                            ? 'schnell'
                                                                            : (image.model?.includes('/')
                                                                                ? 'dev'
                                                                                : image.model) as 'dev' | 'schnell' | 'pro' | 'recraftv3';
                                                                        onRegenerateWithSeed(newSeed, modelType);
                                                                    }}
                                                                >
                                                                    <RefreshCw className="w-3 h-3 mr-1" />
                                                                    Regenerate
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
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

                                                    // First check if it's a schnell model
                                                    const isSchnell = image.model?.includes('schnell');

                                                    // Then determine the model type
                                                    const modelType = isSchnell
                                                        ? 'schnell'
                                                        : (image.model?.includes('/')
                                                            ? 'dev'
                                                            : image.model) as 'dev' | 'schnell' | 'pro' | 'recraftv3';

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
                                            onClick={() => onDeleteImage(image.url)}
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
                                    animate={{
                                        rotate: 360,
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 1, repeat: Infinity }
                                    }}
                                    className="relative"
                                >
                                    <Loader2 className="w-12 h-12 text-primary" />
                                    <motion.div
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0.8, 1.2, 0.8]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <span className="text-2xl">✨</span>
                                    </motion.div>
                                </motion.div>
                                <motion.p
                                    className="text-sm text-gray-500 text-center"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <span className="text-lg">🪄</span> Sprinkling magic pixels... <span className="text-lg">✨</span>
                                    <br />
                                    <span className="text-xs italic opacity-75">*wiggling whiskers and tapping paws*</span>
                                </motion.p>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <span className="text-6xl">🎨</span>
                                    </motion.div>
                                    <motion.div
                                        className="absolute"
                                        animate={{
                                            opacity: [0, 1, 0],
                                            y: [-20, -30, -20]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <span className="text-2xl">✨</span>
                                    </motion.div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center space-y-2"
                                >
                                    <p className="text-sm text-gray-500">
                                        <span className="text-lg">🐰</span> Your canvas is empty for now...
                                    </p>
                                    <p className="text-xs text-primary/70 italic">
                                        Let&apos;s paint some dreams together! <span className="text-lg">🌈</span>
                                    </p>
                                </motion.div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-4">
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