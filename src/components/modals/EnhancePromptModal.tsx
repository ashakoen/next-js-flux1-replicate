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
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

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
                                <div className="mt-6 bg-muted/50 rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground break-words">{enhancedPrompt}</p>
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

                                <div className="mt-6 space-y-4">
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
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-[340px] border-l p-6 bg-white dark:bg-gray-800 flex flex-col">
                        {showSuccess ? (
                            <div className="mt-auto pt-4 flex flex-col gap-2">
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
