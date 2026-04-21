"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  const { isSignedIn } = useAuth();

  return (
    <>
      {isSignedIn ? (
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
      ) : (
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="outline">Sign in</Button>
        </SignInButton>
      )}
      {!isSignedIn ? (
        <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
          <Button>Sign up</Button>
        </SignUpButton>
      ) : null}
    </>
  );
}

