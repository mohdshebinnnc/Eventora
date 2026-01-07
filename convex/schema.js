import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),

        hasCompletedOnboarding: v.boolean(),

        location: v.optional(
            v.object({
                city: v.string(),
                state: v.optional(v.string()),
                country: v.string(),

            })
        ),
        interests: v.optional(v.array(v.string())), // Min 3 Categories

        freeEventsCreated: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),

    }).index("by_token", ["tokenIdentifier"]),

    events: defineTable({
         title: v.string(),
         description: v.string(),
         slug: v.string(),
         
        //  Organizer
        organizerId: v.id("users"),
        organizerName: v.string(),
        
        // Event Details
        category: v.string(),
        tags: v.array(v.string()),
        
        //Date & Time
        startDate: v.number(),
        endDate: v.number(),
        timezone: v.string(),
        // Location
        locationType:v.union(v.literal("physical"),v.literal("online")),
        venue:v.optional(v.string()),
        address:v.optional(v.string()),
        city:v.string(),
        state:v.optional(v.string()),
        
        // capacity and ticketing
        capacity:v.number(),
        ticketType:v.union(v.literal("free"),v.literal("paid")),
        ticketPrice:v.optional(v.number()), // Paid at event offline
        registrationCount: v.number(),

        // Customization
        coverImage:v.optional(v.string()),
        themeColor:v.optional(v.string()),

        createdAt:v.number(),
        updatedAt:v.number(),
    })
        .index("by_organizer", ["organizerId"])
        .index("by_category", ["category"])
        .index("by_start_date", ["startDate"])
        .index("by_slug", ["slug"])
        .searchIndex("search_title", {searchField:"title"}),


    registrations: defineTable({
        eventId:v.id("events"),
        userId:v.id("users"),
        
        // attendee info
        attendeeName:v.string(),
        attendeeEmail:v.string(),
        
        // QR code
        qrCode:v.string(), // unique ID for QR

        // Check-In
        checkedIn:v.boolean(),
        checkedInAt:v.optional(v.number()),
        
        // Status
        status:v.union(v.literal("confirmed"),v.literal("cancelled")),

        registeredAt:v.number(),
    })
        .index("by_event", ["eventId"])
        .index("by_user", ["userId"])
        .index("by_event_user", ["eventId","userId"])
        .index("by_qr_code", ["qrCode"])
});