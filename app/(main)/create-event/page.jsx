"use client"

import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query';
import { useAuth } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { City, State } from 'country-state-city';
import UpgradeModal from '@/components/upgrade-modal';
import { UnsplashImagePicker } from '@/components/unsplashImage';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Check, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const timeRegex=/^([01]\d|2[0-3]):([0-5]\d)$/;

const eventSchema=z.object({
    title:z.string().min(5, "Title must be at least 5 characters long"),
    description:z.string().min(20, "Description must be at least 20 characters long"),
    category:z.string().min(1, "Please select a category"),
    startDate:z.date({required_error:"Start date is required"}),
    endDate:z.date({required_error:"End date is required"}),
    startTime:z.string({required_error:"Start time must be HH:MM"}),
    endTime:z.string({required_error:"End time must be HH:MM"}),

    locationType:z.enum(["physical","online"]).default("physical"),
    venue:z.string().url("Must be a valid URL").optional().or(z.literal("")),
    address:z.string().optional(),
    city:z.string().min(1, "City is required"),
    state:z.string().optional(),

    capacity:z.number().min(1, "Capacity must be at least 1"),
    ticketType:z.enum(["free","paid"]).default("free"),
    ticketPrice:z.number().optional(),
    coverImage:z.string().optional(),
    themeColor:z.string().default("#1e3a8a"),
})

const CreateEvent = () => {

    const router=useRouter()

    const [showImagePicker,setShowImagePicker]=useState(false)
    const [showUpgradeModal,setShowUpgradeModal]=useState(false)
    const [upgradeReason,setUpgradeReason]=useState("limit")
    const [aiPrompt,setAiPrompt]=useState("")
    const [aiLoading,setAiLoading]=useState(false)

    const {has}=useAuth()
    const hasPro=has?.({plan:"pro"})

    const {data:currentUser}=useConvexQuery(api.users.getCurrentUser)
    const {mutate: createEvent, isLoading}=useConvexMutation(api.event.createEvent)

    const {register,handleSubmit,watch,setValue,control,formState:{errors}}=useForm({
        resolver:zodResolver(eventSchema),
        defaultValues:{
            locationType:"physical",
            ticketType:"free",
            capacity:0,
            themeColor:"#1e3a8a",
            category:"",
            state:"",
            city:"",
            startDate:"",
            endDate:"",
            startTime:"",
            endTime:"",
             
        }
    })

    const themeColor=watch("themeColor")
    const ticketType=watch("ticketType")
    const selectedState=watch("state")
    const startDate=watch("startDate")
    const endDate=watch("endDate")
    const coverImage=watch("coverImage")

    const indianStates=State.getStatesOfCountry("IN");

    const cities=useMemo(()=>{
        if(!selectedState) return [];
        const st=indianStates.find((s)=>s.name===selectedState);
        if(!st) return [];
        return City.getCitiesOfState("IN", st.isoCode);
    },[selectedState, indianStates])

    const colorPresets=[
        "#1e3a8a",
        ...(!hasPro ? ["#4c1d95", "#065f46", "92400e", "#7f1d1d", "#831843"] : [])
    ]
    
    const handleAIGenerate = async () => {
        if(!aiPrompt.trim() || aiPrompt.trim().length < 3) {
            toast.error("Please describe your event in more detail")
            return
        }
        setAiLoading(true)
        try {
            const res = await fetch("/api/ai/generate-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Auto-fill form
            if(data.title) setValue("title", data.title)
            if(data.description) setValue("description", data.description)
            if(data.category) setValue("category", data.category)
            if(data.capacitySuggestion) setValue("capacity", data.capacitySuggestion)
            if(data.ticketType) setValue("ticketType", data.ticketType)
            if(data.ticketPriceSuggestion) setValue("ticketPrice", data.ticketPriceSuggestion)
            if(data.venueSuggestion) setValue("venue", data.venueSuggestion)
            if(data.locationType) setValue("locationType", data.locationType)

            toast.success("AI generated event details! Review and customize below.")
        } catch (error) {
            toast.error(error.message || "Failed to generate. Try again.")
        } finally {
            setAiLoading(false)
        }
    }

    const onSubmit = async (data) => {
        try {
            if (!coverImage) {
                toast.error("Please select a cover image");
                return;
            }

            const startTimeParts = data.startTime.split(":");
            const endTimeParts = data.endTime.split(":");

            const startDateTime = new Date(data.startDate);
            startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]));

            const endDateTime = new Date(data.endDate);
            endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]));

            if (endDateTime <= startDateTime) {
                toast.error("End time must be after start time");
                return;
            }

            const result = await createEvent({
                ...data,
                startDate: startDateTime.getTime(),
                endDate: endDateTime.getTime(),
                coverImage,
                themeColor,
                tags: data.tags || [],
                hasPro,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                country: "India",
            });

            toast.success("Event created! 🎉")
            router.push(`/events/${result.slug}`);
            
        } catch (error) {
            console.error(error);
            if(error.message?.includes("limit")){
                setUpgradeReason("limit");
                setShowUpgradeModal(true);
            } else {
                toast.error(error.message || "Failed to create event")
            }
        }
    };

  return (
    <div
        style={{backgroundColor:themeColor}}
        className='min-h-screen transition-colors duration-300 px-6 py-8 -mt-6 md:-mt-16 lg:rounded-md'
    >
        <div className='max-w-6xl mx-auto flex flex-col gap-5 md:flex-row justify-between mb-10'>
            <div>
                <h1 className='text-4xl font-bold'>Create Event</h1>
                {!hasPro && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Free: {currentUser?.freeEventsCreated || 0}/1 events created
                    </p>
                )}
            </div>
        </div>

        <div className='max-w-6xl mx-auto grid md:grid-cols-[320px_1fr] gap-10'>
            {/* Left : image + theme color */}
            <div className="space-y-6">
                <div 
                    className="aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border "
                    onClick={() => setShowImagePicker(true)}
                >
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt="Event cover"
                            width={500}
                            height={500}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="opacity-60 text-sm">
                            Click to add cover image
                        </span>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <Label className="block mb-2">Theme Color</Label>
                    <div className="flex gap-2 flex-wrap justify-center">
                        {colorPresets.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    themeColor === color 
                                    ? "ring-4 ring-offset-2 ring-white scale-110" 
                                    : "hover:scale-105 opacity-80 hover:opacity-100"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    if(color !== "#1e3a8a" && !hasPro){
                                       setUpgradeReason("color");
                                       setShowUpgradeModal(true);
                                       return; 
                                    }
                                    setValue("themeColor", color);
                                }}
                            >
                                {themeColor === color && <Check className="w-5 h-5 text-white" />}
                                {color !== "#1e3a8a" && !hasPro && <Lock className="w-4 h-4 text-white/70" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right : form */}
            <form onSubmit={handleSubmit(onSubmit)} >
                {/* AI Generation */}
                <div className="space-y-4 border border-gray-200/20 rounded-xl p-6 bg-white/5 mb-4">
                    <Label className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        AI Event Generator
                    </Label>
                    <p className="text-sm text-white/70">Describe your event in a few words and let AI fill in the details</p>
                    <div className="flex gap-2">
                        <Input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="bg-white flex-1"
                            placeholder='e.g. "tech meetup in Mumbai" or "outdoor yoga workshop"'
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAIGenerate())}
                        />
                        <Button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white gap-2 shrink-0"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {aiLoading ? "Generating..." : "Generate"}
                        </Button>
                    </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4 border border-gray-200/20 rounded-xl p-6 bg-white/5">
                        <Label className="text-xl font-semibold">Event Details</Label>
                        
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                {...register("title")}
                                className={`bg-white ${errors.title ? "border-red-500" : ""}`}
                                placeholder="Enter event title"
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...register("description")}
                                className={`bg-white h-32 ${errors.description ? "border-red-500" : ""}`}
                                placeholder="Describe your event..."
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                onValueChange={(value) => setValue("category", value)}
                            >
                                <SelectTrigger className={`bg-white ${errors.category ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
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
                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                        </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4 border border-gray-200/20 rounded-xl p-6 bg-white/5">
                        <Label className="text-xl font-semibold">Date & Time</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`bg-white w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"} ${errors.startDate ? "border-red-500" : ""}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(date) => setValue("startDate", date)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                 <Label htmlFor="startTime">Start Time</Label>
                                 <Input
                                    type="time"
                                    {...register("startTime")}
                                    className={`bg-white ${errors.startTime ? "border-red-500" : ""}`}
                                 />
                                 {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`bg-white w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"} ${errors.endDate ? "border-red-500" : ""}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={(date) => setValue("endDate", date)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                 <Label htmlFor="endTime">End Time</Label>
                                 <Input
                                    type="time"
                                    {...register("endTime")}
                                    className={`bg-white ${errors.endTime ? "border-red-500" : ""}`}
                                 />
                                 {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
                            </div>
                        </div>
                </div>

                {/* Location - Placeholder */}
                {/* Location */}
                <div className="space-y-4 border border-gray-200/20 rounded-xl p-6 bg-white/5">
                        <Label className="text-xl font-semibold">Location</Label>
                        
                        <div className="space-y-2">
                             <Label>Location Type</Label>
                             <Select 
                                defaultValue="physical"
                                onValueChange={(value) => setValue("locationType", value)}
                             >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select location type"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="physical">Physical Location</SelectItem>
                                    <SelectItem value="online">Online Event</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        
                        {watch("locationType") === "physical" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="venue">Venue Name</Label>
                                    <Input
                                        id="venue"
                                        {...register("venue")}
                                        className={`bg-white ${errors.venue ? "border-red-500" : ""}`}
                                        placeholder="e.g. Conference Center"
                                    />
                                    {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        {...register("address")}
                                        className={`bg-white ${errors.address ? "border-red-500" : ""}`}
                                        placeholder="Full address of the venue"
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Select
                                            onValueChange={(value) => {
                                                setValue("state", value);
                                                setValue("city", "");
                                            }}
                                        >
                                            <SelectTrigger className={`bg-white ${errors.state ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {indianStates.map((state) => (
                                                    <SelectItem key={state.isoCode} value={state.name}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Select
                                            onValueChange={(value) => setValue("city", value)}
                                            disabled={!selectedState}
                                        >
                                            <SelectTrigger className={`bg-white ${errors.city ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select city" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map((city) => (
                                                    <SelectItem key={city.name} value={city.name}>
                                                        {city.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="venue">Meeting Link</Label>
                                <Input
                                    id="venue"
                                    {...register("venue")}
                                    className="bg-white"
                                    placeholder="e.g. https://zoom.us/j/..."
                                />
                                {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue.message}</p>}
                            </div>
                        )}
                </div>

                {/* Tickets & Capacity */}
                <div className="space-y-4 border border-gray-200/20 rounded-xl p-6 bg-white/5">
                        <Label className="text-xl font-semibold">Tickets & Capacity</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="capacity">Total Capacity</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    {...register("capacity", { valueAsNumber: true })}
                                    className={`bg-white ${errors.capacity ? "border-red-500" : ""}`}
                                />
                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
                             </div>

                             <div className="space-y-2">
                                    <Label>Ticket Type</Label>
                                    <Select 
                                        defaultValue="free"
                                        onValueChange={(value) => setValue("ticketType", value)}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select ticket type"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                             </div>
                             
                             {watch("ticketType") === "paid" && (
                                <div className="space-y-2">
                                    <Label htmlFor="ticketPrice">Price (₹)</Label>
                                    <Input
                                        id="ticketPrice"
                                        type="number"
                                        {...register("ticketPrice", { valueAsNumber: true })}
                                        className={`bg-white ${errors.ticketPrice ? "border-red-500" : ""}`}
                                        placeholder="0.00"
                                    />
                                    {errors.ticketPrice && <p className="text-red-500 text-xs mt-1">{errors.ticketPrice.message}</p>}
                                </div>
                             )}
                        </div>
                </div>
                
                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02]" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Creating Event..." : "Create Event"}
                </Button>

            </form>
            
        </div>

        {/* unsplash picker */}
        {showImagePicker && <UnsplashImagePicker
            isOpen={showImagePicker}
            onClose={() => setShowImagePicker(false)}
            onSelect={(url) => {
                setValue("coverImage", url);
                setShowImagePicker(false);
            }}
        />}

        {/* Upgrade modal */}
        <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            trigger="header"
        />
    </div>
  )
}

export default CreateEvent
