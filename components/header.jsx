import Link from 'next/link';
import Image from 'next/image';
import React from 'react'

const Header = () => {
    return (
        <>
            <nav className='fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b z-20'>
                <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
                    {/* Logo */}
                    <Link href={"/"} className='flex items-center'>
                        <Image src="/eventora.png" alt='Eventora logo' width={500} height={500} className='w-full h-11' priority/>
                    </Link>

                    {/* Search & Location */}

                    {/* Right Side Actions */}
                </div>

                {/* mobile Search &Location */}
            </nav>

            {/* Modals  */}
        </>
    );
};

export default Header;
