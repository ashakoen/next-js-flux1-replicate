'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Terminal } from 'lucide-react';
import { GenerationSettingsCard } from '@/components/cards/GenerationSettingsCard';
import { GenerationActions } from '@/components/GenerationActions';
import { db } from '@/services/indexedDB';

import ServerLogModal from '../components/modals/serverLogModal';
import {
	FormData,
	GeneratedImage,
	LogEntry,
	TelemetryData,
	ImagePackConfig
} from '@/types/types';
import { GeneratedImagesCard } from "@/components/cards/GeneratedImagesCard";
import { SourceImageDrawer } from "@/components/SourceImageDrawer";
import { FavoritePromptsDrawer } from "@/components/FavoritePromptsDrawer";
import { LoraModelsDrawer } from '@/components/LoraModelsDrawer';
import { ExtraLoraModelsDrawer } from "@/components/ExtraLoraModelsDrawer";
import { GenerateConfirmModal } from "@/components/modals/GenerateConfirmModal";
import ImageBucketWrapper from "@/components/ImageBucketWrapper";
import { STORAGE } from '@/constants/storage';
import { Toaster, toast } from "sonner";
import { createHash } from 'crypto';



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
	style: 'any',
	prompt_strength: 0.8,
	negative_prompt: '',
	style_type: 'None',
	magic_prompt_option: 'Auto',
	image_reference_weight: 0.85,
	style_reference_weight: 0.85,
	image_reference_url: '',
	style_reference_url: '',
	character_reference_url: ''
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
	const [selectedLoraModel, setSelectedLoraModel] = useState<string | null>(null);
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
	const [selectedImage, setSelectedImage] = useState<{
		url: string;
		file: File | null;
		dimensions?: { width: number; height: number; }
	} | null>(null);
	const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
	const [isInpaintingEnabled, setIsInpaintingEnabled] = useState(false);
	const [extraLoraModels, setExtraLoraModels] = useState<string[]>([]);
	const [selectedExtraLora, setSelectedExtraLora] = useState<string | null>(null);

	const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
	const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>();
	const [isLoadingImages, setIsLoadingImages] = useState(true);

	const [bucketImages, setBucketImages] = useState<GeneratedImage[]>([]);
	const [showDownloadDialog, setShowDownloadDialog] = useState(false);
	const [includeCaptionFiles, setIncludeCaptionFiles] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);


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

	const handleReusePrompt = (prompt: string) => {
		setFormData((prev) => ({
			...prev,
			prompt
		}));
	};

	useEffect(() => {
		const initializeStorage = async () => {
			try {
				setIsLoadingImages(true);
				const storedImages = await db.getImages();
				if (storedImages?.length) {
					setGeneratedImages(storedImages);
				}
			} catch (error) {
				console.error('Storage initialization error:', error);
			} finally {
				setIsLoadingImages(false);
			}
		};

		initializeStorage();
	}, []);

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

	const clearGeneratedImages = useCallback(() => {
		db.clearImages().catch(error => {
			console.error('Error clearing IndexedDB:', error);
		});
		setGeneratedImages([]);
	}, []);

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
		const savedExtraModels = localStorage.getItem('extraLoraModels');
		if (savedExtraModels) {
			setExtraLoraModels(JSON.parse(savedExtraModels));
		}
	}, []);

	useEffect(() => {
		const savedFormData = localStorage.getItem('replicateFormData');
		if (savedFormData) {
			const parsedData = JSON.parse(savedFormData);
			// Only update selectedLoraModel if there's a privateLoraName and it's in our validated list
			if (parsedData.privateLoraName && validatedLoraModels.includes(parsedData.privateLoraName)) {
				setSelectedLoraModel(parsedData.privateLoraName);
			}
		}
	}, [validatedLoraModels]); // Only re-run when validatedLoraModels changes

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

	useEffect(() => {
		if (!isInpaintingEnabled) {
			//console.log('Inpainting disabled, clearing maskDataUrl');
			setMaskDataUrl(null);
		}
	}, [isInpaintingEnabled]);

	useEffect(() => {
		const initializeBucket = async () => {
			try {
				const storedBucketImages = await db.getBucketImages();
				if (storedBucketImages?.length) {
					setBucketImages(storedBucketImages);
				}
			} catch (error) {
				console.error('Bucket initialization error:', error);
			}
		};

		initializeBucket();
	}, []);

	const handleNumOutputsChange = (value: number) => {
		setFormData((prev) => ({
			...prev,
			num_outputs: value,
		}));
	};

	const handleDeleteFavoritePrompt = useCallback((prompt: string) => {
		const updatedFavorites = favoritePrompts.filter(p => p !== prompt);
		setFavoritePrompts(updatedFavorites);
		localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
	}, [favoritePrompts]);

	const handleDeleteImage = useCallback(async (timestamp: string) => {
		await db.deleteImage(timestamp);
		setGeneratedImages(prev => prev.filter(img => img.timestamp !== timestamp));
	}, []);

	const handleAddToBucket = async (image: GeneratedImage) => {
		try {

			if (bucketImages.length >= STORAGE.MAX_BUCKET_IMAGES) {
				toast.error('Bucket is full', {
					description: 'Please download your images before adding more.',
					action: {
						label: 'Download All',
						onClick: () => handleDownloadAllBucket()
					}
				});
				return;
			}

			const isDuplicate = bucketImages.some(
				existingImage =>
					existingImage.url === image.url ||
					existingImage.timestamp === image.timestamp
			);

			if (isDuplicate) {
				toast.error('This image is already in your bucket');
				return;
			}

			const response = await fetch('/api/replicate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': apiKey
				},
				body: JSON.stringify({
					body: {
						fetchImageForBucket: true,
						imageUrl: image.url
					}
				})
			});

			if (!response.ok) throw new Error('Failed to fetch image');

			const { imageData, contentType } = await response.json();

			// Create data URL from base64 and content type
			const dataUrl = `data:${contentType};base64,${imageData}`;

			// Create new image object with data URL instead of remote URL
			const bucketImage: GeneratedImage = {
				...image,
				url: dataUrl
			};

			// Save to IndexedDB
			await db.saveToBucket(bucketImage);
			setBucketImages(prev => [...prev, bucketImage]);
			toast.success('Image added to bucket');
		} catch (error) {
			console.error('Error adding to bucket:', error);
			toast.error('Failed to add image to bucket');
		}
	};

	const handleRemoveFromBucket = async (timestamp: string) => {
		try {
			await db.removeFromBucket(timestamp);
			setBucketImages(prev => prev.filter(img => img.timestamp !== timestamp));
			toast.success('Image removed from bucket');
		} catch (error) {
			console.error('Error removing from bucket:', error);
			toast.error('Failed to remove image from bucket');
		}
	};

	const clearBucketImages = async () => {
		try {
			await db.clearBucket();
			setBucketImages([]);
			toast.success('Bucket cleared successfully');
		} catch (error) {
			console.error('Error clearing bucket:', error);
			toast.error('Failed to clear bucket');
		}
	};

	const handleDownloadAllBucket = async (includeCaptionFiles: boolean = false) => {
		try {
			setIsDownloading(true);
			if (bucketImages.length === 0) {
				toast.error('No images in bucket to download');
				return;
			}

			const MAX_IMAGES = 300;
			// Sort by timestamp (newest first) and take only the most recent MAX_IMAGES
			const imagesToDownload = [...bucketImages]
				.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
				.slice(0, MAX_IMAGES);

			// Create a zip file containing all images
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();

			// Add each image to the zip
			for (const image of imagesToDownload) {
				try {
					const response = await fetch(image.url);
					const blob = await response.blob();
					const safeTimestamp = image.timestamp.replace(/[/:]/g, '-');
					const baseFilename = `bucket-image-${safeTimestamp}`;
	
					// Add image
					zip.file(`${baseFilename}.png`, blob);
	
					// Add empty caption file if option selected
					if (includeCaptionFiles) {
						const caption = image.prompt || ''; // Use empty string as fallback if prompt is undefined
						zip.file(`${baseFilename}.txt`, caption);
					}
				} catch (error) {
					console.error(`Failed to add image ${image.timestamp} to zip:`, error);
					toast.error(`Failed to add one or more images to zip`);
				}
			}

			// Generate the zip file
			const zipBlob = await zip.generateAsync({ type: 'blob' });

			// Create download link with sanitized timestamp
			const blobUrl = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = blobUrl;
			a.download = `bucket-images-${Date.now()}.zip`;

			// Trigger download
			document.body.appendChild(a);
			a.click();

			// Cleanup
			window.URL.revokeObjectURL(blobUrl);
			document.body.removeChild(a);

			// Show appropriate success message
			if (bucketImages.length > MAX_IMAGES) {
				toast.success(`Downloaded most recent ${MAX_IMAGES} images${includeCaptionFiles ? ' with caption files' : ''}`);
			} else {
				toast.success(`Downloaded all bucket images${includeCaptionFiles ? ' with caption files' : ''}`);
			}
		} catch (error) {
			console.error('Failed to download all bucket images:', error);
			toast.error('Failed to download images');
		} finally {
			setIsDownloading(false);
			setShowDownloadDialog(false);
			setIncludeCaptionFiles(false);
		}
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

			//console.log('Updated formData:', updatedFormData);
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

	const getValidAspectRatio = (width: number, height: number, model: string): string => {
		const ratio = width / height;
		const tolerance = 0.03; // Smaller tolerance for more precise matching

		if (model === 'luma') {
			if (Math.abs(ratio - 1) < tolerance) return '1:1';
			if (Math.abs(ratio - 3 / 4) < tolerance) return '3:4';
			if (Math.abs(ratio - 4 / 3) < tolerance) return '4:3';
			if (Math.abs(ratio - 9 / 16) < tolerance) return '9:16';
			if (Math.abs(ratio - 16 / 9) < tolerance) return '16:9';
			if (Math.abs(ratio - 9 / 21) < tolerance) return '9:21';
			if (Math.abs(ratio - 21 / 9) < tolerance) return '21:9';
			return '1:1';
		}

		// For all other models
		if (Math.abs(ratio - 2 / 3) < tolerance) return '2:3';  // Check 2:3 first
		if (Math.abs(ratio - 1) < tolerance) return '1:1';
		if (Math.abs(ratio - 16 / 9) < tolerance) return '16:9';
		if (Math.abs(ratio - 21 / 9) < tolerance) return '21:9';
		if (Math.abs(ratio - 3 / 2) < tolerance) return '3:2';
		if (Math.abs(ratio - 4 / 5) < tolerance) return '4:5';
		if (Math.abs(ratio - 5 / 4) < tolerance) return '5:4';
		if (Math.abs(ratio - 9 / 16) < tolerance) return '9:16';
		if (Math.abs(ratio - 9 / 21) < tolerance) return '9:21';
		return '1:1';
	};

	const handleImageSelect = async (imageData: {
		url: string;
		file: File | null;
		dimensions?: { width: number; height: number; }
	}) => {
		// Get dimensions from the image
		const img = new Image();
		img.src = imageData.url;
		await new Promise((resolve) => {
			img.onload = () => {
				imageData.dimensions = {
					width: img.width,
					height: img.height
				};
				resolve(null);
			};
		});

		console.log('handleImageSelect dimensions:', imageData.dimensions);
		setSelectedImage(imageData);
	};

	// Add this function to handle clearing the image
	const handleClearImage = () => {
		if (selectedImage?.url) {
			URL.revokeObjectURL(selectedImage.url);
		}
		setSelectedImage(null);
		setMaskDataUrl(null);  // Clear the mask data
		setIsInpaintingEnabled(false);  // Disable inpainting
	};

	const clearExtraModels = () => {
		setExtraLoraModels([]);
		localStorage.removeItem('extraLoraModels');
	};

	const handleRegenerateWithSeed = async (newSeed: number, modelType?: 'dev' | 'schnell' | 'pro' | 'pro-ultra' | 'recraftv3') => {
		// Update the form state
		setFormData(prev => ({
			...prev,
			seed: newSeed,
			num_outputs: 1,
			...(modelType && { model: modelType }) // modelType is now properly typed
		}));

		// Submit with override data
		handleSubmit(
			{ preventDefault: () => { } } as React.FormEvent,
			{
				seed: newSeed,
				num_outputs: 1,
				...(modelType && { model: modelType })
			}
		);
	};

	const handleUpscaleImage = async (params: any) => {
		//console.log('Starting upscale with params:', params);

		if (!apiKey) {
			setShowApiKeyAlert(true);
			return;
		}

		if (isGenerating) {
			return;
		}


		toast.info("Starting image upscale...");

		setIsGenerating(true);
		setIsLoading(true);
		setShowApiKeyAlert(false);

		isPolling.current = true;
		abortController.current = new AbortController();

		const newTelemetryData: TelemetryData = {
			requestId: `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			requestStartTime: getCurrentUTCTimestamp(),
			responseTime: 0,
			totalDuration: 0,
			statusChanges: [],
			pollingSteps: 0,
			generationParameters: params,
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
		};

		setTelemetryData(newTelemetryData);

		try {
			const startTime = Date.now();
			const response = await fetch('/api/replicate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': apiKey
				},
				body: JSON.stringify({
					body: params,
				}),
				signal: abortController.current?.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const endTime = Date.now();
			const getUrl = data.urls.get;
			setCancelUrl(data.urls.cancel);

			newTelemetryData.responseTime = endTime - startTime;
			newTelemetryData.statusChanges.push({
				status: data.status,
				timestamp: getCurrentUTCTimestamp()
			});

			pollForResult(getUrl, newTelemetryData);

		} catch (error) {
			console.error('Error upscaling image:', error);
			setShowApiKeyAlert(true);
			stopStatuses();
			newTelemetryData.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
			finalizeTelemetryData(newTelemetryData);
		}
	};


	const handleImagePackUpload = async (config: ImagePackConfig) => {
		try {
			//console.log('Processing image pack config:', config);


			const JSZip = (await import('jszip')).default;
			const zip = await JSZip.loadAsync(config.zipFile);

			const imageFile = Object.values(zip.files).find(file =>
				!file.name.includes('source') &&
				!file.name.includes('mask') &&
				/\.(png|jpg|webp)$/i.test(file.name)
			);

			const maskFile = Object.values(zip.files).find(file =>
				file.name.includes('mask') &&
				/\.(png|jpg|webp)$/i.test(file.name)
			);

			let width = formData.width;
			let height = formData.height;

			if (imageFile) {
				const blob = await imageFile.async('blob');
				const previewUrl = URL.createObjectURL(blob);

				// Get dimensions from the actual image
				const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
					const img = new Image();
					img.onload = () => {
						resolve({
							width: img.width,
							height: img.height
						});
					};
					img.src = previewUrl;
				});

				width = dimensions.width;
				height = dimensions.height;
				setPreviewImageUrl(previewUrl);
			}


			let modelType: FormData['model'];
			let privateLoraName = '';

			// Map the model from the config
			if (config.model.includes('flux')) {
				// Extract model type from full identifier
				if (config.model.includes('pro-ultra')) {
					modelType = 'pro-ultra';
				} else if (config.model.includes('pro')) {
					modelType = 'pro';
				} else if (config.model.includes('schnell')) {
					modelType = 'schnell';
				} else {
					modelType = 'dev';
				}
			} else if (config.model.includes('recraftv3')) {
				modelType = 'recraftv3';
			} else if (config.model.includes('/')) {
				// It's a LoRA model
				modelType = 'dev';
				privateLoraName = config.model;
				if (config.version) {
					privateLoraName += `:${config.version}`;
				}
			} else {
				console.warn(`Unknown model type: ${config.model}, falling back to dev`);
				modelType = 'dev';
			}

			const newFormData: FormData = {
				...formData, // Start with current form data as base
				prompt: config.prompt,
				negative_prompt: config.negative_prompt || '',
				model: modelType,
				seed: config.seed,
				privateLoraName: privateLoraName,
				privateLoraVersion: '',
				lora_scale: config.lora_scale || 1,
				extra_lora: config.extra_lora || '',
				extra_lora_scale: config.extra_lora_scale || 0.8,
				width,
				height,
				aspect_ratio: (() => {
					// Calculate the actual aspect ratio from dimensions
					const calculatedAspectRatio = getValidAspectRatio(width, height, modelType);
					
					console.log('Image Pack Aspect Ratio Debug:');
					console.log('- Width:', width);
					console.log('- Height:', height);
					console.log('- Stored aspect_ratio:', config.aspect_ratio);
					console.log('- Calculated aspect_ratio:', calculatedAspectRatio);
					
					// If the stored aspect ratio matches the calculated one, use it
					if (config.aspect_ratio && 
						config.aspect_ratio === calculatedAspectRatio) {
						console.log('✅ Using stored aspect ratio (matches calculated)');
						return config.aspect_ratio;
					}
					
					console.log('⚠️ Using calculated aspect ratio (mismatch or missing stored ratio)');
					return calculatedAspectRatio;
				})(),
				guidance_scale: config.guidance_scale,
				num_inference_steps: config.num_inference_steps,
				num_outputs: 1,
				output_format: (config.output_format as 'webp' | 'jpg' | 'png' | 'svg') || 'png',
				output_quality: config.output_quality || 80,
				disable_safety_checker: config.disable_safety_checker || false,
				go_fast: config.go_fast || false,
				style: config.style || 'any',
				prompt_strength: config.prompt_strength || 0.8,
				style_type: formData.style_type,
				magic_prompt_option: formData.magic_prompt_option,
				image_reference_url: config.image_reference_url || '',
				image_reference_weight: config.image_reference_weight || 0.85,
				style_reference_url: config.style_reference_url || '',
				style_reference_weight: config.style_reference_weight || 0.85,
				character_reference_url: config.character_reference_url || ''
			};

			// Update form state
			setFormData(newFormData);
			setPendingFormData(newFormData);

			// If it's a LoRA model, validate it
			if (privateLoraName && !validatedLoraModels.includes(privateLoraName)) {
				await validateLoraModel(privateLoraName);
			}

			// Handle source image if present
			if (config.isImg2Img && config.sourceImageUrl) {
				const response = await fetch(config.sourceImageUrl);
				const blob = await response.blob();
				const file = new File([blob], 'source-image.png', { type: 'image/png' });

				setSelectedImage({
					url: config.sourceImageUrl,
					file
				});

				if (maskFile) {
					const maskBlob = await maskFile.async('blob');
					const reader = new FileReader();
					const maskDataUrl = await new Promise<string>((resolve) => {
						reader.onloadend = () => resolve(reader.result as string);
						reader.readAsDataURL(maskBlob);
					});

					// Convert to proper URI format
					//const response = await fetch(maskDataUrl);
					//const blob = await response.blob();
					//const finalMaskDataUrl = URL.createObjectURL(blob);

					setMaskDataUrl(maskDataUrl);
					setIsInpaintingEnabled(true);
				}

			}

			setShowGenerateConfirm(true);

		} catch (error) {
			console.error('Error processing image pack:', error);
			toast.error('Failed to process image pack configuration');
		}
	};



	const downloadImageWithConfig = async (imageUrl: string, image: GeneratedImage) => {
		//console.log('Image object received:', image);
		try {
			toast.info('Preparing image pack...');

			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();

			// Fetch the generated image (this is still a URL)
			const imageResponse = await fetch(imageUrl);
			if (!imageResponse.ok) throw new Error('Failed to fetch generated image');
			const imageBlob = await imageResponse.blob();

			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const baseFilename = `generation-${timestamp}`;

			// Add generated image
			zip.file(`${baseFilename}.${image.output_format || (image.model === 'recraftv3' ? 'webp' : 'png')}`, imageBlob);

			let imageDimensions: { width: number; height: number; aspect_ratio: string } = {
				width: 512,
				height: 512,
				aspect_ratio: '1:1'
			};

			// In the downloadImageWithConfig function
			if (image.isImg2Img && image.sourceImageUrl) {
				try {
					// For base64 data URI stored in IndexedDB
					const base64Data = image.sourceImageUrl.split(',')[1];
					const mimeType = image.sourceImageUrl.split(';')[0].split(':')[1];

					// Convert base64 to binary while preserving original format
					const binaryStr = atob(base64Data);
					const bytes = new Uint8Array(binaryStr.length);
					for (let i = 0; i < binaryStr.length; i++) {
						bytes[i] = binaryStr.charCodeAt(i);
					}

					// Create blob with original mime type
					const sourceImageBlob = new Blob([bytes], { type: mimeType });
					const extension = mimeType.split('/')[1];

					// Add to zip with original format
					zip.file(`${baseFilename}-source.${extension}`, sourceImageBlob);

					// Use source dimensions for aspect ratio if available
					if (image.sourceDimensions) {
						imageDimensions = {
							width: image.sourceDimensions.width,
							height: image.sourceDimensions.height,
							aspect_ratio: `${image.sourceDimensions.width}:${image.sourceDimensions.height}`
						};
					}
				} catch (error) {
					console.error(`Failed to process source image:`, error);
				}
			}

			// If it's inpainting, add the mask from data URI
			if (image.maskDataUrl) {
				try {
					// Convert base64 data URI directly to blob
					const base64Data = image.maskDataUrl.split(',')[1];
					const maskBlob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
					zip.file(`${baseFilename}-mask.png`, maskBlob);
				} catch (error) {
					console.warn('Failed to process mask:', error);
				}
			}

			// Clean up prompt text by removing line breaks
			const cleanPrompt = image.prompt.replace(/[\n\r]+/g, ' ').trim();
			const cleanNegativePrompt = image.negative_prompt?.replace(/[\n\r]+/g, ' ').trim();

			// Add config last (after we know what files were successfully added)
			const config = {
				prompt: cleanPrompt,
				negative_prompt: cleanNegativePrompt,
				model: image.model,
				seed: image.seed,
				version: image.version,
				privateLoraName: image.privateLoraName,
				lora_scale: image.lora_scale,
				extra_lora: image.extra_lora,
				extra_lora_scale: image.extra_lora_scale,
				guidance_scale: image.guidance_scale,
				num_inference_steps: image.num_inference_steps,
				go_fast: image.go_fast,
				output_format: image.output_format,
				output_quality: image.output_quality,
				disable_safety_checker: image.disable_safety_checker,
				style: image.style,
				isImg2Img: image.isImg2Img,
				prompt_strength: image.prompt_strength,
				generationType: image.isImg2Img ?
					(image.maskDataUrl ? 'inpainting' : 'img2img') :
					'txt2img',
				image_reference_url: image.image_reference_url,
				image_reference_weight: image.image_reference_weight,
				style_reference_url: image.style_reference_url,
				style_reference_weight: image.style_reference_weight,
				character_reference_url: image.character_reference_url,
				aspect_ratio: image.aspect_ratio,
				timestamp: image.timestamp
			};

			zip.file(`${baseFilename}.json`, JSON.stringify(config, null, 2));

			// Generate and download zip
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const zipUrl = window.URL.createObjectURL(zipBlob);

			const link = document.createElement('a');
			link.href = zipUrl;
			link.download = `${baseFilename}.zip`;
			link.click();

			window.URL.revokeObjectURL(zipUrl);

			//toast.success('Image pack downloaded successfully!');
		} catch (error) {
			console.error('Failed to create image pack:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to create image pack');
		}
	};

	const handleUseAsInput = async (imageUrl: string) => {
		try {
			// Fetch the image
			const response = await fetch(imageUrl);
			const blob = await response.blob();

			// Create a File object from the blob
			const filename = imageUrl.split('/').pop() || 'image.png';
			const file = new File([blob], filename, { type: blob.type });

			// Create object URL for preview
			const objectUrl = URL.createObjectURL(blob);

			// Update the ImageUploadCard state
			handleImageSelect({ url: objectUrl, file });

		} catch (error) {
			console.error('Failed to use image as input:', error);
			handleError('Failed to use image as input');
		}
	};

	const blobUrlToDataUri = async (blobUrl: string): Promise<string> => {
		try {
			const response = await fetch(blobUrl);
			const blob = await response.blob();

			// Create a canvas with original dimensions
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const img = new Image();

			return new Promise((resolve, reject) => {
				img.onload = () => {
					// Use original dimensions
					canvas.width = img.width;
					canvas.height = img.height;
					ctx?.drawImage(img, 0, 0, img.width, img.height);
					resolve(canvas.toDataURL('image/jpeg', 0.7)); // Still compress quality but keep dimensions
				};
				img.onerror = reject;
				img.src = URL.createObjectURL(blob);
			});
		} catch (error) {
			console.error('Error converting blob URL to data URI:', error);
			return '';
		}
	};

	const handleMaskGenerated = (maskDataUrl: string | null) => {
		setMaskDataUrl(maskDataUrl);
		setFormData(prev => ({
			...prev,
			maskDataUrl
		}));
	};

	const handleAddToFavorites = (prompt: string) => {
		if (prompt && !favoritePrompts.includes(prompt)) {
			const updatedFavorites = [...favoritePrompts, prompt];
			setFavoritePrompts(updatedFavorites);
			localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
		}
	};

	const handleGenerateConfirm = async () => {
		setShowGenerateConfirm(false);
		if (!pendingFormData) return;

		try {
			await handleSubmit(
				{ preventDefault: () => { } } as React.FormEvent,
				pendingFormData
			);

		} catch (error) {
			console.error('Error generating image:', error);
			toast.error('Failed to generate image');
		}
	};

	const handleSubmit = async (e: React.FormEvent, overrideData?: Partial<FormData>) => {
		e.preventDefault();

		//console.log('Submitting with formData:', formData);
		//console.log('Override data:', overrideData);

		const submissionData = {
			...formData,
			...overrideData,
			...(selectedImage && { prompt_strength: formData.prompt_strength }),
			...(selectedImage?.file && maskDataUrl && isInpaintingEnabled ? { maskDataUrl } : {})
		};

		const telemetryDataWithoutMask = {
			...submissionData,
			// Remove maskDataUrl if it exists
			maskDataUrl: undefined
		};

		//console.log('Final submission data:', submissionData);

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

		const [loraName, loraVersion] = submissionData.privateLoraName.split(':');

		//console.log('LoRA Name:', loraName);
		//console.log('LoRA Version:', loraVersion);

		let imageData: string | undefined;

		if (selectedImage?.file) {
			const reader = new FileReader();
			const base64Promise = new Promise<string | ArrayBuffer | null>((resolve) => {
				reader.onload = () => resolve(reader.result);
				reader.readAsDataURL(selectedImage.file!);
			});
			const base64Data = await base64Promise;
			imageData = base64Data as string;
		}

		if (submissionData.model === 'recraftv3') {
			replicateParams = {
				input: {
					prompt: submissionData.prompt,
					width: submissionData.width,
					height: submissionData.height,
					style: submissionData.style || 'any',
					output_format: submissionData.output_format,
					...(selectedImage?.file ? { image: imageData } : {})
				},
				model: submissionData.model
			};
		} else if (submissionData.model === 'ideogram') {
			replicateParams = {
				input: {
					prompt: submissionData.prompt,
					negative_prompt: submissionData.negative_prompt,
					style_type: "Realistic",
					aspect_ratio: submissionData.aspect_ratio,
					magic_prompt_option: "Off",
					...(selectedImage?.file && maskDataUrl ? {
						image: imageData,
						mask: maskDataUrl
					} : {})
				},
				model: "ideogram"
			};

		} else if (submissionData.model === 'luma') {
			replicateParams = {
				input: {
					prompt: submissionData.prompt,
					aspect_ratio: submissionData.aspect_ratio,
					seed: submissionData.seed || Math.floor(Math.random() * 1000000),
					// Add reference images and weights only if they exist
					...(submissionData.image_reference_url ? {
						image_reference_url: submissionData.image_reference_url,
						image_reference_weight: submissionData.image_reference_weight
					} : {}),
					...(submissionData.style_reference_url ? {
						style_reference_url: submissionData.style_reference_url,
						style_reference_weight: submissionData.style_reference_weight
					} : {}),
					...(submissionData.character_reference_url ? {
						character_reference_url: submissionData.character_reference_url
					} : {})
				},
				model: "luma"
			};

		} else if (loraName && loraVersion) {

			replicateParams = {
				version: loraVersion,
				input: {
					prompt: submissionData.prompt,
					model: submissionData.model,
					num_outputs: submissionData.num_outputs,
					guidance_scale: submissionData.guidance_scale,
					num_inference_steps: submissionData.num_inference_steps,
					output_format: submissionData.output_format,
					output_quality: submissionData.output_quality,
					disable_safety_checker: submissionData.disable_safety_checker,
					...(submissionData.aspect_ratio === 'custom' ? { width: submissionData.width, height: submissionData.height } : { aspect_ratio: submissionData.aspect_ratio }),
					lora: loraName,
					lora_scale: submissionData.lora_scale,
					...(submissionData.extra_lora ? { extra_lora: submissionData.extra_lora, extra_lora_scale: submissionData.extra_lora_scale } : {}),
					...(submissionData.seed !== 0 ? { seed: submissionData.seed } : {}),
					go_fast: submissionData.go_fast,
					...(selectedImage?.file && maskDataUrl ? {
						image: imageData,
						mask: maskDataUrl,
						prompt_strength: formData.prompt_strength
					} : selectedImage?.file ? {
						image: imageData,
						prompt_strength: formData.prompt_strength
					} : {})
				}
			};

		} else {

			replicateParams = {
				input: {
					prompt: submissionData.prompt,
					num_outputs: submissionData.num_outputs,
					guidance_scale: submissionData.guidance_scale,
					num_inference_steps: submissionData.num_inference_steps,
					output_format: submissionData.output_format,
					output_quality: submissionData.output_quality,
					disable_safety_checker: submissionData.disable_safety_checker,
					...(submissionData.aspect_ratio === 'custom' ? { width: submissionData.width, height: submissionData.height } : { aspect_ratio: submissionData.aspect_ratio }),
					...(submissionData.extra_lora ? { extra_lora: submissionData.extra_lora, extra_lora_scale: submissionData.extra_lora_scale } : {}),
					...(submissionData.seed !== 0 ? { seed: submissionData.seed } : {}),
					go_fast: submissionData.go_fast,
					...(selectedImage?.file && maskDataUrl ? {
						image: imageData,
						mask: maskDataUrl,
						prompt_strength: formData.prompt_strength
					} : selectedImage?.file ? {
						image: imageData,
						prompt_strength: formData.prompt_strength
					} : {})
				},
				model: submissionData.model,
			};
		}

		//console.log('Replicate Params:', replicateParams);

		if (selectedImage?.file && maskDataUrl) {
			console.log('Sending inpainting request with:', {
				imageSize: imageData ? imageData.length : 0,
				maskSize: maskDataUrl.length,
				maskPreview: maskDataUrl.substring(0, 100) + '...'
			});
		}

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
				...telemetryDataWithoutMask,
				hasInputImage: !!selectedImage
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
					'X-API-Key': apiKey
				},
				body: JSON.stringify({
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
					'X-API-Key': apiKey
				},
				body: JSON.stringify({
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
				currentTelemetryData.outputImageSizes = [];

				//console.log('pollForResult dimensions:', selectedImage?.dimensions);

				const outputUrls = Array.isArray(pollData.output) ? pollData.output : [pollData.output];

				let sourceImageDataUri: string | undefined;
				if (selectedImage?.url) {
					sourceImageDataUri = await blobUrlToDataUri(selectedImage.url);
				}

				const newImages = outputUrls.map((outputUrl: string) => {
					//('pollData input:', pollData.input);

					return {
						url: outputUrl,
						prompt: pollData.input.prompt,
						model: pollData.model,
						version: pollData.version,
						aspect_ratio: formData.aspect_ratio,
						...(pollData.model === 'luma/photon' ? {
							image_reference_url: pollData.input.image_reference_url,
							image_reference_weight: pollData.input.image_reference_weight,
							style_reference_url: pollData.input.style_reference_url,
							style_reference_weight: pollData.input.style_reference_weight,
							character_reference_url: pollData.input.character_reference_url,
						} : pollData.model !== 'recraftv3' ? {
							go_fast: pollData.input.go_fast,
							guidance_scale: pollData.input.guidance_scale,
							num_inference_steps: pollData.input.num_inference_steps,
							lora_scale: pollData.input.lora_scale,
							seed: seed,
							extra_lora: pollData.input.extra_lora,
							extra_lora_scale: pollData.input.extra_lora_scale,
						} : {
							style: pollData.input.style,
							width: pollData.input.width,
							height: pollData.input.height,
						}),
						timestamp: new Date().toISOString(),
						isImg2Img: !!selectedImage,
						//sourceImageUrl: selectedImage?.url || undefined,
						sourceImageUrl: sourceImageDataUri || undefined,
						sourceDimensions: selectedImage?.dimensions,
						maskDataUrl: maskDataUrl || undefined,
						prompt_strength: pollData.input.prompt_strength
					}
				})

				setGeneratedImages((prev) => {
					const updatedImages = [...prev, ...newImages]
					db.saveImages(updatedImages).catch(error => {
						console.error('Error saving to IndexedDB:', error);
					});
					return updatedImages
				})

				stopStatuses()
				finalizeTelemetryData(currentTelemetryData)
				addCompletionMessage('Image generation complete.')

			} else if (pollData.status === 'failed') {
				console.error('Prediction failed:', pollData.error)
				stopStatuses()
				currentTelemetryData.errors.push('Prediction failed')
				addCompletionMessage('Image generation failed.')
				toast.error('Generation failed', {
					description: pollData.error || 'The image generation failed. Please try again.',
					duration: 4500
				})
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

			const telemetryWithHash = {
				...finalTelemetryData
			};

			const response = await fetch('/api/telemetry', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': apiKey
				},
				body: JSON.stringify(telemetryWithHash),
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

	const downloadBucketImage = async (dataUrl: string, timestamp: string) => {
		try {
			// Create a blob from the data URL
			const response = await fetch(dataUrl);
			const blob = await response.blob();

			// Create a temporary URL for the blob
			const blobUrl = window.URL.createObjectURL(blob);

			// Create download link
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = blobUrl;
			a.download = `bucket-image-${timestamp}.png`; // You can customize the filename

			// Trigger download
			document.body.appendChild(a);
			a.click();

			// Cleanup
			window.URL.revokeObjectURL(blobUrl);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Failed to download bucket image:', error);
			toast.error('Failed to download image from bucket');
		}
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
						'X-API-Key': apiKey
					},
					body: JSON.stringify({ cancelUrl }),
				})

				if (response.ok) {
					console.log('Generation canceled successfully')
					toast.error('Generation canceled', {
						description: 'The image generation was canceled.',
						duration: 4500
					})
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
			<Toaster position="top-right" />
			<div className="container mx-auto px-2 pt-12 pb-20 h-[calc(100vh-2rem)]">
				<div className="main-layout">

					<GenerateConfirmModal
						isOpen={showGenerateConfirm}
						onClose={() => setShowGenerateConfirm(false)}
						onConfirm={handleGenerateConfirm}
						formData={pendingFormData || initialFormData}
						previewImageUrl={previewImageUrl}
					/>

					<SourceImageDrawer
						onImageSelect={handleImageSelect}
						selectedImage={selectedImage}
						onClearImage={handleClearImage}
						onError={handleError}
						disabled={formData.model === 'recraftv3'}
						isInpaintingEnabled={isInpaintingEnabled}
						onInpaintingChange={setIsInpaintingEnabled}
						onMaskGenerated={handleMaskGenerated}
						currentMaskDataUrl={maskDataUrl}
					/>

					<FavoritePromptsDrawer
						favoritePrompts={favoritePrompts}
						handleDeleteFavoritePrompt={handleDeleteFavoritePrompt}
						handleAddToFavorites={handleAddToFavorites}
						onUsePrompt={(prompt) => setFormData(prev => ({ ...prev, prompt }))}
					/>

					<LoraModelsDrawer
						validatedLoraModels={validatedLoraModels}
						setValidatedLoraModels={setValidatedLoraModels}
						selectedLoraModel={selectedLoraModel}
						clearValidatedModels={clearValidatedModels}
						setSelectedLoraModel={setSelectedLoraModel}
						setFormData={setFormData}
						apiKey={apiKey}
						setShowApiKeyAlert={setShowApiKeyAlert}
					/>

					<ExtraLoraModelsDrawer
						extraLoraModels={extraLoraModels}
						setExtraLoraModels={setExtraLoraModels}
						selectedExtraLora={selectedExtraLora}
						clearExtraModels={clearExtraModels}
						setSelectedExtraLora={setSelectedExtraLora}
						setFormData={setFormData}
					/>

					<div className="middle-column order-2 xl:order-1 xl:w-1/5 h-[calc(100vh-8rem)]">
						<div className="flex flex-col h-full justify-between">
							<GenerationSettingsCard
								className="flex-1 min-h-0 overflow-auto h-[calc(100vh-10rem)]"
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
								hasSourceImage={!!selectedImage}
								onAddToFavorites={handleAddToFavorites}
								favoritePrompts={favoritePrompts}
								onImagePackUpload={handleImagePackUpload}
								extraLoraModels={extraLoraModels}
								setExtraLoraModels={setExtraLoraModels}
								setValidatedLoraModels={setValidatedLoraModels}
								setFavoritePrompts={setFavoritePrompts}
							/>

							<GenerationActions  // New component
								isGenerating={isGenerating}
								isLoading={isLoading}
								handleSubmit={handleSubmit}
								handleCancel={handleCancel}
							/>
						</div>
					</div>



					{/* Generated Images Card - Right 2/3 */}
					<div className="right-column order-1 xl:order-2 xl:w-[55%]">

						<GeneratedImagesCard
							images={generatedImages}
							setImages={setGeneratedImages}
							onDownloadImage={downloadImage}
							onDeleteImage={handleDeleteImage}
							clearGeneratedImages={clearGeneratedImages}
							isGenerating={isGenerating}
							numberOfOutputs={formData.num_outputs}
							onRegenerateWithSeed={handleRegenerateWithSeed}
							onUseAsInput={handleUseAsInput}
							model={formData.model}
							onReusePrompt={handleReusePrompt}
							onUpscaleImage={handleUpscaleImage}
							onDownloadWithConfig={downloadImageWithConfig}
							isLoadingImages={isLoadingImages}
							onAddToBucket={handleAddToBucket}
							bucketImages={bucketImages}
						/>

					</div>

					<div className="order-3 xl:w-1/4">
						<ImageBucketWrapper
							bucketImages={bucketImages}
							onRemoveFromBucket={handleRemoveFromBucket}
							onDownloadImage={downloadBucketImage}
							onDownloadAll={handleDownloadAllBucket}
							onClearBucket={clearBucketImages}
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



			</div>
		</>
	);
}