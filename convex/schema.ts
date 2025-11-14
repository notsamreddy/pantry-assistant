import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pantries: defineTable({
    name: v.string(),
    address: v.string(),
    phoneNumber: v.string(),
    inventory: v.string(), // Text field for common items
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.optional(
      v.array(
        v.object({
          day: v.string(),
          time: v.string(),
        })
      )
    ),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
});

