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
  section: "Operasional" | "Konten & AI" | "Bisnis";
}

/** Sidebar items. Add one entry per new feature page. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: HomeIcon, section: "Operasional" },
  { title: "Job Lagu", href: "/admin/jobs", icon: ListMusicIcon, section: "Operasional" },
  { title: "Lagu", href: "/admin/songs", icon: Disc3Icon, section: "Operasional" },
  { title: "Provider AI", href: "/admin/providers", icon: BotIcon, section: "Konten & AI" },
  {
    title: "Template Prompt",
    href: "/admin/prompts",
    icon: FileTextIcon,
    section: "Konten & AI",
  },
  {
    title: "Sampel Landing",
    href: "/admin/samples",
    icon: SparklesIcon,
    section: "Konten & AI",
  },
  { title: "Data Master", href: "/admin/master-data", icon: MusicIcon, section: "Konten & AI" },
  { title: "Harga", href: "/admin/pricing", icon: TagIcon, section: "Bisnis" },
  { title: "Voucher", href: "/admin/vouchers", icon: TicketPercentIcon, section: "Bisnis" },
  { title: "Pengguna", href: "/admin/users", icon: UsersIcon, section: "Bisnis" },
];

export const NAV_SECTIONS = ["Operasional", "Konten & AI", "Bisnis"] as const;
