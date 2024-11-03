'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from 'next/image';
import { Download, Loader2 } from 'lucide-react';
import { GeneratedImage } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { WandSparkles } from 'lucide-react';

interface GeneratedImagesCardProps {
    searchTerm: string;
    filteredImages: GeneratedImage[];
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownloadImage: (imageUrl: string) => Promise<void>;
    onDeleteImage: (imageUrl: string) => void;
    clearGeneratedImages: () => void;
    isGenerating: boolean;
    numberOfOutputs: number;
}

export function GeneratedImagesCard({
    searchTerm,
    filteredImages,
    onSearchChange,
    onDownloadImage,
    onDeleteImage,
    clearGeneratedImages,
    isGenerating,
    numberOfOutputs
}: GeneratedImagesCardProps) {

    const [isConfirming, setIsConfirming] = useState(false);

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
        <Card className="w-full h-[calc(100vh-10rem)] mt-8 sm:mt-0">
            <CardHeader className="relative">
                <CardTitle>Your FLUX.1 Image Generations</CardTitle>
                <CardDescription>Your generations will show up here. Have fun! </CardDescription>
            </CardHeader>
            <div className="px-6 pb-10 border-b"> {/* New fixed section */}
                <Input
                    type="text"
                    placeholder="Search images by prompt..."
                    value={searchTerm}
                    onChange={onSearchChange}
                    className="w-full"
                />
            </div>
            <CardContent className="overflow-y-auto pt-6 h-[calc(100%-16rem)]">
                {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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
                                    className="relative group"
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

                            {filteredImages.map((image, index) => (
                                <motion.div
                                    key={image.url}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative group"
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
                                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                                            <div className="flex flex-col h-full py-6">
                                                <div className="relative w-full h-0 pb-[75%] overflow-hidden mb-6">
                                                    <Image
                                                        src={image.url}
                                                        alt={`Generated image ${index + 1}`}
                                                        layout="fill"
                                                        objectFit="contain"
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="p-6 bg-white dark:bg-gray-800">
                                                    <Accordion type="single" collapsible className="w-full">
                                                        <AccordionItem value="details" className="border-0">
                                                            <AccordionTrigger className="py-4 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-0">
                                                                <h3 className="text-base font-semibold">Image Details</h3>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="md:col-span-2 space-y-2">
                                                                        <p className="text-sm"><span className="font-medium">Prompt:</span> {image.prompt}</p>
                                                                        {image.model && <p className="text-sm"><span className="font-medium">Model:</span> {image.model}</p>}
                                                                        {image.version && (
                                                                            <p className="text-sm">
                                                                                <span className="font-medium">Version:</span>
                                                                                <span className="block mt-1 text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded overflow-x-auto">
                                                                                    {image.version}
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                        {image.seed !== undefined && (
                                                                            <p className="text-sm">
                                                                                <span className="font-medium">Seed:</span>
                                                                                <span className="ml-2 font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                                                                                    {image.seed}
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                        {image.isImg2Img !== undefined && (
                                                                            <p className="text-sm">
                                                                                <span className="font-medium">Image to Image:</span>
                                                                                <span className={`ml-2 px-2 py-1 rounded ${image.isImg2Img ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'}`}>
                                                                                    {image.isImg2Img ? 'Yes' : 'No'}
                                                                                </span>
                                                                            </p>
                                                                        )}
                
                                                                    </div>
                                                                    <div className="md:col-span-1 space-y-2">
                                                                        {image.go_fast !== undefined && (
                                                                            <p className="text-sm">
                                                                                <span className="font-medium">Go Fast:</span>
                                                                                <span className={`ml-2 px-2 py-1 rounded ${image.go_fast ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'}`}>
                                                                                    {image.go_fast ? 'Yes' : 'No'}
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                        {image.guidance_scale !== undefined && (
                                                                            <p className="text-sm"><span className="font-medium">Guidance Scale:</span> {image.guidance_scale}</p>
                                                                        )}
                                                                        {image.num_inference_steps !== undefined && (
                                                                            <p className="text-sm"><span className="font-medium">Inference Steps:</span> {image.num_inference_steps}</p>
                                                                        )}
                                                                        {image.lora_scale !== undefined && (
                                                                            <p className="text-sm"><span className="font-medium">LoRA Scale:</span> {image.lora_scale}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onClick={() => onDownloadImage(image.url)}
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download image</span>
                                    </Button>
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
            <CardFooter className="flex justify-end border-t pt-6">
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
                    disabled={filteredImages.length === 0}
                >
                    {isConfirming ? 'Are you sure?' : 'Clear Generated Images'}
                </Button>
            </CardFooter>
        </Card>
    );
}