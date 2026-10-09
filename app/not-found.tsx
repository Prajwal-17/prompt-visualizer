import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="font-mono text-xs text-muted-foreground">
        404 / NOT IN THIS COLLECTION
      </p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight">
        This prompt isn’t here.
      </h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        The capture may have moved, or the link may refer to a document outside
        this snapshot.
      </p>
      <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Back to the collection
      </Link>
    </div>
  );
}
