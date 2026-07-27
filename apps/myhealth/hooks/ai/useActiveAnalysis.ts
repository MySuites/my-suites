import { useEffect, useState } from 'react';
import {
    AnalysisStatus,
    getAnalysisStatus,
    subscribeAnalysisStatus,
} from '../../services/ai/analyzeProgressPicture';

// Tracks which progress picture is currently mid-analysis and which are
// queued behind it, so the UI can show a spinner on the active one and a
// spinner+pause on queued ones - the underlying model only runs one at a time.
export function useAnalysisStatus(): AnalysisStatus {
    const [status, setStatus] = useState<AnalysisStatus>(getAnalysisStatus());

    useEffect(() => {
        return subscribeAnalysisStatus(setStatus);
    }, []);

    return status;
}
