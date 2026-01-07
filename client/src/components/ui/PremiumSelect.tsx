import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
    label: React.ReactNode;
    value: string | number;
}

interface PremiumSelectProps {
    value: string | number;
    onChange: (value: any) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    dropdownClassName?: string;
}

export function PremiumSelect({ value, onChange, options, placeholder, className, dropdownClassName }: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn("flex items-center justify-between space-x-2 bg-muted/50 hover:bg-muted text-sm font-semibold py-1.5 px-3 rounded-xl transition-colors w-full", className)}
                whileTap={{ scale: 0.95 }}
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
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn("absolute left-0 top-full mt-2 w-full z-[1000] bg-popover border border-border/50 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto scrollbar-thin", dropdownClassName)}
                        >
                            {options.map((option) => (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(String(option.value))}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50",
                                        option.value === value ? "text-primary bg-primary/5" : "text-muted-foreground"
                                    )}
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="block w-full text-left">{option.label}</span>
                                    {option.value === value && (
                                        <Check size={14} className="text-primary" />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
