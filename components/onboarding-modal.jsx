"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Progress } from "./ui/progress"
import { Heart, MapPin } from "lucide-react"
import { CATEGORIES } from "@/lib/data"

export function OnboardingModal({isOpen, onClose, onComplete}) {
  const [step, setStep] = useState(1)
  const progress=(step/2) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-4">
              <Progress value={progress} className="h-1"/>
            </div>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {step ===1 ? (
                <>
                  <Heart className="w-6 h-6 text-purple-500 mb-2"/>
                  What happens you?
                </>
              ):(
                <>
                  <MapPin className="w-6 h-6 text-purple-500 mb-2"/>
                  What interests you ?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {step ===1
                ? "Select at least 3 categories to personalize your experience"
                : "We'll show you events happening near you"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
                  {CATEGORIES.map((category)=>(
                    <button key={category.id}>
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-sm font-medium">{category.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
