import { PricingTable } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Pricing | FlashyCardy",
  description: "Choose a plan and unlock the features that fit how you study.",
};

export default function PricingPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Card className="border-0 bg-transparent shadow-none ring-0">
          <CardHeader className="gap-1 px-0 text-center sm:text-left">
            <CardTitle
              className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
              role="heading"
              aria-level={1}
            >
              Pricing
            </CardTitle>
            <CardDescription className="text-base">
              Compare plans and subscribe securely through Clerk Billing. Plans
              and prices are configured in your Clerk Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pt-2">
            <PricingTable
              for="user"
              newSubscriptionRedirectUrl="/dashboard"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
