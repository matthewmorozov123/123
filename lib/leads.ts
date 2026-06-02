const intentTerms = [
  "book",
  "consultation",
  "demo",
  "call",
  "contact",
  "quote",
  "price",
  "pricing",
  "interested",
  "hire",
  "start",
  "setup",
  "implement",
  "sales"
];

const businessTypePatterns = [
  /\bi (?:own|run|have|operate|manage|am starting|started)\s+(?:an?\s+|the\s+|my\s+)?([^.!?]{2,80})/i,
  /\bmy business is\s+(?:an?\s+|the\s+)?([^.!?]{2,80})/i,
  /\bwe (?:own|run|have|operate|manage)\s+(?:an?\s+|the\s+|our\s+)?([^.!?]{2,80})/i,
  /\b(?:for|with)\s+(?:an?\s+|the\s+|my\s+|our\s+)?([^.!?]{2,80})\s+(?:business|company|practice|shop|salon|clinic|agency|store)\b/i
];

export function hasBuyingIntent(text: string) {
  const normalized = text.toLowerCase();
  return intentTerms.some((term) => normalized.includes(term));
}

function extractBusinessType(text: string) {
  for (const pattern of businessTypePatterns) {
    const match = text.match(pattern);
    const businessType = match?.[1]
      ?.replace(/\b(and|but|so|because|that|where|with|for)$/i, "")
      .trim();

    if (businessType && businessType.length >= 2) {
      return businessType;
    }
  }

  return null;
}

export function suggestedSolutionFor(text: string) {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("restaurant") ||
    normalized.includes("coffee shop") ||
    normalized.includes("cafe") ||
    normalized.includes("café") ||
    normalized.includes("bakery") ||
    normalized.includes("hospitality")
  ) {
    return "For restaurants, coffee shops, cafes, and hospitality businesses, Brightscale usually starts with an AI SMS agent for follow-up and an AI voice agent for missed calls, common questions, reservations, catering inquiries, or order-related support.";
  }

  if (normalized.includes("med spa") || normalized.includes("spa") || normalized.includes("clinic")) {
    return "For med spas, Brightscale usually pairs an AI voice agent with fast lead follow-up so inquiries turn into booked consultations.";
  }

  if (normalized.includes("real estate") || normalized.includes("realtor")) {
    return "For real estate teams, Brightscale can help qualify new leads and route serious prospects into the right follow-up flow.";
  }

  if (normalized.includes("ecommerce") || normalized.includes("e-commerce") || normalized.includes("shopify")) {
    return "For ecommerce, Brightscale can support social media automation, customer messaging, and retargeting workflows.";
  }

  const businessType = extractBusinessType(text);
  if (businessType) {
    return `For a ${businessType}, Brightscale should first identify the highest-volume customer touchpoints, then recommend the most practical automation fit: an AI voice agent for missed calls and appointment or inquiry handling, AI SMS and email agents for fast lead follow-up, AI social media agents for DMs and comments, Meta ads for lead generation, or a custom workflow when the business has repeated manual tasks.`;
  }

  return "When a visitor names a business type that is not specifically listed, Brightscale should ask one brief clarifying question about where the business loses time or leads, then suggest the closest fit among AI voice agents, AI SMS and email agents, AI social media agents, Meta ads, or custom AI automation.";
}
