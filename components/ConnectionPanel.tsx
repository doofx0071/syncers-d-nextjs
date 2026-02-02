"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Wifi, Loader2, Copy, Check, Shield, Zap, Eye, EyeOff, Lock, X } from "lucide-react"
import { useWebRTC } from "@/hooks/use-webrtc"
import { SyncSpinner } from "@/components/SyncSpinner"

export function ConnectionPanel() {
    const { connectionStatus, myId, peers, password, setPassword } = useStore()
    const { connectToPeer } = useWebRTC()
    const [copied, setCopied] = useState(false)
    const [targetPeerId, setTargetPeerId] = useState("")
    const [targetPassword, setTargetPassword] = useState("")

    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showPasswordInput, setShowPasswordInput] = useState(false)
    const [showTargetPassword, setShowTargetPassword] = useState(false)

    const shareUrl = myId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${myId}` : ''

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleConnect = () => {
        if (targetPeerId) {
            connectToPeer(targetPeerId, targetPassword || undefined)
            setTargetPeerId("")
            setTargetPassword("")
        }
    }

    if (connectionStatus === 'connecting') {
        return (
            <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                    <SyncSpinner size={80} />
                    <p className="text-muted-foreground">Connecting to secure network...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="glass-card">
                <CardContent className="p-6 space-y-6">
                    {/* Status Banner */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/30 gap-4">
                        <div className="flex items-center gap-4">
                            {connectionStatus === 'connected' ? (
                                <>
                                    <div className="relative flex items-center justify-center shrink-0">
                                        <div className="w-4 h-4 rounded-full bg-success" />
                                        <div className="absolute w-4 h-4 rounded-full bg-success animate-ping opacity-50" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-success shrink-0" />
                                        <span className="font-semibold text-success text-lg">Connection established!</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-4 h-4 rounded-full bg-destructive shrink-0" />
                                    <span className="font-medium text-destructive text-lg">Disconnected</span>
                                </>
                            )}
                        </div>

                    </div>

                    {/* QR Code + Share Section */}
                    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                        {/* QR Code */}
                        {myId && (
                            <div className="shrink-0 flex flex-col items-center gap-3">
                                <div className="p-2 rounded-xl bg-white shadow-lg">
                                    <QRCodeSVG
                                        value={shareUrl}
                                        size={180}
                                        level="M"
                                        fgColor="#1a1a1a"
                                        bgColor="#ffffff"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Scan to connect</p>
                            </div>
                        )}

                        {/* Share Info */}
                        <div className="flex-1 space-y-6 w-full">
                            {/* Share Link */}
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">Share room link to devices you want to share files with.</p>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={shareUrl || "Initializing..."}
                                        className="font-mono text-sm bg-secondary/30 border-border/30"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={copyLink}
                                        className="shrink-0 border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Password Protection */}
                            <div className="space-y-3">
                                <Button
                                    onClick={() => setShowPasswordModal(true)}
                                    variant={password ? "outline" : "secondary"}
                                    className={`w-full justify-start ${password ? "border-primary/50 bg-primary/5 text-primary" : "text-muted-foreground"}`}
                                >
                                    <Lock className={`w-4 h-4 mr-2 ${password ? "text-primary" : "text-muted-foreground"}`} />
                                    {password ? "Password Protected (Click to change)" : "Set Password Protection (Optional)"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Connect to Peer Section */}
                    <div className="pt-6 border-t border-border/50 space-y-4">
                        <h3 className="text-lg font-semibold">Connect to a Room</h3>
                        <div className="space-y-3">
                            <Input
                                placeholder="Enter Peer ID..."
                                value={targetPeerId}
                                onChange={(e) => setTargetPeerId(e.target.value)}
                                className="bg-secondary/30 border-border/30"
                            />
                            <div className="relative">
                                <Input
                                    type={showTargetPassword ? "text" : "password"}
                                    placeholder="Room password (if protected)"
                                    value={targetPassword}
                                    onChange={(e) => setTargetPassword(e.target.value)}
                                    className="bg-secondary/30 border-border/30 pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowTargetPassword(!showTargetPassword)}
                                >
                                    {showTargetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                            <Button
                                onClick={handleConnect}
                                disabled={!targetPeerId || connectionStatus !== 'connected'}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25"
                            >
                                Connect to Room
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl border-primary/20">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-heading">Room Security</h3>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowPasswordModal(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Set a password to prevent unauthorized users from joining your room.
                                    Leave empty to remove password protection.
                                </p>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Room Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswordInput ? "text" : "password"}
                                            placeholder="Enter secure password"
                                            value={password || ''}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pr-10"
                                            autoFocus
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPasswordInput(!showPasswordInput)}
                                        >
                                            {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                                        Close
                                    </Button>
                                    <Button onClick={() => setShowPasswordModal(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}
