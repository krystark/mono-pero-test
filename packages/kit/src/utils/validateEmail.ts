export function validateEmail(email?: string | null): boolean {
    if (!email) return false;
    const s = String(email).trim();
    // Простая, надёжная проверка как в легаси:
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
