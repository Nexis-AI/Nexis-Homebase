"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowUpRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  recipient: z
    .string()
    .min(42, {
      message: "Address must be at least 42 characters.",
    })
    .max(44, {
      message: "Address must not be longer than 44 characters.",
    }),
  amount: z.coerce
    .number()
    .min(0.000001, {
      message: "Amount must be at least 0.000001",
    }),
})

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  token: {
    symbol: string
    name: string
    balance: string
    price: number
    decimals: number
  } | null
}

export function SendTokenModal({ isOpen, onClose, token }: SendTokenModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      amount: undefined,
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!token) {
      toast({
        title: "Error",
        description: "No token selected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse the amount and convert to token units
      const amount = data.amount;
      const tokenAmount = amount * (10 ** token.decimals);

      setIsSubmitting(true);
      
      // In a production app, you would call a contract method here
      // For demo, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Transaction sent",
        description: `Sent ${amount} ${token.symbol} to ${data.recipient}`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error sending transaction:", error);
      toast({
        title: "Transaction failed",
        description: "There was an error sending your transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxClick = () => {
    if (!token) return;
    // Convert the balance string to a number for the form
    const numericBalance = Number(token.balance.replace(/,/g, ''))
    form.setValue("amount", numericBalance)
  }

  // Safely calculate dollar value with fallback when token is null
  const dollarValue = (form.watch("amount") || 0) * (token?.price || 0)

  // If no token is selected, show a placeholder or return null
  if (!token) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Send Token</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Please select a token first to send.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Send {token.symbol}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Send {token.name} ({token.symbol}) to another wallet address.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a valid {token.symbol} wallet address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Amount</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Balance: {token.balance} {token.symbol}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step={10 ** -token.decimals}
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber)
                        }}
                      />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleMaxClick}>
                      Max
                    </Button>
                  </div>
                  {dollarValue > 0 && (
                    <FormDescription>
                      ≈ ${dollarValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    Send {token.symbol}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

