import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

// Must run before any react-native-executorch model/resource call, or it
// throws "ResourceFetcher adapter is not initialized".
export function initExecutorchForApp(): void {
    initExecutorch({ resourceFetcher: ExpoResourceFetcher });
}
