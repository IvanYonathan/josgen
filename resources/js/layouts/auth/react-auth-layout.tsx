import { Link } from 'react-router-dom';
import AppLogoIcon from '@/components/app-logo-icon';
import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useDailyVerse } from '@/hooks/use-daily-verse';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

const STORAGE_BASE = import.meta.env.VITE_STORAGE_BASE_URL as string | undefined;

const AUTH_IMAGE_PATHS = [
    'image/auth-image/bg-image1.JPG',
    'image/auth-image/bg-image2.JPG',
    'image/auth-image/bg-image3.JPG',
    'image/auth-image/bg-image4.JPG',
    'image/auth-image/bg-image5.JPG',
    'image/auth-image/bg-image6.JPG',
    'image/auth-image/bg-image7.JPG',
    'image/auth-image/bg-image8.JPG',
];

const AUTH_IMAGES = AUTH_IMAGE_PATHS.map(path =>
    STORAGE_BASE ? `${STORAGE_BASE}/${path}` : `/${path}`
);

export default function ReactAuthLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedSrcs, setLoadedSrcs] = useState<Set<string>>(() => new Set([AUTH_IMAGES[0]]));
    const { verse, loading } = useDailyVerse();
    const preloadedRef = useRef<Set<string>>(new Set());

    // Preload next image before transition
    const preloadNext = useCallback((currentIdx: number) => {
        const nextIdx = (currentIdx + 1) % AUTH_IMAGES.length;
        const nextSrc = AUTH_IMAGES[nextIdx];
        if (!preloadedRef.current.has(nextSrc)) {
            preloadedRef.current.add(nextSrc);
            const img = new window.Image();
            img.onload = () => setLoadedSrcs(prev => new Set(prev).add(nextSrc));
            img.src = nextSrc;
        }
    }, []);

    // Preload the next image after current renders
    useEffect(() => {
        preloadNext(currentImageIndex);
    }, [currentImageIndex, preloadNext]);

    // Auto-advance every 10s
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => {
                const next = (prev + 1) % AUTH_IMAGES.length;
                // Start preloading the one after next
                preloadNext(next);
                return next;
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [preloadNext]);

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r overflow-hidden">
                {/* Only render images that have been loaded */}
                {AUTH_IMAGES.map((image, index) => {
                    const isCurrent = currentImageIndex === index;
                    // Only mount this div if the image has been loaded (or is current)
                    if (!loadedSrcs.has(image) && !isCurrent) return null;
                    return (
                        <div
                            key={image}
                            className="absolute inset-0 bg-zinc-900 transition-opacity duration-1000 ease-in-out"
                            style={{
                                backgroundImage: loadedSrcs.has(image) ? `url(${image})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: isCurrent ? 1 : 0,
                                zIndex: isCurrent ? 1 : 0,
                            }}
                        />
                    );
                })}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 z-10" />

                <Link to="/" className="relative z-20 flex items-center text-lg font-medium">
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    Joshua Generation
                </Link>
                <div className="relative z-20 mt-auto">
                    {!loading && verse && (
                        <blockquote className="space-y-2">
                            <p className="text-lg">&ldquo;{verse.text}&rdquo;</p>
                            <footer className="text-sm text-neutral-300 mt-2">{verse.reference}</footer>
                        </blockquote>
                    )}
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link to="/" className="relative z-20 flex items-center justify-center lg:hidden">
                        <AppLogoIcon className="h-10 fill-current text-black sm:h-12" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-muted-foreground text-sm text-balance">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
