"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import Image from "next/image";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { useUserStore } from "@/store/user";

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

const userDetailsSchema = z.object({
  fullname: z.string().min(2, { message: "Fullname must be at least 2 characters long." }),
  phoneNumber: z.string().optional(),
  brokerageName: z.string().optional(),
  brokeragePhoneNumber: z.string().optional(),
  website: z.string().optional(),
});

const realEstateAdjectives = [
  "Luxury",
  "Premium",
  "Elite",
  "Prime",
  "Modern",
  "Classic",
  "Urban",
  "Smart",
  "Global",
  "Royal",
  "Grand",
  "Select",
  "Metro",
  "Dynamic",
  "Trusted",
  "Expert",
  "Pro",
  "Master",
  "Leading",
  "Top",
];

const locationTerms = [
  "NYC",
  "BK",
  "QNS",
  "BX",
  "SI", // New York areas
  "East",
  "West",
  "North",
  "South",
  "Urban",
  "Metro",
  "City",
];

function generateRealEstateUsername(): string {
  // Get current timestamp in milliseconds and convert to base 36
  const timestamp = Date.now().toString(36);

  // Generate a random UUID segment (4 characters)
  const uniqueId = Math.random().toString(36).substring(2, 6);

  const randomAdjective = realEstateAdjectives[Math.floor(Math.random() * realEstateAdjectives.length)].slice(0, 3);

  const randomLocation = locationTerms[Math.floor(Math.random() * locationTerms.length)].slice(0, 3);

  // Create formats that include unique identifiers
  const formats = [
    `${randomAdjective}${timestamp.slice(-4)}${uniqueId.slice(0, 2)}`,
    `${randomLocation}${uniqueId}`,
    `Agt${randomLocation}${timestamp.slice(-3)}`,
    `${randomLocation}${timestamp.slice(-3)}Agt`,
  ];

  return formats[Math.floor(Math.random() * formats.length)];
}

function SignupForm() {
  const [step, setStep] = useState(1); // 1: signup, 2: otp, 3: user details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const { setUser } = useUserStore();

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const userDetailsForm = useForm<z.infer<typeof userDetailsSchema>>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      fullname: "",
      brokerageName: "",
      website: "",
    },
  });

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, username: generateRealEstateUsername() }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Store email and password for OTP verification
      setEmail(values.email);
      setPassword(values.password);
      setUserId(data.user?.id || "");

      toast("Account created!", {
        description: "Please check your email for verification code.",
      });

      setStep(2); // Move to OTP verification
    } catch (error) {
      toast("Signup failed", {
        description: error instanceof Error ? error.message : "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onOtpSubmit() {
    if (otp.length !== 6) {
      toast("Invalid OTP", {
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: otp, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      // Store user ID for the update step
      setUserId(data.user?.id || userId);

      toast("Email verified!", {
        description: "Please complete your profile.",
      });

      setStep(3); // Move to user details
    } catch (error) {
      toast("Verification failed", {
        description: error instanceof Error ? error.message : "Invalid verification code",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onUserDetailsSubmit(values: z.infer<typeof userDetailsSchema>) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...values }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      // Store user data in Zustand store
      if (data.data) {
        setUser(data.data);
      }



      // If plan param exists, redirect to Stripe checkout
      if (plan) {
        toast("Welcome to closR!", {
          description: "Redirecting to checkout...",
        });

        try {
          // Capture all query params to pass them through
          const queryParams: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });

          const checkoutRes = await fetch("/api/stripe/landing-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              package: plan, // Use the plan from URL or default to "pro"
              successUrl: "https://frontend-alpha-woad-96.vercel.app/payment-success?session_id={CHECKOUT_SESSION_ID}",
              cancelUrl: "https://frontend-alpha-woad-96.vercel.app/pricing",
              metadata: queryParams, // Pass all params as metadata
              userId: userId,
              customerId: data.data?.stripe_customer_id,
              email: data.data?.email
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
        toast("Welcome to closR!", {
          description: "Choose your subscription plan...",
        });
        router.push("/pricing");
      }
    } catch (error) {
      toast("Update failed", {
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full h-full flex flex-col items-center justify-center">
      {/* Progress indicator */}

      {/* Step 1: Signup */}
      {step === 1 && (
        <>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-light-text pb-3">Create an account</h1>
            <p className="text-lg md:text-xl font-normal text-light-text">
              Enter your email and password to get started
            </p>
          </div>
          <div className="mt-8 w-full md:w-[85%] lg:w-[65%] xl:w-[45%]">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-[16px] w-full">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary text-base font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full px-5 py-4 h-[56px] text-base"
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
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary text-base font-medium">Password</FormLabel>
                      <FormControl>
                        <div className=" relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="w-full px-5 py-4 h-[56px] text-base"
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
                <Button className="bg-primary text-white w-full px-5 py-3 h-[56px] text-base font-medium" type="submit">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Creating Account
                    </>
                  ) : (
                    "Create Account"
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
                variant="outline"
                className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
              >
                <Image src="/googleico.svg" alt="google" width={24} height={24} />
                Google
              </Button>
              <Button
                variant="outline"
                className="bg-[#F9F9F9] text-light-text font-normal w-[48%] px-5 py-3 border border-light-border h-[56px] text-base"
                onClick={() => router.push(plan ? `/login?plan=${plan}` : "/login")}
              >
                Login
              </Button>
            </div>

            <p className="font-normal text-base text-light-text-secondary text-center">
              By clicking continue, you agree to our...
            </p>
          </div>
        </>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <div className="flex flex-col items-center justify-center w-full md:w-[85%] lg:w-[65%] xl:w-[45%]">
          <h1 className="text-lg font-bold bg-primary text-white flex rounded-md border border-[#3C8DFF] w-[65px] h-[32px] items-center justify-center py-[5px] px-2 mb-4">
            closR
          </h1>
          <p className="text-2xl font-bold my-8 text-light-text">Verify your email</p>
          <div className="self-start mb-4 w-full">
            <p className="text-sm text-light-text-secondary">Enter the 6-digit code we&apos;ve sent to your email:</p>
            <p className="text-light-text">{email}</p>
          </div>

          <InputOTP
            onChange={(value: string) => setOtp(value)}
            className="!w-full !flex !justify-between mb-6"
            maxLength={6}
          >
            <InputOTPGroup>
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={0} />
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={1} />
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={2} />
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={3} />
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={4} />
              <InputOTPSlot className="border border-light-border !h-[48px] !w-[48px] rounded-[8px]" index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            className="bg-primary text-white w-full px-5 py-3 h-[56px] text-base font-medium my-6"
            onClick={onOtpSubmit}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Verifying
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <div className="w-full h-px bg-gray-300 my-4" />

          <button
            onClick={() => setStep(1)}
            className="text-light-text-secondary hover:text-light-text transition-colors"
          >
            {"< Go Back"}
          </button>
        </div>
      )}

      {/* Step 3: User Details */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center w-full md:w-[85%] lg:w-[65%] xl:w-[45%]">
          <h1 className="text-lg font-bold bg-primary text-white flex rounded-md border border-[#3C8DFF] w-[65px] h-[32px] items-center justify-center py-[5px] px-2 mb-4">
            closR
          </h1>
          <p className="text-2xl font-bold my-8 text-light-text">Tell us a bit more about you</p>
          <div className="self-start mb-4 w-full">
            <p className="text-light-text">{email}</p>
          </div>
          <div className="w-full">
            <Form {...userDetailsForm}>
              <form onSubmit={userDetailsForm.handleSubmit(onUserDetailsSubmit)} className="space-y-[16px]">
                <FormField
                  control={userDetailsForm.control}
                  name="fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full px-4 py-[14.5px] h-[48px]"
                          type="text"
                          placeholder="Enter your full name here"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userDetailsForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary ">Phone Number (optional)</FormLabel>
                      <FormControl>
                        <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userDetailsForm.control}
                  name="brokerageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary">Brokerage Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full px-4 py-[14.5px] h-[48px]"
                          type="text"
                          placeholder="Enter your Brokerage Name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userDetailsForm.control}
                  name="brokeragePhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-text-secondary ">Brokerage Phone Number (optional)</FormLabel>
                      <FormControl>
                        <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="bg-primary text-white w-full px-4 py-[8.5px] h-[48px]" type="submit">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2" size={20} strokeWidth={2} /> Finishing
                    </>
                  ) : (
                    "Complete Signup"
                  )}
                </Button>
              </form>
            </Form>
          </div>
          <div className="w-full h-px bg-gray-300 my-8" />

          <button
            onClick={() => setStep(2)}
            className="mb-6 text-light-text-secondary hover:text-light-text transition-colors"
          >
            {"< Go Back"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function Signup() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

//111