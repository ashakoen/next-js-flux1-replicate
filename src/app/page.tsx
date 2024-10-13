'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, AlertCircle, Star, Trash2, Moon, Sun } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useTheme } from "next-themes";

type FormData = {
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

type GeneratedImage = {
  url: string;
  prompt: string;
  model?: string;
  version?: string;
  go_fast?: boolean;
  guidance_scale?: number;
  num_inference_steps?: number;
  lora_scale?: number;
};

const initialFormData: FormData = {
  seed: 0,
  model: 'dev',
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
};

const validAspectRatios = ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21", "custom"];

export default function Component() {
  const { theme, setTheme } = useTheme();
  const [validatedLoraModels, setValidatedLoraModels] = useState<string[]>([]);
  const [isValidatingLora, setIsValidatingLora] = useState(false);
  const [loraValidationError, setLoraValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoraModel, setSelectedLoraModel] = useState<string | null>(null);
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [cancelUrl, setCancelUrl] = useState<string | null>(null);
  const isPolling = useRef(true);

  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    setFilteredImages(
      generatedImages.filter((image) => {
        const normalizedPrompt = image.prompt.trim().toLowerCase();
        const normalizedSearchTerm = searchTerm.trim().toLowerCase();
        const regex = new RegExp(`\\b${normalizedSearchTerm}\\b`, 'i');
        const isMatch = regex.test(normalizedPrompt);
        return isMatch;
      })
    );
  }, [generatedImages, searchTerm]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('replicateApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    const savedLoraModels = localStorage.getItem('validatedLoraModels');
    if (savedLoraModels) {
      setValidatedLoraModels(JSON.parse(savedLoraModels));
    }
  }, []);

  useEffect(() => {
    const savedGeneratedImages = localStorage.getItem('generatedImages');
    console.log('Loaded generatedImages from localStorage:', savedGeneratedImages);
    if (savedGeneratedImages) {
      setGeneratedImages(JSON.parse(savedGeneratedImages));
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      console.log('Saving generatedImages to localStorage:', generatedImages);
      localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
    }
  }, [generatedImages, isInitialLoad]);

  const clearGeneratedImages = () => {
    setGeneratedImages([]);
    localStorage.removeItem('generatedImages');
  };

  useEffect(() => {
    const savedFavoritePrompts = localStorage.getItem('favoritePrompts');
    if (savedFavoritePrompts) {
      setFavoritePrompts(JSON.parse(savedFavoritePrompts));
    }
  }, []);

  useEffect(() => {
    const savedFormData = localStorage.getItem('replicateFormData');
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setFormData(prevData => ({
        ...prevData,
        ...parsedData,
        privateLoraName: parsedData.privateLoraName || '',
        privateLoraVersion: parsedData.privateLoraVersion || '',
      }));
    }
  }, []);

  const handleNumOutputsChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      num_outputs: value,
    }));
  };

  const handleSavePrompt = useCallback(() => {
    if (formData.prompt && !favoritePrompts.includes(formData.prompt)) {
      const updatedFavorites = [...favoritePrompts, formData.prompt];
      setFavoritePrompts(updatedFavorites);
      localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
    }
  }, [formData.prompt, favoritePrompts]);

  const handleDeleteFavoritePrompt = useCallback((prompt: string) => {
    const updatedFavorites = favoritePrompts.filter(p => p !== prompt);
    setFavoritePrompts(updatedFavorites);
    localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
  }, [favoritePrompts]);

  const handleDeleteImage = (imageUrl: string) => {
    setGeneratedImages((prev) => {
      const updatedImages = prev.filter((image) => image.url !== imageUrl);
      localStorage.setItem('generatedImages', JSON.stringify(updatedImages));
      return updatedImages;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'privateLoraName') {
      if (value.trim() === '') {
        setSelectedLoraModel('');
      }
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          privateLoraName: value
        };
        localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
        return updatedFormData;
      });
    } else {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          [name]: type === 'number' ? Number(value) : value
        };
        localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
        return updatedFormData;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'privateLoraName') {
      const fullModelName = value;
      if (fullModelName && !validatedLoraModels.includes(fullModelName)) {
        validateLoraModel(fullModelName);
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };
      localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
      return updatedFormData;
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: checked };
      localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
      return updatedFormData;
    });
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value[0] };
      localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
      return updatedFormData;
    });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('replicateApiKey', newApiKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey) {
      setShowApiKeyAlert(true);
      return;
    }

    if (isGenerating) {
      return;
    }

    isPolling.current = true;
    abortController.current = new AbortController();

    const [loraName, loraVersion] = formData.privateLoraName.split(':');

    console.log('LoRA Name:', loraName);
    console.log('LoRA Version:', loraVersion);

    let replicateParams;
    if (loraName && loraVersion) {
      replicateParams = {
        version: loraVersion,
        input: {
          prompt: formData.prompt,
          model: formData.model,
          num_outputs: formData.num_outputs,
          guidance_scale: formData.guidance_scale,
          num_inference_steps: formData.num_inference_steps,
          output_format: formData.output_format,
          output_quality: formData.output_quality,
          disable_safety_checker: formData.disable_safety_checker,
          ...(formData.aspect_ratio === 'custom' ? { width: formData.width, height: formData.height } : { aspect_ratio: formData.aspect_ratio }),
          lora: loraName,
          lora_scale: formData.lora_scale,
          ...(formData.extra_lora ? { extra_lora: formData.extra_lora, extra_lora_scale: formData.extra_lora_scale } : {}),
          ...(formData.seed !== 0 ? { seed: formData.seed } : {}),
          go_fast: formData.go_fast,
        }
      };
    } else {
      replicateParams = {
        input: {
          prompt: formData.prompt,
          num_outputs: formData.num_outputs,
          guidance_scale: formData.guidance_scale,
          num_inference_steps: formData.num_inference_steps,
          output_format: formData.output_format,
          output_quality: formData.output_quality,
          disable_safety_checker: formData.disable_safety_checker,
          ...(formData.aspect_ratio === 'custom' ? { width: formData.width, height: formData.height } : { aspect_ratio: formData.aspect_ratio }),
          ...(formData.extra_lora ? { extra_lora: formData.extra_lora, extra_lora_scale: formData.extra_lora_scale } : {}),
          ...(formData.seed !== 0 ? { seed: formData.seed } : {}),
          go_fast: formData.go_fast,
        },
        model: formData.model,
      };
    }

    console.log('Replicate Params:', replicateParams);

    setIsGenerating(true);
    setIsLoading(true);
    setShowApiKeyAlert(false);

    try {
      const initialResponse = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          body: replicateParams,
        }),
      });

      if (!initialResponse.ok) {
        throw new Error(`HTTP error! status: ${initialResponse.status}`);
      }

      const initialData = await initialResponse.json();
      const getUrl = initialData.urls.get;
      setCancelUrl(initialData.urls.cancel);

      pollForResult(getUrl);

    } catch (error) {
      console.error('There was a problem with the request:', error);
      setShowApiKeyAlert(true);
      stopStatuses();
    }
  };

  const pollForResult = async (url: string) => {
    if (!isPolling.current) return;

    try {
      const pollResponse = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          getUrl: url,
        }),
        signal: abortController.current?.signal,
      });

      const pollData = await pollResponse.json();

      if (pollData.status === 'canceled') {
        
        console.log('Generation was canceled.');
        stopStatuses();
        return;
      }

      if (pollData.status === 'succeeded') {
        const newImages = pollData.output.map((outputUrl: string) => ({
          url: outputUrl,
          prompt: pollData.input.prompt,
          model: pollData.model,
          version: pollData.version,
          go_fast: pollData.input.go_fast,
          guidance_scale: pollData.input.guidance_scale,
          num_inference_steps: pollData.input.num_inference_steps,
          lora_scale: pollData.input.lora_scale,
        }));

        setGeneratedImages((prev) => {
          const updatedImages = [...prev, ...newImages];
          localStorage.setItem('generatedImages', JSON.stringify(updatedImages));
          return updatedImages;
        });

        stopStatuses();
      } else if (pollData.status === 'failed') {
        console.error('Prediction failed');
        stopStatuses();
      } else if (['processing', 'starting'].includes(pollData.status)) {
        setTimeout(() => {
          if (isPolling.current) {
            pollForResult(url);
          }
        }, 3000);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted:', error);
      } else {
        console.error('Polling error:', error);
        setShowApiKeyAlert(true);
        stopStatuses();
      }
    }
  };

  const stopStatuses = () => {
    setIsLoading(false);
    setIsGenerating(false);
    isPolling.current = false;
  };

  const validateLoraModel = (modelName: string) => {
    if (!apiKey) {
      setShowApiKeyAlert(true);
      return;
    }
    setIsValidatingLora(true);
    setLoraValidationError(null);
    setTimeout(() => {
      setIsValidatingLora(false);
      setValidatedLoraModels((prev) => {
        const newModels = Array.from(new Set([...prev, modelName]));
        localStorage.setItem('validatedLoraModels', JSON.stringify(newModels));
        return newModels;
      });
      setLoraValidationError(null);
      setFormData((prev) => ({ ...prev, privateLoraName: modelName }));
    }, 2000);
  };

  const clearValidatedModels = () => {
    setValidatedLoraModels([]);
    localStorage.removeItem('validatedLoraModels');
  };

  const downloadImage = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `generated-image-${Date.now()}.${formData.output_format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCancel = async () => {
    isPolling.current = false;

    try {
      if (abortController.current) {
        abortController.current.abort();
      }

      if (cancelUrl) {
        const response = await fetch('/api/replicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey, cancelUrl }),
        });

        if (response.ok) {
          console.log('Generation canceled successfully');
        } else {
          console.error('Failed to cancel generation');
        }
      }

      setIsLoading(false);
      setIsGenerating(false);
      setCancelUrl(null);

    } catch (error) {
      console.error('Cancel request failed:', error);
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <Card className="w-full mx-auto mb-8 mt-8">
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Your Creations</CardTitle>
                <CardDescription>View, download, or manage your generated images</CardDescription>
              </div>
              {isGenerating && (
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search images by prompt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {filteredImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {filteredImages.map((image: GeneratedImage, index) => (
                  <div key={index} className="relative group">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="relative w-full pb-[100%]">
                            <Image
                              src={image.url}
                              alt={`Generated image ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-lg shadow-md transition-transform duration-200 transform group-hover:scale-105"
                            />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px]">
                        <div className="w-full h-auto max-h-[80vh] max-w-full">
                          <Image
                            src={image.url}
                            alt={`Generated image ${index + 1}`}
                            layout="responsive"
                            width={800}
                            height={800}
                            className="rounded-lg max-h-[80vh] max-w-full object-contain"
                          />
                        </div>
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
                          <h3 className="text-lg font-semibold mb-2">Image Details</h3>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Prompt:</span> {image.prompt}
                            </p>
                            {image.model && (
                              <p className="text-sm">
                                <span className="font-medium">Model:</span> {image.model}
                              </p>
                            )}
                            {image.version && (
                              <p className="text-sm">
                                <span className="font-medium">Version:</span> {image.version}
                              </p>
                            )}
                            {image.go_fast !== undefined && (
                              <p className="text-sm">
                                <span className="font-medium">Go Fast:</span> {image.go_fast ? 'Yes' : 'No'}
                              </p>
                            )}
                            {image.guidance_scale !== undefined && (
                              <p className="text-sm">
                                <span className="font-medium">Guidance Scale:</span> {image.guidance_scale}
                              </p>
                            )}
                            {image.num_inference_steps !== undefined && (
                              <p className="text-sm">
                                <span className="font-medium">Inference Steps:</span> {image.num_inference_steps}
                              </p>
                            )}
                            {image.lora_scale !== undefined && (
                              <p className="text-sm">
                                <span className="font-medium">LoRA Scale:</span> {image.lora_scale}
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => downloadImage(image.url)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download image</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => handleDeleteImage(image.url)}
                    >
                      <span className="sr-only">Delete image</span>
                      &times;
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {isGenerating ? `Generating ${formData.num_outputs > 1 ? 'images, please wait' : 'image, please wait'}...` : 'No generated images yet.'}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              className="btn-theme"
              onClick={clearGeneratedImages}
              disabled={generatedImages.length === 0}
            >
              Clear Generated Images
            </Button>
          </CardFooter>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 justify-end">
          <div className="lg:col-span-3">
            <Card className="w-full mb-8">
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Generate images using FLUX.1 through the Replicate API</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic">
                      <div className="space-y-4">
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
                    </TabsContent>
                    <TabsContent value="advanced">
                      <div className="space-y-4">
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
                          <Label htmlFor="model">Base Model</Label>
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
                                  setFormData((prev) => ({ ...prev, privateLoraName: '' }));
                                  setSelectedLoraModel('');
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
                  <CardFooter className="flex justify-end pt-8">
                    <div className="flex w-full">
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
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="fixed bottom-4 right-4 z-50"
                >
                  <span className="sr-only">Open settings</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </Button>
              </DrawerTrigger>
              {typeof document !== 'undefined' && ReactDOM.createPortal(
                <DrawerContent className="drawer-content">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="api-key" className="border-b border-gray-200 dark:border-gray-700">
                      <AccordionTrigger>Replicate API Key</AccordionTrigger>
                      <AccordionContent>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="apiKey">API Key</Label>
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
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="validated-models" className="border-b border-gray-200 dark:border-gray-700">
                      <AccordionTrigger>Validated LoRA Models</AccordionTrigger>
                      <AccordionContent>
                        <Card>
                          <CardContent className="pt-6">
                            {validatedLoraModels.length > 0 ? (
                              <Select
                                value={selectedLoraModel || 'select-one'}
                                onValueChange={(value) => {
                                  setSelectedLoraModel(value);
                                  setFormData((prevFormData) => ({
                                    ...prevFormData,
                                    privateLoraName: value
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-full max-w-lg">
                                  <SelectValue placeholder="Select a validated LoRA model" />
                                </SelectTrigger>
                                <SelectContent className="w-full max-w-lg">
                                  <SelectItem value="select-one" disabled>Select One</SelectItem>
                                  {validatedLoraModels
                                    .filter(model => typeof model === 'string' && model.trim() !== '')
                                    .map((model, index) => (
                                      <SelectItem key={index} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p>No validated LoRA models yet.</p>
                            )}
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button
                              className="btn-theme"
                              onClick={clearValidatedModels}
                              disabled={validatedLoraModels.length === 0}
                            >
                              Clear Validated Models
                            </Button>
                          </CardFooter>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="favorite-prompts" className="border-b border-gray-200 dark:border-gray-700">
                      <AccordionTrigger>Favorite Prompts</AccordionTrigger>
                      <AccordionContent>
                        <Card>
                          <CardContent className="pt-6">
                            {favoritePrompts.length > 0 ? (
                              <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {favoritePrompts.map((prompt, index) => (
                                  <li key={index} className="flex justify-between items-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            className="truncate cursor-pointer"
                                            onClick={() => setFormData((prev) => ({ ...prev, prompt }))}
                                          >
                                            {prompt}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Click to use</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteFavoritePrompt(prompt)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No favorite prompts saved yet.</p>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="btn-theme"
                              onClick={handleSavePrompt}
                              disabled={!formData.prompt || favoritePrompts.includes(formData.prompt)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Save Current Prompt
                            </Button>
                          </CardFooter>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </div>
                </DrawerContent>,
                document.body
              )}
            </Drawer>
          </div>
        </div>
      </div>
    </>
  );
}