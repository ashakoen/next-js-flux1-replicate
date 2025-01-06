'use client';

import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FavoritePromptsDrawerProps {
    favoritePrompts: string[];
    handleDeleteFavoritePrompt: (prompt: string) => void;
    onUsePrompt: (prompt: string) => void;
}

export function FavoritePromptsDrawer({
    favoritePrompts,
    handleDeleteFavoritePrompt,
    onUsePrompt
}: FavoritePromptsDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPrompts = useMemo(() => {
        if (!searchQuery.trim()) return favoritePrompts;
        return favoritePrompts.filter(prompt =>
            prompt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [favoritePrompts, searchQuery]);

    return (
        <div className="fixed left-0 top-[11rem] z-30">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`flex flex-col items-center gap-2 py-3 h-auto
        border-l-0 rounded-r-lg shadow-md border-2
        bg-gradient-to-r from-amber-200 to-teal-200
        hover:from-amber-300 hover:to-teal-300
        dark:from-amber-900 dark:to-teal-900
        dark:hover:from-amber-800 dark:hover:to-teal-800
        transition-all duration-300
        ${favoritePrompts.length > 0 ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''}
    `}
                        style={{
                            borderTopLeftRadius: 0, // Flat left edge
                            borderBottomLeftRadius: 0, // Flat left edge
                        }}
                    >
                        <div className="relative">
                            <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                            {favoritePrompts.length > 0 && (
                                <div className="absolute -top-1 -right-2.5 w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span
                            className="text-base font-medium text-transparent bg-clip-text 
        bg-gradient-to-b from-amber-600 to-teal-600 dark:from-amber-500 dark:to-teal-500"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            {isOpen ? 'Close' : 'Prompts'}
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent
                    className="w-[400px] fixed left-0 h-[calc(100vh-8rem)] mt-[2rem] p-4 flex flex-col 
                    bg-muted rounded-r-xl shadow-lg slide-in-from-left"
                >
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-foreground">
                            <Star className="h-5 w-5 text-primary" />
                            <span className="font-semibold bg-gradient-to-r from-primary to-accent 
                            text-transparent bg-clip-text">
                                Favorite Prompts ({favoritePrompts.length})
                            </span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="relative mt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search prompts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 border border-muted-foreground rounded-lg focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <ScrollArea className="flex-1 mt-4 pr-4">
                        <div className="space-y-3">
                            {filteredPrompts.length > 0 ? (
                                filteredPrompts.map((prompt, index) => (
                                    <TooltipProvider key={index} delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="group relative p-4 rounded-lg border border-muted-foreground 
                                                    bg-muted/50 hover:bg-muted/70 transition-all duration-200"
                                                >
                                                    <div
                                                        className="cursor-pointer mb-8"
                                                        onClick={() => onUsePrompt(prompt)}
                                                    >
                                                        <p className="text-sm line-clamp-2 pr-8 text-foreground">
                                                            {prompt}
                                                        </p>
                                                        <div className="absolute top-2 right-2 text-xs text-muted-foreground 
                                                        bg-muted px-1.5 py-0.5 rounded-full">
                                                            {prompt.length}c
                                                        </div>
                                                    </div>
                                                    <div className="absolute right-2 bottom-3 flex gap-1 
                                                        opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onUsePrompt(prompt)}
                                                            className="h-7 px-2 text-xs text-accent hover:bg-accent/10"
                                                        >
                                                            Use
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteFavoritePrompt(prompt);
                                                            }}
                                                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                className="max-w-[300px] p-3 text-xs bg-muted/90 text-foreground"
                                            >
                                                <p className="whitespace-pre-wrap">{prompt}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    {searchQuery ? 'No matching prompts found' : 'No favorite prompts yet'}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}