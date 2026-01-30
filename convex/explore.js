import { v } from "convex/values";
import { query } from "./_generated/server";

export const getFeaturedEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startDate"), now))
            .order("desc")
            .collect();

        const featured = events
            .sort((a, b) => b.registeredCount - a.registeredCount)
            .slice(0, args.limit ?? 3);

        return featured;
    }
})

//Get Events By Location
export const getEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        let events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startDate"), now))
            .collect();

        //filter city or state
        if (args.city) {
            events = events.filter((e) => e.city.toLowerCase() === args.city.toLowerCase())
        } else if (args.state) {
            events = events.filter((e) => e.state?.toLowerCase() === args.state.toLowerCase())
        }

        return events.slice(0, args.limit ?? 4);
    }

})

//Get popular events
export const getPopularEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startDate"), now))
            .collect();

        // Sort by registration count
        const popular = events
            .sort((a, b) => b.registeredCount - a.registeredCount)
            .slice(0, args.limit ?? 3);

        return popular;
    }
})

//Get events by category
export const getEventsByCategory = query({
    args: {
        category: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .filter((q) => q.gte(q.field("startDate"), now))
            .collect();

        return events.slice(0, args.limit ?? 12);
    }
})

export const getCategoryCounts = query({
    handler: async (ctx) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startDate"), now))
            .collect();

        // Count events by category
        const counts = {}
        events.forEach((event) => {
            counts[event.category] = (counts[event.category] || 0) + 1;
        })
        return counts;
    }
})

