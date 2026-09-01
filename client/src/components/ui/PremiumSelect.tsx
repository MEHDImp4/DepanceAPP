import { useEffect, useId, useRef, useState } from "react";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption<T extends string | number> {
    label: React.ReactNode;
    value: T;
}

interface PremiumSelectProps<T extends string | number> {
    value: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    placeholder?: string;
    className?: string;
    dropdownClassName?: string;
}

export function PremiumSelect<T extends string | number>({ value, onChange, options, placeholder, className, dropdownClassName }: PremiumSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const listboxId = useId();
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen) optionRefs.current[activeIndex]?.focus();
    }, [activeIndex, isOpen]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
            setIsOpen(true);
            return;
        }
        if (!isOpen) return;
        if (event.key === 'Escape') setIsOpen(false);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex(index => (index + direction + options.length) % options.length);
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelect(options[activeIndex].value);
        }
    };

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                className={cn("flex items-center justify-between space-x-2 bg-muted/50 hover:bg-muted text-sm font-semibold py-1.5 px-3 rounded-xl transition-colors w-full", className)}
            >
                <span className={cn("block w-full text-left truncate", selectedOption ? "text-foreground" : "text-muted-foreground")}>
                    {selectedOption?.label || placeholder || "Select"}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "text-muted-foreground transition-transform duration-300",
                        isOpen ? "rotate-180" : "rotate-0"
                    )}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to close on click outside */}
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-activedescendant={`${listboxId}-option-${activeIndex}`}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        className={cn("absolute left-0 top-full mt-2 w-full z-[1000] bg-popover border border-border/50 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto scrollbar-thin", dropdownClassName)}
                    >
                        {options.map((option, index) => (
                            <button
                                ref={element => { optionRefs.current[index] = element; }}
                                id={`${listboxId}-option-${index}`}
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                tabIndex={index === activeIndex ? 0 : -1}
                                onKeyDown={handleKeyDown}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50",
                                    option.value === value ? "text-primary bg-primary/5" : "text-muted-foreground"
                                )}
                            >
                                <span className="block w-full text-left">{option.label}</span>
                                {option.value === value && (
                                    <Check size={14} className="text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
