export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type LeadPayload = {
  sessionId: string;
  name: string;
  email: string;
  businessType: string;
  phone?: string;
  source?: string;
  lastMessage?: string;
};

export type RetrievedDocument = {
  id: string;
  content: string;
  url: string;
  title: string;
  similarity: number;
};
