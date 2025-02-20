'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Star, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
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
import { toast } from "sonner";

interface SemanticSearchResult {
    prompt: string;
    similarity: number;
}

interface CombinedPromptResult {
    prompt: string;
    isFavorite: boolean;
    similarity?: number;
}

interface FavoritePromptsDrawerProps {
    favoritePrompts: string[];
    handleDeleteFavoritePrompt: (prompt: string) => void;
    handleAddToFavorites: (prompt: string) => void;
    onUsePrompt: (prompt: string) => void;
}

export function FavoritePromptsDrawer({
    favoritePrompts,
    handleDeleteFavoritePrompt,
    handleAddToFavorites,
    onUsePrompt
}: FavoritePromptsDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
    const [searchMode, setSearchMode] = useState<'text' | 'semantic'>('text');

    const filteredPrompts = useMemo<CombinedPromptResult[]>(() => {
        if (!searchQuery.trim()) {
            return favoritePrompts.map(prompt => ({
                prompt,
                isFavorite: true
            }));
        }

        if (searchMode === 'semantic') {
            return semanticResults.map(result => ({
                prompt: result.prompt,
                similarity: result.similarity,
                isFavorite: favoritePrompts.includes(result.prompt)
            }));
        }

        // Text search mode
        return favoritePrompts
            .filter(prompt => prompt.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(prompt => ({
                prompt,
                isFavorite: true
            }));
    }, [favoritePrompts, searchQuery, semanticResults, searchMode]);

    const clearSearch = () => {
        setSearchQuery('');
        setSemanticResults([]);
        setSearchMode('text');
    };

    useEffect(() => {
        const performSemanticSearch = async () => {
            if (!searchQuery.trim() || searchMode !== 'semantic') {
                setSemanticResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch('/api/semantic-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        searchTerm: searchQuery,
                        apiKey: localStorage.getItem('replicateApiKey')
                    })
                });

                if (!response.ok) throw new Error('Search failed');
                const { prompts } = await response.json();
                setSemanticResults(prompts);
            } catch (error) {
                console.error('Semantic search failed:', error);
                toast.error('Semantic search failed');
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(performSemanticSearch, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchMode]);

    return (
        <div className="fixed left-0 top-[14.5rem] z-30">
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
                            {isOpen ? 'Close' : 'Descriptions'}
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
                                Favorite Descriptions ({favoritePrompts.length})
                            </span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="relative mt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search your descriptions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-8 w-full border border-muted-foreground rounded-lg focus:ring-2 focus:ring-primary"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 px-1">
                                <Tabs defaultValue="text" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-8">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <TabsTrigger
                                                        value="text"
                                                        onClick={() => setSearchMode('text')}
                                                        className={searchMode === 'text' ? 'bg-primary text-primary-foreground' : ''}
                                                    >
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Local Favorites
                                                    </TabsTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Search within your saved favorite prompts</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <TabsTrigger
                                                        value="semantic"
                                                        onClick={() => setSearchMode('semantic')}
                                                        className={searchMode === 'semantic' ? 'bg-primary text-primary-foreground' : ''}
                                                    >
                                                        <Search className="h-3 w-3 mr-1" />
                                                        Search Themes
                                                    </TabsTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                <p>Search through all prompts you&apos;ve ever used</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TabsList>
                                </Tabs>
                                {isSearching && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 mt-4 pr-4">
                        <div className="space-y-3">
                            {filteredPrompts.length > 0 ? (
                                filteredPrompts.map((result, index) => (
                                    <TooltipProvider key={index} delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={`group relative p-4 rounded-lg border 
                        ${result.isFavorite
                                                        ? 'border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                                                        : 'border-muted-foreground bg-muted/50'} 
                        hover:bg-muted/70 transition-all duration-200`}
                                                >
                                                    <div
                                                        className="cursor-pointer mb-8"
                                                        onClick={() => onUsePrompt(result.prompt)}
                                                    >
                                                        {/* Favorite indicator */}
                                                        {result.isFavorite && (
                                                            <div className="absolute top-2 left-2">
                                                                <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" fill="currentColor" />
                                                            </div>
                                                        )}

                                                        <p className={`text-sm line-clamp-2 ${result.isFavorite ? 'pl-7' : ''} pr-8 text-foreground`}>
                                                            {result.prompt}
                                                        </p>

                                                        {/* Metadata badges */}
                                                        <div className="absolute top-2 right-2 flex gap-2">
                                                            {result.similarity !== undefined && (
                                                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full
                                        ${result.isFavorite 
                                            ? 'text-amber-700 dark:text-amber-300' 
                                            : 'text-muted-foreground'}"
                                                                >
                                                                    {Math.round(result.similarity * 100)}% match
                                                                </span>
                                                            )}
                                                            <span className={`text-xs bg-muted px-1.5 py-0.5 rounded-full
                                    ${result.isFavorite
                                                                    ? 'text-amber-700 dark:text-amber-300'
                                                                    : 'text-muted-foreground'}`}
                                                            >
                                                                {result.prompt.length}c
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="absolute right-2 bottom-3 flex gap-1 
                            opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onUsePrompt(result.prompt)}
                                                            className="h-7 px-2 text-xs text-accent hover:bg-accent/10"
                                                        >
                                                            Use
                                                        </Button>
                                                        {result.isFavorite ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteFavoritePrompt(result.prompt);
                                                                }}
                                                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                                            >
                                                                Remove
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAddToFavorites(result.prompt);
                                                                }}
                                                                className="h-7 px-2 text-xs text-amber-600 hover:bg-amber-100/50
                                        dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                            >
                                                                Save
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                className="max-w-[300px] p-3 text-xs bg-muted/90 text-foreground"
                                            >
                                                <p className="whitespace-pre-wrap">{result.prompt}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    {searchQuery
                                        ? 'No matching prompts found'
                                        : searchMode === 'semantic'
                                            ? 'No semantic search results'
                                            : 'No favorite prompts yet'
                                    }
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
