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
