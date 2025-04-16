import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <div className="relative h-8 w-8"> {/* Increase size if needed */}
            <img
                src="/logo/logolight.png"
                alt="Logo Light"
                className="absolute inset-0 h-full w-full object-contain block dark:hidden"
                {...props}
            />
    
        </div>
    );
}
