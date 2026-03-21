"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

const formSchema = z.object({
  fullname: z.string().min(2, { message: "Fullname must be at least 6 characters long." }),
  brokerageName: z.string().optional(),
  website: z.string().optional(),
});

export default function VerifyOtpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      brokerageName: "",
      website: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setIsLoading(true);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-lg font-bold bg-primary text-white flex rounded-md border border-[#3C8DFF] w-[65px] h-[32px] items-center justify-center py-[5px] px-2">
        closR
      </h1>
      <p className="text-2xl font-bold my-8 text-light-text">Tell us a bit more about you</p>
      <div className="self-start mb-4">
        <p className=" text-light-text">myname@mycompany.com</p>
      </div>
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField
              control={form.control}
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
              control={form.control}
              name="brokerageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary">Company Name (optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full px-4 py-[14.5px] h-[48px]"
                      type="text"
                      placeholder="Enter your Company Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary">Your Website (optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full px-4 py-[14.5px] h-[48px]"
                      type="text"
                      placeholder="example: yoursite.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="bg-primary text-white w-full px-4 py-[8.5px] h-[48px]" type="submit">
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin" size={59} strokeWidth={2} /> Finish
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </form>
        </Form>
      </div>
      <div className="w-full h-px bg-gray-300 my-8" />

      <Link href="/otp-verify" className="mb-6 text-light-text-secondary">
        {"< Go Back"}
      </Link>
    </div>
  );
}
