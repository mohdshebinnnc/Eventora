"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Input } from "./ui/input"
import { Loader2, Search } from "lucide-react"
import Image from "next/image"

export function UnsplashImagePicker({isOpen,onClose,onSelect}) {
    const [query,setQuery]=useState("")
    const [images,setImages]=useState([])
    const [loading,setLoading]=useState(false)

    const [error, setError] = useState(null)

    const searchImages = async(searchQuery) => {
        if (!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) {
            setError("Unsplash Access Key is missing")
            return
        }

        setLoading(true)
        setError(null)
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${searchQuery || "event"}&per_page=12&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
            )

            if (!response.ok) {
                throw new Error("Failed to fetch images")
            }

            const data = await response.json()
            setImages(data.results || [])
        } catch (error) {
            console.error("Error fetching images:", error)
            setError("Failed to load images")
            setImages([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            searchImages("event")
        }
    }, [isOpen])

    const handleSearch = (e) => {
        e.preventDefault()
        searchImages(query)
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose Cover Image</DialogTitle>
            <DialogDescription>
                Search and select an image from Unsplash for your event cover.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
                // type="text"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search for images..."
                className="flex-1"
            />
            <Button type="submit" disabled={loading}>
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                    <Search className="h-4 w-4"/>
                )}
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto min-h-[300px] px-2">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500"/>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64 text-center text-red-500 p-4">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 py-4">
                    {images.map((image) => (
                        <button 
                            key={image.id} 
                            className="relative group aspect-video cursor-pointer overflow-hidden rounded-lg border-2 hover:border-purple-500 transition-all"
                            onClick={() => onSelect(image.urls.regular)}
                        >
                            <Image 
                                src={image.urls.small} 
                                alt={image.alt_description || "Unsplash image"} 
                                width={400}
                                height={300}
                                unoptimized
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        </button>
                    ))}
                </div>
            )}
            {!loading && images.length === 0 && (
                        <div className="col-span-3 text-center text-muted-foreground py-12">
                            Search for images to get started.
                        </div>
                    )}
          </div>

          <p className="text-xs text-muted-foreground">
            Photos from {" "}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">
                Unsplash
            </a>
          </p>

        </DialogContent>
    </Dialog>
  )
}
