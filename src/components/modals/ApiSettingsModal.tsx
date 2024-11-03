'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from 'lucide-react';

interface ApiSettingsModalProps {
    apiKey: string;
    showApiKeyAlert: boolean;
    handleApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ApiSettingsModal({
    apiKey,
    showApiKeyAlert,
    handleApiKeyChange
}: ApiSettingsModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-6 right-6">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}