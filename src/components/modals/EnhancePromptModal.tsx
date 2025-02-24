'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, ScrollText, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface EnhancePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (enhancement: string) => void;
    prompt: string;
    isEnhancing?: boolean;
}

export function EnhancePromptModal({
    isOpen,
    onClose,
    onConfirm,
    prompt,
    isEnhancing = false
}: EnhancePromptModalProps) {
    const [enhancement, setEnhancement] = useState('');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
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
            </DialogContent>
        </Dialog>
    );
}
