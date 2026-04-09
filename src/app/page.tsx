import { Show } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/auth/AuthButtons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-xl border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="flex flex-col items-center gap-2 px-0 text-center">
          <CardTitle
            className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl"
            role="heading"
            aria-level={1}
          >
            FlashyCardy
          </CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Your personal flashcard platform
          </CardDescription>
        </CardHeader>

        <Show when="signed-out">
          <CardContent className="flex flex-col items-stretch gap-3 px-0 sm:flex-row sm:items-center sm:justify-center [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
            <AuthButtons />
          </CardContent>
        </Show>
      </Card>
    </main>
  );
}
