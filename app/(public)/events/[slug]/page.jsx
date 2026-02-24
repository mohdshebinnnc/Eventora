"use client"

import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Image from 'next/image'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Calendar, MapPin, Users, Clock, Ticket, ArrowLeft, 
  Share2, Loader2, CheckCircle, XCircle, User
} from 'lucide-react'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton } from '@clerk/nextjs'
import { getCategoryIcon, getCategoryLabel } from '@/lib/data'
import { Skeleton } from '@/components/ui/skeleton'

const EventDetailPage = () => {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug
    const [showQR, setShowQR] = useState(false)

    const { data: event, isLoading: loadingEvent } = useConvexQuery(
        api.event.getEventBySlug, { slug }
    )
    const { data: registration } = useConvexQuery(
        api.event.getRegistrationStatus,
        event ? { eventId: event._id } : "skip"
    )
    const { mutate: register, isLoading: registering } = useConvexMutation(api.event.registerForEvent)
    const { mutate: cancelReg, isLoading: cancelling } = useConvexMutation(api.event.cancelRegistration)

    const handleRegister = async () => {
        try {
            await register({ eventId: event._id })
            toast.success("Successfully registered! 🎉")
        } catch (error) {
            toast.error(error.message || "Failed to register")
        }
    }

    const handleCancel = async () => {
        try {
            await cancelReg({ eventId: event._id })
            toast.success("Registration cancelled")
        } catch (error) {
            toast.error(error.message || "Failed to cancel")
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description?.substring(0, 100),
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
            toast.success("Link copied to clipboard!")
        }
    }

    if (loadingEvent) {
        return (
            <div className='min-h-screen pb-16'>
                {/* Hero Skeleton */}
                <Skeleton className='h-[300px] md:h-[400px] w-full rounded-none' />
                {/* Content Skeleton */}
                <div className='max-w-5xl mx-auto px-6 mt-8 grid md:grid-cols-[1fr_340px] gap-8'>
                    <div className='space-y-6'>
                        <div className='space-y-3'>
                            <Skeleton className='h-8 w-2/3' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-4/5' />
                        </div>
                        <Skeleton className='h-px w-full' />
                        <div className='grid sm:grid-cols-2 gap-6'>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className='flex items-start gap-3'>
                                    <Skeleton className='w-9 h-9 rounded-lg shrink-0' />
                                    <div className='space-y-1.5'>
                                        <Skeleton className='h-4 w-24' />
                                        <Skeleton className='h-3 w-32' />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <Skeleton className='h-[320px] w-full rounded-xl' />
                    </div>
                </div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center gap-4'>
                <h1 className='text-3xl font-bold'>Event Not Found</h1>
                <p className='text-muted-foreground'>This event may have been removed or doesn&apos;t exist.</p>
                <Button onClick={() => router.push("/explore")}>
                    <ArrowLeft className='w-4 h-4 mr-2' /> Back to Explore
                </Button>
            </div>
        )
    }

    const eventPast = isPast(new Date(event.endDate))
    const isFull = event.registrationCount >= event.capacity
    const isRegistered = registration && registration.status === "confirmed"
    const timeUntil = !eventPast ? formatDistanceToNow(new Date(event.startDate), { addSuffix: true }) : null

    return (
        <div className='min-h-screen pb-16'>
            {/* Hero */}
            <div className='relative h-[300px] md:h-[400px] overflow-hidden'>
                {event.coverImage ? (
                    <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className='object-cover'
                        priority
                    />
                ) : (
                    <div
                        className='absolute inset-0'
                        style={{ backgroundColor: event.themeColor || "#1e3a8a" }}
                    />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

                <div className='absolute top-6 left-6'>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" onClick={() => router.back()}>
                        <ArrowLeft className='w-4 h-4' /> Back
                    </Button>
                </div>

                <div className='absolute bottom-0 left-0 right-0 p-6 md:p-12'>
                    <div className='max-w-5xl mx-auto'>
                        <div className='flex flex-wrap gap-2 mb-3'>
                            <Badge variant="secondary">
                                {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
                            </Badge>
                            <Badge variant={event.ticketType === "free" ? "default" : "outline"}>
                                {event.ticketType === "free" ? "Free" : `₹${event.ticketPrice}`}
                            </Badge>
                            {eventPast && <Badge variant="destructive">Event Ended</Badge>}
                            {!eventPast && timeUntil && (
                                <Badge className="bg-purple-600">{timeUntil}</Badge>
                            )}
                        </div>
                        <h1 className='text-3xl md:text-5xl font-bold text-white mb-2'>{event.title}</h1>
                        <p className='text-white/80 text-sm'>
                            By {event.organizerName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className='max-w-5xl mx-auto px-6 mt-8 grid md:grid-cols-[1fr_340px] gap-8'>
                {/* Left Column */}
                <div className='space-y-8'>
                    {/* Description */}
                    <div>
                        <h2 className='text-2xl font-bold mb-4'>About This Event</h2>
                        <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                            {event.description}
                        </p>
                    </div>

                    <Separator />

                    {/* Details */}
                    <div className='grid sm:grid-cols-2 gap-6'>
                        <div className='flex items-start gap-3'>
                            <div className='p-2 rounded-lg bg-purple-500/10'>
                                <Calendar className='w-5 h-5 text-purple-500' />
                            </div>
                            <div>
                                <p className='font-semibold'>Date & Time</p>
                                <p className='text-sm text-muted-foreground'>
                                    {format(event.startDate, "EEEE, MMMM d, yyyy")}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                    {format(event.startDate, "h:mm a")} – {format(event.endDate, "h:mm a")}
                                </p>
                            </div>
                        </div>

                        <div className='flex items-start gap-3'>
                            <div className='p-2 rounded-lg bg-purple-500/10'>
                                <MapPin className='w-5 h-5 text-purple-500' />
                            </div>
                            <div>
                                <p className='font-semibold'>Location</p>
                                {event.locationType === "online" ? (
                                    <p className='text-sm text-muted-foreground'>Online Event</p>
                                ) : (
                                    <>
                                        {event.venue && <p className='text-sm text-muted-foreground'>{event.venue}</p>}
                                        <p className='text-sm text-muted-foreground'>
                                            {event.city}, {event.state || event.country}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className='flex items-start gap-3'>
                            <div className='p-2 rounded-lg bg-purple-500/10'>
                                <Users className='w-5 h-5 text-purple-500' />
                            </div>
                            <div>
                                <p className='font-semibold'>Capacity</p>
                                <p className='text-sm text-muted-foreground'>
                                    {event.registrationCount} / {event.capacity} registered
                                </p>
                            </div>
                        </div>

                        <div className='flex items-start gap-3'>
                            <div className='p-2 rounded-lg bg-purple-500/10'>
                                <Ticket className='w-5 h-5 text-purple-500' />
                            </div>
                            <div>
                                <p className='font-semibold'>Ticket</p>
                                <p className='text-sm text-muted-foreground'>
                                    {event.ticketType === "free" ? "Free Entry" : `₹${event.ticketPrice} per ticket`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className='font-semibold mb-3'>Tags</h3>
                                <div className='flex flex-wrap gap-2'>
                                    {event.tags.map((tag, i) => (
                                        <Badge key={i} variant="outline">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column — Registration Card */}
                <div>
                    <Card className="sticky top-28">
                        <CardContent className="p-6 space-y-4">
                            <div className='text-center'>
                                {event.ticketType === "paid" ? (
                                    <p className='text-3xl font-bold'>₹{event.ticketPrice}</p>
                                ) : (
                                    <p className='text-3xl font-bold text-green-500'>Free</p>
                                )}
                                <p className='text-sm text-muted-foreground mt-1'>
                                    {event.registrationCount} / {event.capacity} spots taken
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className='w-full bg-secondary rounded-full h-2'>
                                <div 
                                    className='bg-purple-500 h-2 rounded-full transition-all'
                                    style={{ width: `${Math.min((event.registrationCount / event.capacity) * 100, 100)}%` }}
                                />
                            </div>

                            {eventPast ? (
                                <Button className="w-full" disabled>
                                    <Clock className='w-4 h-4 mr-2' /> Event Has Ended
                                </Button>
                            ) : (
                                <>
                                    <Authenticated>
                                        {isRegistered ? (
                                            <div className='space-y-3'>
                                                <div className='flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20'>
                                                    <CheckCircle className='w-5 h-5 text-green-500' />
                                                    <span className='text-sm font-medium text-green-500'>You&apos;re Registered!</span>
                                                </div>
                                                <Button
                                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => setShowQR(true)}
                                                >
                                                    <Ticket className='w-4 h-4 mr-2' /> View Ticket
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-red-500 hover:text-red-600"
                                                    onClick={handleCancel}
                                                    disabled={cancelling}
                                                >
                                                    {cancelling ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <XCircle className='w-4 h-4 mr-2' />}
                                                    Cancel Registration
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                                                size="lg"
                                                disabled={isFull || registering}
                                                onClick={handleRegister}
                                            >
                                                {registering ? (
                                                    <><Loader2 className='w-4 h-4 animate-spin mr-2' /> Registering...</>
                                                ) : isFull ? (
                                                    "Event Full"
                                                ) : (
                                                    <><Ticket className='w-4 h-4 mr-2' /> Register Now</>
                                                )}
                                            </Button>
                                        )}
                                    </Authenticated>
                                    <Unauthenticated>
                                        <SignInButton mode='modal'>
                                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold" size="lg">
                                                Sign In to Register
                                            </Button>
                                        </SignInButton>
                                    </Unauthenticated>
                                </>
                            )}

                            <Separator />

                            <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                                <Share2 className='w-4 h-4' /> Share Event
                            </Button>

                            {/* Organizer */}
                            <div className='flex items-center gap-3 p-3 bg-secondary/50 rounded-lg'>
                                <div className='p-2 rounded-full bg-purple-500/10'>
                                    <User className='w-4 h-4 text-purple-500' />
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Organized by</p>
                                    <p className='text-sm font-medium'>{event.organizerName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* QR Ticket Modal */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Ticket</DialogTitle>
                        <DialogDescription>Show this QR code at the event for check-in</DialogDescription>
                    </DialogHeader>
                    <div className='flex flex-col items-center gap-4 py-4'>
                        <div className='p-4 bg-white rounded-xl'>
                            <QRCode value={registration?.qrCode || ""} size={200} />
                        </div>
                        <div className='text-center'>
                            <p className='font-bold text-lg'>{event.title}</p>
                            <p className='text-sm text-muted-foreground'>
                                {format(event.startDate, "PPP 'at' h:mm a")}
                            </p>
                            <p className='text-xs text-muted-foreground mt-2 font-mono'>
                                {registration?.qrCode}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EventDetailPage
