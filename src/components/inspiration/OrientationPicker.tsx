'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutTemplate, RectangleVertical } from "lucide-react";

interface OrientationPickerProps {
    value: '2:3' | '3:2';
    onChange: (orientation: '2:3' | '3:2') => void;
}

export function OrientationPicker({ value, onChange }: OrientationPickerProps) {
    return (
        <div className="flex gap-4 justify-center">
            <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors
                    ${value === '3:2' ? 'border-2 border-primary' : ''}`}
                onClick={() => onChange('3:2')}
            >
                <div className="flex flex-col items-center gap-2">
                    <LayoutTemplate className="h-12 w-12" />
                    <span className="text-sm font-medium">Landscape</span>
                    <span className="text-xs text-muted-foreground">3:2</span>
                </div>
            </Card>

            <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors
                    ${value === '2:3' ? 'border-2 border-primary' : ''}`}
                onClick={() => onChange('2:3')}
            >
                <div className="flex flex-col items-center gap-2">
                    <RectangleVertical className="h-12 w-12" />
                    <span className="text-sm font-medium">Portrait</span>
                    <span className="text-xs text-muted-foreground">2:3</span>
                </div>
            </Card>
        </div>
    );
}