const pad = (n) => String(n).padStart(2, "0");

/** YYYY-MM-DD (NSE order status / provisional order reports). */
export function formatIsoDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** DD-MM-YYYY (NSE report APIs). */
export function formatDdMmYyyy(d) {
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** DD-MM-YYYY HH:MM (NSE ELOGBANK request_date). */
export function formatDdMmYyyyHhMm(d) {
    return `${formatDdMmYyyy(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** { from, to } covering the last `days` days up to today. */
export function lastDaysRange(days) {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    return { from, to: today };
}
