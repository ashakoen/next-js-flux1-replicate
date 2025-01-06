import React from 'react';

export type IdeogramStyleType = "None" | "Auto" | "General" | "Realistic" | "Design" | "Render 3D" | "Anime";
export type IdeogramMagicPromptOption = "Auto" | "On" | "Off";

export type FormData = {
    seed: number;
    model: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3' | 'recraftv3-svg' | 'ideogram';
    privateLoraName: string;
    privateLoraVersion: string;
    width: number;
    height: number;
    prompt: string;
    extra_lora: string;
    lora_scale: number;
    num_outputs: number;
    aspect_ratio: string;
    output_format: 'webp' | 'jpg' | 'png' | 'svg';
    guidance_scale: number;
    output_quality: number;
    extra_lora_scale: number;
    num_inference_steps: number;
    disable_safety_checker: boolean;
    go_fast: boolean;
    style?: string;
    maskDataUrl?: string;
    prompt_strength?: number;
    negative_prompt?: string;
    style_type?: IdeogramStyleType;
    magic_prompt_option?: IdeogramMagicPromptOption;
};

export type GeneratedImage = {
    url: string;
    prompt: string;
    model?: string;
    version?: string;
    go_fast?: boolean;
    guidance_scale?: number;
    num_inference_steps?: number;
    lora_scale?: number;
    timestamp?: string;
    seed?: number;
    isImg2Img: boolean;
    privateLoraName?: string;
    style?: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    extra_lora?: string;
    extra_lora_scale?: number;
};

export type LogEntry = {
    timestamp: string;
    message: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'error';  // Added 'error'
};

export type TelemetryData = {
    requestId: string;
    requestStartTime: string; // ISO 8601 format
    responseTime: number;
    totalDuration: number;
    statusChanges: { status: string; timestamp: string }[]; // ISO 8601 format
    modelLoadTime?: number;
    pollingSteps: number;
    generationParameters: FormData & {
        hasInputImage: boolean;
        style?: string;  // Add this for recraftv3
    };
    outputImageSizes: number[];
    clientInfo: {
        userAgent: string;
        language: string;
        screenSize: string;
        timezone: string;
    };
    timeOfDay: string;
    dayOfWeek: string;
    errors: string[];
    cancelledByUser: boolean;
    replicateId: string;
    replicateModel: string;
    replicateVersion: string;
    replicateCreatedAt: string;
    replicateStartedAt: string;
    replicateCompletedAt: string;
    replicatePredictTime: number;
    cancelledAt?: string;
    cancelledId?: string;
};

export type Recraftv3Size =
    | "1024x1024" | "1365x1024" | "1024x1365"
    | "1536x1024" | "1024x1536" | "1820x1024"
    | "1024x1820" | "1024x2048" | "2048x1024"
    | "1434x1024" | "1024x1434" | "1024x1280"
    | "1280x1024" | "1707x1024" | "1024x1707";

export type Recraftv3Style =
    | "any"
    | "realistic_image"
    | "digital_illustration"
    | "digital_illustration/pixel_art"
    | "digital_illustration/hand_drawn"
    | "digital_illustration/grain"
    | "digital_illustration/infantile_sketch"
    | "digital_illustration/2d_art_poster"
    | "digital_illustration/handmade_3d"
    | "digital_illustration/hand_drawn_outline"
    | "digital_illustration/engraving_color"
    | "digital_illustration/2d_art_poster_2"
    | "realistic_image/b_and_w"
    | "realistic_image/hard_flash"
    | "realistic_image/hdr"
    | "realistic_image/natural_light"
    | "realistic_image/studio_portrait"
    | "realistic_image/enterprise"
    | "realistic_image/motion_blur";

export interface CanvasDrawProps {
    onChange?: (canvas: CanvasDraw) => void;
    loadTimeOffset?: number;
    lazyRadius?: number;
    brushRadius?: number;
    brushColor?: string;
    catenaryColor?: string;
    gridColor?: string;
    backgroundColor?: string;
    hideGrid?: boolean;
    canvasWidth?: number;
    canvasHeight?: number;
    disabled?: boolean;
    imgSrc?: string;
    saveData?: string;
    immediateLoading?: boolean;
    hideInterface?: boolean;
    enablePanAndZoom?: boolean;
    mouseZoomFactor?: number;
    zoomExtents?: { min: number; max: number };
    className?: string;
}

// Add this class declaration for CanvasDraw
export declare class CanvasDraw extends React.Component<CanvasDrawProps> {
    clear(): void;
    undo(): void;
    getSaveData(): string;
    getDataURL(): string;
    loadSaveData(saveData: string, immediate?: boolean): void;
    container: HTMLDivElement | null;
}

export interface ReactSketchCanvasRef {
    exportImage: (imageType: 'png' | 'jpeg') => Promise<string>;
    exportSvg: () => Promise<string>;
    clearCanvas: () => void;
    undo: () => void;
    redo: () => void;
    resetCanvas: () => void;
}

export interface ReactSketchCanvasProps {
    width?: string;
    height?: string;
    strokeWidth?: number;
    strokeColor?: string;
    canvasColor?: string;
    backgroundImage?: string;
    exportWithBackgroundImage?: boolean;
    preserveBackgroundImageAspectRatio?: string;
    className?: string;
}