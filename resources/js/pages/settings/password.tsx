import InputError from '@/components/input-error';
import SettingsLayout from '@/layouts/settings/layout';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/api/auth/change-password';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<{ current_password?: string; password?: string; password_confirmation?: string }>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    useEffect(() => {
        document.title = 'Password settings';
    }, []);

    const updatePassword: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await changePassword({
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            });

            setCurrentPassword('');
            setPassword('');
            setPasswordConfirmation('');
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                setErrors(apiErrors);

                if (apiErrors.password) {
                    setPassword('');
                    setPasswordConfirmation('');
                    passwordInput.current?.focus();
                }

                if (apiErrors.current_password) {
                    setCurrentPassword('');
                    currentPasswordInput.current?.focus();
                }
            } else {
                console.error('Failed to change password:', error);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Update password" description="Ensure your account is using a long, random password to stay secure" />

                    <form onSubmit={updatePassword} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Current password</Label>

                            <Input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                placeholder="Current password"
                            />

                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>

                            <Input
                                id="password"
                                ref={passwordInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="New password"
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>

                            <Input
                                id="password_confirmation"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                            />

                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save password</Button>

                        {recentlySuccessful && (
                            <p className="text-sm text-neutral-600">Saved</p>
                        )}
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
}
