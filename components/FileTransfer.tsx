"use client"

import { useCallback, useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, CloudDownload, FileText, FileImage, FileArchive, File, X, ArrowUp, ArrowDown, FolderOpen, Upload } from "lucide-react"
import { useWebRTC } from "@/hooks/use-webrtc"

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <FileArchive className="w-5 h-5 text-amber-500" />
    if (type.includes('text') || type.includes('document')) return <FileText className="w-5 h-5 text-emerald-500" />
    return <File className="w-5 h-5 text-muted-foreground" />
}

function formatSize(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileTransfer() {
    const { files, peers, removeFile } = useStore()
    const { sendFile } = useWebRTC()
    const [isDragging, setIsDragging] = useState(false)

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        droppedFiles.forEach(file => sendFile(file))
    }, [sendFile])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        selectedFiles.forEach(file => sendFile(file))
        e.target.value = ''
    }

    const handleDownload = (fileId: string, url: string | undefined, fileName: string) => {
        if (url) {
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            a.click()
        }
    }

    const hasDownloadableFiles = files.some(f => f.status === 'completed' && f.direction === 'incoming' && f.url)

    return (
        <Card className="glass-card h-full">
            <CardHeader className="py-4 px-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FolderOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">Files</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-sm font-medium tabular-nums">
                                {files.length}
                            </span>
                        </div>
                    </div>
                    {hasDownloadableFiles && (
                        <button
                            onClick={() => {
                                files.forEach(f => {
                                    if (f.status === 'completed' && f.direction === 'incoming' && f.url) {
                                        handleDownload(f.id, f.url, f.name)
                                    }
                                })
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                        >
                            <CloudDownload className="w-4 h-4" />
                            <span className="hidden sm:inline">Download all</span>
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
                {/* Send Files Button + Drag Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
                        ${isDragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border/50 hover:border-primary/50 hover:bg-secondary/20'
                        }
                        ${peers.length === 0 ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                        disabled={peers.length === 0}
                    />
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-2xl bg-primary/10">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                className="rounded-full h-11 px-6 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25"
                                disabled={peers.length === 0}
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Send Files
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                {peers.length === 0
                                    ? 'Connect to a peer first'
                                    : 'or drag and drop files here'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="space-y-3">
                    {files.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/30 flex items-center justify-center mb-3">
                                <FolderOpen className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No files transferred yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">Files you send or receive will appear here</p>
                        </div>
                    ) : (
                        files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/20 hover:bg-secondary/30 transition-colors"
                            >
                                {/* File Icon */}
                                <div className="p-2.5 rounded-xl bg-background/80 border border-border/30">
                                    {getFileIcon(file.type)}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{file.name}</span>
                                        <div className={`p-1 rounded-full ${file.direction === 'incoming' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                                            {file.direction === 'incoming' ? (
                                                <ArrowDown className="w-3 h-3 text-blue-500" />
                                            ) : (
                                                <ArrowUp className="w-3 h-3 text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-muted-foreground">{formatSize(file.size)}</span>
                                        <span className={`font-medium ${file.status === 'completed' ? 'text-success' :
                                                file.status === 'error' ? 'text-destructive' :
                                                    'text-primary'
                                            }`}>
                                            {file.status === 'completed' ? '✓ Complete' :
                                                file.status === 'error' ? '✕ Error' :
                                                    `${file.progress}%`}
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    {file.status === 'transferring' && (
                                        <div className="file-progress">
                                            <div
                                                className="file-progress-bar"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {file.status === 'completed' && file.direction === 'incoming' && file.url && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleDownload(file.id, file.url, file.name)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => removeFile(file.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
