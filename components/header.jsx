"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react'
import { SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from './ui/button';
import { Authenticated, Unauthenticated } from 'convex/react';
import { BarLoader } from 'react-spinners';
import { useStoreUser } from '@/hooks/use-store-user';
import { Building, Plus, Ticket } from 'lucide-react';
import { OnboardingModal } from './onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';

const Header = () => {
    const { isLoading } = useStoreUser();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const {showOnboarding,handleOnboardingSkip,handleOnboardingComplete}=useOnboarding()

    return (
        <>
            <nav className='fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b z-20'>
                <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
                    {/* Logo */}
                    <Link href={"/"} className='flex items-center'>
                        <Image src="/eventora.png" alt='Eventora logo' width={176} height={44} className='w-44 h-11' priority />
                    </Link>

                    {/* Search & Location */}

                    {/* Right Side Actions */}
                    <div className='flex items-center'>
                        <Button variant={"ghost"} onClick={() => setShowUpgradeModal(true)} size="sm">
                            Pricing
                        </Button>

                        <Button variant="ghost" size="sm" asChild className={"mr-2"}>
                            <Link href="/explore">Explore</Link>
                        </Button>

                        <Authenticated>
                            <Button size="sm" asChild className="flex gap-2 mr-4">
                                <Link href="/create-event">
                                    <Plus className='w-4 h-4' />
                                    <span className='hidden sm:inline'>Create Event</span>
                                </Link>
                            </Button>

                            <UserButton>
                                <UserButton.MenuItems>
                                    <UserButton.Link
                                        label='My Tickets'
                                        labelIcon={<Ticket size={16} />}
                                        href='/my-tickets'
                                    />

                                    <UserButton.Link
                                        label='My Events'
                                        labelIcon={<Building size={16} />}
                                        href='/my-events'
                                    />

                                    <UserButton.Action label='manageAccount' />
                                </UserButton.MenuItems>
                            </UserButton>
                        </Authenticated>

                        <Unauthenticated>
                            <SignInButton mode='modal'>
                                <Button size="sm">Sign In</Button>
                            </SignInButton>

                        </Unauthenticated>
                    </div>
                </div>

                {/* mobile Search &Location */}

                {/* Loader */}
                {isLoading && (
                    <div className='absolute bottom-0 left-0 w-full'>
                        <BarLoader width={"100%"} color="#a855f7" />
                    </div>
                )}

            </nav>

            {/* Modals  */}
            <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleOnboardingSkip} 
                onComplete={handleOnboardingComplete}
            />
        </>
    );
};

export default Header;
