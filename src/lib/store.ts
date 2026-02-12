import { create } from 'zustand'

interface AgentState {
    isOOOActive: boolean
    isIndexing: boolean
    indexingProgress: number
    metaPolicyAllowContext: boolean
    userAllowContext: boolean

    // Actions
    setOOOActive: (active: boolean) => void
    setIsIndexing: (indexing: boolean) => void
    setIndexingProgress: (progress: number) => void
    setMetaPolicyAllowContext: (allow: boolean) => void
    setUserAllowContext: (allow: boolean) => void
}

export const useAgentStore = create<AgentState>((set) => ({
    isOOOActive: false,
    isIndexing: false,
    indexingProgress: 0,
    metaPolicyAllowContext: true, // Default to true for demo
    userAllowContext: true,

    setOOOActive: (active) => set({ isOOOActive: active }),
    setIsIndexing: (indexing) => set({ isIndexing: indexing }),
    setIndexingProgress: (progress) => set({ indexingProgress: progress }),
    setMetaPolicyAllowContext: (allow) => set({ metaPolicyAllowContext: allow }),
    setUserAllowContext: (allow) => set({ userAllowContext: allow }),
}))
