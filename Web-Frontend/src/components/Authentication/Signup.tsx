"use client";
import { Input } from "@/src/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/src/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormError from "@/src/components/Authentication/forms/form-error";
import { register } from "@/src/lib/actions/register";
import { startTransition } from "react";
import { RegisterSchema } from "@/src/schemas/registerSchema";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/src/lib/actions/login";
import { motion } from "motion/react";
import { Separator } from "@/src/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const router = useRouter();
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof RegisterSchema>) {
    console.log("Submitting form with values:", values);
    setIsLoading(true);
    setError("");
    startTransition(async () => {
      const registerData = await register(values);
      if (registerData.success) {
        await login({
          email: values.email,
          password: values.password,
        });
        router.refresh();
        router.push("/dashboard");
      } else {
        setError(registerData.error);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className=" flex items-center justify-center bg-card "
    >
      <div className="max-w-md w-full p-8 rounded-lg ">
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder=""
                      autoComplete="name"
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder=""
                      autoComplete="email"
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder=""
                      autoComplete="new-password"
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder=""
                      autoComplete="username"
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <FormError message={error} />
              <Button
                type="submit"
                className="w-full flex items-center justify-center"
                disabled={isLoading}
                onClick={() => {
                  onSubmit(form.getValues());
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing Up...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </div>
          </form>
        </Form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="mt-4"></div>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
