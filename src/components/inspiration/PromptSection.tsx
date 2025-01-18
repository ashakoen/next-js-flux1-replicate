'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TelemetryData } from "@/types/types";
import { createHash } from 'crypto';

interface PromptSectionProps {
    imageUrl: string;
    onPromptChange: (prompt: string) => void;
    isLoading?: boolean;
}

export function PromptSection({ imageUrl, onPromptChange, isLoading = false }: PromptSectionProps) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [cancelUrl, setCancelUrl] = useState<string | null>(null);

    const pollPromptResult = async (url: string, telemetryData: TelemetryData) => {
        try {
            telemetryData.pollingSteps++;

            const response = await fetch('/api/replicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: localStorage.getItem('replicateApiKey'),
                    getUrl: url
                })
            });

            if (!response.ok) throw new Error('Failed to poll for result');
            const data = await response.json();

            telemetryData.statusChanges.push({
                status: data.status,
                timestamp: new Date().toISOString()
            });

            if (data.status === 'succeeded' && data.output) {
                const generatedPrompt = Array.isArray(data.output) 
                    ? data.output.join(' ') 
                    : data.output;
                setPrompt(generatedPrompt);
                onPromptChange(generatedPrompt);
                setIsGenerating(false);
                setCancelUrl(null);

                telemetryData.replicateId = data.id;
                telemetryData.replicateModel = data.model;
                telemetryData.replicateVersion = data.version;
                telemetryData.replicateCreatedAt = data.created_at;
                telemetryData.replicateStartedAt = data.started_at;
                telemetryData.replicateCompletedAt = data.completed_at;
                telemetryData.replicatePredictTime = data.metrics?.predict_time || 0;
                finalizeTelemetryData(telemetryData);
                return;
            }

            if (data.status === 'failed') {
                telemetryData.errors.push('Prompt generation failed');
                finalizeTelemetryData(telemetryData);
                throw new Error('Prompt generation failed');
            }

            // Continue polling if not complete
            setTimeout(() => pollPromptResult(url, telemetryData), 1000);
        } catch (error) {
            console.error('Polling error:', error);
            setIsGenerating(false);
            setCancelUrl(null);
            telemetryData.errors.push(error instanceof Error ? error.message : 'Unknown error');
            finalizeTelemetryData(telemetryData);
            toast.error('Failed to generate prompt');
        }
    };

    const generatePrompt = async () => {
        setIsGenerating(true);

        const telemetryData: TelemetryData = {
            requestId: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            requestStartTime: new Date().toISOString(),
            responseTime: 0,
            totalDuration: 0,
            statusChanges: [],
            pollingSteps: 0,
            generationParameters: {
                seed: 0,
                model: 'dev' as const,
                privateLoraName: '',
                privateLoraVersion: '',
                width: 512,
                height: 512,
                prompt: '',
                extra_lora: '',
                lora_scale: 1,
                num_outputs: 1,
                aspect_ratio: '1:1',
                output_format: 'png',
                guidance_scale: 3.5,
                output_quality: 80,
                extra_lora_scale: 0.8,
                num_inference_steps: 28,
                disable_safety_checker: false,
                go_fast: true,
                style: 'any',
                prompt_strength: 0.8,
                negative_prompt: '',
                image_reference_weight: 0.85,
                style_reference_weight: 0.85,
                style_type: 'None',
                magic_prompt_option: 'Auto',
                image_reference_url: '',
                style_reference_url: '',
                character_reference_url: '',
                hasInputImage: true
            },
            outputImageSizes: [],
            clientInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                screenSize: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            timeOfDay: new Date().toLocaleTimeString(),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            errors: [],
            cancelledByUser: false,
            replicateId: '',
            replicateModel: '',
            replicateVersion: '',
            replicateCreatedAt: '',
            replicateStartedAt: '',
            replicateCompletedAt: '',
            replicatePredictTime: 0
        };

        try {
            const startTime = Date.now();
            const response = await fetch('/api/replicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: localStorage.getItem('replicateApiKey'),
                    body: {
                        model: 'llava',
                        input: {
                            image: imageUrl,
                            prompt: "Describe this image in detail for use as a text-to-image prompt. Focus on visual elements, style, composition, and mood. Be specific but concise."
                        }
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to start prompt generation');
            const prediction = await response.json();
            console.log('Initial prediction response:', prediction);

            telemetryData.responseTime = Date.now() - startTime;
            telemetryData.statusChanges.push({
                status: prediction.status,
                timestamp: new Date().toISOString()
            });

            setCancelUrl(prediction.urls?.cancel || null);

            if (prediction.urls?.get) {
                pollPromptResult(prediction.urls.get, telemetryData);
            }
        } catch (error) {
            console.error('Failed to generate prompt:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate prompt');
            setIsGenerating(false);
            setCancelUrl(null);
            telemetryData.errors.push(error instanceof Error ? error.message : 'Unknown error');
            finalizeTelemetryData(telemetryData);
        }
    };

    const handleCancel = async () => {
        if (!cancelUrl) return;

        try {
            const response = await fetch('/api/replicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: localStorage.getItem('replicateApiKey'),
                    cancelUrl
                })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel generation');
            }

            toast.success('Generation cancelled');
            setIsGenerating(false);
            setCancelUrl(null);
        } catch (error) {
            console.error('Failed to cancel:', error);
            toast.error('Failed to cancel generation');
        }
    };

    const finalizeTelemetryData = async (telemetryData: TelemetryData) => {
        const endTime = Date.now();
        const startTime = new Date(telemetryData.requestStartTime).getTime();
        telemetryData.totalDuration = endTime - startTime;
    
        try {
            const apiKey = localStorage.getItem('replicateApiKey');
            const userHash = createHash('sha256')
                .update(apiKey + (process.env.NEXT_PUBLIC_TELEMETRY_SALT || 'default-salt'))
                .digest('hex');
    
            const telemetryWithHash = {
                ...telemetryData,
                user_hash: userHash
            };
    
            const response = await fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetryWithHash)
            });
    
            if (!response.ok) {
                console.error('Failed to send telemetry data');
            }
        } catch (error) {
            console.error('Error sending telemetry data:', error);
        }
    };

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generation Prompt</h3>
                    {isGenerating ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={!cancelUrl}
                            className="text-red-500 hover:text-red-600"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <X className="h-4 w-4 mr-2" />
                            )}
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generatePrompt}
                            disabled={isGenerating || isLoading}
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    )}
                </div>
                <Textarea
                    placeholder="Generate or write a prompt..."
                    value={prompt}
                    onChange={(e) => {
                        setPrompt(e.target.value);
                        onPromptChange(e.target.value);
                    }}
                    className="min-h-[100px]"
                    disabled={isGenerating}
                />
                {isGenerating && (
                    <div className="text-sm text-muted-foreground animate-pulse">
                        Analyzing image and generating prompt...
                    </div>
                )}
            </div>
        </Card>
    );
}