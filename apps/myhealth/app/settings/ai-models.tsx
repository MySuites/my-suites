import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { RaisedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { useAIModelManager } from '../../hooks/ai/useAIModelManager';

export default function AIModelsScreen() {
    const theme = useUITheme();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const {
        models,
        selectedId,
        downloadingId,
        downloadProgress,
        download,
        remove,
        select,
    } = useAIModelManager();

    const handleSelect = async (id: string, downloaded: boolean) => {
        if (!downloaded) {
            showToast({ message: 'Download this model first', type: 'error' });
            return;
        }
        await select(id);
        showToast({ message: 'AI model switched', type: 'success' });
    };

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader title="AI Models" leftAction={<BackButton />} />

            <ScrollView
                style={{ flex: 1, paddingTop: insets.top + 80 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            >
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Download a model to run photo analysis and workout insights on-device. Only one model needs to be active at a time.
                </Text>

                {models.map((model) => {
                    const isSelected = selectedId === model.id;
                    const isDownloading = downloadingId === model.id;

                    return (
                        <RaisedCard key={model.id} className="mb-3 p-4">
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1 mr-3">
                                    <Text className="text-base font-semibold text-light dark:text-dark">
                                        {model.label}
                                    </Text>
                                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {model.description}
                                    </Text>
                                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        ~{model.approxSizeMB} MB · {model.capabilities.join(' + ')}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <IconSymbol name="checkmark" size={20} color={theme.primary} />
                                )}
                            </View>

                            {isDownloading ? (
                                <View className="flex-row items-center gap-2 mt-2">
                                    <ActivityIndicator size="small" color={theme.primary} />
                                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                                        Downloading… {Math.round(downloadProgress * 100)}%
                                    </Text>
                                </View>
                            ) : (
                                <View className="flex-row gap-2 mt-2">
                                    {!model.downloaded && (
                                        <RaisedCard
                                            onPress={() => download(model.id)}
                                            className="flex-1 py-2 items-center"
                                        >
                                            <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
                                                Download
                                            </Text>
                                        </RaisedCard>
                                    )}
                                    {model.downloaded && !isSelected && (
                                        <RaisedCard
                                            onPress={() => handleSelect(model.id, model.downloaded)}
                                            className="flex-1 py-2 items-center"
                                        >
                                            <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
                                                Use this model
                                            </Text>
                                        </RaisedCard>
                                    )}
                                    {model.downloaded && !isSelected && (
                                        <RaisedCard
                                            onPress={() => remove(model.id)}
                                            className="w-12 py-2 items-center"
                                        >
                                            <IconSymbol name="trash.fill" size={18} color={theme.danger} />
                                        </RaisedCard>
                                    )}
                                </View>
                            )}
                        </RaisedCard>
                    );
                })}
            </ScrollView>
        </View>
    );
}
