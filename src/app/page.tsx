'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Terminal } from 'lucide-react';
import { GenerationSettingsCard } from '@/components/cards/GenerationSettingsCard';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import ServerLogModal from '../components/modals/serverLogModal';
import { 
    FormData, 
    GeneratedImage, 
    LogEntry, 
    TelemetryData 
} from '@/types/types';
import { GeneratedImagesCard } from "@/components/cards/GeneratedImagesCard";
import { ImageUploadCard } from "@/components/cards/ImageUploadCard";


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
	style: 'any'
};

export default function Component() {
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

	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [showLogs, setShowLogs] = useState(false);
	const logEndRef = useRef<HTMLDivElement>(null);
	const logContainerRef = useRef<HTMLDivElement>(null);
	const shouldScrollRef = useRef(false);

	const abortController = useRef<AbortController | null>(null);
	const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null)
	const [selectedImage, setSelectedImage] = useState<{ url: string; file: File | null } | null>(null);

	const getClientInfo = () => {
		return {
			userAgent: navigator.userAgent,
			language: navigator.language,
			screenSize: `${window.screen.width}x${window.screen.height}`,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		}
	}

	const getCurrentUTCTimestamp = () => {
		return new Date().toISOString()
	}

	const getLocalTimeOfDay = () => {
		return new Date().toLocaleTimeString()
	}

	const getLocalDayOfWeek = () => {
		return new Date().toLocaleDateString('en-US', { weekday: 'long' })
	}

	const scrollToBottom = useCallback(() => {
		if (logContainerRef.current) {
			logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
		}
	}, []);

	useEffect(() => {
		setFilteredImages(
			generatedImages
				.filter((image) => {
					const normalizedPrompt = image.prompt.trim().toLowerCase();
					const normalizedSearchTerm = searchTerm.trim().toLowerCase();
					const regex = new RegExp(`\\b${normalizedSearchTerm}\\b`, 'i');
					const isMatch = regex.test(normalizedPrompt);
					return isMatch;
				})
				.sort((a, b) => {
					const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
					const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
					return timeB - timeA;
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

	useEffect(() => {
		if (logEndRef.current) {
			logEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs]);

	useEffect(() => {
		if (shouldScrollRef.current) {
			scrollToBottom();
			shouldScrollRef.current = false;
		}
	}, [logs, scrollToBottom]);

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
			console.log('handleSelectChange:', {
				name,
				value,
				prevModel: prev.model,
				prevFormat: prev.output_format
			});
		
			// Guard against empty output_format
			if (name === 'output_format' && !value) {
				value = prev.model === 'recraftv3' ? 'webp' : 'png';
			}
		
			const updatedFormData = { 
				...prev, 
				[name]: value,
				// Model-specific constraints
				...(name === 'model' && {
					...(value === 'schnell' && 
						!prev.privateLoraName && 
						prev.num_inference_steps > 4 
							? { num_inference_steps: 4 } 
							: {}),
					...(value === 'recraftv3' 
						? { 
							num_outputs: 1,
							output_format: 'webp',
							style: 'any'
						} 
						: {
							output_format: 'png'  // Always set png when switching to non-recraftv3 models
						})
				}),
           // Handle output format changes for recraftv3
		   ...(name === 'output_format' && prev.model === 'recraftv3' && {
			style: value === 'svg' ? 'any' : 'any'  // Always set to 'any' when switching formats
		})
			};
		
			console.log('Updated formData:', updatedFormData);
			localStorage.setItem('replicateFormData', JSON.stringify(updatedFormData));
			return updatedFormData as FormData;
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

	const handleImageSelect = (imageData: { url: string; file: File | null }) => {
		setSelectedImage(imageData);
	};
	
	// Add this function to handle clearing the image
	const handleClearImage = () => {
		if (selectedImage?.url) {
			URL.revokeObjectURL(selectedImage.url);
		}
		setSelectedImage(null);
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

		let replicateParams;

		const [loraName, loraVersion] = formData.privateLoraName.split(':');

		console.log('LoRA Name:', loraName);
		console.log('LoRA Version:', loraVersion);

		let imageData: string | undefined;
		
		if (selectedImage?.file) {
			const reader = new FileReader();
			const base64Promise = new Promise<string | ArrayBuffer | null>((resolve) => {
				reader.onload = () => resolve(reader.result);
				reader.readAsDataURL(selectedImage.file!); // '!' tells TypeScript we know file exists
			});
			const base64Data = await base64Promise;
			imageData = base64Data as string;
		}

		if (formData.model === 'recraftv3') {
			replicateParams = {
				input: {
					prompt: formData.prompt,
					width: formData.width,
					height: formData.height,
					style: formData.style || 'any',
					output_format: formData.output_format,  // Add this line
					...(selectedImage?.file ? { image: imageData } : {})
				},
				model: formData.model
			};
		
		} else if (loraName && loraVersion) {
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
					...(selectedImage?.file ? { image: imageData } : {}),
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
					...(selectedImage?.file ? { image: imageData } : {}),
				},
				model: formData.model,
			};
		}

		console.log('Replicate Params:', replicateParams);

		setIsGenerating(true);
		setIsLoading(true);
		setShowApiKeyAlert(false);

		const newTelemetryData: TelemetryData = {
			requestId: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			requestStartTime: getCurrentUTCTimestamp(),
			responseTime: 0,
			totalDuration: 0,
			statusChanges: [],
			pollingSteps: 0,
			generationParameters: { 
				...formData,
				hasInputImage: !!selectedImage // Add this line to indicate if an input image was used
			},
			outputImageSizes: [],
			clientInfo: getClientInfo(),
			timeOfDay: getLocalTimeOfDay(),
			dayOfWeek: getLocalDayOfWeek(),
			errors: [],
			cancelledByUser: false,
			replicateId: '',
			replicateModel: '',
			replicateVersion: '',
			replicateCreatedAt: '',
			replicateStartedAt: '',
			replicateCompletedAt: '',
			replicatePredictTime: 0
		}

		setTelemetryData(newTelemetryData)

		try {
			const startTime = Date.now()
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
			const endTime = Date.now()
			const getUrl = initialData.urls.get;
			setCancelUrl(initialData.urls.cancel);

			newTelemetryData.responseTime = endTime - startTime
			newTelemetryData.statusChanges.push({
				status: initialData.status,
				timestamp: getCurrentUTCTimestamp()
			})

			pollForResult(getUrl, newTelemetryData)

		} catch (error) {
			console.error('There was a problem with the request:', error);
			setShowApiKeyAlert(true);
			stopStatuses();
			newTelemetryData.errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
			finalizeTelemetryData(newTelemetryData)
		}
	};



	const pollForResult = async (url: string, currentTelemetryData: TelemetryData) => {
		if (!isPolling.current) return

		currentTelemetryData.pollingSteps++

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
			})

			if (!pollResponse.ok) {
				throw new Error(`HTTP error! status: ${pollResponse.status}`)
			}

			const pollData = await pollResponse.json()

			addLogEntry({
				timestamp: new Date().toISOString(),
				message: pollData.logs || '',
				status: pollData.status
			})

			// Only add a new status change if it's different from the last one
			const lastStatus = currentTelemetryData.statusChanges[currentTelemetryData.statusChanges.length - 1]
			if (!lastStatus || lastStatus.status !== pollData.status) {
				currentTelemetryData.statusChanges.push({
					status: pollData.status,
					timestamp: new Date(pollData.completed_at || pollData.created_at).toISOString()
				})
			}

			if (pollData.status === 'canceled') {
				console.log('Generation was canceled.')
				stopStatuses()
				currentTelemetryData.cancelledByUser = true
				currentTelemetryData.cancelledAt = pollData.completed_at
				currentTelemetryData.cancelledId = pollData.id
				addCompletionMessage('Image generation canceled.')
				finalizeTelemetryData(currentTelemetryData)
				return
			}

			if (pollData.status === 'succeeded') {
				// Update telemetry with Replicate metrics
				const seed = pollData.extractedSeed || pollData.input.seed || 0;
				currentTelemetryData.replicateId = pollData.id
				currentTelemetryData.replicateModel = pollData.model
				currentTelemetryData.replicateVersion = pollData.version
				currentTelemetryData.replicateCreatedAt = pollData.created_at
				currentTelemetryData.replicateStartedAt = pollData.started_at
				currentTelemetryData.replicateCompletedAt = pollData.completed_at
				currentTelemetryData.replicatePredictTime = pollData.metrics?.predict_time || 0
				currentTelemetryData.generationParameters.seed = seed; 

				const outputUrls = Array.isArray(pollData.output) ? pollData.output : [pollData.output];

				const newImages = outputUrls.map((outputUrl: string) => {
					// Fetch image size
					fetch(outputUrl).then(response => {
						const size = parseInt(response.headers.get('content-length') || '0')
						currentTelemetryData.outputImageSizes.push(size)
					})
					return {
						url: outputUrl,
						prompt: pollData.input.prompt,
						model: pollData.model,
						version: pollData.version,
						...(pollData.model !== 'recraftv3' ? {
							go_fast: pollData.input.go_fast,
							guidance_scale: pollData.input.guidance_scale,
							num_inference_steps: pollData.input.num_inference_steps,
							lora_scale: pollData.input.lora_scale,
							seed: seed,
						} : {
							style: pollData.input.style,
							width: pollData.input.width,
							height: pollData.input.height
						}),
						timestamp: new Date().toISOString(),
						isImg2Img: !!selectedImage
					}
				})

				setGeneratedImages((prev) => {
					const updatedImages = [...prev, ...newImages]
					console.log('Saving images with img2img data:', updatedImages)  // Add this line
					localStorage.setItem('generatedImages', JSON.stringify(updatedImages))
					return updatedImages
				})

				stopStatuses()
				finalizeTelemetryData(currentTelemetryData)
				addCompletionMessage('Image generation complete.')
			} else if (pollData.status === 'failed') {
				console.error('Prediction failed')
				stopStatuses()
				currentTelemetryData.errors.push('Prediction failed')
				addCompletionMessage('Image generation failed.')
				finalizeTelemetryData(currentTelemetryData)
			} else if (['processing', 'starting'].includes(pollData.status)) {
				if (pollData.logs && pollData.logs.includes('Loaded LoRAs in')) {
					const loadTimeMatch = pollData.logs.match(/Loaded LoRAs in (\d+\.\d+)s/)
					if (loadTimeMatch) {
						currentTelemetryData.modelLoadTime = parseFloat(loadTimeMatch[1])
					}
				}

				setTelemetryData({ ...currentTelemetryData })

				setTimeout(() => {
					if (isPolling.current) {
						pollForResult(url, currentTelemetryData)
					}
				}, 2000)
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					console.log('Fetch aborted:', error)
					currentTelemetryData.cancelledByUser = true
				} else {
					console.error('Polling error:', error)
					setShowApiKeyAlert(true)
					currentTelemetryData.errors.push(error.message)
				}
			} else {
				console.error('Unknown error occurred during polling')
				currentTelemetryData.errors.push('Unknown error occurred during polling')
			}
			stopStatuses()
			addCompletionMessage('Error occurred during image generation.')
			finalizeTelemetryData(currentTelemetryData)

		}
	}

	const finalizeTelemetryData = async (finalTelemetryData: TelemetryData) => {
		const endTime = Date.now()
		const startTime = new Date(finalTelemetryData.requestStartTime).getTime()
		finalTelemetryData.totalDuration = endTime - startTime
		setTelemetryData(finalTelemetryData)

		try {
			const response = await fetch('/api/telemetry', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(finalTelemetryData),
			})

			if (!response.ok) {
				console.error('Failed to send telemetry data')
			}
		} catch (error) {
			console.error('Error sending telemetry data:', error)
		}
	}

	const addLogEntry = useCallback((entry: LogEntry) => {
		setLogs(prevLogs => [...prevLogs, entry]);
		shouldScrollRef.current = true;
	}, []);

	const addCompletionMessage = useCallback((message: string) => {
		addLogEntry({
			timestamp: new Date().toISOString(),
			message: message,
			status: 'succeeded'
		});
	}, [addLogEntry]);




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
		try {
			const response = await fetch('/api/download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ imageUrl })
			});
			
			if (!response.ok) throw new Error('Download failed');
			
			// Get the filename from the Content-Disposition header
			const disposition = response.headers.get('Content-Disposition');
			const filename = disposition?.split('filename=')[1] || 'generated-image.png';
			
			// Create blob from response
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			
			// Trigger download
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			// Cleanup
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Failed to download image:', error);
		}
	};

	const handleCancel = async () => {
		isPolling.current = false

		try {
			if (abortController.current) {
				abortController.current.abort()
			}

			if (cancelUrl) {
				const response = await fetch('/api/replicate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ apiKey, cancelUrl }),
				})

				if (response.ok) {
					console.log('Generation canceled successfully')
					if (telemetryData) {
						telemetryData.cancelledByUser = true
						finalizeTelemetryData(telemetryData)
					}
				} else {
					console.error('Failed to cancel generation')
				}
			}

			setIsLoading(false)
			setIsGenerating(false)
			setCancelUrl(null)

		} catch (error) {
			console.error('Cancel request failed:', error)
		}
	}

	const clearLogs = () => {
		setLogs([]);
	};

	const handleError = (error: string) => {
		console.error(error);
		// Optionally add error to logs
		addLogEntry({
			timestamp: new Date().toISOString(),
			message: error,
			status: 'error'
		});
	};


	return (
		<>
			<div className="container mx-auto p-4 pt-10 pb-20 min-h-screen max-h-screen overflow-y-auto">
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-8">
					<div className="xl:col-span-1">
						<div className="sticky top-0">
							<GenerationSettingsCard
								formData={formData}
								isLoading={isLoading}
								isGenerating={isGenerating}
								cancelUrl={cancelUrl}
								validatedLoraModels={validatedLoraModels}
								isValidatingLora={isValidatingLora}
								loraValidationError={loraValidationError}
								handleInputChange={handleInputChange}
								handleBlur={handleBlur}
								handleSelectChange={handleSelectChange}
								handleSwitchChange={handleSwitchChange}
								handleSliderChange={handleSliderChange}
								handleNumOutputsChange={handleNumOutputsChange}
								handleSubmit={handleSubmit}
								handleCancel={handleCancel}
								apiKey={apiKey}             
								showApiKeyAlert={showApiKeyAlert}
								handleApiKeyChange={handleApiKeyChange} 
							/>
        <ImageUploadCard
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            onClearImage={handleClearImage}
			onError={handleError}
			disabled={formData.model === 'recraftv3'}
        />
						</div>
					</div>

					{/* Generated Images Card - Right 2/3 */}
					<div className="xl:col-span-2">
						<GeneratedImagesCard
							searchTerm={searchTerm}
							filteredImages={filteredImages}
							onSearchChange={(e) => setSearchTerm(e.target.value)}
							onDownloadImage={downloadImage}
							onDeleteImage={handleDeleteImage}
							clearGeneratedImages={clearGeneratedImages}
							isGenerating={isGenerating}
							numberOfOutputs={formData.num_outputs}
						/>
					</div>
				</div>

				{/* Keep the logs button at the bottom */}
				<div className="fixed bottom-4 left-4 z-50 flex flex-col items-start space-y-2">
					<ServerLogModal
						logs={logs.map(log => ({
							...log,
							status: log.status === "error" ? "failed" : log.status
						}))}
						showLogs={showLogs}
						setShowLogs={setShowLogs}
						clearLogs={clearLogs}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowLogs(!showLogs)}
					>
						<Terminal className="mr-2 h-4 w-4" />
						{showLogs ? 'Hide Logs' : 'Show Logs'}
					</Button>
				</div>

				<div className="fixed bottom-4 right-4 z-50">
                <SettingsDrawer
                    validatedLoraModels={validatedLoraModels}
                    selectedLoraModel={selectedLoraModel}
                    favoritePrompts={favoritePrompts}
                    handleDeleteFavoritePrompt={handleDeleteFavoritePrompt}
                    handleSavePrompt={handleSavePrompt}
                    clearValidatedModels={clearValidatedModels}
                    setFormData={setFormData}
                    setSelectedLoraModel={setSelectedLoraModel}
                    formData={formData}
                />
            </div>

			</div>
		</>
	);
}