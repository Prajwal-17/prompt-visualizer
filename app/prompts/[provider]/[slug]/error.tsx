"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-medium tracking-tight">
        This capture couldn’t be opened.
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Try loading it again. The original collection is also available through
        the GitHub link in the navigation.
      </p>
      <Button variant="outline" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
