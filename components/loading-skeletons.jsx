import React from 'react'
import { Skeleton } from './ui/skeleton'
import { Card, CardContent } from './ui/card'

export const EventCardSkeleton = ({ variant = "grid" }) => {
    if (variant === "list") {
        return (
            <Card className="py-0">
                <CardContent className="p-3 flex gap-3">
                    <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden pt-0">
            <Skeleton className="h-48 w-full rounded-none" />
            <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-3/4" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </CardContent>
        </Card>
    )
}

export const CarouselSkeleton = () => (
    <div className="mb-16">
        <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
)

export const CategorySkeleton = () => (
    <Card className="py-2">
        <CardContent className="px-3 sm:p-6 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </CardContent>
    </Card>
)

export const ExploreSkeleton = () => (
    <>
        <div className="pb-12 text-center">
            <Skeleton className="h-12 w-72 mx-auto mb-6" />
            <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        <CarouselSkeleton />

        <div className="mb-16">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
        </div>

        <div className="mb-16">
            <Skeleton className="h-8 w-56 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <CategorySkeleton key={i} />)}
            </div>
        </div>

        <div className="mb-16">
            <Skeleton className="h-8 w-60 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} variant="list" />)}
            </div>
        </div>
    </>
)

export default EventCardSkeleton
