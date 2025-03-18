import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <img src="/logo.svg" alt="Joshua Generation Logo" {...props} />
    );
}