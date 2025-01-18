'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { FormData, GenerationParams, PexelsImage, TelemetryData } from "@/types/types";
import { SearchSection } from "./inspiration/SearchSection";
import { ImageGrid } from "./inspiration/ImageGrid";
import { ImagePreview } from "./inspiration/ImagePreview";
import { OrientationPicker } from "./inspiration/OrientationPicker";
import { PromptSection } from "./inspiration/PromptSection";
import { GenerateSection } from "./inspiration/GenerateSection";
import { Dispatch, SetStateAction } from 'react';

interface InspirationDrawerProps {
    onImageSelect?: (imageData: { url: string; file: File | null }) => void;
    pollForResult: (url: string, telemetryData: TelemetryData) => Promise<void>;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;  // Updated type
}

export function InspirationDrawer({ onImageSelect, pollForResult, setFormData }: InspirationDrawerProps) {
    const [searchResults, setSearchResults] = useState<PexelsImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<PexelsImage | null>(null);
    const [orientation, setOrientation] = useState<'2:3' | '3:2'>('2:3');
    const [prompt, setPrompt] = useState('');

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/pexels?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (image: PexelsImage) => {
        setSelectedImage(image);
        onImageSelect?.({
            url: image.src.original,
            file: null
        });
    };

    const handleGenerate = (params: GenerationParams) => {
        if (onImageSelect && params.sourceImage) {
            onImageSelect({
                url: params.sourceImage.url,
                file: params.sourceImage.file
            });
        }
        
        // Set form values based on the generated prompt
        setFormData(prev => ({
            ...prev,
            prompt: params.prompt,
            seed: params.seed,
            model: params.model,
            width: params.width,
            height: params.height,
            aspect_ratio: params.width / params.height === 832/1216 ? '2:3' : '3:2',
            image_reference_url: params.sourceImage?.url || '', // Add this
            go_fast: true,
            guidance_scale: 3.5,
            num_inference_steps: 28
        }));

        const submitEvent = new Event('submit', { bubbles: true });
        document.querySelector('form')?.dispatchEvent(submitEvent);

    };

    return (
        <div className="fixed left-0 top-[6rem] z-30">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center gap-2 py-3 h-auto
                            border-l-0 rounded-l-none border-2
                            bg-gradient-to-r from-violet-200 to-cyan-200
                            hover:from-violet-300 hover:to-cyan-300
                            dark:from-violet-900 dark:to-cyan-900
                            dark:hover:from-violet-800 dark:hover:to-cyan-800
                            transition-all duration-300 shadow-md
                            hover:shadow-lg hover:scale-105"
                    >
                        <Sparkles className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                        <span
                            className="text-base font-medium bg-gradient-to-b from-violet-500 to-cyan-500 
                                dark:from-violet-400 dark:to-cyan-400 
                                text-transparent bg-clip-text"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            Inspire
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[800px] fixed left-0 h-[calc(100vh-8rem)] mt-[2rem] pt-8 p-6 flex flex-col slide-in-from-left rounded-r-xl focus-visible:outline-none">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                            <span className="bg-gradient-to-r from-violet-500 to-cyan-500 
                                dark:from-violet-400 dark:to-cyan-400 
                                text-transparent bg-clip-text font-semibold">
                                Get Inspired
                            </span>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto mt-8 pr-2">
                        <div className="space-y-6">
                            {selectedImage ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-4">
                                        <ImagePreview
                                            image={selectedImage}
                                            onClear={() => setSelectedImage(null)}
                                            orientation={orientation}
                                        />
                                        <OrientationPicker
                                            value={orientation}
                                            onChange={setOrientation}
                                        />
                                    </div>
                                    <PromptSection
                                        imageUrl={selectedImage.src.original}
                                        onPromptChange={setPrompt}
                                        isLoading={isLoading}
                                    />
        <GenerateSection
            prompt={prompt}
            imageUrl={selectedImage?.src.original || ''}
            orientation={orientation}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            pollForResult={pollForResult}
            onClose={() => document.querySelector<HTMLButtonElement>('[data-radix-collection-item]')?.click()}
        />
                                </div>
                            ) : (
                                <>
                                    <SearchSection onSearch={handleSearch} />
                                    <ImageGrid
                                        images={searchResults}
                                        isLoading={isLoading}
                                        onSelect={handleImageSelect}
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