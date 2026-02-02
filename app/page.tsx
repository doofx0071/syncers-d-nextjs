"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ConnectionPanel } from "@/components/ConnectionPanel"
import { PeerList } from "@/components/PeerList"
import { FileTransfer } from "@/components/FileTransfer"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useStore } from "@/lib/store"
import Image from 'next/image'
import { Moon, Sun, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

function SyncersApp({ roomId: pathRoomId }: { roomId?: string }) {
  const searchParams = useSearchParams()
  const { connectToPeer } = useWebRTC()
  const status = useStore((state) => state.connectionStatus)

  useEffect(() => {
    const peerId = pathRoomId || searchParams.get('peer')
    if (peerId && status === 'connected') {
      const timer = setTimeout(() => {
        connectToPeer(peerId)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pathRoomId, searchParams, status, connectToPeer])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Top Right */}
      <header className="fixed top-0 right-0 p-4 z-50">
        <ThemeToggle />
      </header>

      {/* Main Content - Centered */}
      <main className="max-w-[1000px] mx-auto px-4 py-8 pt-20">

        {/* Hero Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="shrink-0">
              <Image
                src="/syncers.png"
                alt="Syncers Logo"
                width={88}
                height={88}
                className="w-[88px] h-[88px] drop-shadow-xl"
              />
            </div>
            <div>
              <h1 className="font-heading text-5xl tracking-tight font-bold">Syncers</h1>
              <p className="text-xl text-muted-foreground mt-2 font-medium">
                Real-time file sharing across devices
              </p>
            </div>
          </div>
        </div>

        {/* Connection Panel */}
        <ConnectionPanel />

        {/* Users & Files - Stacked */}
        <div className="mt-6 space-y-4">
          <PeerList />
          <FileTransfer />
        </div>

        {/* Footer */}
        <footer className="text-center py-8 mt-8">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-secondary/30 border border-border/30">
            <Shield className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm text-muted-foreground m-0">
              This platform uses end-to-end encryption to ensure your data is protected from unauthorized access.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

function ThemeToggle() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const isDark = document.documentElement.classList.contains('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2"
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 dark:hidden" />
      <span className="text-sm">
        <span className="dark:hidden">Dark</span>
        <span className="hidden dark:inline">Light</span>
      </span>
    </Button>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function Page({ params: paramsProp }: { params?: { roomId?: string } }) {
  // Use a local variable to store the roomId if it exists
  const roomId = paramsProp?.roomId;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <SyncersApp roomId={roomId} />
    </Suspense>
  )
}
