'use client';

import { Button } from "@/components/ui/button";
import { Loader2, FolderLock, Wand2 } from "lucide-react";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface LoraModelsDrawerProps {
    validatedLoraModels: string[];
    setValidatedLoraModels: React.Dispatch<React.SetStateAction<string[]>>;
    selectedLoraModel: string | null;
    clearValidatedModels: () => void;
    setSelectedLoraModel: (value: string | null) => void;
    setFormData: (fn: (prev: any) => any) => void;
    apiKey: string;
    setShowApiKeyAlert: (show: boolean) => void;
}

export function LoraModelsDrawer({
    validatedLoraModels,
    setValidatedLoraModels,
    selectedLoraModel,
    clearValidatedModels,
    setSelectedLoraModel,
    setFormData,
    apiKey,
    setShowApiKeyAlert
}: LoraModelsDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newModelInput, setNewModelInput] = useState('');
    const [isValidatingLora, setIsValidatingLora] = useState(false);
    const [loraValidationError, setLoraValidationError] = useState<string | null>(null);

    const validateAndAddLoraModel = async (modelName: string) => {
        if (!apiKey) {
            setShowApiKeyAlert(true);
            return;
        }
    
        setIsValidatingLora(true);
        setLoraValidationError(null);
    
        const matches = modelName.match(/^([^/]+)\/([^:]+):(.+)$/);
        if (!matches) {
            setIsValidatingLora(false);
            setLoraValidationError("Invalid format. Expected: username/model-name:version");
            return;
        }
    
        const [_, username, modelBaseName, version] = matches;
        const modelPath = `${username}/${modelBaseName}`;
    
        try {
            const response = await fetch('/api/replicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({
                    body: {
                        validateLora: true,
                        modelPath,
                        version
                    }
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Failed to validate model");
            }
    
            const versionExists = data.results?.some((result: any) => result.id === version);
            if (!versionExists) {
                throw new Error("Version not found for this model");
            }
    
            setValidatedLoraModels(prev => {
                const newModels = Array.from(new Set([...prev, modelName]));
                localStorage.setItem('validatedLoraModels', JSON.stringify(newModels));
                return newModels;
            });
            setFormData(prev => ({ ...prev, privateLoraName: modelName }));
            setNewModelInput('');
            toast.success("LoRA model validated and added successfully!");
    
        } catch (error) {
            console.error('Validation error:', error);
            setLoraValidationError(error instanceof Error ? error.message : "Failed to validate LoRA model");
        } finally {
            setIsValidatingLora(false);
        }
    };

    const handleAddModel = () => {
        if (newModelInput.trim()) {
            validateAndAddLoraModel(newModelInput.trim());
        }
    };

    return (
        <div className="fixed left-0 top-[20rem] z-30">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                <Button
    variant="outline"
    size="sm"
    className={`flex flex-col items-center gap-2 py-3 h-auto
        border-l-0 rounded-r-lg shadow-md border-2
        bg-gradient-to-r from-purple-200 to-indigo-200
        hover:from-purple-300 hover:to-indigo-300
        dark:from-purple-900 dark:to-indigo-900
        dark:hover:from-purple-800 dark:hover:to-indigo-800
        transition-all duration-300
        ${validatedLoraModels.length > 0 ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}
    `}
    style={{
        borderTopLeftRadius: 0, // Force flat top-left edge
        borderBottomLeftRadius: 0, // Force flat bottom-left edge
    }}
>
    <div className="relative">
        <FolderLock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
        {validatedLoraModels.length > 0 && (
            <div className="absolute -top-1 -right-2.5 w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse" />
        )}
    </div>
    <span
        className="text-base font-medium bg-gradient-to-b from-purple-500 to-pink-500 
            dark:from-purple-400 dark:to-pink-400 
            text-transparent bg-clip-text"
        style={{ writingMode: 'vertical-rl' }}
    >
        {isOpen ? 'Close' : 'Private LoRAs'}
    </span>
</Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] fixed left-0 h-[calc(100vh-8rem)] mt-[2rem] p-4 flex flex-col slide-in-from-left rounded-r-xl
    bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
    <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
            <FolderLock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 
                dark:from-purple-400 dark:to-pink-400 
                text-transparent bg-clip-text font-semibold">
                Private LoRA Models ({validatedLoraModels.length})
            </span>
        </SheetTitle>
    </SheetHeader>

                    <div className="mt-4 space-y-2">

                        <Label htmlFor="newLoraModel">Add New LoRA Model</Label>
                        <div className="flex gap-2">
                            <Input
                                id="newLoraModel"
                                placeholder="Enter LoRA model name"
                                value={newModelInput}
                                onChange={(e) => setNewModelInput(e.target.value)}
                                className="flex-1"
                            />
    <Button
        onClick={handleAddModel}
        disabled={isValidatingLora}
        className="bg-purple-500 hover:bg-purple-600 text-white
            dark:bg-purple-600 dark:hover:bg-purple-700"
    >
        {isValidatingLora ? (
            <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
            'Add'
        )}
    </Button>
                        </div>
                        {loraValidationError && (
                            <p className="text-sm text-red-500">{loraValidationError}</p>
                        )}
                    </div>

                    <ScrollArea className="flex-1 mt-4">
                        <div className="space-y-3 pr-4">
                            {validatedLoraModels.length > 0 ? (
                                validatedLoraModels.map((model, index) => (
                                    <TooltipProvider key={index}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <div className={`group relative p-3 rounded-lg border 
        ${model === selectedLoraModel 
            ? 'border-purple-500 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' 
            : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
    >
                                                    <div className="flex items-start gap-2">
                                                        {model === selectedLoraModel && (
                                                            <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse" />
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
                                                                setSelectedLoraModel(model);
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    privateLoraName: model
                                                                }));
                                                                toast.success("LoRA model selected!");
                                                            }}
                                                            className="h-7 px-2 text-xs bg-purple-50 hover:bg-purple-100 
                                            dark:bg-purple-900/20 dark:hover:bg-purple-900/30 
                                            text-purple-600 dark:text-purple-400"
                                                        >
                                                            Select
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setValidatedLoraModels(prev => {
                                                                    const newModels = prev.filter(p => p !== model);
                                                                    localStorage.setItem('validatedLoraModels', JSON.stringify(newModels));
                                                                    return newModels;
                                                                });
                                                                if (selectedLoraModel === model) {
                                                                    setSelectedLoraModel(null);
                                                                    setFormData(prev => ({ ...prev, privateLoraName: '' }));
                                                                }
                                                                toast.success("LoRA model removed!");
                                                            }}
                                                            className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 
                                            dark:bg-red-900/20 dark:hover:bg-red-900/30 
                                            text-red-600 dark:text-red-400"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" align="center" className="max-w-[300px] p-3">
                                                <p className="text-xs break-all whitespace-pre-wrap">{model}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No LoRA models validated yet
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {validatedLoraModels.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearValidatedModels}
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