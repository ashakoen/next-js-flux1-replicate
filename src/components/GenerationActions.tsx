'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

interface GenerationActionsProps {
    isGenerating: boolean;
    isLoading: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleCancel: () => void;
    className?: string;
}

export function GenerationActions({
    isGenerating,
    isLoading,
    handleSubmit,
    handleCancel,
    className
}: GenerationActionsProps) {
    return (
        <Card className={`w-full mt-4 ${className}`}> 
        <CardContent className="p-6">
            <div className="flex gap-2">
                <Button 
                    onClick={(e) => handleSubmit(e)}
                    className="flex-1 h-10 bg-gradient-to-r from-purple-500 to-pink-500 
                        hover:from-purple-600 hover:to-pink-600
                        text-white shadow-inner font-medium text-sm
                        transition-all duration-200" 
                    disabled={isGenerating || isLoading}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        'Show Me!'
                    )}
                </Button>
                {isGenerating && (
                    <Button 
                        variant="destructive" 
                        onClick={handleCancel}
                        className="w-28 h-10 shadow-inner font-medium text-sm
                            bg-gradient-to-r from-red-500 to-red-600
                            hover:from-red-600 hover:to-red-700
                            transition-all duration-200"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
    );
}