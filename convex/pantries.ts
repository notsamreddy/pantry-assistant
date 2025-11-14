import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to get all pantries
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("pantries")
      .withIndex("by_status")
      .order("desc")
      .collect();
  },
});

// Query to get a single pantry by ID
export const get = query({
  args: { id: v.id("pantries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new pantry
export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    phoneNumber: v.string(),
    inventory: v.string(),
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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("pantries", {
      name: args.name,
      address: args.address,
      phoneNumber: args.phoneNumber,
      inventory: args.inventory,
      email: args.email,
      website: args.website,
      hours: args.hours,
      status: args.status ?? "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to update a pantry
export const update = mutation({
  args: {
    id: v.id("pantries"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    inventory: v.optional(v.string()),
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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Mutation to delete a pantry
export const remove = mutation({
  args: { id: v.id("pantries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

