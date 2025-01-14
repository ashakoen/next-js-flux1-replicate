import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FormData } from "@/types/types";
import Image from "next/image";

interface GenerateConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    formData: FormData;
    previewImageUrl?: string;
}

export function GenerateConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    formData,
    previewImageUrl
}: GenerateConfirmModalProps) {

    //console.log('Preview URL in modal:', previewImageUrl);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Confirm Generation</DialogTitle>
                    <DialogDescription>
                        Generate image with these settings?
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4 py-4">
                    {previewImageUrl && (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                            <Image
                                src={previewImageUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized
                                priority
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <h4 className="font-medium">Prompt</h4>
                        <p className="text-sm text-muted-foreground break-words">{formData.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">Model</h4>
                            <p className="text-sm text-muted-foreground">
                                {formData.privateLoraName ? `${formData.model} (LoRA)` : formData.model}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Size</h4>
                            <p className="text-sm text-muted-foreground">
                                {formData.width}x{formData.height}
                            </p>
                        </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm}>Generate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}