import { Link } from 'react-router-dom';
import AppLogoIcon from '@/components/app-logo-icon';
import { type PropsWithChildren, useEffect, useState } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function ReactAuthLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
    
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

    const verses = [
        {
            text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
            reference: "Jeremiah 29:11"
        },
        {
            text: "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
            reference: "Proverbs 3:5-6"
        },
        {
            text: "I can do all things through Him who strengthens me.",
            reference: "Philippians 4:13"
        },
        {
            text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
            reference: "Psalm 23:1-3"
        },
        {
            text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.",
            reference: "Joshua 1:9"
        },
        {
            text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
            reference: "John 3:16"
        },
        {
            text: "The Lord bless you and keep you; the Lord make his face to shine upon you and be gracious to you.",
            reference: "Numbers 6:24-25"
        },
        {
            text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
            reference: "Isaiah 40:31"
        },
        {
            text: "The Lord is near to the brokenhearted and saves the crushed in spirit.",
            reference: "Psalm 34:18"
        },
        {
            text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.",
            reference: "Philippians 4:6"
        },
        {
            text: "Cast all your anxieties on him, because he cares for you.",
            reference: "1 Peter 5:7"
        },
        {
            text: "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid?",
            reference: "Psalm 27:1"
        }
    ];

    useEffect(() => {
        const imageInterval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 10000);

        return () => clearInterval(imageInterval);
    }, []);

    useEffect(() => {
        const verseInterval = setInterval(() => {
            setCurrentVerseIndex((prevIndex) => (prevIndex + 1) % verses.length);
        }, 8000);

        return () => clearInterval(verseInterval);
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
                    <blockquote className="space-y-2 relative">
                        {verses.map((verse, index) => (
                            <div
                                key={index}
                                className="transition-opacity duration-700 ease-in-out"
                                style={{
                                    opacity: currentVerseIndex === index ? 1 : 0,
                                    position: currentVerseIndex === index ? 'relative' : 'absolute',
                                    top: currentVerseIndex === index ? 'auto' : 0,
                                    left: currentVerseIndex === index ? 'auto' : 0,
                                    pointerEvents: currentVerseIndex === index ? 'auto' : 'none',
                                }}
                            >
                                <p className="text-lg">&ldquo;{verse.text}&rdquo;</p>
                                <footer className="text-sm text-neutral-300 mt-2">{verse.reference}</footer>
                            </div>
                        ))}
                    </blockquote>
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