export function generateId(): string {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
    );
}

// Helper to parse 'YYYY-MM-DD' as local midnight
export function parseLocalYMD(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Helper to format Date as 'YYYY-MM-DD' local
export function toLocalYMD(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const date = parseLocalYMD(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
        });
    } catch (e) {
        return '';
    }
}

export function formatDateFull(dateStr: string): string {
    const date = parseLocalYMD(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
    });
}

export function isToday(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = parseLocalYMD(dateStr);
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

export function isTomorrow(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = parseLocalYMD(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
    );
}

export function isThisWeek(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = parseLocalYMD(dateStr);
    const today = new Date();
    // Reset today to midnight
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 (Mon) - 7 (Sun)

    // Calculate start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);

    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
}

export function isThisMonth(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = parseLocalYMD(dateStr);
    const today = new Date();
    return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

export function getWeekDates(): Date[] {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
    );
}

export function getTodayISO(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function isPastDue(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = parseLocalYMD(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // date is already midnight from parseLocalYMD
    return date < today;
}

export function getDayName(date: Date): string {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
}

export function getDayNumber(date: Date): number {
    return date.getDate();
}
