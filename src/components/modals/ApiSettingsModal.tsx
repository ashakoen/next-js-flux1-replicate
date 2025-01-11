'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, Upload, Settings } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from 'react';

interface ApiSettingsModalProps {
    apiKey: string;
    showApiKeyAlert: boolean;
    handleApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    extraLoraModels: string[];
    validatedLoraModels: string[];
    favoritePrompts: string[];
    setExtraLoraModels: (models: string[]) => void;
    setValidatedLoraModels: (models: string[]) => void;
    setFavoritePrompts: (prompts: string[]) => void;
}

export function ApiSettingsModal({
    apiKey,
    showApiKeyAlert,
    handleApiKeyChange,
    extraLoraModels,
    validatedLoraModels,
    favoritePrompts,
    setExtraLoraModels,
    setValidatedLoraModels,
    setFavoritePrompts
}: ApiSettingsModalProps) {

    const [open, setOpen] = useState(false);

    const handleExportSettings = () => {
        const settings = {
            extraLoraModels,
            validatedLoraModels,
            favoritePrompts,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        link.href = url;
        link.download = `replicate-settings-${timestamp}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        toast.success('Settings exported successfully!');
    };

    const handleImportSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            
            if (!settings.extraLoraModels || !settings.validatedLoraModels || !settings.favoritePrompts) {
                throw new Error('Invalid settings file format');
            }

            localStorage.setItem('extraLoraModels', JSON.stringify(settings.extraLoraModels));
            localStorage.setItem('validatedLoraModels', JSON.stringify(settings.validatedLoraModels));
            localStorage.setItem('favoritePrompts', JSON.stringify(settings.favoritePrompts));

            setExtraLoraModels(settings.extraLoraModels);
            setValidatedLoraModels(settings.validatedLoraModels);
            setFavoritePrompts(settings.favoritePrompts);

            toast.success('Settings imported successfully!');
            setOpen(false);
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import settings. Please check the file format.');
        }
        
        e.target.value = '';
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
            <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 flex items-center justify-center"
        >
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">API Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>API Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">Replicate API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Enter your Replicate API key"
                        />
                    </div>
                    {showApiKeyAlert && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Please enter your Replicate API key before generating images.
                            </AlertDescription>
                        </Alert>
                    )}

<div className="flex gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportSettings}
                            className="flex-1"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Settings
                        </Button>
                        
                        <div className="relative flex-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => document.getElementById('settingsFile')?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import Settings
                            </Button>
                            <input
                                type="file"
                                id="settingsFile"
                                accept=".json"
                                onChange={handleImportSettings}
                                className="hidden"
                            />
                        </div>
                    </div>           
                </div>
            </DialogContent>
        </Dialog>
    );
}