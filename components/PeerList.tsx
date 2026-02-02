"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Star, User, UserCircle, Check, X, Users } from "lucide-react"
import { useWebRTC } from "@/hooks/use-webrtc"
import { SyncSpinner } from "@/components/SyncSpinner"

export function PeerList() {
    const { peers, myId, myName, setProfile, isHost } = useStore()
    const { broadcastNameChange } = useWebRTC()
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState("")

    const handleChangeName = () => {
        if (newName.trim() && myId) {
            setProfile(myId, newName.trim())
            broadcastNameChange(newName.trim())
            setIsEditing(false)
            setNewName("")
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setNewName("")
    }

    return (
        <Card className="glass-card h-full">
            <CardHeader className="py-4 px-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">Users</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-sm font-medium tabular-nums">
                                {peers.length + 1}
                            </span>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(true)
                                setNewName(myName || "")
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                        >
                            <UserCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Change name</span>
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <ul className="divide-y divide-border/30">
                    {/* Current User (Host) */}
                    <li className="px-5 py-4 flex items-center gap-4 bg-primary/5">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                        </div>
                        {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleChangeName()
                                        if (e.key === 'Escape') handleCancel()
                                    }}
                                    placeholder="Enter your new name"
                                    className="h-9 text-sm bg-background"
                                    autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-success hover:bg-success/10" onClick={handleChangeName}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={handleCancel}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <span className="font-semibold text-base">{myName || 'You'}</span>
                                {isHost && (
                                    <span className="ml-auto px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Host</span>
                                )}
                            </>
                        )}
                    </li>

                    {/* Connected Peers */}
                    {peers.map((peer) => (
                        <li key={peer.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                            <div className="p-2 rounded-lg bg-secondary/50">
                                <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-base">{peer.name}</span>
                            {peer.isHost && (
                                <span className="ml-auto px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Host</span>
                            )}
                        </li>
                    ))}

                    {/* Empty State */}
                    {peers.length === 0 && (
                        <li className="px-5 py-10 text-center">
                            <div className="space-y-2">
                                <div className="flex justify-center py-4">
                                    <SyncSpinner size={80} />
                                </div>
                                <p className="text-muted-foreground">Waiting for users to join...</p>
                                <p className="text-sm text-muted-foreground/70">Share the room link or QR code</p>
                            </div>
                        </li>
                    )}
                </ul>
            </CardContent>
        </Card>
    )
}
