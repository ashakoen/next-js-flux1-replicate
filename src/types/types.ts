export type FormData = {
    seed: number;
    model: 'dev' | 'schnell';
    privateLoraName: string;
    privateLoraVersion: string;
    width: number;
    height: number;
    prompt: string;
    extra_lora: string;
    lora_scale: number;
    num_outputs: number;
    aspect_ratio: string;
    output_format: 'webp' | 'jpg' | 'png';
    guidance_scale: number;
    output_quality: number;
    extra_lora_scale: number;
    num_inference_steps: number;
    disable_safety_checker: boolean;
    go_fast: boolean;
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
};