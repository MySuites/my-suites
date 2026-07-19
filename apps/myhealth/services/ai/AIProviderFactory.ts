import { AIProvider } from './AIProvider';
import { LocalAIProvider } from './LocalAIProvider';
import { CloudAIProvider } from './CloudAIProvider';

export type SubscriptionTier = 'free' | 'pro';

// Only 'free' exists today, so this always resolves to the local provider.
// Once the paid tier ships, 'pro' should route to CloudAIProvider.
export function getAIProvider(tier: SubscriptionTier = 'free'): AIProvider {
    if (tier === 'pro') {
        return CloudAIProvider;
    }
    return LocalAIProvider;
}
