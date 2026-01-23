"use client"

import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/hooks/use-convex-query'
import React from 'react'

const ExplorePage = () => {
    //fetch current user for location
    const {data:currentUser} = useConvexQuery(api.users.getCurrentUser)

    const {data:featuredEvents,isLoading:loadingFeatured} = useConvexQuery(api.explore.getFeaturedEvents,{limit:3})

    const {data: localEvents, isLoading:loadingLocal}=useConvexQuery(api.explore.getEventsByLocation,
        {
            city:currentUser?.location?.city || "Gurugram",
            state:currentUser?.location?.state || "Haryana",
            limit:4
        })

        const {data:popularEvents,isLoading:loadingPopular}=useConvexQuery(api.explore.getPopularEvents,{limit:6})

        const {data:categoryCounts}=useConvexQuery(api.explore.getCategoryCounts)
        
    return (
        <div>ExplorePage</div>
    )
}

export default ExplorePage