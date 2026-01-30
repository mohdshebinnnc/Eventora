"use client"

import EventCard from '@/components/event-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/hooks/use-convex-query'
import { CATEGORIES } from '@/lib/data'
import { createLocationSlug } from '@/lib/location.utils'
import { format } from 'date-fns'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, Calendar, Loader2, MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useRef } from 'react'

const ExplorePage = () => {
    //fetch current user for location
    const {data:currentUser} = useConvexQuery(api.users.getCurrentUser)
    const plugin=useRef(Autoplay({delay:5000, stopOnInteraction:true}))
    const router=useRouter();

    const {data:featuredEvents,isLoading:loadingFeatured} = useConvexQuery(api.explore.getFeaturedEvents,{limit:3})

    const {data: localEvents, isLoading:loadingLocal}=useConvexQuery(api.explore.getEventsByLocation,
        {
            city:currentUser?.location?.city || "Gurugram",
            state:currentUser?.location?.state || "Haryana",
            limit:4
        }
    )

    const {data:popularEvents,isLoading:loadingPopular}=useConvexQuery(api.explore.getPopularEvents,{limit:6})

    const {data:categoryCounts}=useConvexQuery(api.explore.getCategoryCounts)

    const categoriesWithCounts=CATEGORIES.map((cat)=>{
        return {
            ...cat,
            count:categoryCounts?.[cat.id] || 0
        }
    })

    const handleEventClick=(slug)=>{
        router.push(`/events/${slug}`)
    }

    const handleCategoryClick=(categoryId)=>{
        router.push(`/explore/${categoryId}`)
    }

    const handleViewLocalEvents=()=>{
        const city =currentUser?.location?.city || "Gurugram"
        const state =currentUser?.location?.state || "Haryana"

        const slug=createLocationSlug(city,state)
        router.push(`/explore/${slug}`)
    }

    //Loading State
    const isLoading=loadingFeatured || loadingLocal || loadingPopular
    
    if(isLoading){
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <Loader2 className='w-8 h-8 animate-spin text-purple-500'/>
            </div>
        )
    }
    return (
        <>
            <div className='pb-12 text-center'>
                <h1 className='text-5xl md:text-6xl font-bold mb-6'>Discover Events</h1>
                <p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
                    Explore featured events, find what&apos;s happening locally, or browse events across India.
                </p>
            </div>

            {/* Featured Carousel */}

            {featuredEvents && featuredEvents.length > 0 && (
                <div className='mb-16'>
                    <Carousel 
                        className="w-full"
                        plugins={[plugin.current]}
                        onMouseEnter={plugin.current.stop}
                        onMouseLeave={plugin.current.reset}
                    >
                        <CarouselContent>
                            {featuredEvents.map((event) => (
                            <CarouselItem key={event._id}>
                               <div 
                                onClick={() => handleEventClick(event.slug)}
                                className='relative h-[400px] rounded-xl overflow-hidden cursor-pointer'
                                >
                                    {event.coverImage ? (
                                        <Image
                                            src={event.coverImage}
                                            alt={event.title}
                                            fill
                                            className='object-cover'
                                            priority
                                        />
                                    ):(
                                        <div 
                                            className='absolute inset-0 bg-gray-200'
                                            style={{
                                                background: event.themeColor
                                            }}
                                        />
                                    )}

                                    <div className='absolute inset-0 bg-linear-to-r from-black/50 to-black/50'/>

                                    <div className='relative h-full flex flex-col justify-end p-8 md:p-12'>
                                        <Badge className="w-fit mb-4" variant="secondary">
                                            {event.city}, {event.state || event.country}
                                        </Badge>
                                        <h2 className='text-3xl md:text-5xl font-bold mb-3 text-white'>{event.title}</h2>
                                        <p className='text-lg text-white/90 mb-4 max-w-2xl line-clamp-2'>{event.description}</p>
                                        
                                        <div className='flex items-center gap-4 text-white/80'>
                                            <div className='flex items-center gap-2'>
                                                <Calendar className='w-5 h-5'/>
                                                <span className='text-sm'>
                                                    {format(event.startDate, "PPP")}
                                                </span>
                                            </div>

                                            <div className='flex items-center gap-2'>
                                                <MapPin className='w-4 h-4'/>
                                                <span className='text-sm'>{event.city}, {event.state || event.country}</span>
                                            </div>

                                            <div className='flex items-center gap-2'>
                                                <Users className='w-4 h-4'/>
                                                <span className='text-sm'>{event.registrationCount} registered</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4"/>
                        <CarouselNext className="right-4 "/>
                    </Carousel>
                </div>
            ) }

            {/* Local Events */}
            {localEvents && localEvents.length > 0 && (
                <div className='mb-16'>
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <h2 className='text-3xl font-bold mb-1'>Events Near You</h2>
                            <p className='text-muted-foreground'>
                                Happening in {currentUser?.location?.city || "Your area"}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleViewLocalEvents}
                        >
                            View All <ArrowRight className='w-4 h-4'/>
                        </Button>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {localEvents.map((event) => (
                            <EventCard 
                                key={event._id} 
                                event={event}
                                variant="grid"
                                onClick={() => handleEventClick(event.slug)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Browse by Category */}
            <div className='mb-16'>
                <h2 className='text-3xl font-bold mb-6'>Browse by Category</h2>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    {categoriesWithCounts.map((category) => (
                        <Card
                        key={category.id}
                        className='py-2 group cursor-pointer hover:shadow-lg transition-all hover:border-purple-500/50'
                        onClick={() => handleCategoryClick(category.id)}
                        >
                            <CardContent className="px-3 sm:p-6 flex items-center gap-4">
                                <div className='text-3xl sm:text-4xl'>{category.icon}</div>
                                <div className='flex-1 min-w-0'>
                                    <h3 className='font-semibold mb-1 group-hover:text-purple-500/50 transition-colors'>{category.label}</h3>
                                    <p className='text-sm text-muted-foreground'>{category.count} Event{category.count !== 1 ? 's' : ''}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Popular Events Across Country */}
            {popularEvents && popularEvents.length > 0 && (
                <div className='mb-16'>
                    <div className='mb-6'>
                        <h2 className='text-3xl font-bold mb-1'>Popular Across Country</h2>
                        <p className='text-muted-foreground'>Trending events nationwide</p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {popularEvents.map((event) => (
                            <EventCard 
                                key={event._id} 
                                event={event}
                                variant="list"
                                onClick={() => handleEventClick(event.slug)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loadingFeatured && 
                !loadingLocal && 
                !loadingPopular &&
                (!featuredEvents || featuredEvents.length === 0) &&
                (!localEvents || localEvents.length === 0) &&
                (!popularEvents || popularEvents.length === 0) && (
                    <Card className="p-12 text-center">
                        <div className='max-w-md mx-auto space-y-4'>
                            <div className='text-6xl mb-4'>🎉</div>
                            <h2 className='text-2xl font-bold mb-1'>No Events yet</h2>
                            <p className='text-muted-foreground'>Be the first to create an event in your area!</p>
                            <Button asChild className="gap-2">
                                <a href='/create-event'>Create Event</a>
                            </Button>
                        </div>
                    </Card>
                )
            }
        </>
    )
}
export default ExplorePage