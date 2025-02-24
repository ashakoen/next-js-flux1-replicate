'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, Loader2, WandSparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

const ENHANCEMENT_WORDS = [
    { word: "Sprinkling magic dust", emoji: "✨" },
    { word: "Adding artistic flair", emoji: "🎨" },
    { word: "Unleashing creativity", emoji: "🌈" },
    { word: "Brewing inspiration", emoji: "☕️" },
    { word: "Channeling imagination", emoji: "🌟" },
    { word: "Weaving dreams", emoji: "🕊️" },
    { word: "Crafting beauty", emoji: "🎭" },
    { word: "Stirring emotions", emoji: "💫" }
] as const;

const CREATIVE_QUOTES = [
    {
        quote: "Every artist was first an amateur",
        author: "Ralph Waldo Emerson",
        emoji: "🎨"
    },
    {
        quote: "Art enables us to find ourselves and lose ourselves at the same time",
        author: "Thomas Merton",
        emoji: "✨"
    },
    {
        quote: "Creativity takes courage",
        author: "Henri Matisse",
        emoji: "💪"
    },
    {
        quote: "Art is not what you see, but what you make others see",
        author: "Edgar Degas",
        emoji: "👀"
    },
    {
        quote: "Everything you can imagine is real",
        author: "Pablo Picasso",
        emoji: "🌈"
    },
    {
        quote: "The painter has the Universe in their mind and hands",
        author: "Leonardo da Vinci",
        emoji: "🌟"
    }
] as const;

const QUICK_ENHANCEMENTS = [
    { label: "More Realism", value: "more realistic" },
    { label: "Cinematic", value: "cinematic lighting and composition" },
    { label: "Detailed", value: "more detailed" },
    { label: "Dramatic", value: "more dramatic" },
    { label: "Vibrant", value: "more vibrant colors" },
    { label: "Sexier", value: "more alluring and sexy" },
    { label: "Artistic", value: "artistic interpretation" },
    { label: "Cartoonish", value: "cartoonish style" }
] as const;

interface EnhancePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (enhancement: string) => void;
    prompt: string;
    isEnhancing?: boolean;
    onGenerate?: () => void;
    showSuccess?: boolean;
    enhancedPrompt?: string;
}

export function EnhancePromptModal({
    isOpen,
    onClose,
    onConfirm,
    prompt,
    isEnhancing = false,
    onGenerate,
    showSuccess = false,
    enhancedPrompt = ''
}: EnhancePromptModalProps) {
    const [enhancement, setEnhancement] = useState('');
    const [activeEnhancements, setActiveEnhancements] = useState<Set<string>>(new Set());
    const [showIndex, setShowIndex] = useState(0);

    // Animation for loading state
    useEffect(() => {
        if (isEnhancing) {
            const interval = setInterval(() => {
                setShowIndex(i => (i + 1) % ENHANCEMENT_WORDS.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isEnhancing]);

    const randomQuote = useMemo(() => 
        CREATIVE_QUOTES[Math.floor(Math.random() * CREATIVE_QUOTES.length)],
        []
    );

    // Reset enhancement input and active enhancements when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEnhancement('');
            setActiveEnhancements(new Set());
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onClose();
        setEnhancement('');
        setActiveEnhancements(new Set());
    }, [onClose]);

    const handleQuickEnhancement = (value: string) => {
        const newActive = new Set(activeEnhancements);
        
        if (newActive.has(value)) {
            // Remove enhancement if already active
            newActive.delete(value);
            setEnhancement(prev => {
                const parts = prev.split(', ').filter(part => part.trim() !== value);
                return parts.join(', ');
            });
        } else {
            // Add enhancement if not active
            newActive.add(value);
            setEnhancement(prev => {
                if (!prev) return value;
                return `${prev}, ${value}`;
            });
        }
        
        setActiveEnhancements(newActive);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[1000px] p-0">
                <div className="flex min-h-[400px]">
                    <div className="flex-1 p-6 overflow-y-auto">
                        {showSuccess ? (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-2 text-[#9b59b6] dark:text-[#fa71cd]">
                                        <WandSparkles className="h-4 w-4" />
                                        <span className="text-sm font-medium">New description created!</span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground break-words">{enhancedPrompt}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Wand2 className="h-5 w-5 text-[#9b59b6] dark:text-[#fa71cd]" />
                                        Enhance Image Description
                                    </DialogTitle>
                                    <DialogDescription>
                                        How would you like this image description enhanced?
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="relative mt-6 space-y-4">
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground break-words">{prompt}</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Enhancement
                                        </Label>
                                        <Input
                                            value={enhancement}
                                            onChange={(e) => setEnhancement(e.target.value)}
                                            placeholder="Enter enhancement word or phrase"
                                            className="focus-visible:ring-[#9b59b6] dark:focus-visible:ring-[#fa71cd]"
                                        />
                                    </div>

                                    {isEnhancing && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                            <div className="text-center space-y-4">
                                                <div className="relative h-12">
                                                    {ENHANCEMENT_WORDS.map((item, i) => (
                                                        <div
                                                            key={item.word}
                                                            className={cn(
                                                                "absolute inset-x-0 transition-all duration-500",
                                                                showIndex === i 
                                                                    ? "opacity-100 transform-none" 
                                                                    : "opacity-0 translate-y-2"
                                                            )}
                                                        >
                                                            <div className="text-2xl mb-2 animate-bounce">{item.emoji}</div>
                                                            <p className="text-sm text-[#9b59b6] dark:text-[#fa71cd] font-medium">
                                                                {item.word}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-xs text-muted-foreground animate-pulse">
                                                    Enhancing your description...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-[340px] border-l p-6 bg-white dark:bg-gray-800 flex flex-col">
                        {showSuccess ? (
                            <>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6">
                                        <div className="text-center space-y-3">
                                            <div className="text-4xl animate-pulse">{randomQuote.emoji}</div>
                                            <p className="text-sm italic text-muted-foreground leading-relaxed">&quot;{randomQuote.quote}&quot;</p>
                                            <p className="text-xs font-medium text-[#9b59b6] dark:text-[#fa71cd]">— {randomQuote.author}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col gap-2">
                                    <Button variant="outline" size="sm" onClick={handleClose}>
                                        Not Now
                                    </Button>
                                    <Button 
                                        size="sm"
                                        className="bg-[#9b59b6] hover:bg-[#8e44ad] dark:bg-[#fa71cd] dark:hover:bg-[#e85bb7] text-white"
                                        onClick={() => {
                                            handleClose();
                                            onGenerate?.();
                                        }}
                                    >
                                        Show Me!
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold">Quick Enhancements</h2>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <div className="space-y-2">
                                        {QUICK_ENHANCEMENTS.map((option) => (
                                            <Button
                                                key={option.value}
                                                variant={activeEnhancements.has(option.value) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleQuickEnhancement(option.value)}
                                                className={cn(
                                                    "w-full justify-start",
                                                    activeEnhancements.has(option.value) && 
                                                    "bg-[#9b59b6] hover:bg-[#8e44ad] dark:bg-[#fa71cd] dark:hover:bg-[#e85bb7] text-white"
                                                )}
                                            >
                                                {option.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-2">
                                    <Button variant="outline" size="sm" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#9b59b6] hover:bg-[#8e44ad] dark:bg-[#fa71cd] dark:hover:bg-[#e85bb7] text-white"
                                        onClick={() => onConfirm(enhancement)}
                                        disabled={isEnhancing}
                                    >
                                        {isEnhancing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Enhancing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Enhance
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
