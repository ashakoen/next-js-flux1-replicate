'use client';

import ReactDOM from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface SettingsDrawerProps {
    validatedLoraModels: string[];
    selectedLoraModel: string | null;
    clearValidatedModels: () => void;
    setFormData: (fn: (prev: any) => any) => void;
    setSelectedLoraModel: (value: string | null) => void;
    formData: { prompt: string; [key: string]: any };
}

export function SettingsDrawer({
    validatedLoraModels,
    selectedLoraModel,
    clearValidatedModels,
    setFormData,
    setSelectedLoraModel,
    formData
}: SettingsDrawerProps) {

	return (
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
					</Accordion>
				</DrawerContent>,
				document.body
			)}
		</Drawer>
	);
}