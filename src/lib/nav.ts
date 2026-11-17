import {
  BotIcon,
  Disc3Icon,
  FileTextIcon,
  HomeIcon,
  ListMusicIcon,
  MusicIcon,
  SparklesIcon,
  TagIcon,
  TicketPercentIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Sidebar items. Add one entry per new feature page. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/admin", icon: HomeIcon },
  { title: "Song Jobs", href: "/admin/jobs", icon: ListMusicIcon },
  { title: "Songs", href: "/admin/songs", icon: Disc3Icon },
  { title: "AI Providers", href: "/admin/providers", icon: BotIcon },
  { title: "Prompt Templates", href: "/admin/prompts", icon: FileTextIcon },
  { title: "Sampel Landing", href: "/admin/samples", icon: SparklesIcon },
  { title: "Master Data", href: "/admin/master-data", icon: MusicIcon },
  { title: "Harga", href: "/admin/pricing", icon: TagIcon },
  { title: "Voucher", href: "/admin/vouchers", icon: TicketPercentIcon },
  { title: "Users", href: "/admin/users", icon: UsersIcon },
];
