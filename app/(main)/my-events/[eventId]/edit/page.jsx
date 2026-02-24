"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { City, State } from 'country-state-city'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UnsplashImagePicker } from '@/components/unsplashImage'
import Image from 'next/image'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon, Loader2, Save } from 'lucide-react'

const editSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    category: z.string().min(1, "Category required"),
    startDate: z.date({ required_error: "Start date required" }),
    endDate: z.date({ required_error: "End date required" }),
    startTime: z.string({ required_error: "Start time required" }),
    endTime: z.string({ required_error: "End time required" }),
    locationType: z.enum(["physical", "online"]),
    venue: z.string().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().min(1, "City required"),
    state: z.string().optional(),
    capacity: z.number().min(1, "Min 1"),
    ticketType: z.enum(["free", "paid"]),
    ticketPrice: z.number().optional(),
})

const EditEventPage = () => {
    const params = useParams()
    const router = useRouter()
    const eventId = params.eventId

    const [showImagePicker, setShowImagePicker] = useState(false)
    const [coverImage, setCoverImage] = useState("")
    const [formReady, setFormReady] = useState(false)

    const { data: event, isLoading: loadingEvent } = useConvexQuery(api.event.getEventBySlug, "skip")
    
    // We need to fetch by ID, but getEventBySlug uses slug. Let's use a direct db.get approach.
    // Actually, we'll get the event from the my-events list. Let's query all and find it.
    const { data: myEvents, isLoading: loadingEvents } = useConvexQuery(api.event.getMyEvents)
    const currentEvent = myEvents?.find((e) => e._id === eventId)

    const { mutate: updateEvent, isLoading: saving } = useConvexMutation(api.event.updateEvent)

    const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
        resolver: zodResolver(editSchema),
        defaultValues: {
            locationType: "physical",
            ticketType: "free",
            capacity: 0,
            category: "",
            state: "",
            city: "",
        }
    })

    const selectedState = watch("state")
    const startDate = watch("startDate")
    const endDate = watch("endDate")

    const indianStates = State.getStatesOfCountry("IN")
    const cities = useMemo(() => {
        if (!selectedState) return []
        const st = indianStates.find((s) => s.name === selectedState)
        if (!st) return []
        return City.getCitiesOfState("IN", st.isoCode)
    }, [selectedState, indianStates])

    // Populate form when event loads
    useEffect(() => {
        if (currentEvent && !formReady) {
            const sd = new Date(currentEvent.startDate)
            const ed = new Date(currentEvent.endDate)
            
            reset({
                title: currentEvent.title,
                description: currentEvent.description,
                category: currentEvent.category,
                startDate: sd,
                endDate: ed,
                startTime: format(sd, "HH:mm"),
                endTime: format(ed, "HH:mm"),
                locationType: currentEvent.locationType,
                venue: currentEvent.venue || "",
                address: currentEvent.address || "",
                city: currentEvent.city,
                state: currentEvent.state || "",
                capacity: currentEvent.capacity,
                ticketType: currentEvent.ticketType,
                ticketPrice: currentEvent.ticketPrice || 0,
            })
            setCoverImage(currentEvent.coverImage || "")
            setFormReady(true)
        }
    }, [currentEvent, formReady, reset])

    const onSubmit = async (data) => {
        try {
            const startTimeParts = data.startTime.split(":")
            const endTimeParts = data.endTime.split(":")

            const startDateTime = new Date(data.startDate)
            startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]))

            const endDateTime = new Date(data.endDate)
            endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]))

            if (endDateTime <= startDateTime) {
                toast.error("End time must be after start time")
                return
            }

            await updateEvent({
                eventId,
                title: data.title,
                description: data.description,
                category: data.category,
                startDate: startDateTime.getTime(),
                endDate: endDateTime.getTime(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locationType: data.locationType,
                venue: data.venue || undefined,
                address: data.address || undefined,
                city: data.city,
                state: data.state || undefined,
                country: "India",
                capacity: data.capacity,
                ticketType: data.ticketType,
                ticketPrice: data.ticketPrice || undefined,
                coverImage: coverImage || undefined,
            })

            toast.success("Event updated! ✅")
            router.push("/my-events")
        } catch (error) {
            toast.error(error.message || "Failed to update")
        }
    }

    if (loadingEvents) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
            </div>
        )
    }

    if (!currentEvent) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center gap-4'>
                <h1 className='text-2xl font-bold'>Event not found</h1>
                <Button onClick={() => router.push("/my-events")}>
                    <ArrowLeft className='w-4 h-4 mr-2' /> Back to My Events
                </Button>
            </div>
        )
    }

    return (
        <div className='min-h-screen pb-16'>
            <div className='flex items-center gap-4 mb-8'>
                <Button variant="ghost" size="sm" onClick={() => router.push("/my-events")}>
                    <ArrowLeft className='w-4 h-4 mr-2' /> Back
                </Button>
                <h1 className='text-3xl font-bold'>Edit Event</h1>
            </div>

            <div className='max-w-4xl mx-auto grid md:grid-cols-[280px_1fr] gap-8'>
                {/* Cover Image */}
                <div>
                    <div
                        className='aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border border-dashed border-white/20 hover:border-purple-500/50 transition-colors'
                        onClick={() => setShowImagePicker(true)}
                    >
                        {coverImage ? (
                            <Image src={coverImage} alt="Cover" width={400} height={400} className='w-full h-full object-cover' />
                        ) : (
                            <span className='text-sm text-muted-foreground'>Click to change cover</span>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    {/* Details */}
                    <div className='space-y-4 border border-white/10 rounded-xl p-6 bg-white/5'>
                        <Label className="text-lg font-semibold">Event Details</Label>

                        <div className='space-y-2'>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register("title")} className="bg-white/10" />
                            {errors.title && <p className='text-red-400 text-xs'>{errors.title.message}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register("description")} className="bg-white/10 h-32" />
                            {errors.description && <p className='text-red-400 text-xs'>{errors.description.message}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label>Category</Label>
                            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                                <SelectTrigger className="bg-white/10"><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="music">Music</SelectItem>
                                    <SelectItem value="tech">Tech</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="sports">Sports</SelectItem>
                                    <SelectItem value="art">Art</SelectItem>
                                    <SelectItem value="food">Food & Drink</SelectItem>
                                    <SelectItem value="health">Health & Wellness</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className='space-y-4 border border-white/10 rounded-xl p-6 bg-white/5'>
                        <Label className="text-lg font-semibold">Date & Time</Label>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="bg-white/10 w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={startDate} onSelect={(d) => setValue("startDate", d)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className='space-y-2'>
                                <Label>Start Time</Label>
                                <Input type="time" {...register("startTime")} className="bg-white/10" />
                            </div>
                            <div className='space-y-2'>
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="bg-white/10 w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={endDate} onSelect={(d) => setValue("endDate", d)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className='space-y-2'>
                                <Label>End Time</Label>
                                <Input type="time" {...register("endTime")} className="bg-white/10" />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className='space-y-4 border border-white/10 rounded-xl p-6 bg-white/5'>
                        <Label className="text-lg font-semibold">Location</Label>
                        <Select value={watch("locationType")} onValueChange={(v) => setValue("locationType", v)}>
                            <SelectTrigger className="bg-white/10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="physical">Physical</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                        </Select>

                        {watch("locationType") === "physical" ? (
                            <>
                                <div className='space-y-2'>
                                    <Label>Venue</Label>
                                    <Input {...register("venue")} className="bg-white/10" />
                                </div>
                                <div className='space-y-2'>
                                    <Label>Address</Label>
                                    <Textarea {...register("address")} className="bg-white/10" />
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='space-y-2'>
                                        <Label>State</Label>
                                        <Select value={watch("state")} onValueChange={(v) => { setValue("state", v); setValue("city", "") }}>
                                            <SelectTrigger className="bg-white/10"><SelectValue placeholder="Select state" /></SelectTrigger>
                                            <SelectContent>
                                                {indianStates.map((s) => (
                                                    <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className='space-y-2'>
                                        <Label>City</Label>
                                        <Select value={watch("city")} onValueChange={(v) => setValue("city", v)} disabled={!selectedState}>
                                            <SelectTrigger className="bg-white/10"><SelectValue placeholder="Select city" /></SelectTrigger>
                                            <SelectContent>
                                                {cities.map((c) => (
                                                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className='space-y-2'>
                                <Label>Meeting Link</Label>
                                <Input {...register("venue")} className="bg-white/10" placeholder="https://zoom.us/..." />
                            </div>
                        )}
                    </div>

                    {/* Tickets */}
                    <div className='space-y-4 border border-white/10 rounded-xl p-6 bg-white/5'>
                        <Label className="text-lg font-semibold">Tickets & Capacity</Label>
                        <div className='grid grid-cols-3 gap-4'>
                            <div className='space-y-2'>
                                <Label>Capacity</Label>
                                <Input type="number" {...register("capacity", { valueAsNumber: true })} className="bg-white/10" />
                            </div>
                            <div className='space-y-2'>
                                <Label>Ticket Type</Label>
                                <Select value={watch("ticketType")} onValueChange={(v) => setValue("ticketType", v)}>
                                    <SelectTrigger className="bg-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {watch("ticketType") === "paid" && (
                                <div className='space-y-2'>
                                    <Label>Price (₹)</Label>
                                    <Input type="number" {...register("ticketPrice", { valueAsNumber: true })} className="bg-white/10" />
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </div>

            {showImagePicker && (
                <UnsplashImagePicker
                    isOpen={showImagePicker}
                    onClose={() => setShowImagePicker(false)}
                    onSelect={(url) => { setCoverImage(url); setShowImagePicker(false) }}
                />
            )}
        </div>
    )
}

export default EditEventPage
