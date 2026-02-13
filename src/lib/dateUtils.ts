import { format, subHours } from 'date-fns';

/**
 * Returns the current "Protocol Date" key (YYYY-MM-DD).
 * The day starts at 04:00 AM.
 * If it's 03:59 AM on Jan 2nd, it still counts as Jan 1st.
 */
export const getProtocolDate = (): string => {
    const now = new Date();
    // Subtract 4 hours so that 00:00-03:59 becomes the previous day
    const adjustedDate = subHours(now, 4);
    return format(adjustedDate, 'yyyy-MM-dd');
};

export const getDisplayDate = (): string => {
    const now = new Date();
    const adjustedDate = subHours(now, 4);
    return format(adjustedDate, 'MMM dd, yyyy');
};
