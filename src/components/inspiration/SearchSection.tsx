'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchSectionProps {
    onSearch: (query: string) => void;
}

export function SearchSection({ onSearch }: SearchSectionProps) {
    return (
        <div className="relative mt-4 px-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for inspiration..."
                    className="pl-8"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    );
}