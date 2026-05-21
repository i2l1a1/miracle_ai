export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
        .format(d)
        .replace(",", "");
}
