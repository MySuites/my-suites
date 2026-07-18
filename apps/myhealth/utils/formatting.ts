export function formatSeconds(s: number) {
    const mm = Math.floor(s / 60)
        .toString()
        .padStart(2, "0");
    const ss = Math.floor(s % 60)
        .toString()
        .padStart(2, "0");
    return `${mm}:${ss}`;
}

export function formatRestTime(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins > 0) {
        return `${mins}min ${secs}sec`;
    }
    return `${secs}s`;
}

// H:MM:SS once past an hour, MM:SS otherwise — for long-running stopwatches
// (formatSeconds's 2-digit-per-unit padding breaks past 99 minutes).
export function formatStopwatch(s: number): string {
    const totalSecs = Math.max(0, Math.floor(s));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number, unitSystem: 'imperial' | 'metric'): string {
    if (unitSystem === 'imperial') {
        return `${(meters / 1609.34).toFixed(2)} mi`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

export function formatElevation(meters: number, unitSystem: 'imperial' | 'metric'): string {
    if (unitSystem === 'imperial') {
        return `${Math.round(meters * 3.28084)} ft`;
    }
    return `${Math.round(meters)} m`;
}

// Average pace — seconds elapsed per unit of distance already expressed in
// the user's display unit (miles or km, not meters).
export function formatPace(elapsedSecs: number, distance: number, unitSystem: 'imperial' | 'metric'): string {
    if (!distance || distance <= 0) return '--';
    const secsPerUnit = elapsedSecs / distance;
    const mins = Math.floor(secsPerUnit / 60);
    const secs = Math.round(secsPerUnit % 60);
    const unit = unitSystem === 'imperial' ? 'mi' : 'km';
    return `${mins}:${secs.toString().padStart(2, "0")} /${unit}`;
}

export function formatCompactNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 100000) {
        // >= 100k: Round to nearest k, no decimals
        return Math.round(num / 1000) + "k";
    }
    if (num >= 10000) {
        // 10k - 99k: One decimal place
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toLocaleString();
}
