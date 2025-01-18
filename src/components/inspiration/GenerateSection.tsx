import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { GenerationParams, TelemetryData } from "@/types/types";

interface GenerateSectionProps {
    prompt: string;
    imageUrl: string;
    orientation: '2:3' | '3:2';
    isLoading?: boolean;
    onGenerate?: (params: GenerationParams) => void;
    pollForResult: (url: string, telemetryData: TelemetryData) => Promise<void>;
    onClose?: () => void;
}


export function GenerateSection({ 
    prompt, 
    imageUrl,
    orientation,
    isLoading = false,
    onGenerate,
    pollForResult,
    onClose
}: GenerateSectionProps) {
    const handleGenerate = () => {
        if (!prompt || !imageUrl) return;

        const dimensions = orientation === '2:3' 
            ? { width: 832, height: 1216 } 
            : { width: 1216, height: 832 };

        const params: GenerationParams = {
            prompt,
            seed: Math.floor(Math.random() * 1000000),
            model: 'dev',
            ...dimensions,
            sourceImage: {
                url: imageUrl,
                file: null
            }
        };

        onGenerate?.(params);
        onClose?.();
    };

    return (
        <Card className="p-4">
            <div className="flex justify-end">
                <Button
                    onClick={handleGenerate}
                    disabled={!prompt || isLoading}
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isLoading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </Card>
    );
}