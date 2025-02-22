import React from 'react';

export type IdeogramStyleType = "None" | "Auto" | "General" | "Realistic" | "Design" | "Render 3D" | "Anime";
export type IdeogramMagicPromptOption = "Auto" | "On" | "Off";

export type FormData = {
    seed: number;
    model: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3' | 'recraftv3-svg' | 'ideogram' | 'luma';
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
    maskDataUrl?: string | null;
    prompt_strength?: number;
    negative_prompt?: string;
    style_type?: IdeogramStyleType;
    magic_prompt_option?: IdeogramMagicPromptOption;
    image_reference_url?: string;
    style_reference_url?: string;
    character_reference_url?: string;
    image_reference_weight: number;
    style_reference_weight: number;
};

export type GeneratedImage = {
    url: string;
    prompt: string;
    negative_prompt?: string;
    model: string;
    seed: number;
    blobData?: Blob;        // For storing the actual image data
    displayUrl?: string;    // For temporary display URLs
    version?: string;
    privateLoraName?: string;
    lora_scale?: number;
    extra_lora?: string;
    extra_lora_scale?: number;
    guidance_scale: number;
    num_inference_steps: number;
    go_fast?: boolean;
    output_format?: string;
    output_quality?: number;
    disable_safety_checker?: boolean;
    width: number;
    height: number;
    aspect_ratio?: string;
    style?: string;
    isImg2Img?: boolean;
    prompt_strength?: number;
    maskDataUrl?: string | null;
    sourceImageUrl: string,
    timestamp: string;
    baseInputImage?: string;
    baseInputImageFormat?: string;
    generationType?: 'txt2img' | 'img2img' | 'inpainting';
    image_reference_url?: string;
    image_reference_weight?: number;
    style_reference_url?: string;
    style_reference_weight?: number;
    character_reference_url?: string;
    sourceFile?: File;
    sourceDimensions?: {
        width: number;
        height: number;
    };
    isEdited?: boolean;
    originalUrl?: string;
    cropData?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

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


export type LumaPhotonAspectRatio =
    | "1:1" | "3:4" | "4:3" | "9:16"
    | "16:9" | "9:21" | "21:9";


    export interface GenerationParams {
        prompt: string;
        seed: number;
        model: "dev" | "schnell" | "pro" | "pro-ultra" | "recraftv3" | "recraftv3-svg" | "ideogram" | "luma";
        width: number;
        height: number;
        sourceImage?: {
            url: string;
            file: File | null;
        };
    }

export interface UpscaleParams {
    version: string;
    input: {
        image: string;
        scale?: number;
        face_enhance?: boolean;
        jpeg?: number;
        noise?: number;
        task_type?: string;
    };
}

export interface PexelsImage {
    id: string;
    width: number;
    height: number;
    photographer: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        tiny: string;
    };
}

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

export interface ImagePackConfig {
    prompt: string;
    negative_prompt?: string;
    model: string;
    seed: number;
    version?: string;
    privateLoraName?: string;
    lora_scale?: number;
    extra_lora?: string;
    extra_lora_scale?: number;
    guidance_scale: number;
    num_inference_steps: number;
    go_fast?: boolean;
    output_format: string;
    output_quality?: number;
    disable_safety_checker?: boolean;
    width?: number;
    height?: number;
    aspect_ratio?: string;
    style?: string;
    isImg2Img: boolean;
    prompt_strength?: number;
    sourceImageUrl?: string;
    maskDataUrl?: string;
    zipFile: File;
    previewImageUrl?: string;
    image_reference_url?: string;
    image_reference_weight?: number;
    style_reference_url?: string;
    style_reference_weight?: number;
    character_reference_url?: string;
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
