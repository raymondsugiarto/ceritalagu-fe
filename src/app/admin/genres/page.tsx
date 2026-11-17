import { redirect } from "next/navigation";

// Genres moved into Master Data together with occasions and recipient types.
export default function GenresPage() {
  redirect("/admin/master-data?kind=genre");
}
