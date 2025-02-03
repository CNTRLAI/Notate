"use client";

import { CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

interface FormSuccessProps {
  message?: string;
}

export default function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <Alert variant={"default"} className="mt-2">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
