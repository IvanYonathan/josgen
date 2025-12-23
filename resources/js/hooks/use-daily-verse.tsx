import { useEffect, useState } from 'react';
import { getDailyVerse } from '@/lib/api/daily-verse/get-daily-verse';
import { DailyVerse } from '@/types/daily-verse/daily-verse';

export function useDailyVerse() {
    const [verse, setVerse] = useState<DailyVerse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDailyVerse()
            .then((data) => {
                setVerse(data);
                setError(null);
            })
            .catch((err) => {
                console.error('Failed to fetch daily verse:', err);
                setError(err instanceof Error ? err.message : 'Failed to load verse');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { verse, loading, error };
}
