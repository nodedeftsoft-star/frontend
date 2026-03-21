"use client";

import Link from "next/link";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyOtpPage() {
  const [_otp, setOtp] = useState("");

  //console.log(otp);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-lg font-bold bg-primary text-white flex rounded-md border border-[#3C8DFF] w-[65px] h-[32px] items-center justify-center py-[5px] px-2">
        closR
      </h1>
      <p className="text-2xl font-bold my-8 text-light-text">Verify your email</p>
      <div className="self-start mb-4">
        <p className="text-sm text-light-text-secondary">Enter the 6-digit code we&apos;ve sent to your email:</p>
        <p className=" text-light-text">myname@mycompany.com</p>
      </div>

      <InputOTP
        onChange={(value: string) => setOtp(value)}
        className="!w-full bg-green-500 !flex !justify-between"
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

      <div className="w-full h-px bg-gray-300 my-8" />

      <Link href={"/login"} className="mb-6 text-light-text-secondary">
        {"< Go Back"}
      </Link>
    </div>
  );
}
