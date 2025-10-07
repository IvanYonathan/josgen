import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface DailyVerseCardProps {
    reference: string;
    text: string;
    url?: string;
}

export function DailyVerseCard({ reference, text, url }: Readonly<DailyVerseCardProps>) {
    const {t} = useTranslation('components/common/daily-verse-card');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const verseContent = `"${text}"\n— ${reference}`;

        try {
            await navigator.clipboard.writeText(verseContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy verse:', err);
        }
    };

    return (
        <div className="dark:border-sidebar-border/70 border border-sidebar-border/70 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
                        {t('title')}
                    </h3>
                    <blockquote className="text-base leading-relaxed text-gray-800 dark:text-gray-100 mb-4 italic">
                        "{text}"
                    </blockquote>
                    <cite className="text-sm font-medium text-gray-600 dark:text-gray-400 not-italic">
                        — {reference}
                    </cite>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                    title="Copy verse"
                    aria-label="Copy verse to clipboard"
                >
                    {copied ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                        <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                </button>
            </div>

            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {t('readOnBibleCom')}
                </a>
            )}
        </div>
    );
}
