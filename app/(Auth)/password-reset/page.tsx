"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
// import Image from "next/image";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emailFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const resetFormSchema = z
  .object({
    resetCode: z.string().length(6, "Reset code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function PasswordResetPage() {
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState("");

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onEmailSubmit = async (data: z.infer<typeof emailFormSchema>) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset code");
      }

      setEmail(data.email);
      setShowResetForm(true);
      toast.success("Reset code sent", {
        description: "Please check your email for the reset code",
      });
    } catch (error) {
      // console.error(error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to send reset code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: z.infer<typeof resetFormSchema>) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/new-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          resetCode: data.resetCode,
          newPassword: data.newPassword,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast.success("Success", {
        description: "Password reset successful. Please sign in with your new password.",
      });
      router.push("/login");
    } catch (_error) {
      // console.error(error);
      toast.error("Error", {
        description: "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className=" w-full h-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-light-text pb-3">
          {showResetForm ? "Reset Password" : "Retrieve Password"}
        </h1>
        <p className="text-lg md:text-xl font-normal text-light-text">
          {showResetForm ? "Enter the reset code and new password" : ""}
        </p>
      </div>
      <div className="mt-8 w-full md:w-[85%] lg:w-[65%] xl:w-[45%] relative">
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className={cn(
              "space-y-[16px] w-full transition-all duration-300",
              showResetForm && "invisible opacity-0 absolute top-0 left-0"
            )}
          >
            <FormField
              control={emailForm.control}
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
            <Button className="bg-primary text-white w-full px-5 py-3 h-[56px] text-base font-medium" type="submit">
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Sending reset code...
                </>
              ) : (
                "Reset"
              )}
            </Button>

            {/* <div className="flex items-center mt-2 mb-8 justify-center">
              <div className="w-20 h-px bg-gray-300" />
              <span className="mx-4 text-base text-light-text-secondary font-medium">OR</span>
              <div className="w-20 h-px bg-gray-300" />
            </div> */}

            <p className="font-normal text-base text-light-text-secondary text-center">
              Already have an account?{" "}
              <span
                className="text-primary font-medium cursor-pointer hover:underline"
                onClick={() => router.push("/login")}
              >
                Sign In
              </span>
            </p>
          </form>
        </Form>

        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className={cn(
              "space-y-[16px] w-full transition-all duration-300",
              !showResetForm && "invisible opacity-0 absolute top-0 left-0"
            )}
          >
            <FormField
              control={resetForm.control}
              name="resetCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary text-base font-medium">Reset Code</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full px-5 py-4 h-[56px] text-lg"
                      placeholder="Enter 6-digit code"
                      {...field}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary text-base font-medium">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-5 py-4 h-[56px] text-lg"
                        placeholder="Enter new password"
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

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary text-base font-medium">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full px-5 py-4 h-[56px] text-lg"
                        placeholder="Confirm new password"
                        {...field}
                      />
                      <div
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-5 top-[18px] cursor-pointer"
                      >
                        {showConfirmPassword ? (
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

            <Button className="bg-primary text-white w-full px-5 py-3 h-[56px] text-base font-medium" type="submit">
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <p className="font-normal text-base text-light-text-secondary text-center pt-4">
              Didn&apos;t receive the code?{" "}
              <span
                className="text-primary font-medium cursor-pointer hover:underline"
                onClick={() => {
                  setShowResetForm(false);
                  resetForm.reset();
                }}
              >
                Try again
              </span>
            </p>
          </form>
        </Form>

        {/* <div className="flex flex-row gap-[24px] justify-between mb-4 mt-8">
          <Button
            type="button"
            variant="outline"
            className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
          >
            <Image src="/googleico.svg" alt="google" width={24} height={24} />
            Google
          </Button>
          <Button
            onClick={() => router.push("/signup")}
            variant="outline"
            className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
          >
            Sign Up
          </Button>
        </div> */}
      </div>
    </section>
  );
}
