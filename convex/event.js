import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const createEvent=mutation({
    args:{
        title:v.string(),
        description:v.string(),
        category:v.string(),
        tags: v.array(v.string()),
         
        startDate: v.number(),
        endDate: v.number(),
        timezone: v.string(),

        locationType:v.union(v.literal("physical"),v.literal("online")),
        venue:v.optional(v.string()),
        address:v.optional(v.string()),
        city:v.string(),
        state:v.optional(v.string()),
        country:v.string(),
        
        capacity:v.number(),
        ticketType:v.union(v.literal("free"),v.literal("paid")),
        ticketPrice:v.optional(v.number()),
        coverImage:v.optional(v.string()),
        themeColor:v.optional(v.string()),
        hasPro: v.optional(v.boolean()),
    },
    handler:async(ctx, args)=>{
        try {
            const user=await ctx.runQuery(internal.users.getCurrentUser)

            if(!args.hasPro && user.freeEventsCreated >= 1){
                throw new Error(
                    "Free event limit reached. Please upgrade to pro to create more events."
                )
            }

            const defaultColor="#1e3a8a"
            if(!args.hasPro && args.themeColor && args.themeColor !== defaultColor){
                throw new Error("Custom theme colors are a pro feature. Please upgrade to Pro. ")
            }

            const themeColor=args.hasPro ? args.themeColor : defaultColor

            //generate slug from. title
            const slug=args.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g,"-")
                .replace(/(^-|-$)/g,"")

            const eventSlug = `${slug}-${Date.now()}`

            const eventId=await ctx.db.insert("events",{
                ...args,
                themeColor,
                slug: eventSlug,
                organizerId:user._id,
                organizerName:user.name,
                registrationCount:0,
                createdAt:Date.now(),
                updatedAt:Date.now(), 
            })

            await ctx.db.patch(user._id,{
                freeEventsCreated:user.freeEventsCreated + 1,
            })

            return { eventId, slug: eventSlug }
        } catch (error) {
            throw new Error(`Failed to create event: ${error.message}`)
        }
    }
})

// get event by slug
export const getEventBySlug=query({
    args:{
        slug:v.string(),
    },
    handler:async(ctx, args)=>{
        const event=await ctx.db
            .query("events")
            .withIndex("by_slug", (q)=>q.eq("slug",args.slug))
            .unique()
        return event
    }
})

// get events by organizer
export const getMyEvents=query({
    handler:async(ctx)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        const events=await ctx.db
            .query("events")
            .withIndex("by_organizer", (q)=>q.eq("organizerId",user._id))
            .order("desc")
            .collect()
        return events
    }
})

// Delete Event
export const deleteEvent=mutation({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        const event=await ctx.db.get(args.eventId)

        if(!event){
            throw new Error("Event not found")
        }
        // check if user is the organizer
        if(event.organizerId !== user._id){
            throw new Error("You are not authorized to delete this event")
        }

        // Delete all registrations for this event
        const registrations=await ctx.db
            .query("registrations")
            .withIndex("by_event", (q)=>q.eq("eventId",args.eventId))
            .collect()
        
        for(const registration of registrations){
            await ctx.db.delete(registration._id)
        }

        await ctx.db.delete(args.eventId)

        if(user.freeEventsCreated > 0){
            await ctx.db.patch(user._id,{
                freeEventsCreated:user.freeEventsCreated - 1,
            })
        }
        return {success:true}
    }
})

// Update Event
export const updateEvent=mutation({
    args:{
        eventId:v.id("events"),
        title:v.optional(v.string()),
        description:v.optional(v.string()),
        category:v.optional(v.string()),
        tags:v.optional(v.array(v.string())),
        startDate:v.optional(v.number()),
        endDate:v.optional(v.number()),
        timezone:v.optional(v.string()),
        locationType:v.optional(v.union(v.literal("physical"),v.literal("online"))),
        venue:v.optional(v.string()),
        address:v.optional(v.string()),
        city:v.optional(v.string()),
        state:v.optional(v.string()),
        country:v.optional(v.string()),
        capacity:v.optional(v.number()),
        ticketType:v.optional(v.union(v.literal("free"),v.literal("paid"))),
        ticketPrice:v.optional(v.number()),
        coverImage:v.optional(v.string()),
        themeColor:v.optional(v.string()),
    },
    handler:async(ctx, args)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        const event=await ctx.db.get(args.eventId)
        if(!event) throw new Error("Event not found")
        if(event.organizerId !== user._id) throw new Error("Not authorized")
        
        const {eventId, ...updates}=args
        // Remove undefined values
        const cleanUpdates=Object.fromEntries(
            Object.entries(updates).filter(([_,v])=>v !== undefined)
        )
        
        await ctx.db.patch(args.eventId,{
            ...cleanUpdates,
            updatedAt:Date.now(),
        })
        return {success:true}
    }
})

// Register for event
export const registerForEvent=mutation({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        const event=await ctx.db.get(args.eventId)
        if(!event) throw new Error("Event not found")

        // Check capacity
        if(event.registrationCount >= event.capacity){
            throw new Error("Event is full")
        }

        // Check if already registered
        const existing=await ctx.db
            .query("registrations")
            .withIndex("by_event_user",(q)=>q.eq("eventId",args.eventId).eq("userId",user._id))
            .unique()
        if(existing && existing.status === "confirmed"){
            throw new Error("Already registered for this event")
        }

        // Generate unique QR code
        const qrCode=`EVT-${args.eventId}-USR-${user._id}-${Date.now()}`

        const registrationId=await ctx.db.insert("registrations",{
            eventId:args.eventId,
            userId:user._id,
            attendeeName:user.name,
            attendeeEmail:user.email,
            qrCode,
            checkedIn:false,
            status:"confirmed",
            registeredAt:Date.now(),
        })

        // Increment registration count
        await ctx.db.patch(args.eventId,{
            registrationCount:event.registrationCount + 1,
            updatedAt:Date.now(),
        })

        return {registrationId, qrCode}
    }
})

// Cancel registration
export const cancelRegistration=mutation({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        
        const registration=await ctx.db
            .query("registrations")
            .withIndex("by_event_user",(q)=>q.eq("eventId",args.eventId).eq("userId",user._id))
            .unique()
        
        if(!registration) throw new Error("Registration not found")
        
        await ctx.db.patch(registration._id,{
            status:"cancelled",
        })
        
        const event=await ctx.db.get(args.eventId)
        if(event && event.registrationCount > 0){
            await ctx.db.patch(args.eventId,{
                registrationCount:event.registrationCount - 1,
                updatedAt:Date.now(),
            })
        }
        return {success:true}
    }
})

// Check-in attendee via QR
export const checkInAttendee=mutation({
    args:{
        qrCode:v.string(),
    },
    handler:async(ctx, args)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)

        const registration=await ctx.db
            .query("registrations")
            .withIndex("by_qr_code",(q)=>q.eq("qrCode",args.qrCode))
            .unique()
        
        if(!registration) throw new Error("Invalid QR code")
        if(registration.status === "cancelled") throw new Error("Registration was cancelled")
        if(registration.checkedIn) throw new Error("Already checked in")
        
        // Verify the user is the organizer of this event
        const event=await ctx.db.get(registration.eventId)
        if(!event) throw new Error("Event not found")
        if(event.organizerId !== user._id) throw new Error("Only the organizer can check in attendees")
        
        await ctx.db.patch(registration._id,{
            checkedIn:true,
            checkedInAt:Date.now(),
        })
        
        return {
            success:true,
            attendeeName:registration.attendeeName,
            attendeeEmail:registration.attendeeEmail,
        }
    }
})

// Get event registrations (for organizer)
export const getEventRegistrations=query({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const registrations=await ctx.db
            .query("registrations")
            .withIndex("by_event",(q)=>q.eq("eventId",args.eventId))
            .collect()
        return registrations
    }
})

// Get my tickets (registrations for current user)
export const getMyTickets=query({
    handler:async(ctx)=>{
        const user=await ctx.runQuery(internal.users.getCurrentUser)
        if(!user) return []

        const registrations=await ctx.db
            .query("registrations")
            .withIndex("by_user",(q)=>q.eq("userId",user._id))
            .collect()
        
        // Attach event details
        const tickets=await Promise.all(
            registrations.map(async(reg)=>{
                const event=await ctx.db.get(reg.eventId)
                return {...reg, event}
            })
        )
        return tickets.filter((t)=>t.event !== null)
    }
})

// Get event stats for organizer dashboard
export const getEventStats=query({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const event=await ctx.db.get(args.eventId)
        if(!event) return null

        const registrations=await ctx.db
            .query("registrations")
            .withIndex("by_event",(q)=>q.eq("eventId",args.eventId))
            .collect()
        
        const confirmed=registrations.filter((r)=>r.status === "confirmed")
        const checkedIn=confirmed.filter((r)=>r.checkedIn)
        const cancelled=registrations.filter((r)=>r.status === "cancelled")

        return {
            totalRegistrations:confirmed.length,
            checkedInCount:checkedIn.length,
            cancelledCount:cancelled.length,
            checkInRate:confirmed.length > 0 ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
            capacityUsed:Math.round((confirmed.length / event.capacity) * 100),
            revenue:event.ticketType === "paid" ? confirmed.length * (event.ticketPrice || 0) : 0,
        }
    }
})

// Check user registration status for an event
export const getRegistrationStatus=query({
    args:{
        eventId:v.id("events"),
    },
    handler:async(ctx, args)=>{
        const identity=await ctx.auth.getUserIdentity()
        if(!identity) return null

        const user=await ctx.db
            .query("users")
            .withIndex("by_token",(q)=>q.eq("tokenIdentifier",identity.tokenIdentifier))
            .unique()
        if(!user) return null

        const registration=await ctx.db
            .query("registrations")
            .withIndex("by_event_user",(q)=>q.eq("eventId",args.eventId).eq("userId",user._id))
            .unique()
        
        return registration
    }
})