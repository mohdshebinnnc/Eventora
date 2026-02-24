"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react'
import { SignInButton, useAuth, UserButton } from '@clerk/nextjs';
import { Button } from './ui/button';
import { Authenticated, Unauthenticated } from 'convex/react';
import { BarLoader } from 'react-spinners';
import { useStoreUser } from '@/hooks/use-store-user';
import { Building, Crown, Menu, Plus, Ticket, X } from 'lucide-react';
import { OnboardingModal } from './onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';
import SearchLocationBar from './search-location-bar';
import { Badge } from './ui/badge';
import UpgradeModal from './upgrade-modal';

const Header = () => {
    const { isLoading } = useStoreUser();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const {showOnboarding,handleOnboardingSkip,handleOnboardingComplete}=useOnboarding()

    const {has} = useAuth()
    const hasPro=has?.({plan:"pro"})

    return (
        <>
            <nav className='fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b z-20'>
                <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
                    {/* Logo */}
                    <Link href={"/"} className='flex items-center'>
                        <Image src="/eventora.png" alt='Eventora logo' width={176} height={44} className='w-44 h-11' priority />

                        {/* Pro Badge */}
                        {hasPro &&(
                            <Badge className="bg-linear-to-r from-pink-500 to-orange-500 gap-1 text-white ml-3">
                                <Crown className='w-3 h-3'/>
                                Pro
                            </Badge>
                        )}
                    </Link>

                    {/* Search & Location (desktop) */}
                    <div className='hidden md:flex flex-1 justify-center gap-2'>
                        <SearchLocationBar />
                    </div>

                    {/* Right Side Actions (desktop) */}
                    <div className='hidden md:flex items-center'>
                    {!hasPro &&(
                        <Button variant={"ghost"} onClick={() => setShowUpgradeModal(true)} size="sm">
                            Pricing
                        </Button>
                    )}

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

                    {/* Mobile: hamburger + user avatar */}
                    <div className='flex md:hidden items-center gap-2'>
                        <Authenticated>
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

                        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Search & Location */}
                <div className='md:hidden border-t px-3 py-3'>
                    <SearchLocationBar />
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className='md:hidden border-t bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200'>
                        <div className='px-6 py-4 space-y-2'>
                            <Button variant="ghost" size="sm" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                                <Link href="/explore">🔍 Explore Events</Link>
                            </Button>

                            <Authenticated>
                                <Button variant="ghost" size="sm" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/create-event">
                                        <Plus className='w-4 h-4 mr-2' /> Create Event
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/my-tickets">
                                        <Ticket className='w-4 h-4 mr-2' /> My Tickets
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                                    <Link href="/my-events">
                                        <Building className='w-4 h-4 mr-2' /> My Events
                                    </Link>
                                </Button>
                            </Authenticated>

                            <Unauthenticated>
                                <SignInButton mode='modal'>
                                    <Button size="sm" className="w-full">Sign In</Button>
                                </SignInButton>
                            </Unauthenticated>

                            {!hasPro && (
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowUpgradeModal(true); setMobileMenuOpen(false) }}>
                                    <Crown className='w-4 h-4 mr-2' /> Upgrade to Pro
                                </Button>
                            )}
                        </div>
                    </div>
                )}

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

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </>
    );
};

export default Header;
