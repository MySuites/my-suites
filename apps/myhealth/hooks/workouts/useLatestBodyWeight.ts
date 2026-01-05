import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@mysuite/auth";
import { DataRepository } from "../../providers/DataRepository";

export function useLatestBodyWeight() {
    const { user } = useAuth();
    const [latestWeight, setLatestWeight] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWeight = useCallback(async () => {
        // Local-First: We can fetch even if user is not logged in (guest)
        // But the hook relies on 'user' to know which ID to fetch?
        // DataRepository.getLatestBodyWeight takes userId | null.
        // If user is null, it might return guest data or nothing depending on implementation?
        // Let's pass user?.id || null.

        setLoading(true);
        try {
            // DataRepository now handles the logic (checking local DB)
            const weight = await DataRepository.getLatestBodyWeight(
                user?.id || null,
            );
            setLatestWeight(weight);
        } catch (e) {
            console.error("Error fetching latest body weight:", e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Fetch on mount or user change
        fetchWeight();
    }, [user, fetchWeight]);

    return { weight: latestWeight, loading, refetch: fetchWeight };
}
