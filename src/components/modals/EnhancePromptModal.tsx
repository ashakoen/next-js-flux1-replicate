'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, ScrollText, Loader2, WandSparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";

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

    // Reset enhancement input when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEnhancement('');
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onClose();
        setEnhancement('');
    }, [onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
                <DialogHeader className="text-center">
                    <DialogTitle className="flex items-center justify-center gap-2">
                        <Wand2 className="h-5 w-5 text-[#9b59b6] dark:text-[#fa71cd]" />
                        Enhance Image Description
                    </DialogTitle>
                    <DialogDescription>
                        How would you like this image description enhanced?
                    </DialogDescription>
                </DialogHeader>
                {showSuccess ? (
                    <div className="flex-1 px-6 py-4">
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 text-[#9b59b6] dark:text-[#fa71cd]">
                                    <WandSparkles className="h-4 w-4" />
                                    <span className="text-sm font-medium">New description created!</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Want to see what it looks like?</p>
                            </div>
                            <div className="space-y-2 bg-muted/50 rounded-lg p-4 max-h-[200px] relative">
                                <div className="overflow-y-auto max-h-[140px]">
                                    <p className="text-sm text-muted-foreground break-words">{enhancedPrompt}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" size="sm" onClick={handleClose}>Not Now</Button>
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
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2 bg-muted/50 rounded-lg p-4 max-h-[200px] relative">
                                    <h4 className="font-medium flex items-center gap-2 sticky top-0 bg-muted/50 py-2 -mt-2 -mx-4 px-4 backdrop-blur-sm border-b">
                                        <span>Current Image Description</span>
                                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                                    </h4>
                                    <div className="overflow-y-auto max-h-[140px] pt-2">
                                        <p className="text-sm text-muted-foreground break-words">{prompt}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-[#9b59b6] dark:text-[#fa71cd]" />
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
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button
                                onClick={() => onConfirm(enhancement)}
                                disabled={isEnhancing}
                                className="bg-[#9b59b6] hover:bg-[#8e44ad] dark:bg-[#fa71cd] dark:hover:bg-[#e85bb7] text-white"
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
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
