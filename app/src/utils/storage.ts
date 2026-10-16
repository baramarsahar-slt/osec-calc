/**
 * עטיפה בטוחה ל-localStorage: לא מפילה את האפליקציה אם האחסון חסום
 * (למשל גלישה פרטית, או מדיניות דפדפן), ומבצעת JSON parse/stringify.
 * כל שמירת מידע ב-localStorage בפרויקט עוברת דרך כאן.
 */

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // אין מה לעשות אם האחסון חסום — פשוט מתעלמים
  }
}
