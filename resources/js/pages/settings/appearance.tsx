import { useEffect } from 'react';
import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    useEffect(() => {
        document.title = 'Appearance settings';
    }, []);

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
                <AppearanceTabs />
            </div>
        </SettingsLayout>
    );
}
