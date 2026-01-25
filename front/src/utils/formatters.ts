/**
 * Truncate a blockchain address to show first and last characters
 * @param address - Full blockchain address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 6)
 * @returns Truncated address like "e476a...7f2c4a"
 */
export function truncateAddress(
    address: string,
    startChars: number = 6,
    endChars: number = 6
): string {
    if (!address) return ''
    if (address.length <= startChars + endChars) return address

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format amount with thousand separators
 * @param amount - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "15,420"
 */
export function formatAmount(amount: number | string, decimals: number = 0): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '0'

    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @returns Formatted string like "65%"
 */
export function formatPercentage(value: number): string {
    if (isNaN(value)) return '0%'
    return `${Math.round(value)}%`
}

/**
 * Calculate win rate from won bets and total bets
 * @param wonBets - Number of won bets
 * @param totalBets - Total number of bets
 * @returns Win rate percentage (0-100)
 */
export function calculateWinRate(wonBets: number, totalBets: number): number {
    if (totalBets === 0) return 0
    return (wonBets / totalBets) * 100
}

/**
 * Format time remaining from milliseconds
 * @param ms - Milliseconds remaining
 * @returns Formatted string like "2d 14h" or "5h 30m"
 */
export function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Ended'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
        const remainingHours = hours % 24
        return `${days}d ${remainingHours}h`
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60
        return `${hours}h ${remainingMinutes}m`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${seconds}s`
    }
}
