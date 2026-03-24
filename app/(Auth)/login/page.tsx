"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/store/user";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const { setUser } = useUserStore();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setUser(data.user);



      // If plan param exists, redirect to Stripe checkout
      if (plan) {
        toast("Login successful", {
          description: "Redirecting to checkout...",
        });

        try {
          const checkoutRes = await fetch("/api/stripe/landing-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              package: plan,
              successUrl: "https://frontend-alpha-woad-96.vercel.app/payment-success?session_id={CHECKOUT_SESSION_ID}",
              cancelUrl: "https://frontend-alpha-woad-96.vercel.app/pricing",
            }),
          });

          const checkoutData = await checkoutRes.json();

          if (checkoutRes.ok && checkoutData?.data?.url) {
            window.location.href = checkoutData.data.url;
            return;
          }
        } catch (checkoutError) {
          console.error("Checkout session error:", checkoutError);
        }

        // Fallback to pricing if checkout fails
        toast("Could not create checkout session", {
          description: "Redirecting to pricing...",
        });
        router.push("/pricing");
      } else {
        toast("Login successful", {
          description: "Redirecting to dashboard...",
        });
        router.push("/");
      }
    } catch {
      toast("Login failed", {
        description: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className=" w-full h-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-light-text pb-3">Welcome Back</h1>
        <p className="text-lg md:text-xl font-normal text-light-text">Enter your email and password to login</p>
      </div>
      <div className="mt-8 w-full md:w-[85%] lg:w-[65%] xl:w-[45%]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[16px] w-full">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary text-base font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full px-5 py-4 h-[56px] text-lg"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary text-base font-medium">Password</FormLabel>
                  <FormControl>
                    <div className=" relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-5 py-4 h-[56px] text-lg"
                        placeholder="**************"
                        {...field}
                      />
                      <div
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-5 top-[18px] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="text-light-text-secondary" size={20} />
                        ) : (
                          <Eye className="text-light-text-secondary" size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full -mt-2">
              <Button
                variant={"ghost"}
                type="button"
                className="p-0 m-0 h-fit text-primary hover:bg-transparent"
                onClick={() => router.push("password-reset")}
              >
                Forgot Password
              </Button>
            </div>
            <Button className="bg-primary text-white w-full px-5 py-3 h-[56px] text-base font-medium" type="submit">
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Logging In
                </>
              ) : (
                "Login with Email"
              )}
            </Button>

            <div className="flex items-center mt-2 mb-8 justify-center">
              <div className="w-20 h-px bg-gray-300" />
              <span className="mx-4 text-base text-light-text-secondary font-medium">OR CONTINUE WITH</span>
              <div className="w-20 h-px bg-gray-300" />
            </div>
          </form>
        </Form>
        <div className="flex flex-row gap-[24px] justify-between mb-4">
          <Button
            type="button"
            variant="outline"
            className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
          >
            <Image src="/googleico.svg" alt="google" width={24} height={24} />
            Google
          </Button>
          <Button
            onClick={() => router.push(plan ? `/signup?plan=${plan}` : "/signup")}
            variant="outline"
            className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
          >
            Sign Up
          </Button>
        </div>

        <p className="font-normal text-base text-light-text-secondary text-center">
          By clicking continue, you agree to our...
          {/* <br /> Terms of Service and Privacy Policy. */}
        </p>
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

//3