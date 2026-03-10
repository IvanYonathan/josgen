import { useEffect } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import SettingsLayout from '@/layouts/settings/layout';
import { useTranslation } from '@/hooks/use-translation';

export default function Appearance() {
    const { t } = useTranslation('settings');

    useEffect(() => {
        document.title = 'Appearance settings';
    }, []);

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title={t('appearance.title')} description={t('appearance.description')} />
                <AppearanceTabs />
            </div>
        </SettingsLayout>
    );
}
