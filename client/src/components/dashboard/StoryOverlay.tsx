import { useState, useEffect } from "react";
import { useRecap } from "@/hooks/use-api";
import { formatCurrency } from "@/hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Tag, ShoppingBag } from "lucide-react";

interface StoryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StoryOverlay({ isOpen, onClose }: StoryOverlayProps) {
    const { data: recap } = useRecap();
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    if (!isOpen || !recap) return null;

    const totalSteps = 5;

    const nextStep = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    const variants = {
        enter: { x: 300, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -300, opacity: 0 },
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-white transition-all duration-300 ${i <= step ? "w-full" : "w-0"}`}
                        />
                    </div>
                ))}
            </div>

            <button onClick={onClose} className="absolute top-8 right-6 z-20 text-white/50 hover:text-white">
                <X size={24} />
            </button>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-md h-full flex flex-col items-center justify-center p-8 text-center"
                    onClick={nextStep}
                >
                    {/* Step 0: Intro */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div className="text-6xl animate-bounce">📅</div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                {recap.month} Recap
                            </h2>
                            <p className="text-xl text-gray-300">
                                Let's see how you did this month!
                            </p>
                            <p className="text-sm text-gray-500 mt-10 animate-pulse">Tap to continue</p>
                        </div>
                    )}

                    {/* Step 1: Total Spent */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-light text-gray-400">You spent</h3>
                            <div className="text-5xl font-bold text-white">
                                {formatCurrency(recap.totalSpent)}
                            </div>
                            <div className="text-lg text-gray-300 flex items-center justify-center gap-2">
                                across <span className="font-bold text-primary">{recap.transactionCount}</span> transactions
                            </div>
                        </div>
                    )}

                    {/* Step 2: Top Category */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <h3 className="text-2xl font-light text-gray-400">Top Category</h3>
                            {recap.topCategory ? (
                                <>
                                    <div className="w-24 h-24 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto text-4xl border-2 border-purple-500/50">
                                        {recap.topCategory.icon || <Tag />}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{recap.topCategory.name}</h2>
                                        <p className="text-2xl text-gray-300">{formatCurrency(recap.topCategory.amount)}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xl">No expenses recorded yet.</p>
                            )}
                        </div>
                    )}

                    {/* Step 3: Biggest Purchase */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-light text-gray-400">Biggest Purchase</h3>
                            {recap.biggestPurchase ? (
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 w-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-left">
                                            <h4 className="font-bold text-xl">{recap.biggestPurchase.description}</h4>
                                            <p className="text-sm text-gray-400">{new Date(recap.biggestPurchase.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <ShoppingBag className="text-purple-400" />
                                    </div>
                                    <p className="text-3xl font-bold text-left">{formatCurrency(recap.biggestPurchase.amount)}</p>
                                </div>
                            ) : (
                                <p>No big purchases found.</p>
                            )}
                        </div>
                    )}

                    {/* Step 4: Comparison */}
                    {step === 4 && (
                        <div className="space-y-8">
                            <h3 className="text-2xl font-light text-gray-400">Compared to last month</h3>

                            {recap.comparison.percentageChange !== 0 ? (
                                <div className={`flex flex-col items-center gap-4 ${recap.comparison.percentageChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {recap.comparison.percentageChange > 0 ? (
                                        <TrendingUp size={64} />
                                    ) : (
                                        <TrendingDown size={64} />
                                    )}
                                    <div className="text-4xl font-bold">
                                        {recap.comparison.percentageChange > 0 ? "+" : ""}{recap.comparison.percentageChange}%
                                    </div>
                                    <p className="text-xl text-gray-300">
                                        You spent {formatCurrency(Math.abs(recap.totalSpent - recap.comparison.lastMonthSpent))} {recap.comparison.percentageChange > 0 ? "more" : "less"}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xl">Same spending as last month.</p>
                            )}

                            <button
                                onClick={onClose}
                                className="mt-8 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                            >
                                Close Recap
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
