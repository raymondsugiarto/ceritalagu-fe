import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/contact/dto.go.

/** Topic codes, in display order. Labels live in `contact.topics.<code>`. */
export const CONTACT_TOPIC_VALUES = [
  "general",
  "order",
  "refund",
  "song",
  "partner",
  "other",
] as const;

export type ContactTopic = (typeof CONTACT_TOPIC_VALUES)[number];

export interface SendContactInput {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  /** Honeypot: always empty for real visitors. */
  website?: string;
}

export const contactApi = {
  async send(input: SendContactInput): Promise<{ sent: boolean }> {
    return unwrap(await api.post<{ sent: boolean }>("/contact", input));
  },
};
