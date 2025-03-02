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
	ImagePackConfig,
	ImagePackEntry
} from '@/types/types';
import { GeneratedImagesCard } from "@/components/cards/GeneratedImagesCard";
import { SourceImageDrawer } from "@/components/SourceImageDrawer";
import { FavoritePromptsDrawer } from "@/components/FavoritePromptsDrawer";
import { LoraModelsDrawer } from '@/components/LoraModelsDrawer';
import { ExtraLoraModelsDrawer } from "@/components/ExtraLoraModelsDrawer";
import { ImagePackDrawer } from "@/components/ImagePackDrawer";
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
	output_quality: 100,
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
	const [inpaintingPrompt, setInpaintingPrompt] = useState('');
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
			setInpaintingPrompt('');
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
		} else if (name === 'prompt') {
			setFormData((prev) => {
				const updatedFormData = {
					...prev,
					[name]: value
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
			...(modelType && { 
			  model: modelType,
			  // If switching to schnell model and steps > 4, set to 4
			  ...(modelType === 'schnell' && prev.num_inference_steps > 4 && {
				num_inference_steps: 4
			  })
			})
		  }));
		
		  // Submit with override data
		  handleSubmit(
			{ preventDefault: () => { } } as React.FormEvent,
			{
			  seed: newSeed,
			  num_outputs: 1,
			  ...(modelType && { 
				model: modelType,
				// Also enforce in the submission data
				...(modelType === 'schnell' && formData.num_inference_steps > 4 && {
				  num_inference_steps: 4
				})
			  })
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


	const handleImagePackUpload = async (config: ImagePackConfig, skipConfirmation: boolean = false) => {
		try {
			// Show info toast only if not called from saveToImagePack (which has its own toast)
			if (!skipConfirmation) {
				toast.info('Processing image pack...', {id: 'image-pack-upload'});
			}

			const JSZip = (await import('jszip')).default;
			const zip = await JSZip.loadAsync(config.zipFile);
			
			// Generate a unique ID for this image pack
			const packId = `pack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			// Get or create a session ID
			const sessionId = localStorage.getItem('imagePackSessionId') || 
				`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			// Store the session ID for future use
			localStorage.setItem('imagePackSessionId', sessionId);

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

			// Create an entry for the image pack to store in IndexedDB
			const sessionId = localStorage.getItem('imagePackSessionId') || 
				`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			// Store the session ID for future use
			localStorage.setItem('imagePackSessionId', sessionId);
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

			// Only show the generation confirmation dialog if not skipping confirmation
			if (!skipConfirmation) {
				setShowGenerateConfirm(true);
			}
			// Note: Success toast is now handled in the calling function when skipConfirmation is true

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

	const saveToImagePack = async (image: GeneratedImage) => {
		try {
			toast.info('Saving to Image Packs...', {id: 'saving-image-pack'});
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();
			
			// Fetch the generated image
			const imageResponse = await fetch(image.url);
			if (!imageResponse.ok) throw new Error('Failed to fetch generated image');
			const imageBlob = await imageResponse.blob();
			
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const baseFilename = `generation-${timestamp}`;
			
			// Add generated image to zip
			const fileExt = image.output_format || (image.model === 'recraftv3' ? 'webp' : 'png');
			zip.file(`${baseFilename}.${fileExt}`, imageBlob);
			
			// Create a data URL for the preview image
			const previewUrl = URL.createObjectURL(imageBlob);
			
			// Process source image if applicable
			let sourceImageUrl: string | undefined;
			if (image.isImg2Img && image.sourceImageUrl) {
				try {
					// For base64 data URI stored in IndexedDB
					const base64Data = image.sourceImageUrl.split(',')[1];
					const mimeType = image.sourceImageUrl.split(';')[0].split(':')[1];
					
					// Convert base64 to binary
					const binaryStr = atob(base64Data);
					const bytes = new Uint8Array(binaryStr.length);
					for (let i = 0; i < binaryStr.length; i++) {
						bytes[i] = binaryStr.charCodeAt(i);
					}
					
					// Create blob with original mime type
					const sourceImageBlob = new Blob([bytes], { type: mimeType });
					const extension = mimeType.split('/')[1];
					
					// Add to zip
					zip.file(`${baseFilename}-source.${extension}`, sourceImageBlob);
					sourceImageUrl = image.sourceImageUrl;
				} catch (error) {
					console.error('Failed to process source image:', error);
				}
			}
			
			// Process mask if applicable
			let maskDataUrl: string | undefined;
			if (image.maskDataUrl) {
				try {
					const base64Data = image.maskDataUrl.split(',')[1];
					const maskBlob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
					zip.file(`${baseFilename}-mask.png`, maskBlob);
					maskDataUrl = image.maskDataUrl;
				} catch (error) {
					console.warn('Failed to process mask:', error);
				}
			}
			
			// Clean up prompt text
			const cleanPrompt = image.prompt.replace(/[\n\r]+/g, ' ').trim();
			const cleanNegativePrompt = image.negative_prompt?.replace(/[\n\r]+/g, ' ').trim();
			
			// Add config
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
			
			// Generate zip file as blob
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			
			// Create virtual File for the ImagePack
			const virtualZipFile = new File(
				[zipBlob],
				`${baseFilename}.zip`,
				{ type: 'application/zip' }
			);
			
			// Create a URL for the zip file
			const zipUrl = URL.createObjectURL(zipBlob);
			
			// Get or create a session ID for the image pack
			const sessionId = localStorage.getItem('imagePackSessionId') || 
				`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			// Store the session ID for future use
			localStorage.setItem('imagePackSessionId', sessionId);
			
			// Create an ImagePackEntry to save to IndexedDB
			const packEntry: ImagePackEntry = {
				id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date().toISOString(),
				previewImageUrl: previewUrl,
				zipFileUrl: zipUrl,
				config: {
					...config,
					zipFile: virtualZipFile,
					prompt: config.prompt || '',
					model: config.model || 'dev',
					seed: config.seed || 0,
					guidance_scale: config.guidance_scale || 3.5,
					num_inference_steps: config.num_inference_steps || 28,
					isImg2Img: !!config.isImg2Img,
					output_format: config.output_format || 'png'
				},
				sourceImageUrl,
				maskDataUrl,
				originalFilename: `${baseFilename}.zip`,
				sessionId,
				isFavorite: false
			};
			
			// Save to IndexedDB
			await db.saveImagePack(packEntry);
			
			// Also call handleImagePackUpload to prepare the form data
			// Pass true for skipConfirmation to prevent the generation dialog from showing
			await handleImagePackUpload(packEntry.config, true);
			
			// Update the info toast to success instead of showing a new one
			toast.success('Saved to Image Packs', {id: 'saving-image-pack'});
		} catch (error) {
			console.error('Failed to save image pack:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to save image pack', {id: 'saving-image-pack'});
			throw error; // Rethrow so the UI can handle it
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
			...(selectedImage?.file && maskDataUrl && isInpaintingEnabled ? { 
				maskDataUrl,
				prompt: inpaintingPrompt ? `${inpaintingPrompt.trim()}, ${formData.prompt}` : formData.prompt
			} : {})
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
				const errorData = await initialResponse.json();
				throw { 
				  response: { 
					data: errorData,
					status: initialResponse.status 
				  } 
				};
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

		} catch (error: unknown) {
			console.error('There was a problem with the request:', error);
			
			if (error && typeof error === 'object' && 'response' in error && 
				error.response && typeof error.response === 'object' && 
				'data' in error.response) {
			  const errorResponse = error.response as { 
				data: { 
				  detail?: string; 
				  title?: string;
				  invalid_fields?: Array<{
					description: string;
					field?: string;
				  }>;
				} 
			  };
			
			  // Create a more user-friendly error message based on the field
			  const field = errorResponse.data.invalid_fields?.[0]?.field;
			  let errorMessage = '';
			
			  if (field === 'input.num_inference_steps') {
				errorMessage = 'Quality Steps must be 4 or less when using the FLUX.1 Schnell model';
			  } else {
				// Fallback to original error message for other cases
				errorMessage = errorResponse.data.invalid_fields?.[0]?.description || 
							  errorResponse.data.detail?.replace(/^-\s*[^:]+:\s*/, '') || 
							  errorResponse.data.title ||
							  'An error occurred';
			  }
			
			  toast.error('Generation failed', {
				description: errorMessage,
				duration: 4500
			  });
			} else if (!apiKey) {
			  setShowApiKeyAlert(true);
			} else {
			  toast.error('Generation failed', {
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				duration: 4500
			  });
			}
			
			stopStatuses();
			newTelemetryData.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
			finalizeTelemetryData(newTelemetryData);
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

	const validateLoraModel = async (modelName: string) => {
		if (!apiKey) {
			console.log('No API key available'); 
		  setShowApiKeyAlert(true);
		  return;
		}
	  

		console.log('API Key available:', !!apiKey);  // Add this debug line
		console.log('Model name:', modelName);  // Add this debug line

		setIsValidatingLora(true);
		setLoraValidationError(null);
	  
		try {
		  const [loraPath, version] = modelName.split(':');
		  
		  const response = await fetch('/api/replicate', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'X-API-Key': apiKey  // Make sure apiKey is defined and not empty
			},
			body: JSON.stringify({
				body: {  // Match the pattern used in other successful API calls
				  validateLora: true,
				  modelPath: loraPath,
				  version: version
				}
			  }),
		  });
	  
		  if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to validate LoRA model');
		  }
	  
		  setValidatedLoraModels(prev => {
			const newModels = Array.from(new Set([...prev, modelName]));
			localStorage.setItem('validatedLoraModels', JSON.stringify(newModels));
			return newModels;
		  });
		  setFormData(prev => ({ ...prev, privateLoraName: modelName }));
	  
		} catch (error) {
		  console.error('LoRA validation error:', error);
		  setLoraValidationError(error instanceof Error ? error.message : 'Validation failed');
		} finally {
		  setIsValidatingLora(false);
		}
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
							apiKey={apiKey}
							handleSelectChange={handleSelectChange}
							onInpaintingPromptChange={(prefix) => setInpaintingPrompt(prefix)}
							inpaintingPromptValue={inpaintingPrompt}
							hasPersonalAiModel={!!formData.privateLoraName}
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

					{formData.privateLoraName && (
						<ExtraLoraModelsDrawer
							extraLoraModels={extraLoraModels}
							setExtraLoraModels={setExtraLoraModels}
							selectedExtraLora={selectedExtraLora}
							clearExtraModels={clearExtraModels}
							setSelectedExtraLora={setSelectedExtraLora}
							setFormData={setFormData}
						/>
					)}

					<ImagePackDrawer
						onImagePackUpload={handleImagePackUpload}
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
								//handleBlur={handleBlur}
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
								isInpaintingEnabled={isInpaintingEnabled}
								inpaintingPrompt={inpaintingPrompt}
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
							onSaveToImagePack={saveToImagePack}
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
			<div className="absolute bottom-16 right-8 opacity-60 h-0 overflow-visible hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.0" x="0" y="0" width="2400" height="2287.816323824348" viewBox="125.60858390808106 82.68358085632325 88.78283981323243 84.63284591674805" preserveAspectRatio="xMidYMid meet" colorInterpolationFilters="sRGB" className="w-10 h-10"><g><defs><linearGradient id="92" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#fa71cd"></stop> <stop offset="100%" stopColor="#9b59b6"></stop></linearGradient><linearGradient id="93" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f9d423"></stop> <stop offset="100%" stopColor="#f83600"></stop></linearGradient><linearGradient id="94" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0064d2"></stop> <stop offset="100%" stopColor="#1cb0f6"></stop></linearGradient><linearGradient id="95" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f00978"></stop> <stop offset="100%" stopColor="#3f51b1"></stop></linearGradient><linearGradient id="96" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7873f5"></stop> <stop offset="100%" stopColor="#ec77ab"></stop></linearGradient><linearGradient id="97" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f9d423"></stop> <stop offset="100%" stopColor="#e14fad"></stop></linearGradient><linearGradient id="98" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#009efd"></stop> <stop offset="100%" stopColor="#2af598"></stop></linearGradient><linearGradient id="99" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ffcc00"></stop> <stop offset="100%" stopColor="#00b140"></stop></linearGradient><linearGradient id="100" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#d51007"></stop> <stop offset="100%" stopColor="#ff8177"></stop></linearGradient><linearGradient id="102" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a2b6df"></stop> <stop offset="100%" stopColor="#0c3483"></stop></linearGradient><linearGradient id="103" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7ac5d8"></stop> <stop offset="100%" stopColor="#eea2a2"></stop></linearGradient><linearGradient id="104" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00ecbc"></stop> <stop offset="100%" stopColor="#007adf"></stop></linearGradient><linearGradient id="105" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#b88746"></stop> <stop offset="100%" stopColor="#fdf5a6"></stop></linearGradient></defs><g fill="#9b59b6" className="basesvg" transform="translate(126.47900009155273,83.55399703979492)"><g fillRule="nonzero" stroke="#9b59b6" className="tp-name" transform="translate(0,0)"><g transform="scale(1.7800000000000007)"><g><path d="M0 0.6L0-1.7 3.3-1.7 3.3 0.6 0 0.6ZM1.7-3.3L1.7-3.3Q0.9-3.3 0.45-2.85 0-2.4 0-1.7L0-1.7 0-1.7Q0-0.9 0.45-0.45 0.9 0 1.7 0L1.7 0 1.7 0Q2.4 0 2.85-0.45 3.3-0.9 3.3-1.7L3.3-1.7 3.3-1.7Q3.3-2.4 2.85-2.85 2.4-3.3 1.7-3.3L1.7-3.3ZM1.7-1L1.7-1Q0.9-1 0.45-0.55 0-0.1 0 0.6L0 0.6 0 0.6Q0 1.4 0.45 1.85 0.9 2.3 1.7 2.3L1.7 2.3 1.7 2.3Q2.4 2.3 2.85 1.85 3.3 1.4 3.3 0.6L3.3 0.6 3.3 0.6Q3.3-0.1 2.85-0.55 2.4-1 1.7-1L1.7-1ZM6.3-34.4L6.3-1.7 9.6-1.7 9.6-34.4 6.3-34.4ZM8-3.3L8-3.3Q7.2-3.3 6.75-2.85 6.3-2.4 6.3-1.7L6.3-1.7 6.3-1.7Q6.3-0.9 6.75-0.45 7.2 0 8 0L8 0 8 0Q8.7 0 9.15-0.45 9.6-0.9 9.6-1.7L9.6-1.7 9.6-1.7Q9.6-2.4 9.15-2.85 8.7-3.3 8-3.3L8-3.3ZM8-36L8-36Q7.2-36 6.75-35.55 6.3-35.1 6.3-34.4L6.3-34.4 6.3-34.4Q6.3-33.6 6.75-33.15 7.2-32.7 8-32.7L8-32.7 8-32.7Q8.7-32.7 9.15-33.15 9.6-33.6 9.6-34.4L9.6-34.4 9.6-34.4Q9.6-35.1 9.15-35.55 8.7-36 8-36L8-36ZM12.6-12.4L12.6-1.7 15.9-1.7 15.9-12.4 12.6-12.4ZM14.3-3.3L14.3-3.3Q13.5-3.3 13.05-2.85 12.6-2.4 12.6-1.7L12.6-1.7 12.6-1.7Q12.6-0.9 13.05-0.45 13.5 0 14.3 0L14.3 0 14.3 0Q15 0 15.45-0.45 15.9-0.9 15.9-1.7L15.9-1.7 15.9-1.7Q15.9-2.4 15.45-2.85 15-3.3 14.3-3.3L14.3-3.3ZM14.3-14L14.3-14Q13.5-14 13.05-13.55 12.6-13.1 12.6-12.4L12.6-12.4 12.6-12.4Q12.6-11.6 13.05-11.15 13.5-10.7 14.3-10.7L14.3-10.7 14.3-10.7Q15-10.7 15.45-11.15 15.9-11.6 15.9-12.4L15.9-12.4 15.9-12.4Q15.9-13.1 15.45-13.55 15-14 14.3-14L14.3-14ZM18.9 0.6L18.9-1.7 22.2-1.7 22.2 0.6 18.9 0.6ZM20.6-3.3L20.6-3.3Q19.8-3.3 19.35-2.85 18.9-2.4 18.9-1.7L18.9-1.7 18.9-1.7Q18.9-0.9 19.35-0.45 19.8 0 20.6 0L20.6 0 20.6 0Q21.3 0 21.75-0.45 22.2-0.9 22.2-1.7L22.2-1.7 22.2-1.7Q22.2-2.4 21.75-2.85 21.3-3.3 20.6-3.3L20.6-3.3ZM20.6-1L20.6-1Q19.8-1 19.35-0.55 18.9-0.1 18.9 0.6L18.9 0.6 18.9 0.6Q18.9 1.4 19.35 1.85 19.8 2.3 20.6 2.3L20.6 2.3 20.6 2.3Q21.3 2.3 21.75 1.85 22.2 1.4 22.2 0.6L22.2 0.6 22.2 0.6Q22.2-0.1 21.75-0.55 21.3-1 20.6-1L20.6-1Z" transform="translate(0, 36)" strokeWidth="1.5" strokeLinejoin="round"></path></g> <g fill="#444" stroke="#444" transform="translate(26.700000762939453,0)"><g transform="scale(1)"><path d="M0-18.4L0-1.7 3.3-1.7 3.3-18.4 0-18.4ZM1.7-3.3L1.7-3.3Q0.9-3.3 0.45-2.85 0-2.4 0-1.7L0-1.7 0-1.7Q0-0.9 0.45-0.45 0.9 0 1.7 0L1.7 0 1.7 0Q2.4 0 2.85-0.45 3.3-0.9 3.3-1.7L3.3-1.7 3.3-1.7Q3.3-2.4 2.85-2.85 2.4-3.3 1.7-3.3L1.7-3.3ZM1.7-20L1.7-20Q0.9-20 0.45-19.55 0-19.1 0-18.4L0-18.4 0-18.4Q0-17.6 0.45-17.15 0.9-16.7 1.7-16.7L1.7-16.7 1.7-16.7Q2.4-16.7 2.85-17.15 3.3-17.6 3.3-18.4L3.3-18.4 3.3-18.4Q3.3-19.1 2.85-19.55 2.4-20 1.7-20L1.7-20ZM6.3-26.4L6.3-1.7 9.6-1.7 9.6-26.4 6.3-26.4ZM8-3.3L8-3.3Q7.2-3.3 6.75-2.85 6.3-2.4 6.3-1.7L6.3-1.7 6.3-1.7Q6.3-0.9 6.75-0.45 7.2 0 8 0L8 0 8 0Q8.7 0 9.15-0.45 9.6-0.9 9.6-1.7L9.6-1.7 9.6-1.7Q9.6-2.4 9.15-2.85 8.7-3.3 8-3.3L8-3.3ZM8-28L8-28Q7.2-28 6.75-27.55 6.3-27.1 6.3-26.4L6.3-26.4 6.3-26.4Q6.3-25.6 6.75-25.15 7.2-24.7 8-24.7L8-24.7 8-24.7Q8.7-24.7 9.15-25.15 9.6-25.6 9.6-26.4L9.6-26.4 9.6-26.4Q9.6-27.1 9.15-27.55 8.7-28 8-28L8-28ZM12.6-6.4L12.6-1.7 15.9-1.7 15.9-6.4 12.6-6.4ZM14.3-3.3L14.3-3.3Q13.5-3.3 13.05-2.85 12.6-2.4 12.6-1.7L12.6-1.7 12.6-1.7Q12.6-0.9 13.05-0.45 13.5 0 14.3 0L14.3 0 14.3 0Q15 0 15.45-0.45 15.9-0.9 15.9-1.7L15.9-1.7 15.9-1.7Q15.9-2.4 15.45-2.85 15-3.3 14.3-3.3L14.3-3.3ZM14.3-8L14.3-8Q13.5-8 13.05-7.55 12.6-7.1 12.6-6.4L12.6-6.4 12.6-6.4Q12.6-5.6 13.05-5.15 13.5-4.7 14.3-4.7L14.3-4.7 14.3-4.7Q15-4.7 15.45-5.15 15.9-5.6 15.9-6.4L15.9-6.4 15.9-6.4Q15.9-7.1 15.45-7.55 15-8 14.3-8L14.3-8ZM18.9-24.4L18.9-1.7 22.2-1.7 22.2-24.4 18.9-24.4ZM20.6-3.3L20.6-3.3Q19.8-3.3 19.35-2.85 18.9-2.4 18.9-1.7L18.9-1.7 18.9-1.7Q18.9-0.9 19.35-0.45 19.8 0 20.6 0L20.6 0 20.6 0Q21.3 0 21.75-0.45 22.2-0.9 22.2-1.7L22.2-1.7 22.2-1.7Q22.2-2.4 21.75-2.85 21.3-3.3 20.6-3.3L20.6-3.3ZM20.6-26L20.6-26Q19.8-26 19.35-25.55 18.9-25.1 18.9-24.4L18.9-24.4 18.9-24.4Q18.9-23.6 19.35-23.15 19.8-22.7 20.6-22.7L20.6-22.7 20.6-22.7Q21.3-22.7 21.75-23.15 22.2-23.6 22.2-24.4L22.2-24.4 22.2-24.4Q22.2-25.1 21.75-25.55 21.3-26 20.6-26L20.6-26Z" transform="translate(0, 36)" strokeWidth="1.5" strokeLinejoin="round"></path></g></g></g></g> <g fillRule="nonzero" className="tp-slogan" fill="#444" transform="translate(3.6910018920898438,74.92400360107422)"> <g transform="scale(1, 1)"><g transform="scale(1)"><path d="M2.39 0L0.37 0L3.32-7.73L5.41-7.73L8.36 0L6.35 0L5.65-1.75L3.07-1.75L2.39 0ZM4.36-5.87L3.34-3.18L5.39-3.18L4.36-5.87ZM13.27 0.12L13.27 0.12Q12.50 0.12 11.83 0.01Q11.17-0.11 10.69-0.32L10.69-0.32L10.69-1.97Q11.22-1.74 11.86-1.60Q12.50-1.45 13.08-1.45L13.08-1.45Q13.80-1.45 14.15-1.58Q14.50-1.72 14.50-2.16L14.50-2.16Q14.50-2.46 14.33-2.64Q14.16-2.82 13.77-2.96Q13.38-3.10 12.70-3.29L12.70-3.29Q11.91-3.53 11.44-3.82Q10.98-4.12 10.77-4.54Q10.57-4.96 10.57-5.57L10.57-5.57Q10.57-6.67 11.36-7.26Q12.15-7.85 13.70-7.85L13.70-7.85Q14.37-7.85 15.01-7.75Q15.64-7.64 16.04-7.51L16.04-7.51L16.04-5.86Q15.52-6.06 15.00-6.16Q14.48-6.25 13.99-6.25L13.99-6.25Q13.34-6.25 12.94-6.13Q12.54-6.01 12.54-5.58L12.54-5.58Q12.54-5.33 12.68-5.18Q12.82-5.03 13.18-4.91Q13.53-4.79 14.14-4.62L14.14-4.62Q15.09-4.37 15.60-4.01Q16.10-3.66 16.29-3.20Q16.48-2.74 16.48-2.16L16.48-2.16Q16.48-1.14 15.69-0.51Q14.90 0.12 13.27 0.12ZM21.40 0L19.47 0L19.47-7.73L21.40-7.73L21.40-4.67L24.42-4.67L24.42-7.73L26.36-7.73L26.36 0L24.42 0L24.42-3.06L21.40-3.06L21.40 0ZM31.36 0L29.34 0L32.29-7.73L34.38-7.73L37.33 0L35.32 0L34.62-1.75L32.04-1.75L31.36 0ZM33.32-5.87L32.30-3.18L34.36-3.18L33.32-5.87ZM46.83 0L44.90 0L44.90-7.73L46.83-7.73L46.83-4.73L49.49-7.73L51.70-7.73L48.94-4.57L51.87 0L49.80 0L47.74-3.34L46.83-2.34L46.83 0ZM57.68 0.12L57.68 0.12Q55.80 0.12 54.82-0.84Q53.83-1.80 53.83-3.83L53.83-3.83Q53.83-5.98 54.82-6.91Q55.80-7.85 57.68-7.85L57.68-7.85Q59.57-7.85 60.55-6.91Q61.54-5.98 61.54-3.83L61.54-3.83Q61.54-1.80 60.55-0.84Q59.57 0.12 57.68 0.12ZM57.68-1.52L57.68-1.52Q58.66-1.52 59.11-2.08Q59.56-2.64 59.56-3.83L59.56-3.83Q59.56-5.12 59.11-5.66Q58.66-6.19 57.68-6.19L57.68-6.19Q56.70-6.19 56.25-5.66Q55.80-5.12 55.80-3.83L55.80-3.83Q55.80-2.64 56.25-2.08Q56.70-1.52 57.68-1.52ZM70.22 0L64.52 0L64.52-7.73L70.22-7.73L70.22-6.24L66.45-6.24L66.45-4.62L69.78-4.62L69.78-3.11L66.45-3.11L66.45-1.49L70.22-1.49L70.22 0ZM75.08 0L73.14 0L73.14-7.73L74.80-7.73L78.09-3.11L78.09-7.73L80.03-7.73L80.03 0L78.36 0L75.08-4.61L75.08 0Z" transform="translate(-0.372, 7.848)"></path></g></g></g></g><defs v-gra="od"></defs></g></svg>
                </div>
		</>
	);
}
