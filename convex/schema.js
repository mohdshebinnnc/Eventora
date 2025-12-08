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
});