import type { Metadata } from "next";
import { Comparison } from "@/components/comparison";

export const metadata: Metadata = {
  title: "Compare captures",
  description:
    "Compare the size, structure, and original instructions of two captured AI configurations.",
};
export default function ComparePage() {
  return <Comparison />;
}
