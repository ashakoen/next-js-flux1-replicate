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
import { FormData } from '@/types/types';
import { ApiSettingsModal } from "@/components/modals/ApiSettingsModal";

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

	const validAspectRatios = ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21", "custom"];

	return (
		<Card className="w-full max-h-[calc(100vh-10rem)] relative">
			<div className="absolute -top-3 -right-2">
            <ApiSettingsModal
                apiKey={apiKey}
                showApiKeyAlert={showApiKeyAlert}
                handleApiKeyChange={handleApiKeyChange}
            />
			</div>
			<CardHeader>
				<CardTitle>Generation Settings</CardTitle>
				<CardDescription>Generate images using FLUX.1 through the Replicate API</CardDescription>
			</CardHeader>
			<CardContent className="overflow-y-auto"> 
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
						<TabsContent value="advanced" className="mt-4 h-[calc(100vh-24rem)] overflow-y-auto scrollbar-hide">
							<div className="space-y-4 pb-12 px-2">
								<div className="pt-4">
									<h6 className="text-md font-medium">Image Settings</h6>
								</div>
								<div>
									<Label htmlFor="output_format">Output Format</Label>
									<Select name="output_format" value={formData.output_format} onValueChange={(value) => handleSelectChange('output_format', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select output format" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="webp">WebP</SelectItem>
											<SelectItem value="jpg">JPG</SelectItem>
											<SelectItem value="png">PNG</SelectItem>
										</SelectContent>
									</Select>
								</div>
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
								<div className="pt-4">
									<h6 className="text-md font-medium">Model Settings</h6>
								</div>
								<div>
									<Label htmlFor="model">FLUX.1 Base Model</Label>
									<Select name="model" value={formData.model} onValueChange={(value) => handleSelectChange('model', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select a model" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="dev">Dev</SelectItem>
											<SelectItem value="schnell">Schnell</SelectItem>
										</SelectContent>
									</Select>
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
										max={50}
										step={1}
										value={[formData.num_inference_steps]}
										onValueChange={(value) => handleSliderChange('num_inference_steps', value)}
										className="custom-slider"
									/>
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
							</div>
						</TabsContent>
					</Tabs>

				</form>
			</CardContent>
		</Card>
	);
}