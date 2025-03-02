'use client';

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ExtraLoraModelsDrawerProps {
    extraLoraModels: string[];
    setExtraLoraModels: React.Dispatch<React.SetStateAction<string[]>>;
    selectedExtraLora: string | null;
    clearExtraModels: () => void;
    setSelectedExtraLora: (value: string | null) => void;
    setFormData: (fn: (prev: any) => any) => void;
}

export function ExtraLoraModelsDrawer({
    extraLoraModels,
    setExtraLoraModels,
    selectedExtraLora,
    clearExtraModels,
    setSelectedExtraLora,
    setFormData
}: ExtraLoraModelsDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newModelInput, setNewModelInput] = useState('');

    const handleAddModel = () => {
        if (newModelInput.trim()) {
            setExtraLoraModels(prev => {
                const newModels = Array.from(new Set([...prev, newModelInput.trim()]));
                localStorage.setItem('extraLoraModels', JSON.stringify(newModels));
                return newModels;
            });
            setNewModelInput('');
            toast.success("Extra LoRA model saved!");
        }
    };

    return (
        <div className="fixed left-0 top-[49rem] z-30">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`flex flex-col items-center gap-2 py-3 h-auto
                            border-l-0 rounded-l-none border-2
                            bg-gradient-to-r from-amber-200 to-orange-200
                            hover:from-amber-300 hover:to-orange-300
                            dark:from-amber-900 dark:to-orange-900
                            dark:hover:from-amber-800 dark:hover:to-orange-800
                            transition-all duration-300 shadow-md
                            hover:shadow-lg hover:scale-105
                            ${extraLoraModels.length > 0 ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''}`}
                    >
                        <div className="relative">
                            <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                            {extraLoraModels.length > 0 && (
                                <div className="absolute -top-1 -right-2.5 w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span
                            className="text-base font-medium bg-gradient-to-b from-amber-500 to-orange-500 
                                dark:from-amber-400 dark:to-orange-400 
                                text-transparent bg-clip-text"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            {isOpen ? 'Close' : 'Extra AI Models'}
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] fixed left-0 h-[calc(100vh-8rem)] mt-[2rem] p-4 flex flex-col slide-in-from-left rounded-r-xl">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 
                                dark:from-amber-400 dark:to-orange-400 
                                text-transparent bg-clip-text font-semibold">
                                Extra AI Models ({extraLoraModels.length})
                            </span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 space-y-2">
                        <Label htmlFor="newExtraLora">Add New Extra AI Model</Label>
                        <div className="flex gap-2">
                            <Input
                                id="newExtraLora"
                                placeholder="e.g., fofr/flux-pixar-cars"
                                value={newModelInput}
                                onChange={(e) => setNewModelInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleAddModel}
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 mt-4">
                        <div className="space-y-3 pr-4">
                            {extraLoraModels.length > 0 ? (
                                extraLoraModels.map((model, index) => (
                                    <div
                                        key={index}
                                        className={`group relative p-3 rounded-lg border border-gray-200 
                                            dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
                                            ${model === selectedExtraLora ? 'border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-900/20' : ''}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {model === selectedExtraLora && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse" />
                                            )}
                                            <p className="text-sm break-all line-clamp-2 pr-20 mb-8">
                                                {model}
                                            </p>
                                        </div>
                                        <div className="absolute right-2 bottom-2 flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedExtraLora(model);
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        extra_lora: model
                                                    }));
                                                    toast.success("Extra LoRA model selected!");
                                                }}
                                                className="h-7 px-2 text-xs bg-amber-50 hover:bg-amber-100 
                                                    dark:bg-amber-900/20 dark:hover:bg-amber-900/30 
                                                    text-amber-600 dark:text-amber-400"
                                            >
                                                Select
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setExtraLoraModels(prev => {
                                                        const newModels = prev.filter(p => p !== model);
                                                        localStorage.setItem('extraLoraModels', JSON.stringify(newModels));
                                                        return newModels;
                                                    });
                                                    if (selectedExtraLora === model) {
                                                        setSelectedExtraLora(null);
                                                        setFormData(prev => ({ ...prev, extra_lora: '' }));
                                                    }
                                                    toast.success("Extra LoRA model removed!");
                                                }}
                                                className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 
                                                    dark:bg-red-900/20 dark:hover:bg-red-900/30 
                                                    text-red-600 dark:text-red-400"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No extra LoRA models saved yet
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {extraLoraModels.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearExtraModels}
                                className="text-xs hover:bg-red-100 
                                    dark:hover:bg-red-900/30 text-red-600 
                                    dark:text-red-400"
                            >
                                Clear All Models
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
