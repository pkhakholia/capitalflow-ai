import { redirect } from "next/navigation";

export default function MessagesPage() {
  // Redirect to dashboard since messages feature is not implemented yet
  redirect("/dashboard");
}
