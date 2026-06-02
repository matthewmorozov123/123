import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000)
});

export const chatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(chatMessageSchema).min(1).max(16),
  pageUrl: z.string().url().optional()
});

export const leadSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  businessType: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  source: z.string().trim().max(120).optional(),
  lastMessage: z.string().trim().max(2000).optional()
});

export const embedRequestSchema = z.object({
  urls: z.array(z.string().url()).optional()
});
