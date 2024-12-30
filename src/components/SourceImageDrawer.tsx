'use client';

import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { ImageUploadCard } from "./cards/ImageUploadCard";
import { DrawingCard } from "./cards/DrawingCard";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SourceImageDrawerProps {
    onImageSelect: (imageData: { url: string; file: File | null }) => void;
    selectedImage: { url: string; file: File | null } | null;
    onClearImage: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    isInpaintingEnabled: boolean;
    onInpaintingChange: (enabled: boolean) => void;
    onMaskGenerated: (maskDataUrl: string) => void;
}

export function SourceImageDrawer({
    onImageSelect,
    selectedImage,
    onClearImage,
    onError,
    disabled = false,
    isInpaintingEnabled,
    onInpaintingChange,
    onMaskGenerated
}: SourceImageDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed left-0 top-[2rem] bottom-[8rem] z-30">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                <Button
    variant="outline"
    size="sm"
    className="flex flex-col items-center gap-2 py-3 h-auto
        border-l-0 rounded-l-none border-2
        bg-gradient-to-r from-pink-200 to-blue-200
        hover:from-pink-300 hover:to-blue-300
        dark:from-pink-900 dark:to-blue-900
        dark:hover:from-pink-800 dark:hover:to-blue-800
        transition-all duration-300 shadow-md
        hover:shadow-lg hover:scale-105"
>
    <ImageIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />
    <span 
        className="text-base font-medium bg-gradient-to-b from-pink-500 to-blue-500 
            dark:from-pink-400 dark:to-blue-400 
            text-transparent bg-clip-text" 
        style={{ writingMode: 'vertical-rl' }}
    >
        {isOpen ? 'Close' : 'Img2Img'}
    </span>
</Button>
                </SheetTrigger>
                <SheetContent
                    className="w-[500px] left-0 fixed h-[calc(100vh-8rem)] mt-[2rem] p-4 flex flex-col slide-in-from-left rounded-r-xl"
                >
                    <SheetHeader className="flex-none">
                        <SheetTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Source Image
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                        <div className="px-4">
                            <ImageUploadCard
                                onImageSelect={onImageSelect}
                                selectedImage={selectedImage}
                                onClearImage={onClearImage}
                                onError={onError}
                                disabled={disabled}
                            />
                            {selectedImage && (
                                <>
                                    <div className="flex items-center space-x-2 py-2">
                                        <Switch
                                            id="inpainting-mode"
                                            checked={isInpaintingEnabled}
                                            onCheckedChange={onInpaintingChange}
                                        />
                                        <Label htmlFor="inpainting-mode">Enable Inpainting</Label>
                                    </div>
                                   
                                        <DrawingCard
                                            sourceImage={selectedImage}
                                            onMaskGenerated={onMaskGenerated}
                                            disabled={!selectedImage || disabled}
                                            width={370}
                                            isInpaintingEnabled={isInpaintingEnabled}
                                        />
                             
                                </>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}