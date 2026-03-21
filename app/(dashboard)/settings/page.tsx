"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoaderCircle, Save } from "lucide-react";
// import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/user";
import { toast } from "sonner";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";

const formSchema = z.object({
  fullname: z.string().min(2, { message: "Fullname must be at least 2 characters long." }),
  brokerageName: z.string().optional(),
  brokeragePhoneNumber: z.string().optional(),
  website: z.string().optional(),
  phoneNumber: z.string().optional(),
});


// type Checked = DropdownMenuCheckboxItemProps["checked"]

export default function SettingsPage() {
  const { clearUser, user, setUser } = useUserStore();
  const { subscription, hasActiveSubscription, loading: subLoading, daysRemaining, userSubscription } = useSubscription();
  const router = useRouter();
  // Buyer inactive state

  const [loggingOut, setLoggingOut] = useState(false);
  const [resetting, setResetting] = useState(false);
  // Renter inactive state

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    refreshSubscription(); // triggers API call
  }, [refreshSubscription]);

  // const timeUnits = ["Days", "Weeks", "Months", "Years"];

  // const handleBuyerUnitSelect = (unit: string) => {
  //   setBuyerInactiveUnit(unit);
  // };

  // const handleRenterUnitSelect = (unit: string) => {
  //   setRenterInactiveUnit(unit);
  // };

  // const handleBuyerValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   if (value === "" || /^\d+$/.test(value)) {
  //     setBuyerInactiveValue(value);
  //   }
  // };

  // const handleRenterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   if (value === "" || /^\d+$/.test(value)) {
  //     setRenterInactiveValue(value);
  //   }
  // };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : "",
      brokerageName: user?.brokerageName || "",
      brokeragePhoneNumber: user?.brokeragePhoneNumber || "",
      website: user?.website || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  const logout = async () => {
    setLoggingOut(true);
    document.cookie = `closr_authToken=; path=/; max-age=0; samesite=strict${process.env.NODE_ENV === "production" ? "; secure" : ""
      }`;
    document.cookie = `userDetails=; path=/; max-age=0; samesite=strict${process.env.NODE_ENV === "production" ? "; secure" : ""
      }`;

    const response = await fetch("/api/auth/signin", { method: "DELETE" });
    if (response.ok) {
      window.location.href = "/signin";
    }
    clearUser();
    setLoggingOut(false);
  };

  const resetPassword = async () => {
    setResetting(true);
    document.cookie = `closr_authToken=; path=/; max-age=0; samesite=strict${process.env.NODE_ENV === "production" ? "; secure" : ""
      }`;
    document.cookie = `userDetails=; path=/; max-age=0; samesite=strict${process.env.NODE_ENV === "production" ? "; secure" : ""
      }`;

    const response = await fetch("/api/auth/signin", { method: "DELETE" });
    if (response.ok) {
      window.location.href = "/password-reset";
    }
    clearUser();
    setResetting(false);
  };

  const queryClient = useQueryClient();

  const { mutate: deactivateUser, isPending: isDeactivating } = useMutation({
    mutationFn: async () => {
      await axios.post("/api/user/deactivate", { id: userId });
    },
    onSuccess: async () => {
      toast.success("Account Deactivated Successfully");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      logout();
      clearUser();
    },
    onError: (err: unknown) => {
      toast.error("Failed to deactivate account");
      console.error(err);
    },
  });

  // function onSubmit(values: z.infer<typeof formSchema>) {
  //   // Do something with the form values.
  //   // ✅ This will be type-safe and validated.
  //   //console.log(values);
  // }
  useEffect(() => {
    if (user) {
      form.reset({
        fullname: user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : "",
        brokerageName: user.brokerageName ?? "",
        brokeragePhoneNumber: user.brokeragePhoneNumber ?? "",
        website: user.website ?? "",
        phoneNumber: user.phoneNumber ?? "",
      });
      setUserId(user?.id);
    }
  }, [user, form, userId]);

  async function onUserDetailsSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    //console.log(values);
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

      setUser(data.data);
      toast.success("User Updated Successfully");
    } catch (error) {
      toast("Update failed", {
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="p-8 h-screen overflow-hidden">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-8 overflow-y-auto h-[calc(100vh-180px)]">
        {/* <div className="mb-6 flex items-center gap-12">
          <div className="relative w-[101px] h-[88px]">
            <Image className="rounded-full" width={88} height={88} alt="user" src={"/user-image.png"} />
            <Button
              className="w-8 h-8 flex items-center justify-center bg-[#F9F9F9] absolute right-0.5 bottom-0.5"
              variant={"outline"}
            >
              <Pencil />
            </Button>
          </div>
          <div>
            <h2 className="text-light-text font-bold text-xl mb-2">Your Avatar</h2>
            <p className="text-light-text-secondary text-sm">Choose a photo that helps personalize your profile.</p>
          </div>
        </div> */}
        <div className="flex justify-end mb-4 sticky top-0 bg-white z-10 p-2 border-b">
          <Button
            disabled={isLoading}
            onClick={() => {
              // Trigger multiple saves here
              form.handleSubmit(onUserDetailsSubmit)();
              // saveAutoInactiveRules(); // <-- example extra save
              // saveSecuritySettings(); // <-- another example
            }}
            size="sm"
            variant="outline"
            className="bg-primary text-white"
          >
            {isLoading ? (
              <LoaderCircle size={12} className="animate-spin" />
            ) : (
              <>
                <Save /> Save
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row w-full gap-6 mt-6">
          <div className="w-full lg:w-[36.4%]">
            <Card className="p-6 w-full mb-6">
              <div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onUserDetailsSubmit)} className="space-y-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-light-text font-bold text-xl mb-2">Profile</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="fullname"
                      render={({ field }) => (
                        <FormItem className="flex gap-4">
                          <FormLabel className="text-light-text-secondary w-[25%] font-normal text-base">
                            Full Name
                          </FormLabel>
                          <FormControl className="mx-4 w-[75%] h-[48px]">
                            <Input placeholder="Enter Fullname" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="flex gap-4">
                          <FormLabel className="text-light-text-secondary w-[25%] font-normal text-base">
                            Phone Number
                          </FormLabel>
                          <FormControl className="mx-4 w-[75%] h-[48px]">
                            <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brokerageName"
                      render={({ field }) => (
                        <FormItem className="flex gap-4">
                          <FormLabel className="text-light-text-secondary w-[25%] font-normal text-base">
                            Brokerage Name
                          </FormLabel>
                          <FormControl className="mx-4 w-[75%] h-[48px]">
                            <Input placeholder="Enter Brokerage Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brokeragePhoneNumber"
                      render={({ field }) => (
                        <FormItem className="flex gap-4">
                          <FormLabel className="text-light-text-secondary w-[25%] font-normal text-base">
                            Brokerage Phone Number
                          </FormLabel>
                          <FormControl className="mx-4 w-[75%] h-[48px]">
                            <PhoneInput placeholder="+x (xxx) xxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* <Button
                      disabled={isLoading}
                      type="submit"
                      size={"sm"}
                      variant={"outline"}
                      className="bg-primary text-white mt-5"
                    >
                      {isLoading ? (
                        <LoaderCircle size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Save /> Save
                        </>
                      )}
                    </Button> */}
                  </form>
                </Form>
              </div>
            </Card>
            <Card className="p-6 w-full">
              <div>
                <p className="text-light-text font-bold text-xl">Log Out</p>
                <p className="text-light-text-secondary text-sm">This will end your current session.</p>
              </div>

              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant={"default"} size={"default"} disabled={loggingOut}>
                      {loggingOut ? <LoaderCircle className="animate-spin" /> : "Logout"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-light-text">Confirm Logout?</AlertDialogTitle>
                      <AlertDialogDescription className="text-light-text-secondary">
                        Are you sure you want to logout?Make sure you&apos;ve saved any work before logging out.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#F9F9F9] font-normal">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-primary font-normal" onClick={logout} disabled={loggingOut}>
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </div>
          <div className="w-full lg:w-[61.8%]">
            {/* Subscription Section */}
            <Card className="p-6 w-full mb-6 border-[#E5E8EB]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-light-text font-bold text-xl mb-2">Subscription</p>
                  <p className="text-light-text-secondary text-sm">Manage your subscription and billing information.</p>
                </div>
              </div>
              <Separator className="mb-4" />

              {subLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : hasActiveSubscription && subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-light-text-secondary mb-1">Plan</p>
                      <p className="text-base font-semibold text-light-text">
                        {userSubscription?.subscription_plan || 'Unknown Plan'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-light-text-secondary mb-1">Status</p>
                      <p className="text-base font-semibold text-light-text capitalize">
                        {subscription.status === "trialing" ? "Trial Period" : subscription.status}
                      </p>
                    </div>
                  </div>

                  {/* Days Remaining */}
                  {daysRemaining !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium">
                        {subscription?.status === "trialing" 
                          ? `Trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                          : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in current billing period`
                        }
                      </p>
                    </div>
                  )}

                  {subscription.status === "trialing" && subscription.trial_end && (
                    <div>
                      <p className="text-sm text-light-text-secondary mb-1">Trial Ends</p>
                      <p className="text-base font-semibold text-light-text">
                        {new Date(subscription.trial_end * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {/* {console.log(subscription)} */}
                  <div>
                    <p className="text-sm text-light-text-secondary mb-1">
                      {subscription.status === "trialing" ? "First Billing Date" : "Next Billing Date"}
                    </p>
                    <p className="text-base font-semibold text-light-text">
                        {new Date((subscription?.items?.data?.[0]?.current_period_end || subscription?.current_period_end) * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <Separator className="my-4" />

                  {/* <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => router.push('/subscription')}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  </div> */}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-light-text-secondary mb-2">
                      You&apos;re currently on the Free plan. Upgrade to Pro to unlock premium features and enhanced capabilities.
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="default"
                    className="w-full"
                    onClick={() => router.push('/pricing')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6 w-full mb-6 border-[#E5E8EB]">
              <div>
                <p className="text-light-text font-bold text-xl mb-2">Security Settings</p>
                <p className="text-light-text-secondary text-sm">These actions are permanent and cannot be undone.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-[#F9F9F9] w-[169px]" variant={"outline"} size={"default"}>
                    {resetting ? <LoaderCircle className="animate-spin" /> : "Change Password"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-light-text">Change Password?</AlertDialogTitle>
                    <AlertDialogDescription className="text-light-text-secondary">
                      You&apos;re going to be redirected to pagee to reset you password
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Separator />
                  <div>
                    <label className="text-sm text-light-text-secondary mb-2">Please enter your email to confirm</label>
                    <Input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your Email" />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-[#F9F9F9] font-normal">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        resetPassword();
                      }}
                      className="bg-primary"
                      disabled={email !== user?.email}
                    >
                      Change Password
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
            <Card className="p-6 w-full">
              <div>
                <p className="text-light-text font-bold text-xl mb-2">Danger Zone</p>
                <p className="text-light-text-secondary text-sm">These actions are permanent and cannot be undone.</p>
              </div>

              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant={"destructive"} size={"default"}>
                      Deactivate Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="gap-2">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-light-text">Deactivate Account?</AlertDialogTitle>
                      <AlertDialogDescription className="text-light-text-secondary">
                        You&apos;re about to deactivate your account. You will be logged out and will need to contact
                        support to reactivate your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Separator />
                    <div className="gap-4">
                      <label className="text-sm text-light-text-secondary mb-4">
                        Please enter your email to confirm
                      </label>
                      <Input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#F9F9F9] font-normal">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deactivateUser()}
                        className="bg-[#E35B4F]"
                        disabled={email !== user?.email}
                      >
                        {isDeactivating ? "Deactivating..." : "Deactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </div>
        </div>
        <div className="h-20" />
      </div>
    </section>
  );
}
