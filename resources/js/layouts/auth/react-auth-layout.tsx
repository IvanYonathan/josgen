import { Link } from 'react-router-dom';
import AppLogoIcon from '@/components/app-logo-icon';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { useDailyVerse } from '@/hooks/use-daily-verse';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function ReactAuthLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { verse, loading } = useDailyVerse();

    const images = [
        '/image/auth-image/bg-image1.JPG',
        '/image/auth-image/bg-image2.JPG',
        '/image/auth-image/bg-image3.JPG',
        '/image/auth-image/bg-image4.JPG',
        '/image/auth-image/bg-image5.JPG',
        '/image/auth-image/bg-image6.JPG',
        '/image/auth-image/bg-image7.JPG',
        '/image/auth-image/bg-image8.JPG',
    ];

    useEffect(() => {
        const imageInterval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 10000);

        return () => clearInterval(imageInterval);
    }, []);

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r overflow-hidden">
                {/* Render all images with opacity transitions */}
                {images.map((image, index) => (
                    <div
                        key={image}
                        className="absolute inset-0 bg-zinc-900 transition-opacity duration-1000 ease-in-out"
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: currentImageIndex === index ? 1 : 0,
                            zIndex: currentImageIndex === index ? 1 : 0,
                        }}
                    />
                ))}
                
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