"use client"

import React, { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { useRouter } from 'next/navigation'
import { format, isPast } from 'date-fns'
import Image from 'next/image'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Ticket, Calendar, MapPin, QrCode, XCircle, CheckCircle } from 'lucide-react'
import { getCategoryIcon } from '@/lib/data'
import { Skeleton } from '@/components/ui/skeleton'

const MyTicketsPage = () => {
    const router = useRouter()
    const [selectedTicket, setSelectedTicket] = useState(null)
    const { data: tickets, isLoading } = useConvexQuery(api.event.getMyTickets)
    const { mutate: cancelReg, isLoading: cancelling } = useConvexMutation(api.event.cancelRegistration)

    const handleCancel = async (eventId) => {
        try {
            await cancelReg({ eventId })
            toast.success("Registration cancelled")
        } catch (error) {
            toast.error(error.message || "Failed to cancel")
        }
    }

    if (isLoading) {
        return (
            <div className='min-h-screen pb-16'>
                <div className='mb-8'>
                    <Skeleton className='h-10 w-40 mb-2' />
                    <Skeleton className='h-4 w-56' />
                </div>
                <div className='space-y-4'>
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className='overflow-hidden'>
                            <CardContent className='p-0'>
                                <div className='flex'>
                                    <Skeleton className='w-40 h-32 shrink-0 rounded-none' />
                                    <div className='flex-1 p-4 space-y-3'>
                                        <Skeleton className='h-5 w-3/4' />
                                        <Skeleton className='h-4 w-1/3' />
                                        <Skeleton className='h-4 w-1/2' />
                                        <div className='flex gap-2 pt-1'>
                                            <Skeleton className='h-8 w-28' />
                                            <Skeleton className='h-8 w-20' />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const upcoming = tickets?.filter((t) => t.status === "confirmed" && !isPast(new Date(t.event.endDate))) || []
    const past = tickets?.filter((t) => t.status === "confirmed" && isPast(new Date(t.event.endDate))) || []
    const cancelled = tickets?.filter((t) => t.status === "cancelled") || []

    const TicketCard = ({ ticket }) => {
        const event = ticket.event
        const isEventPast = isPast(new Date(event.endDate))

        return (
            <Card className="overflow-hidden hover:border-purple-500/50 transition-all">
                <CardContent className='p-0'>
                    <div className='flex flex-col sm:flex-row'>
                        {/* Event Image */}
                        <div className='relative w-full sm:w-40 h-32 sm:h-auto shrink-0'>
                            {event.coverImage ? (
                                <Image src={event.coverImage} alt={event.title} fill className='object-cover' />
                            ) : (
                                <div className='w-full h-full min-h-[120px] flex items-center justify-center text-3xl' style={{ backgroundColor: event.themeColor }}>
                                    {getCategoryIcon(event.category)}
                                </div>
                            )}
                        </div>
                        {/* Info */}
                        <div className='flex-1 p-4 space-y-2'>
                            <div className='flex items-start justify-between'>
                                <div>
                                    <h3 className='font-semibold text-lg cursor-pointer hover:text-purple-500 transition-colors'
                                        onClick={() => router.push(`/events/${event.slug}`)}
                                    >
                                        {event.title}
                                    </h3>
                                    <p className='text-sm text-muted-foreground'>{event.organizerName}</p>
                                </div>
                                <div className='flex gap-2'>
                                    {ticket.status === "cancelled" ? (
                                        <Badge variant="destructive">Cancelled</Badge>
                                    ) : ticket.checkedIn ? (
                                        <Badge className="bg-green-600">Checked In</Badge>
                                    ) : isEventPast ? (
                                        <Badge variant="secondary">Past</Badge>
                                    ) : (
                                        <Badge className="bg-purple-600">Confirmed</Badge>
                                    )}
                                </div>
                            </div>

                            <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                                <div className='flex items-center gap-1'>
                                    <Calendar className='w-4 h-4' />
                                    <span>{format(event.startDate, "MMM d, yyyy · h:mm a")}</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <MapPin className='w-4 h-4' />
                                    <span>{event.locationType === "online" ? "Online" : event.city}</span>
                                </div>
                            </div>

                            {ticket.status === "confirmed" && !isEventPast && (
                                <div className='flex gap-2 pt-1'>
                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedTicket(ticket)}>
                                        <QrCode className='w-3 h-3' /> View Ticket
                                    </Button>
                                    <Button size="sm" variant="ghost" className="gap-1 text-red-500 hover:text-red-600"
                                        onClick={() => handleCancel(event._id)}
                                        disabled={cancelling}
                                    >
                                        <XCircle className='w-3 h-3' /> Cancel
                                    </Button>
                                </div>
                            )}

                            {ticket.checkedIn && (
                                <div className='flex items-center gap-1 text-sm text-green-500'>
                                    <CheckCircle className='w-4 h-4' />
                                    <span>Checked in {ticket.checkedInAt ? format(ticket.checkedInAt, "PPP 'at' h:mm a") : ""}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='min-h-screen pb-16'>
            <div className='mb-8'>
                <h1 className='text-4xl font-bold'>My Tickets</h1>
                <p className='text-muted-foreground mt-1'>
                    {upcoming.length} upcoming · {past.length} past · {cancelled.length} cancelled
                </p>
            </div>

            {!tickets || tickets.length === 0 ? (
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-16 gap-4'>
                        <Ticket className='w-12 h-12 text-muted-foreground' />
                        <h2 className='text-xl font-semibold'>No tickets yet</h2>
                        <p className='text-muted-foreground'>Register for events to see your tickets here!</p>
                        <Button onClick={() => router.push("/explore")}>
                            Browse Events
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="upcoming">
                    <TabsList className="mb-6">
                        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                        <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="space-y-4">
                        {upcoming.length > 0 ? upcoming.map((t) => <TicketCard key={t._id} ticket={t} />) : (
                            <p className='text-muted-foreground text-center py-12'>No upcoming tickets</p>
                        )}
                    </TabsContent>
                    <TabsContent value="past" className="space-y-4">
                        {past.length > 0 ? past.map((t) => <TicketCard key={t._id} ticket={t} />) : (
                            <p className='text-muted-foreground text-center py-12'>No past tickets</p>
                        )}
                    </TabsContent>
                    <TabsContent value="cancelled" className="space-y-4">
                        {cancelled.length > 0 ? cancelled.map((t) => <TicketCard key={t._id} ticket={t} />) : (
                            <p className='text-muted-foreground text-center py-12'>No cancelled tickets</p>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* QR Ticket Modal */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Ticket</DialogTitle>
                        <DialogDescription>Show this QR code at the event entrance</DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className='flex flex-col items-center gap-4 py-4'>
                            <div className='p-4 bg-white rounded-xl shadow-lg'>
                                <QRCode value={selectedTicket.qrCode} size={200} />
                            </div>
                            <div className='text-center'>
                                <p className='font-bold text-lg'>{selectedTicket.event.title}</p>
                                <p className='text-sm text-muted-foreground'>
                                    {format(selectedTicket.event.startDate, "PPP 'at' h:mm a")}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                    {selectedTicket.attendeeName}
                                </p>
                                <p className='text-xs text-muted-foreground mt-2 font-mono break-all'>
                                    {selectedTicket.qrCode}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default MyTicketsPage
