import { useEffect, useState } from 'react';
import HeadingSmall from '@/components/heading-small';
import { cn } from '@/lib/utils';
import SettingsLayout from '@/layouts/settings/layout';
import { useTranslation } from '@/hooks/use-translation';
import { Check } from 'lucide-react';

const LANGUAGE_CODES = ['en', 'id'] as const;

export default function LanguageSettings() {
    const { i18n, t } = useTranslation('settings');
    const [currentLanguage, setCurrentLanguage] = useState(
        localStorage.getItem('app_language') || i18n.language || 'en'
    );

    useEffect(() => {
        document.title = 'Language settings';
    }, []);

    const handleLanguageChange = (code: string) => {
        setCurrentLanguage(code);
        localStorage.setItem('app_language', code);
        i18n.changeLanguage(code);
    };

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall
                    title={t('language.title')}
                    description={t('language.description')}
                />
                <div className="space-y-3">
                    {LANGUAGE_CODES.map((code) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => handleLanguageChange(code)}
                            className={cn(
                                'w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
                                currentLanguage === code && 'border-primary bg-primary/5'
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{t(`language.languages.${code}.label`)}</span>
                                <span className="text-sm text-muted-foreground">{t(`language.languages.${code}.description`)}</span>
                            </div>
                            {currentLanguage === code && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </SettingsLayout>
    );
}
