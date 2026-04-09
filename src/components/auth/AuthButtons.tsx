"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <Button variant="outline">Sign in</Button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
        <Button>Sign up</Button>
      </SignUpButton>
    </>
  );
}

