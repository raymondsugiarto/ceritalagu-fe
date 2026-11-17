import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "./login-view";

export const metadata: Metadata = { title: "Masuk Admin" };

export default function AdminLoginPage() {
  // useSearchParams (the ?next= redirect) needs a Suspense boundary.
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
