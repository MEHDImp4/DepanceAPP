import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, TrendingUp, TrendingDown, Tag, ShoppingBag } from 'lucide-react-native';
import { useRecap } from '@/hooks/use-api';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY } from '@/constants/theme';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface StoryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StoryOverlay({ isOpen, onClose }: StoryOverlayProps) {
    const { data: recap } = useRecap();
    const [step, setStep] = useState(0);
    const insets = useSafeAreaInsets();
    const totalSteps = 5;

    const nextStep = useCallback(() => {
        setStep((current) => {
            if (current < totalSteps - 1) return current + 1;
            onClose();
            return current;
        });
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    if (!isOpen || !recap) return null;

    return (
        <Modal
            visible={isOpen}
            transparent={false}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Progress Bar */}
                <View
                    style={[
                        styles.progressRow,
                        { top: Math.max(insets.top, 16) + 8 },
                    ]}
                >
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <View key={i} style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: i <= step ? '100%' : '0%' },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                <Pressable
                    onPress={onClose}
                    style={[
                        styles.closeButton,
                        { top: Math.max(insets.top, 16) + 28 },
                    ]}
                    hitSlop={12}
                    accessibilityLabel="Close monthly recap"
                >
                    <X size={24} color="rgba(255,255,255,0.65)" />
                </Pressable>

                <Pressable style={styles.stage} onPress={nextStep}>
                    {step === 0 && (
                        <View style={styles.stepBlock}>
                            <Text style={styles.emojiHero}>📅</Text>
                            <Text style={styles.introTitle}>{recap.month} Recap</Text>
                            <Text style={styles.introSub}>
                                Let&apos;s see how you did this month!
                            </Text>
                            <Text style={styles.tapHint}>Tap to continue</Text>
                        </View>
                    )}

                    {step === 1 && (
                        <View style={styles.stepBlock}>
                            <Text style={styles.lightHeading}>You spent</Text>
                            <Text style={styles.bigAmount}>
                                {formatCurrency(recap.totalSpent, recap.currency || 'USD')}
                            </Text>
                            <Text style={styles.subText}>
                                across{' '}
                                <Text style={styles.primaryHighlight}>
                                    {recap.transactionCount}
                                </Text>{' '}
                                transactions
                            </Text>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepBlock}>
                            <Text style={styles.lightHeading}>Top Category</Text>
                            {recap.topCategory ? (
                                <>
                                    <View style={styles.topCatBadge}>
                                        {recap.topCategory.icon ? (
                                            <CategoryIcon
                                                icon={recap.topCategory.icon}
                                                size={36}
                                                color="#2DD4BF"
                                            />
                                        ) : (
                                            <Tag size={32} color="#2DD4BF" />
                                        )}
                                    </View>
                                    <View style={styles.centered}>
                                        <Text style={styles.catName}>
                                            {recap.topCategory.name}
                                        </Text>
                                        <Text style={styles.catAmount}>
                                            {formatCurrency(
                                                recap.topCategory.amount,
                                                recap.currency || 'USD'
                                            )}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.subText}>
                                    No expenses recorded yet.
                                </Text>
                            )}
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepBlock}>
                            <Text style={styles.lightHeading}>Biggest Purchase</Text>
                            {recap.biggestPurchase ? (
                                <View style={styles.purchaseCard}>
                                    <View style={styles.purchaseHeader}>
                                        <View style={styles.purchaseInfo}>
                                            <Text style={styles.purchaseDesc}>
                                                {recap.biggestPurchase.description}
                                            </Text>
                                            <Text style={styles.purchaseDate}>
                                                {new Date(
                                                    recap.biggestPurchase.created_at
                                                ).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <ShoppingBag size={24} color="#2DD4BF" />
                                    </View>
                                    <Text style={styles.purchaseAmount}>
                                        {formatCurrency(
                                            recap.biggestPurchase.amount,
                                            recap.currency || 'USD'
                                        )}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.subText}>
                                    No big purchases found.
                                </Text>
                            )}
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.stepBlock}>
                            <Text style={styles.lightHeading}>
                                Compared to last month
                            </Text>
                            {recap.comparison.percentageChange !== 0 ? (
                                <View style={styles.centered}>
                                    {recap.comparison.percentageChange > 0 ? (
                                        <TrendingUp size={64} color="#F87171" />
                                    ) : (
                                        <TrendingDown size={64} color="#4ADE80" />
                                    )}
                                    <Text
                                        style={[
                                            styles.pctText,
                                            {
                                                color:
                                                    recap.comparison.percentageChange > 0
                                                        ? '#F87171'
                                                        : '#4ADE80',
                                            },
                                        ]}
                                    >
                                        {recap.comparison.percentageChange > 0 ? '+' : ''}
                                        {recap.comparison.percentageChange}%
                                    </Text>
                                    <Text style={styles.subText}>
                                        You spent{' '}
                                        {formatCurrency(
                                            Math.abs(
                                                recap.totalSpent -
                                                    recap.comparison.lastMonthSpent
                                            ),
                                            recap.currency || 'USD'
                                        )}{' '}
                                        {recap.comparison.percentageChange > 0
                                            ? 'more'
                                            : 'less'}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.subText}>
                                    Same spending as last month.
                                </Text>
                            )}
                        </View>
                    )}
                </Pressable>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    progressRow: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        gap: 4,
        zIndex: 20,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    closeButton: {
        position: 'absolute',
        right: 24,
        zIndex: 20,
        padding: 4,
    },
    stage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    stepBlock: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        gap: 22,
    },
    emojiHero: {
        fontSize: 60,
    },
    introTitle: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        color: '#38BDF8',
        textAlign: 'center',
    },
    introSub: {
        fontSize: 20,
        color: '#D1D5DB',
        textAlign: 'center',
    },
    tapHint: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 24,
    },
    lightHeading: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.light,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    bigAmount: {
        fontSize: 48,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subText: {
        fontSize: 18,
        color: '#D1D5DB',
        textAlign: 'center',
    },
    primaryHighlight: {
        fontFamily: FONT_FAMILY.bold,
        color: '#2563EB',
    },
    topCatBadge: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(20, 184, 166, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centered: {
        alignItems: 'center',
        gap: 12,
    },
    catName: {
        fontSize: 28,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
    catAmount: {
        fontSize: 24,
        color: '#D1D5DB',
    },
    purchaseCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 24,
        gap: 16,
    },
    purchaseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    purchaseInfo: {
        flex: 1,
    },
    purchaseDesc: {
        fontSize: 20,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
    purchaseDate: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
    purchaseAmount: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
    pctText: {
        fontSize: 38,
        fontFamily: FONT_FAMILY.bold,
    },
});
