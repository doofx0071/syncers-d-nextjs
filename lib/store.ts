import { create } from 'zustand';

export interface User {
    id: string;
    name: string;
    isHost: boolean;
}

export interface FileTransfer {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    status: 'pending' | 'transferring' | 'completed' | 'error';
    direction: 'incoming' | 'outgoing';
    senderId?: string;
    receiverId?: string;
    blob?: Blob;
    url?: string;
}

interface AppState {
    myId: string;
    myName: string;
    roomId: string | null;
    password?: string;
    isHost: boolean;
    peers: User[];
    messages: unknown[];
    files: FileTransfer[];
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    error: string | null;

    // Actions
    setProfile: (id: string, name: string) => void;
    setRoomId: (id: string) => void;
    setPassword: (pwd: string) => void;
    setIsHost: (isHost: boolean) => void;
    addPeer: (peer: User) => void;
    removePeer: (peerId: string) => void;
    updatePeer: (peerId: string, data: Partial<User>) => void;
    setConnectionStatus: (status: AppState['connectionStatus']) => void;
    setError: (error: string | null) => void;

    // File Actions
    addFile: (file: FileTransfer) => void;
    removeFile: (fileId: string) => void;
    updateFileProgress: (fileId: string, progress: number, status?: FileTransfer['status']) => void;
    setFileUrl: (fileId: string, url: string) => void;
    clearFiles: () => void;
}

export const useStore = create<AppState>((set) => ({
    myId: '',
    myName: 'Guest',
    roomId: null,
    isHost: false,
    peers: [],
    messages: [],
    files: [],
    connectionStatus: 'disconnected',
    error: null,

    setProfile: (id, name) => set({ myId: id, myName: name }),
    setRoomId: (id) => set({ roomId: id }),
    setPassword: (pwd) => set({ password: pwd }),
    setIsHost: (isHost) => set({ isHost }),

    addPeer: (peer) => set((state) => {
        if (state.peers.find(p => p.id === peer.id)) return state;
        return { peers: [...state.peers, peer] };
    }),

    removePeer: (peerId) => set((state) => ({
        peers: state.peers.filter(p => p.id !== peerId)
    })),

    updatePeer: (peerId, data) => set((state) => ({
        peers: state.peers.map(p => p.id === peerId ? { ...p, ...data } : p)
    })),

    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setError: (error) => set({ error }),

    addFile: (file) => set((state) => ({
        files: [...state.files, file]
    })),

    removeFile: (fileId) => set((state) => ({
        files: state.files.filter(f => f.id !== fileId)
    })),

    updateFileProgress: (fileId, progress, status) => set((state) => ({
        files: state.files.map(f => {
            if (f.id !== fileId) return f;
            return {
                ...f,
                progress,
                ...(status ? { status } : {})
            };
        })
    })),

    setFileUrl: (fileId, url) => set((state) => ({
        files: state.files.map(f => f.id === fileId ? { ...f, url } : f)
    })),

    clearFiles: () => set({ files: [] })
}));
