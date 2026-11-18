import type messages from "../../messages/id.json";
import type { Locale } from "./config";

// `id.json` is the source of truth for message keys: a key missing there fails `tsc`.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
