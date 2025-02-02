"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mt-2">
      <TriangleAlertIcon className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
