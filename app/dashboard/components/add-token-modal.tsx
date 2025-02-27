"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Plus, X } from "lucide-react"

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
import type { TokenInfo } from "@/lib/hooks/use-wallet-data"

// Schema for token form validation
const tokenFormSchema = z.object({
  name: z.string().min(1, { message: "Token name is required" }),
  symbol: z.string().min(1, { message: "Token symbol is required" }),
  address: z.string().min(42, { message: "Token address must be at least 42 characters" }),
  decimals: z.coerce.number().int().min(0).max(18),
  logo: z.string().url({ message: "Logo must be a valid URL" }).optional(),
})

type TokenFormValues = z.infer<typeof tokenFormSchema>

interface AddTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToken: (token: TokenInfo) => void
}

export function AddTokenModal({ isOpen, onClose, onAddToken }: AddTokenModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      address: "",
      decimals: 18,
      logo: "",
    },
  })

  async function onSubmit(values: TokenFormValues) {
    try {
      setIsSubmitting(true)

      // Create token object
      const token: TokenInfo = {
        name: values.name,
        symbol: values.symbol,
        address: values.address,
        decimals: values.decimals,
        logo: values.logo || `https://placehold.co/200x200/4F46E5/FFFFFF?text=${values.symbol}`,
      }

      // Add the token
      onAddToken(token)

      toast({
        title: "Token added",
        description: `${values.name} (${values.symbol}) has been added to your wallet.`,
      })

      // Reset form and close modal
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error adding token:", error)
      toast({
        variant: "destructive",
        title: "Failed to add token",
        description: "There was an error adding the token. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Custom Token</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Add a custom token to your wallet by entering its details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Contract Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the smart contract address of the token
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Token" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="TKN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        max={18}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Usually 18 for most tokens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Adding Token..."
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Token
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