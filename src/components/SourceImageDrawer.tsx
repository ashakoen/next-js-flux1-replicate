'use client';

import { Button } from "@/components/ui/button";
import { ImageIcon,X } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageUploadCard } from "./cards/ImageUploadCard";
import { DrawingCard } from "./cards/DrawingCard";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InpaintingPromptSection } from "./InpaintingPromptSection";

interface SourceImageDrawerProps {
    onImageSelect: (imageData: { url: string; file: File | null }) => void;
    selectedImage: { url: string; file: File | null } | null;
    onClearImage: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    isInpaintingEnabled: boolean;
    onInpaintingChange: (enabled: boolean) => void;
    onMaskGenerated: (maskDataUrl: string) => void;
    currentMaskDataUrl?: string | null;
    onInpaintingPromptChange?: (prefix: string) => void;
    apiKey: string;
    handleSelectChange: (name: string, value: string) => void;
    inpaintingPromptValue?: string;
}



export function SourceImageDrawer({
    onImageSelect,
    selectedImage,
    onClearImage,
    onError,
    disabled = false,
    isInpaintingEnabled,
    onInpaintingChange,
    onMaskGenerated,
    currentMaskDataUrl = null,
    onInpaintingPromptChange,
    apiKey,
    handleSelectChange,
    inpaintingPromptValue = ''
}: SourceImageDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inpaintingPrompt, setInpaintingPrompt] = useState(inpaintingPromptValue);

    // Sync with parent's inpainting state and value
    useEffect(() => {
        if (!isInpaintingEnabled) {
            setInpaintingPrompt('');
        } else {
            setInpaintingPrompt(inpaintingPromptValue);
        }
    }, [isInpaintingEnabled, inpaintingPromptValue]);

    useEffect(() => {
        if (!selectedImage) {
            // Only update if there's actually a mask to clear
            if (currentMaskDataUrl) {
                onMaskGenerated('');
                onInpaintingChange(false);
            }
        }
    }, [selectedImage, currentMaskDataUrl, onMaskGenerated, onInpaintingChange]);

    return (
<div className="fixed left-0 top-[2rem] z-30">
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
            <Button
                variant="outline"
                size="sm"
                className={`flex flex-col items-center gap-2 py-3 h-auto
                    border-l-0 rounded-l-none border-2
                    bg-gradient-to-r from-rose-200 to-sky-200
                    hover:from-rose-300 hover:to-sky-300
                    dark:from-rose-900 dark:to-sky-900
                    dark:hover:from-rose-800 dark:hover:to-sky-800
                    transition-all duration-300 shadow-md
                    hover:shadow-lg hover:scale-105
                    ${selectedImage ? 'ring-2 ring-rose-500 dark:ring-rose-400' : ''}`}
            >
                <div className="relative">
                    <ImageIcon className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                    {selectedImage && (
                        <div className="absolute -top-1 -right-2.5 w-2 h-2 bg-rose-500 dark:bg-rose-400 rounded-full animate-pulse" />
                    )}
                </div>
                <span
                    className="text-base font-medium bg-gradient-to-b from-rose-500 to-sky-500 
                        dark:from-rose-400 dark:to-sky-400 
                        text-transparent bg-clip-text"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    {isOpen ? 'Close' : 'img2img'}
                </span>
            </Button>
        </SheetTrigger>
        <SheetContent className="w-[500px] fixed left-0 h-[calc(100vh-8rem)] mt-[2rem] p-4 flex flex-col slide-in-from-left rounded-r-xl focus-visible:outline-none">
    <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            <span className="bg-gradient-to-r from-rose-500 to-sky-500 
                dark:from-rose-400 dark:to-sky-400 
                text-transparent bg-clip-text font-semibold">
                img2img {selectedImage && '(Ready)'}
            </span>
        </SheetTitle>
    </SheetHeader>



            <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                <ImageUploadCard
                    onImageSelect={onImageSelect}
                    selectedImage={selectedImage}
                    onClearImage={onClearImage}
                    onError={onError}
                    disabled={disabled}
                    apiKey={apiKey}
                    handleSelectChange={handleSelectChange}
                />
                
                {selectedImage && (
                    <>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="inpainting-mode"
                                    checked={isInpaintingEnabled}
                                    onCheckedChange={onInpaintingChange}
                                />
                                <Label htmlFor="inpainting-mode">Enable Inpainting</Label>
                            </div>
                            
                            {isInpaintingEnabled && (
                                <InpaintingPromptSection
                                    onPromptPrefixChange={(prefix) => {
                                        setInpaintingPrompt(prefix);
                                        onInpaintingPromptChange?.(prefix);
                                    }}
                                    disabled={disabled}
                                    value={inpaintingPrompt}
                                />
                            )}
                        </div>
                        
                        <DrawingCard
                            sourceImage={selectedImage}
                            onMaskGenerated={onMaskGenerated}
                            disabled={!selectedImage || disabled}
                            width={470}
                            isInpaintingEnabled={isInpaintingEnabled}
                            currentMaskDataUrl={currentMaskDataUrl}
                        />
                    </>
                )}
            </div>
        </SheetContent>
    </Sheet>
</div>
    );
}
