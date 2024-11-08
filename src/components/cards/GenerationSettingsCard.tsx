'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormData, Recraftv3Size, Recraftv3Style } from '@/types/types';
import { ApiSettingsModal } from "@/components/modals/ApiSettingsModal";
import { useEffect } from 'react';

interface GenerationSettingsCardProps {
	formData: FormData;
	isLoading: boolean;
	isGenerating: boolean;
	cancelUrl: string | null;
	validatedLoraModels: string[];
	isValidatingLora: boolean;
	loraValidationError: string | null;
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	handleSelectChange: (name: string, value: string) => void;
	handleSwitchChange: (name: string, checked: boolean) => void;
	handleSliderChange: (name: string, value: number[]) => void;
	handleNumOutputsChange: (value: number) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	handleCancel: () => void;
    apiKey: string;
    showApiKeyAlert: boolean;
    handleApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GenerationSettingsCard({
	formData,
	isLoading,
	isGenerating,
	cancelUrl,
	validatedLoraModels,
	isValidatingLora,
	loraValidationError,
	handleInputChange,
	handleBlur,
	handleSelectChange,
	handleSwitchChange,
	handleSliderChange,
	handleNumOutputsChange,
	handleSubmit,
	handleCancel,
	apiKey,
    showApiKeyAlert,
    handleApiKeyChange
}: GenerationSettingsCardProps) {

	const isRecraftModel = (model: string) => {
		return model.includes('recraftv3');
	};
	const isRecraftv3 = isRecraftModel(formData.model);
	const isSvgFormat = formData.output_format === 'svg';
	const validAspectRatios = ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21", "custom"];

	useEffect(() => {
		console.log('formData changed:', {
			model: formData.model,
			outputFormat: formData.output_format,
			isRecraftModel: isRecraftModel(formData.model),
			isRecraftv3: isRecraftModel(formData.model)
		});
	}, [formData]); // Now we only need formData as a dependency

	console.log('Current model:', formData.model);
	console.log('isRecraftModel result:', isRecraftModel(formData.model));
	console.log('isRecraftv3 value:', isRecraftv3);
	console.log('Output format:', formData.output_format);

    const recraftv3Sizes: Recraftv3Size[] = [
        "1024x1024", "1365x1024", "1024x1365", "1536x1024", "1024x1536",
        "1820x1024", "1024x1820", "1024x2048", "2048x1024", "1434x1024",
        "1024x1434", "1024x1280", "1280x1024", "1707x1024", "1024x1707"
    ];

	const recraftv3SvgStyles = [
		"any",
		"engraving",
		"line_art",
		"line_circuit",
		"linocut"
	];

    const recraftv3Styles: Recraftv3Style[] = [
        "any", "realistic_image", "digital_illustration", "digital_illustration/pixel_art",
        "digital_illustration/hand_drawn", "digital_illustration/grain",
        "digital_illustration/infantile_sketch", "digital_illustration/2d_art_poster",
        "digital_illustration/handmade_3d", "digital_illustration/hand_drawn_outline",
        "digital_illustration/engraving_color", "digital_illustration/2d_art_poster_2",
        "realistic_image/b_and_w", "realistic_image/hard_flash", "realistic_image/hdr",
        "realistic_image/natural_light", "realistic_image/studio_portrait",
        "realistic_image/enterprise", "realistic_image/motion_blur"
	];

	return (
		<Card className="w-full relative">
			<div className="absolute -top-3 -right-2">
            <ApiSettingsModal
                apiKey={apiKey}
                showApiKeyAlert={showApiKeyAlert}
                handleApiKeyChange={handleApiKeyChange}
            />
			</div>
			<CardHeader>
				<CardTitle>Generation Settings</CardTitle>
				<CardDescription>Generate images using AI with the Replicate API</CardDescription>
			</CardHeader>
			<CardContent className="h-[620px] overflow-y-auto">  
			<form onSubmit={handleSubmit}>
					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic">Basic</TabsTrigger>
							<TabsTrigger value="advanced">Advanced</TabsTrigger>
						</TabsList>
						<TabsContent value="basic" className="mt-4">
							<div className="space-y-4 px-2">
								<div>
									<Label htmlFor="prompt">Prompt</Label>
									<Textarea
										id="prompt"
										name="prompt"
										value={formData.prompt}
										onChange={handleInputChange}
										placeholder="Enter your prompt here"
										required
										className="min-h-[100px]"
									/>
								</div>
								{!isRecraftv3 && (
									<div className="flex items-center space-x-2">
										<Switch
											id="go_fast"
											checked={formData.go_fast}
											onCheckedChange={(checked) => handleSwitchChange('go_fast', checked)}
										/>
										<Label htmlFor="go_fast">Go Fast</Label>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<AlertCircle className="h-4 w-4 text-gray-500" />
												</TooltipTrigger>
												<TooltipContent>
													<p>Enable for faster generation at the cost of some quality</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								)}
								{!isRecraftv3 && (
								<div>
									<Label>Number of Outputs</Label>
									<div className="flex space-x-2">
										{[1, 2, 3, 4].map((value) => (
											<button
												key={value}
												type="button"
												onClick={() => handleNumOutputsChange(value)}
												className={`w-12 h-12 flex items-center justify-center rounded-lg ${formData.num_outputs === value
													? 'btn-theme'
													: 'bg-gray-200 text-gray-700 border border-gray-300'
													}`}
											>
												{value}
											</button>
										))}
									</div>
								</div>
								)}

{!isRecraftv3 && (
    <>
        <div>
            <Label htmlFor="guidance_scale">Guidance Scale: {formData.guidance_scale}</Label>
            <Slider
                id="guidance_scale"
                min={0}
                max={10}
                step={0.1}
                value={[formData.guidance_scale]}
                onValueChange={(value) => handleSliderChange('guidance_scale', value)}
                className="custom-slider"
            />
        </div>
        <div>
            <Label htmlFor="num_inference_steps">Inference Steps: {formData.num_inference_steps}</Label>
            <Slider
                id="num_inference_steps"
                min={1}
                max={formData.model === 'schnell' && !formData.privateLoraName ? 4 : 50}
                step={1}
                value={[formData.num_inference_steps]}
                onValueChange={(value) => handleSliderChange('num_inference_steps', value)}
                className="custom-slider"
            />
        </div>
        <div>
            <Label htmlFor="seed">Seed</Label>
            <Input
                id="seed"
                name="seed"
                type="number"
                value={formData.seed}
                onChange={handleInputChange}
            />
        </div>
    </>
)}


							</div>

							<div className="flex w-full pt-8 pb-10">
                            <Button
                                type="submit"
                                disabled={isLoading || formData.prompt.length <= 1}
                                className="btn-theme flex-1 mr-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    `Generate Image${formData.num_outputs > 1 ? 's' : ''}`
                                )}
                            </Button>
                            <Button
                                onClick={handleCancel}
                                className="btn-cancel flex-1"
                                disabled={!isGenerating || !cancelUrl}
                            >
                                Cancel
                            </Button>
                        </div>

						</TabsContent>
						<TabsContent value="advanced" className="mt-4 overflow-y-auto scrollbar-hide overscroll-none touch-pan-y">
							<div className="space-y-4 pb-12 px-2">



								<div className="pt-4">
									<h6 className="text-md font-medium">Base Model Settings</h6>
								</div>
								<div>
									<Label htmlFor="model">Base Model</Label>
									<Select name="model" value={formData.model} onValueChange={(value) => handleSelectChange('model', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select a model" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="dev">FLUX.1 Dev</SelectItem>
											<SelectItem value="schnell">FLUX.1 Schnell</SelectItem>
											<SelectItem value="recraftv3">Recraft v3</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="pt-4">
									<h6 className="text-md font-medium">Image Settings</h6>
								</div>


                                <div>
                                    <Label htmlFor="output_format">Output Format</Label>
                                    <Select 
                                        name="output_format" 
                                        value={formData.output_format} 
                                        onValueChange={(value) => handleSelectChange('output_format', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select output format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isRecraftv3 ? (
                                                <>
                                                    <SelectItem value="webp">WebP</SelectItem>
                                                    <SelectItem value="svg">SVG</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="webp">WebP</SelectItem>
                                                    <SelectItem value="jpg">JPG</SelectItem>
                                                    <SelectItem value="png">PNG</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!isRecraftv3 && (
                                    <>

								<div>
									<Label htmlFor="output_quality">Output Quality: {formData.output_quality}</Label>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div>
													<Slider
														id="output_quality"
														min={0}
														max={100}
														step={1}
														value={[formData.output_quality]}
														onValueChange={(value) => handleSliderChange('output_quality', value)}
														className="custom-slider"
														disabled={formData.output_format !== 'jpg'}
													/>
												</div>
											</TooltipTrigger>
											{formData.output_format !== 'jpg' && (
												<TooltipContent>
													<p>Output quality is only adjustable for JPG format.</p>
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								</div>

								<div>
									<Label htmlFor="aspect_ratio">Aspect Ratio</Label>
									<Select name="aspect_ratio" value={formData.aspect_ratio} onValueChange={(value) => handleSelectChange('aspect_ratio', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select an aspect ratio" />
										</SelectTrigger>
										<SelectContent>
											{validAspectRatios.map((ratio) => (
												<SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{formData.aspect_ratio === 'custom' && (
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label htmlFor="width">Width</Label>
											<Input
												id="width"
												name="width"
												type="number"
												value={formData.width}
												onChange={handleInputChange}
												min={256}
												max={1440}
												step={16}
											/>
										</div>
										<div>
											<Label htmlFor="height">Height</Label>
											<Input
												id="height"
												name="height"
												type="number"
												value={formData.height}
												onChange={handleInputChange}
												min={256}
												max={1440}
												step={16}
											/>
										</div>
									</div>
								)}
								</>
							)}



                                {isRecraftv3 && (
                                    <>
                                        <div>
                                            <Label htmlFor="recraftSize">Size</Label>
                                            <Select 
                                                name="recraftSize" 
                                                value={`${formData.width}x${formData.height}`}
                                                onValueChange={(value) => {
                                                    const [width, height] = value.split('x').map(Number);
                                                    handleSelectChange('width', width.toString());
                                                    handleSelectChange('height', height.toString());
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {recraftv3Sizes.map((size) => (
                                                        <SelectItem key={size} value={size}>{size}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="style">Style</Label>
                                            <Select 
                                                name="style" 
                                                value={formData.style || 'any'}
                                                onValueChange={(value) => handleSelectChange('style', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select style" />
                                                </SelectTrigger>
												<SelectContent>
													{isRecraftv3 && isSvgFormat ? (
														recraftv3SvgStyles.map((style) => (
															<SelectItem key={style} value={style}>
																{style.replace(/_/g, ' ')}
															</SelectItem>
														))
													) : (
														recraftv3Styles.map((style) => (
															<SelectItem key={style} value={style}>
																{style.replace(/_/g, ' ')}
															</SelectItem>
														))
													)}
												</SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                                {!isRecraftv3 && (
                                    <>
								<div className="pt-4">
									<h6 className="text-md font-medium">Fine-tuned Model Settings</h6>
								</div>
								<div>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Label htmlFor="privateLoraName">Private LoRA Model Name</Label>
											</TooltipTrigger>
											<TooltipContent>
												<p>Enter the name of your private LoRA model. This is optional and only required for custom models.</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<div className="relative">
										<Input
											id="privateLoraName"
											name="privateLoraName"
											value={`${formData.privateLoraName}${formData.privateLoraVersion ? ':' + formData.privateLoraVersion : ''}`}
											onChange={handleInputChange}
											onBlur={handleBlur}
											placeholder="Enter private LoRA model name (optional)"
											list="loraModels"
											className="pr-10"
										/>
										{formData.privateLoraName && (
											<button
												type="button"
												onClick={() => {
													const e = { target: { name: 'privateLoraName', value: '' } } as React.ChangeEvent<HTMLInputElement>;
													handleInputChange(e);
												}}
												className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
											>
												&times;
											</button>
										)}
										{isValidatingLora && (
											<Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
										)}
									</div>
									{loraValidationError ? (
										<p className="text-sm text-red-500 mt-1">{loraValidationError}</p>
									) : formData.privateLoraName && validatedLoraModels.includes(`${formData.privateLoraName}${formData.privateLoraVersion ? ':' + formData.privateLoraVersion : ''}`) ? (
										<p className="text-sm text-green-500 mt-1">LoRA model validated successfully!</p>
									) : null}
								</div>
								<div>
									<Label htmlFor="lora_scale">Private LoRA Scale: {formData.lora_scale}</Label>
									<Slider
										id="lora_scale"
										min={-1}
										max={2}
										step={0.01}
										value={[formData.lora_scale]}
										onValueChange={(value) => handleSliderChange('lora_scale', value)}
										className="custom-slider"
									/>
								</div>
								<div className="pt-4">
									<h6 className="text-md font-medium">Extra LoRA Settings</h6>
								</div>
								<div>
									<Label htmlFor="extra_lora">Extra LoRA</Label>
									<Input
										id="extra_lora"
										name="extra_lora"
										value={formData.extra_lora}
										onChange={handleInputChange}
										placeholder="e.g., fofr/flux-pixar-cars"
									/>
								</div>
								<div>
									<Label htmlFor="extra_lora_scale">Extra LoRA Scale: {formData.extra_lora_scale}</Label>
									<Slider
										id="extra_lora_scale"
										min={0}
										max={1}
										step={0.01}
										value={[formData.extra_lora_scale]}
										onValueChange={(value) => handleSliderChange('extra_lora_scale', value)}
										className="custom-slider"
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Switch
										id="disable_safety_checker"
										checked={formData.disable_safety_checker}
										onCheckedChange={(checked) => handleSwitchChange('disable_safety_checker', checked)}
									/>
									<Label htmlFor="disable_safety_checker">Disable Safety Checker</Label>
								</div>
								</>
							)}
							</div>
						</TabsContent>
					</Tabs>

				</form>
			</CardContent>
		</Card>
	);
}