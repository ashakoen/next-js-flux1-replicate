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

const ENHANCEMENT_MESSAGES = [
    { message: "Brewing up some creative magic", emoji: "✨" },
    { message: "Teaching AI to think outside the box", emoji: "📦" },
    { message: "Making your prompt extra special", emoji: "🎨" },
    { message: "Sprinkling some AI pixie dust", emoji: "✨" },
    { message: "Good things come to those who wait", emoji: "🌟" },
    { message: "Not the quickest AI, but it is the BEST", emoji: "🏆" },
    { message: "You will be so glad you waited", emoji: "🎉" },
    { message: "Turning good ideas into great ones", emoji: "🚀" },
    { message: "Adding that special sauce", emoji: "💫" },
    { message: "Unleashing maximum creativity", emoji: "🎨" },
    { message: "Not stuck, just thinking", emoji: "🤔" },
    { message: "So close! Almost there", emoji: "🎯" }
] as const;

const CREATIVE_QUOTES = [
    {
        quote: "Every artist was first an amateur",
        author: "Ralph Waldo Emerson",
        emoji: "🎨"
    },
    {
        quote: "Creativity takes courage",
        author: "Henri Matisse",
        emoji: "💪"
    },
    {
        quote: "Everything you can imagine is real",
        author: "Pablo Picasso",
        emoji: "🌈"
    }
] as const;

const QUICK_ENHANCEMENTS = [
    { label: "Realism", value: "more realistic" },
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
    isEnhancing = false,
    onGenerate,
    showSuccess = false,
}: EnhancePromptModalProps) {
    const [enhancement, setEnhancement] = useState('');
    const [activeEnhancements, setActiveEnhancements] = useState<Set<string>>(new Set());
    const [showIndex, setShowIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Animation for loading state
    useEffect(() => {
        if (isEnhancing) {
            // Message rotation
            const messageInterval = setInterval(() => {
                setShowIndex(i => (i + 1) % ENHANCEMENT_MESSAGES.length);
            }, 2000);

            // Progress bar animation
            const progressInterval = setInterval(() => {
                setProgress(p => {
                    if (p >= 95) return p; // Cap at 95% until complete
                    return p + (95 - p) * 0.1; // Gradually slow down
                });
            }, 200);

            return () => {
                clearInterval(messageInterval);
                clearInterval(progressInterval);
            };
        } else {
            setProgress(0);
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
            setProgress(0);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onClose();
        setEnhancement('');
        setActiveEnhancements(new Set());
        setProgress(0);
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
            <DialogContent className="sm:max-w-[800px] p-0">
                <div className="flex min-h-[300px]">
                    <div className="flex-1 p-6 overflow-y-auto">
                        {showSuccess ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="text-5xl animate-bounce">{randomQuote.emoji}</div>
                                <p className="text-lg font-medium text-[#9b59b6] dark:text-[#fa71cd]">
                                    Enhanced Image Description Complete!
                                </p>
                                <p className="text-sm italic text-muted-foreground">
                                    &quot;{randomQuote.quote}&quot;
                                </p>
                                <p className="text-xs text-[#9b59b6] dark:text-[#fa71cd]">
                                    — {randomQuote.author}
                                </p>
                                <div className="pt-4 flex gap-2">
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
                                        Use It!
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Wand2 className="h-5 w-5 text-[#9b59b6] dark:text-[#fa71cd]" />
                                        Enhance Your Image Description with AI!
                                    </DialogTitle>
                                    <DialogDescription>
                                        How would you like this image description enhanced? Give me some guidance and I&apos;ll write you a brand new one! Just describe how you&apos;d like the image enhanced below or pick an option from the list.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="relative flex-1 mt-4">
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
                                            <div className="text-center space-y-6 w-full px-8">
                                                <div className="relative h-20">
                                                    {ENHANCEMENT_MESSAGES.map((item, i) => (
                                                        <div
                                                            key={item.message}
                                                            className={cn(
                                                                "absolute inset-x-0 transition-all duration-500",
                                                                showIndex === i 
                                                                    ? "opacity-100 transform-none" 
                                                                    : "opacity-0 translate-y-2"
                                                            )}
                                                        >
                                                            <div className="text-4xl mb-3 animate-bounce">{item.emoji}</div>
                                                            <p className="text-lg text-[#9b59b6] dark:text-[#fa71cd] font-medium">
                                                                {item.message}...
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                                                    <div 
                                                        className="bg-gradient-to-r from-[#9b59b6] to-[#fa71cd] h-2.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!showSuccess && (
                        <div className="w-[300px] border-l p-6 bg-white dark:bg-gray-800 flex flex-col">
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
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
