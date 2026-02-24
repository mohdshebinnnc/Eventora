"use client"

import React, { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Image from 'next/image'
import EventCard from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    Loader2, Plus, Calendar, Users, DollarSign, BarChart3,
    QrCode, Download, Trash2, Clock, CheckCircle, Eye, Pencil
} from 'lucide-react'
import { getCategoryIcon } from '@/lib/data'

const MyEventsPage = () => {
    const router = useRouter()
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [eventToDelete, setEventToDelete] = useState(null)

    const { data: events, isLoading } = useConvexQuery(api.event.getMyEvents)
    const { data: stats } = useConvexQuery(
        api.event.getEventStats,
        selectedEvent ? { eventId: selectedEvent._id } : "skip"
    )
    const { data: registrations } = useConvexQuery(
        api.event.getEventRegistrations,
        selectedEvent ? { eventId: selectedEvent._id } : "skip"
    )
    const { mutate: deleteEvent, isLoading: deleting } = useConvexMutation(api.event.deleteEvent)

    const handleDelete = async () => {
        if (!eventToDelete) return
        try {
            await deleteEvent({ eventId: eventToDelete })
            toast.success("Event deleted")
            setShowDeleteDialog(false)
            setEventToDelete(null)
            if (selectedEvent?._id === eventToDelete) setSelectedEvent(null)
        } catch (error) {
            toast.error(error.message || "Failed to delete")
        }
    }

    const exportCSV = () => {
        if (!registrations || !selectedEvent) return
        const headers = ["Name", "Email", "Status", "Checked In", "Registered At"]
        const rows = registrations.map((r) => [
            r.attendeeName,
            r.attendeeEmail,
            r.status,
            r.checkedIn ? "Yes" : "No",
            format(r.registeredAt, "PPP p"),
        ])
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedEvent.title}-registrations.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("CSV exported!")
    }

    if (isLoading) {
        return (
            <div className='min-h-screen pb-16'>
                <div className='flex items-center justify-between mb-8'>
                    <div>
                        <Skeleton className='h-10 w-48 mb-2' />
                        <Skeleton className='h-4 w-32' />
                    </div>
                    <Skeleton className='h-10 w-36' />
                </div>
                <div className='grid lg:grid-cols-[1fr_400px] gap-8'>
                    <div className='space-y-4'>
                        {[...Array(3)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className='p-4 flex items-center gap-4'>
                                    <Skeleton className='w-16 h-16 rounded-lg shrink-0' />
                                    <div className='flex-1 space-y-2'>
                                        <Skeleton className='h-4 w-3/4' />
                                        <Skeleton className='h-3 w-1/2' />
                                        <Skeleton className='h-5 w-20' />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card>
                        <CardContent className='flex flex-col items-center justify-center py-16 gap-2'>
                            <Skeleton className='w-8 h-8 rounded' />
                            <Skeleton className='h-4 w-48' />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen pb-16'>
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-4xl font-bold'>My Events</h1>
                    <p className='text-muted-foreground mt-1'>{events?.length || 0} event{events?.length !== 1 ? "s" : ""} created</p>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white gap-2" onClick={() => router.push("/create-event")}>
                    <Plus className='w-4 h-4' /> Create Event
                </Button>
            </div>

            {!events || events.length === 0 ? (
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-16 gap-4'>
                        <Calendar className='w-12 h-12 text-muted-foreground' />
                        <h2 className='text-xl font-semibold'>No events yet</h2>
                        <p className='text-muted-foreground'>Create your first event to get started!</p>
                        <Button onClick={() => router.push("/create-event")}>
                            <Plus className='w-4 h-4 mr-2' /> Create Event
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className='grid lg:grid-cols-[1fr_400px] gap-8'>
                    {/* Events List */}
                    <div className='space-y-4'>
                        {events.map((event) => (
                            <Card
                                key={event._id}
                                className={`cursor-pointer transition-all hover:border-purple-500/50 ${
                                    selectedEvent?._id === event._id ? "border-purple-500 shadow-lg shadow-purple-500/10" : ""
                                }`}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <CardContent className='p-4 flex items-center gap-4'>
                                    <div className='w-16 h-16 rounded-lg overflow-hidden relative shrink-0'>
                                        {event.coverImage ? (
                                            <Image src={event.coverImage} alt={event.title} fill className='object-cover' />
                                        ) : (
                                            <div className='w-full h-full flex items-center justify-center text-2xl' style={{ backgroundColor: event.themeColor }}>
                                                {getCategoryIcon(event.category)}
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h3 className='font-semibold truncate'>{event.title}</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            {format(event.startDate, "MMM d, yyyy")} · {event.registrationCount}/{event.capacity} registered
                                        </p>
                                        <div className='flex gap-2 mt-1'>
                                            {isPast(new Date(event.endDate)) ? (
                                                <Badge variant="secondary" className="text-xs">Ended</Badge>
                                            ) : (
                                                <Badge className="text-xs bg-green-600">{formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}</Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">{event.ticketType === "free" ? "Free" : `₹${event.ticketPrice}`}</Badge>
                                        </div>
                                    </div>
                                    <div className='flex gap-2 shrink-0'>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.slug}`) }}>
                                            <Eye className='w-4 h-4' />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/my-events/${event._id}/edit`) }}>
                                            <Pencil className='w-4 h-4' />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={(e) => {
                                            e.stopPropagation()
                                            setEventToDelete(event._id)
                                            setShowDeleteDialog(true)
                                        }}>
                                            <Trash2 className='w-4 h-4' />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Dashboard Panel */}
                    <div className='space-y-4'>
                        {selectedEvent ? (
                            <>
                                <h2 className='text-xl font-bold'>{selectedEvent.title}</h2>

                                {/* Stats Grid */}
                                {stats && (
                                    <div className='grid grid-cols-2 gap-3'>
                                        <Card>
                                            <CardContent className='p-4 text-center'>
                                                <Users className='w-5 h-5 mx-auto mb-1 text-purple-500' />
                                                <p className='text-2xl font-bold'>{stats.totalRegistrations}</p>
                                                <p className='text-xs text-muted-foreground'>Registrations</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className='p-4 text-center'>
                                                <CheckCircle className='w-5 h-5 mx-auto mb-1 text-green-500' />
                                                <p className='text-2xl font-bold'>{stats.checkInRate}%</p>
                                                <p className='text-xs text-muted-foreground'>Check-in Rate</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className='p-4 text-center'>
                                                <BarChart3 className='w-5 h-5 mx-auto mb-1 text-blue-500' />
                                                <p className='text-2xl font-bold'>{stats.capacityUsed}%</p>
                                                <p className='text-xs text-muted-foreground'>Capacity Used</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className='p-4 text-center'>
                                                <DollarSign className='w-5 h-5 mx-auto mb-1 text-yellow-500' />
                                                <p className='text-2xl font-bold'>₹{stats.revenue}</p>
                                                <p className='text-xs text-muted-foreground'>Revenue</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className='flex gap-2'>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => router.push(`/my-events/${selectedEvent._id}/edit`)}>
                                        <Pencil className='w-4 h-4' /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => router.push(`/my-events/${selectedEvent._id}/scan`)}>
                                        <QrCode className='w-4 h-4' /> Scan QR
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={exportCSV} disabled={!registrations?.length}>
                                        <Download className='w-4 h-4' /> CSV
                                    </Button>
                                </div>

                                {/* Attendee List */}
                                <div>
                                    <h3 className='font-semibold mb-3'>Attendees ({registrations?.length || 0})</h3>
                                    <div className='space-y-2 max-h-[400px] overflow-y-auto'>
                                        {registrations && registrations.length > 0 ? (
                                            registrations.map((reg) => (
                                                <div key={reg._id} className='flex items-center justify-between p-3 bg-secondary/50 rounded-lg'>
                                                    <div>
                                                        <p className='text-sm font-medium'>{reg.attendeeName}</p>
                                                        <p className='text-xs text-muted-foreground'>{reg.attendeeEmail}</p>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        {reg.status === "cancelled" ? (
                                                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                                                        ) : reg.checkedIn ? (
                                                            <Badge className="text-xs bg-green-600">Checked In</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">Registered</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className='text-sm text-muted-foreground text-center py-8'>No registrations yet</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Card>
                                <CardContent className='flex flex-col items-center justify-center py-16 gap-2'>
                                    <BarChart3 className='w-8 h-8 text-muted-foreground' />
                                    <p className='text-muted-foreground text-sm'>Select an event to view dashboard</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>Are you sure? This will also delete all registrations. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <div className='flex gap-3 justify-end'>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <Trash2 className='w-4 h-4 mr-2' />}
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default MyEventsPage
