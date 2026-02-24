"use client"

import React, { useEffect, useRef, useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Camera, CheckCircle, Loader2, QrCode, Search, XCircle } from 'lucide-react'

const ScanPage = () => {
    const params = useParams()
    const router = useRouter()
    const eventId = params.eventId
    const scannerRef = useRef(null)
    const html5QrCodeRef = useRef(null)
    const [scanning, setScanning] = useState(false)
    const [manualCode, setManualCode] = useState("")
    const [lastResult, setLastResult] = useState(null)

    const { mutate: checkIn, isLoading } = useConvexMutation(api.event.checkInAttendee)

    const handleCheckIn = async (qrCode) => {
        try {
            const result = await checkIn({ qrCode })
            setLastResult({
                success: true,
                name: result.attendeeName,
                email: result.attendeeEmail,
            })
            toast.success(`${result.attendeeName} checked in!`)
        } catch (error) {
            setLastResult({
                success: false,
                error: error.message,
            })
            toast.error(error.message)
        }
    }

    const startScanner = async () => {
        try {
            const { Html5Qrcode } = await import("html5-qrcode")
            const scanner = new Html5Qrcode("qr-reader")
            html5QrCodeRef.current = scanner
            
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleCheckIn(decodedText)
                    scanner.pause()
                    setTimeout(() => {
                        try { scanner.resume() } catch(e) {}
                    }, 3000)
                },
                () => {}
            )
            setScanning(true)
        } catch (error) {
            toast.error("Could not access camera. Use manual entry instead.")
            console.error(error)
        }
    }

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop()
            } catch (e) {}
            html5QrCodeRef.current = null
        }
        setScanning(false)
    }

    useEffect(() => {
        return () => {
            stopScanner()
        }
    }, [])

    return (
        <div className='min-h-screen pb-16'>
            <div className='flex items-center gap-4 mb-8'>
                <Button variant="ghost" size="sm" onClick={() => router.push("/my-events")}>
                    <ArrowLeft className='w-4 h-4 mr-2' /> Back
                </Button>
                <h1 className='text-3xl font-bold'>QR Check-In Scanner</h1>
            </div>

            <div className='max-w-lg mx-auto space-y-6'>
                {/* Scanner */}
                <Card>
                    <CardContent className='p-6 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <h2 className='font-semibold flex items-center gap-2'>
                                <Camera className='w-5 h-5 text-purple-500' /> Camera Scanner
                            </h2>
                            <Button
                                size="sm"
                                variant={scanning ? "destructive" : "default"}
                                onClick={scanning ? stopScanner : startScanner}
                            >
                                {scanning ? "Stop" : "Start Scanner"}
                            </Button>
                        </div>
                        <div 
                            id="qr-reader"
                            ref={scannerRef}
                            className='w-full rounded-lg overflow-hidden bg-black/10 min-h-[250px] flex items-center justify-center'
                        >
                            {!scanning && (
                                <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                                    <QrCode className='w-12 h-12' />
                                    <p className='text-sm'>Click &quot;Start Scanner&quot; to begin</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Entry */}
                <Card>
                    <CardContent className='p-6 space-y-4'>
                        <h2 className='font-semibold flex items-center gap-2'>
                            <Search className='w-5 h-5 text-purple-500' /> Manual Entry
                        </h2>
                        <div className='flex gap-2'>
                            <Input
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Paste QR code text here..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && manualCode.trim()) {
                                        handleCheckIn(manualCode.trim())
                                        setManualCode("")
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (manualCode.trim()) {
                                        handleCheckIn(manualCode.trim())
                                        setManualCode("")
                                    }
                                }}
                                disabled={isLoading || !manualCode.trim()}
                            >
                                {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Check In"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Last Result */}
                {lastResult && (
                    <Card className={lastResult.success ? "border-green-500/50" : "border-red-500/50"}>
                        <CardContent className='p-6'>
                            <div className='flex items-center gap-3'>
                                {lastResult.success ? (
                                    <CheckCircle className='w-8 h-8 text-green-500 shrink-0' />
                                ) : (
                                    <XCircle className='w-8 h-8 text-red-500 shrink-0' />
                                )}
                                <div>
                                    {lastResult.success ? (
                                        <>
                                            <p className='font-semibold text-green-500'>Check-in Successful!</p>
                                            <p className='text-sm'>{lastResult.name}</p>
                                            <p className='text-xs text-muted-foreground'>{lastResult.email}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className='font-semibold text-red-500'>Check-in Failed</p>
                                            <p className='text-sm text-muted-foreground'>{lastResult.error}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default ScanPage
