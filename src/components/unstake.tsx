"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAccount,
  useReadContract,
  useSendTransaction,
} from "@starknet-react/core";
import { Info } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Contract, RpcProvider } from "starknet";
import * as z from "zod";

import erc4626Abi from "@/abi/erc4626.abi.json";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import MyNumber from "@/lib/MyNumber";

import { Icons } from "./Icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const formSchema = z.object({
  unstakeAmount: z.string().refine(
    (v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    },
    { message: "Invalid input" },
  ),
});

export type FormValues = z.infer<typeof formSchema>;

const Unstake = () => {
  const { address } = useAccount();

  const { data: currentStaked } = useReadContract({
    abi: erc4626Abi,
    functionName: "balance_of",
    address: process.env.NEXT_PUBLIC_LST_ADDRESS as `0x${string}`,
    args: [address],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      unstakeAmount: "",
    },
    mode: "onChange",
  });

  const handleQuickUnstakePrice = (percentage: number) => {
    if (!address) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    if (Number(currentStaked) / 10 ** 18) {
      form.setValue(
        "unstakeAmount",
        (((Number(currentStaked) / 10 ** 18) * percentage) / 100).toString(),
      );
    }
  };

  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  const contract = new Contract(
    erc4626Abi,
    process.env.NEXT_PUBLIC_LST_ADDRESS as string,
    provider,
  );

  const { sendAsync } = useSendTransaction({});

  const onSubmit = async (values: FormValues) => {
    if (!address) {
      return toast({
        description: (
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            Please connect your wallet
          </div>
        ),
      });
    }

    const call1 = contract.populate("withdraw", [
      MyNumber.fromEther(values.unstakeAmount, 18),
      address,
      address,
    ]);

    sendAsync([call1]);
  };

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between border-b bg-gradient-to-t from-[#E9F3F0] to-white px-5 py-12">
        <div className="flex items-center gap-4 text-2xl font-semibold text-black">
          <Icons.strkLogo />
          STRK
        </div>
        <div className="rounded-md bg-[#17876D] px-2 py-1 text-xs text-white">
          Current staked -{" "}
          {currentStaked ? (Number(currentStaked) / 10 ** 18).toFixed(2) : 0}{" "}
          STRK
        </div>
      </div>

      <div className="flex w-full items-center gap-2 px-7 py-3">
        <div className="flex flex-1 flex-col items-start">
          <p className="text-xs text-[#8D9C9C]">Enter Amount</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="unstakeAmount"
                render={({ field }) => (
                  <FormItem className="relative space-y-1">
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-fit border-none px-0 !text-3xl shadow-none outline-none placeholder:text-[#8D9C9C] focus-visible:ring-0"
                          placeholder="0.00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="absolute -bottom-5 left-1 text-xs" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[#8D9C9C]">
            <button
              onClick={() => handleQuickUnstakePrice(25)}
              className="rounded-md rounded-r-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              25%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(50)}
              className="border border-x-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              50%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(75)}
              className="border border-r-0 border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              75%
            </button>
            <button
              onClick={() => handleQuickUnstakePrice(100)}
              className="rounded-md rounded-l-none border border-[#8D9C9C33] px-2 py-1 text-xs font-semibold text-[#8D9C9C] transition-all hover:bg-[#8D9C9C33]"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      <div className="mt-[2.75rem] space-y-3 px-7">
        <div className="flex items-center justify-between rounded-md bg-[#17876D1A] px-3 py-2 text-sm font-medium text-[#939494]">
          xSTRK burnt
          <span>
            {form.watch("unstakeAmount")
              ? (Number(form.watch("unstakeAmount")) * 0.9848).toFixed(2)
              : 0}{" "}
            xSTRK
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[#17876D1A] px-3 py-2 text-sm font-medium text-[#939494]">
          Exchange rate
          <span>1 STRK = 0.9848 xSTRK</span>
        </div>
      </div>

      <div className="mt-28 px-5">
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          className="w-full rounded-2xl bg-[#03624C4D] py-6 text-sm font-semibold text-[#17876D] hover:bg-[#03624C4D]"
        >
          Unstake
        </Button>
      </div>
    </div>
  );
};

export default Unstake;
