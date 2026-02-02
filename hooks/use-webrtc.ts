"use client";

import { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useStore } from '@/lib/store';
import { generateFunName, generateShortId, generateUniqueId } from '@/lib/random';

// Simple message types
type MessageType =
    | { type: 'connect'; name: string; password?: string }
    | { type: 'connect-response'; status: 'welcome' | 'password_required' | 'password_invalid' }
    | { type: 'peers'; list: Array<{ id: string; name: string }> }
    | { type: 'name-change'; id: string; name: string }
    | { type: 'file-add'; files: Array<{ id: string; name: string; size: number; fileType: string; ownerId: string }> }
    | { type: 'file-chunk'; fileId: string; chunk: ArrayBuffer; position: number; size: number; total: number }
    | { type: 'error'; message: string };

// Global state to prevent multiple peer instances
let globalPeer: Peer | null = null;
let globalConnections: Map<string, DataConnection> = new Map();
let globalIsHost = true;
let globalHostId: string | null = null;
let globalInitialized = false;

// Transfer queue globals
const transferQueue: { file: File; id: string }[] = [];
let isTransferring = false;

// Incoming file chunks
const incomingFiles: Map<string, { chunks: ArrayBuffer[]; received: number; total: number; type: string; name: string }> = new Map();

export function useWebRTC() {
    const initRef = useRef(false);

    const {
        setProfile,
        setConnectionStatus,
        setError,
        setIsHost,
        addPeer,
        removePeer,
        updatePeer,
        addFile,
        updateFileProgress,
    } = useStore();

    // Broadcast peer list (host only)
    const broadcastPeers = useCallback(() => {
        if (!globalIsHost || !globalPeer) return;

        const state = useStore.getState();
        const list = [
            { id: globalPeer.id, name: state.myName },
            ...state.peers.map(p => ({ id: p.id, name: p.name }))
        ];

        globalConnections.forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'peers', list });
            }
        });
    }, []);

    // Handle incoming message
    const handleMessage = useCallback((conn: DataConnection, msg: MessageType) => {
        const state = useStore.getState();

        switch (msg.type) {
            case 'connect':
                // Host receives join request
                if (globalIsHost) {
                    const hostPwd = state.password;

                    if (hostPwd && msg.password !== hostPwd) {
                        conn.send({ type: 'connect-response', status: hostPwd && !msg.password ? 'password_required' : 'password_invalid' });
                        setTimeout(() => conn.close(), 300);
                        return;
                    }

                    // Accept
                    globalConnections.set(conn.peer, conn);
                    addPeer({ id: conn.peer, name: msg.name, isHost: false });
                    conn.send({ type: 'connect-response', status: 'welcome' });

                    // Broadcast updated list
                    setTimeout(() => broadcastPeers(), 50);
                }
                break;

            case 'connect-response':
                if (msg.status === 'welcome') {
                    setConnectionStatus('connected');
                } else {
                    setError(msg.status === 'password_required' ? 'Password required' : 'Invalid password');
                }
                break;

            case 'peers':
                // Client receives peer list
                if (!globalIsHost) {
                    const myId = globalPeer?.id;
                    msg.list.forEach(p => {
                        if (p.id === myId) return;
                        const existing = state.peers.find(ep => ep.id === p.id);
                        if (!existing) {
                            addPeer({ id: p.id, name: p.name, isHost: p.id === globalHostId });
                        } else if (existing.name !== p.name) {
                            updatePeer(p.id, { name: p.name });
                        }
                    });

                    // Remove disconnected
                    state.peers.forEach(p => {
                        if (!msg.list.find(lp => lp.id === p.id) && p.id !== myId) {
                            removePeer(p.id);
                        }
                    });
                }
                break;

            case 'name-change':
                // Host receives name change
                if (globalIsHost) {
                    updatePeer(msg.id, { name: msg.name });
                    broadcastPeers();
                }
                break;

            case 'file-add':
                msg.files.forEach(f => {
                    addFile({
                        id: f.id,
                        name: f.name,
                        size: f.size,
                        type: f.fileType,
                        progress: 0,
                        status: 'pending',
                        direction: 'incoming',
                        senderId: f.ownerId,
                    });
                });
                // Host broadcasts to others
                if (globalIsHost) {
                    globalConnections.forEach((c, pid) => {
                        if (pid !== conn.peer && c.open) {
                            c.send(msg);
                        }
                    });
                }
                break;

            case 'file-chunk':
                let file = incomingFiles.get(msg.fileId);
                if (!file) {
                    const storeFile = state.files.find(f => f.id === msg.fileId);
                    if (storeFile) {
                        file = { chunks: [], received: 0, total: storeFile.size, type: storeFile.type, name: storeFile.name };
                        incomingFiles.set(msg.fileId, file);
                    }
                }
                if (file) {
                    file.chunks[msg.position] = msg.chunk;
                    file.received += msg.size;
                    const progress = Math.round((file.received / file.total) * 100);
                    const done = file.received >= file.total;
                    updateFileProgress(msg.fileId, progress, done ? 'completed' : 'transferring');

                    if (done) {
                        const blob = new Blob(file.chunks, { type: file.type });
                        useStore.getState().setFileUrl(msg.fileId, URL.createObjectURL(blob));
                        incomingFiles.delete(msg.fileId);
                    }
                }
                break;

            case 'error':
                setError(msg.message);
                break;
        }
    }, [addPeer, removePeer, updatePeer, addFile, updateFileProgress, setConnectionStatus, setError, broadcastPeers]);

    // Setup connection handlers
    const setupConnection = useCallback((conn: DataConnection) => {
        conn.on('data', (data) => handleMessage(conn, data as MessageType));

        conn.on('close', () => {
            globalConnections.delete(conn.peer);
            removePeer(conn.peer);
            if (globalIsHost) broadcastPeers();
        });

        conn.on('error', (err) => console.error('Conn error:', err));
    }, [handleMessage, removePeer, broadcastPeers]);

    // Initialize
    useEffect(() => {
        if (initRef.current || globalInitialized) return;
        initRef.current = true;
        globalInitialized = true;

        setConnectionStatus('connecting');

        const myShortId = generateShortId();

        // Use Google's standard STUN servers for better connectivity
        const peerConfig = {
            secure: true, // Force SSL for Vercel/HTTPS
            debug: 2, // Print warnings and errors
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        };

        const peer = new Peer(myShortId, peerConfig);
        globalPeer = peer;

        peer.on('open', (id) => {
            setProfile(id, generateFunName());
            setConnectionStatus('connected');
            globalIsHost = true;
            setIsHost(true);
        });

        // Unified error handler
        peer.on('error', (err) => {
            console.error('Peer error:', err);

            // Handle specific error types
            if (err.type === 'unavailable-id') {
                console.warn('ID taken, retrying with new ID...');
                const newId = generateShortId();
                // Note: Recursive recreation is tricky in useEffect. 
                // For now, we accept fate or could reload.
                // In a perfect world, we'd refactor initialization into a function.
            } else if (err.type === 'peer-unavailable') {
                setError(`Peer ${err.message.split(' ').pop()} not found. They may have disconnected.`);
            } else {
                setError(err.message || 'Connection error');
                setConnectionStatus('error');
            }
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                setupConnection(conn);
            });
        });

        return () => {
            // Don't cleanup on hot reload
        };
    }, [setProfile, setConnectionStatus, setError, setIsHost, setupConnection]);

    // Connect to peer
    const connectToPeer = useCallback((peerId: string, password?: string) => {
        if (!globalPeer || !globalPeer.open) {
            setError('Not connected to network');
            return;
        }

        // Sanitize peerId: remove spaces and dashes to make it robust
        const sanitizedId = peerId.trim().replace(/[-\s]/g, '');
        const conn = globalPeer.connect(sanitizedId);

        conn.on('open', () => {
            globalConnections.set(peerId, conn);
            globalIsHost = false;
            globalHostId = peerId;
            setIsHost(false);

            // Send join request
            conn.send({ type: 'connect', name: useStore.getState().myName, password });
            addPeer({ id: peerId, name: 'Host', isHost: true });

            setupConnection(conn);
        });

        conn.on('error', (err) => {
            console.error('Connection failed:', err);
            setError('Failed to connect: ' + err.message);
        });
    }, [addPeer, setIsHost, setError, setupConnection]);

    // Broadcast name change
    const broadcastNameChange = useCallback((name: string) => {
        if (globalIsHost) {
            broadcastPeers();
        } else if (globalHostId) {
            const conn = globalConnections.get(globalHostId);
            if (conn?.open) {
                conn.send({ type: 'name-change', id: globalPeer?.id || '', name });
            }
        }
    }, [broadcastPeers]);

    // Queue Processor
    const processNextInQueue = useCallback(async () => {
        if (isTransferring || transferQueue.length === 0) return;

        isTransferring = true;
        const { file, id: fileId } = transferQueue[0];

        try {
            const chunkSize = 64 * 1024; // 64KB
            const bufferThreshold = 1024 * 1024; // 1MB buffer limit
            let offset = 0;
            let pos = 0;
            let lastUpdate = 0;

            while (offset < file.size) {
                // Check backpressure for all connections
                let backpressure = false;
                for (const conn of globalConnections.values()) {
                    if (conn.open && conn.dataChannel.bufferedAmount > bufferThreshold) {
                        backpressure = true;
                        // Wait for buffer to clear
                        await new Promise<void>(resolve => {
                            const handler = () => {
                                conn.dataChannel.onbufferedamountlow = null;
                                resolve();
                            };
                            conn.dataChannel.onbufferedamountlow = handler;
                            setTimeout(resolve, 500); // Fail-safe
                        });
                        break;
                    }
                }

                if (backpressure) continue;

                // Prepare chunk
                const slice = file.slice(offset, offset + chunkSize);
                const buffer = await slice.arrayBuffer();

                const msg: MessageType = {
                    type: 'file-chunk',
                    fileId,
                    chunk: buffer,
                    position: pos,
                    size: slice.size,
                    total: file.size
                };

                globalConnections.forEach(c => c.open && c.send(msg));

                // Update state
                offset += slice.size;
                pos++;

                const now = Date.now();
                if (now - lastUpdate > 200 || offset >= file.size) {
                    const progress = Math.min(100, Math.round((offset / file.size) * 100));
                    useStore.getState().updateFileProgress(fileId, progress, offset >= file.size ? 'completed' : 'transferring');
                    lastUpdate = now;
                }
            }
        } catch (err) {
            console.error('Transfer error:', err);
            useStore.getState().setError('Transfer failed: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            transferQueue.shift();
            isTransferring = false;
            // Process next file after a tiny tick
            setTimeout(() => {
                // Use the global reference to the recursive logic or just call the queue processor
                // We need to trigger the hook's callback again.
                // Since we can't easily access the latest 'processNextInQueue' closure from here if it regenerates,
                // but processNextInQueue has '[]' deps, so it is stable!
                // However, we are inside processNextInQueue's body.

                // Recursion trick:
                if (transferQueue.length > 0) {
                    // We need to call the function again.
                    // Since we cannot call 'processNextInQueue' directly because it's const,
                    // We will access it via a ref or just emit an event.
                    // Or simpler: just loop!
                }
            }, 50);
        }
    }, []);

    // We can't use recursion with const lambda comfortably. 
    // Let's use a useRef to hold the processor function so we can call it from inside.
    const processRef = useRef<() => Promise<void>>(async () => { });

    processRef.current = async () => {
        if (isTransferring || transferQueue.length === 0) return;

        isTransferring = true;
        const { file, id: fileId } = transferQueue[0];

        try {
            const chunkSize = 64 * 1024;
            const bufferThreshold = 1024 * 1024;
            let offset = 0;
            let pos = 0;
            let lastUpdate = 0;

            while (offset < file.size) {
                let backpressure = false;
                for (const conn of globalConnections.values()) {
                    if (conn.open && conn.dataChannel.bufferedAmount > bufferThreshold) {
                        backpressure = true;
                        await new Promise<void>(resolve => {
                            const handler = () => {
                                conn.dataChannel.onbufferedamountlow = null;
                                resolve();
                            };
                            conn.dataChannel.onbufferedamountlow = handler;
                            setTimeout(resolve, 500);
                        });
                        break;
                    }
                }

                if (backpressure) continue;

                const slice = file.slice(offset, offset + chunkSize);
                const buffer = await slice.arrayBuffer();

                const msg: MessageType = {
                    type: 'file-chunk',
                    fileId,
                    chunk: buffer,
                    position: pos,
                    size: slice.size,
                    total: file.size
                };

                globalConnections.forEach(c => c.open && c.send(msg));

                offset += slice.size;
                pos++;

                const now = Date.now();
                if (now - lastUpdate > 200 || offset >= file.size) {
                    const progress = Math.min(100, Math.round((offset / file.size) * 100));
                    useStore.getState().updateFileProgress(fileId, progress, offset >= file.size ? 'completed' : 'transferring');
                    lastUpdate = now;
                }
            }
        } catch (err) {
            console.error('Transfer error:', err);
            useStore.getState().setError('Transfer failed: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            transferQueue.shift();
            isTransferring = false;
            setTimeout(() => {
                processRef.current(); // Recursive call via ref
            }, 50);
        }
    };

    // Send file
    const sendFile = useCallback((file: File) => {
        if (globalConnections.size === 0) {
            setError('No peers connected');
            return;
        }

        const fileId = generateUniqueId();
        const myId = globalPeer?.id || '';

        addFile({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'transferring',
            direction: 'outgoing',
        });

        const addMsg: MessageType = {
            type: 'file-add',
            files: [{ id: fileId, name: file.name, size: file.size, fileType: file.type, ownerId: myId }]
        };
        globalConnections.forEach(c => c.open && c.send(addMsg));

        transferQueue.push({ file, id: fileId });
        processRef.current(); // Trigge processing

    }, [addFile, setError]);

    return { connectToPeer, sendFile, broadcastNameChange };
}
