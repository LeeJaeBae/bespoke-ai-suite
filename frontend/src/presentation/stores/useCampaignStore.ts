import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Campaign, CampaignStatus, CampaignObjective } from '@/domain/entities/Campaign'
import { ApiClient } from '@/infrastructure/api/ApiClient'

interface CampaignState {
  // State
  campaigns: any[]
  selectedCampaign: any | null
  totalCampaigns: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  isLoading: boolean
  searchQuery: string
  filters: {
    status?: CampaignStatus[]
    objective?: CampaignObjective[]
  }

  // Actions
  fetchCampaigns: (page?: number) => Promise<void>
  fetchCampaignById: (id: string) => Promise<void>
  createCampaign: (campaign: any) => Promise<void>
  updateCampaign: (id: string, updates: any) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  updateCampaignStatus: (id: string, status: CampaignStatus) => Promise<void>
  setSearchQuery: (query: string) => void
  setFilter: (filters: any) => void
  clearFilters: () => void
  reset: () => void
}

const initialState = {
  campaigns: [],
  selectedCampaign: null,
  totalCampaigns: 0,
  currentPage: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
  isLoading: false,
  searchQuery: '',
  filters: {},
}

export const useCampaignStore = create<CampaignState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchCampaigns: async (page = 1) => {
        const state = get()
        set({ isLoading: true })

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: '12',
          })

          // 검색어 추가
          if (state.searchQuery) {
            params.append('search', state.searchQuery)
          }

          // 상태 필터 추가
          if (state.filters.status?.length) {
            state.filters.status.forEach(status => {
              params.append('status[]', status)
            })
          }

          // 목표 필터 추가
          if (state.filters.objective?.length) {
            state.filters.objective.forEach(objective => {
              params.append('objective[]', objective)
            })
          }

          const apiClient = ApiClient.getInstance()
          const response = await apiClient.get<any>(`/api/campaigns?${params}`)

          if (response.status === 'success') {
            set({
              campaigns: response.data.items,
              totalCampaigns: response.data.total,
              currentPage: response.data.page,
              totalPages: response.data.totalPages,
              hasNextPage: response.data.hasNextPage,
              hasPrevPage: response.data.hasPrevPage,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to fetch campaigns:', error)
          set({ isLoading: false })
        }
      },

      fetchCampaignById: async (id: string) => {
        set({ isLoading: true })

        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.get<any>(`/api/campaigns/${id}`)

          if (response.status === 'success') {
            set({
              selectedCampaign: response.data,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to fetch campaign:', error)
          set({ isLoading: false })
        }
      },

      createCampaign: async (campaignData: any) => {
        set({ isLoading: true })

        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.post<any>('/api/campaigns', campaignData)

          if (response.status === 'success') {
            // 목록 새로고침
            await get().fetchCampaigns(1)
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Failed to create campaign:', error)
          set({ isLoading: false })
          throw error
        }
      },

      updateCampaign: async (id: string, updates: any) => {
        set({ isLoading: true })

        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.put<any>(`/api/campaigns/${id}`, updates)

          if (response.status === 'success') {
            // 로컬 상태 업데이트
            const { campaigns } = get()
            const updatedCampaigns = campaigns.map(campaign =>
              campaign.id === id ? { ...campaign, ...updates, updatedAt: new Date().toISOString() } : campaign
            )

            set({
              campaigns: updatedCampaigns,
              selectedCampaign: get().selectedCampaign?.id === id 
                ? { ...get().selectedCampaign, ...updates } 
                : get().selectedCampaign,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to update campaign:', error)
          set({ isLoading: false })
          throw error
        }
      },

      deleteCampaign: async (id: string) => {
        set({ isLoading: true })

        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.delete<any>(`/api/campaigns/${id}`)

          if (response.status === 'success') {
            // 로컬 상태에서 제거
            const { campaigns } = get()
            const filteredCampaigns = campaigns.filter(campaign => campaign.id !== id)

            set({
              campaigns: filteredCampaigns,
              totalCampaigns: get().totalCampaigns - 1,
              selectedCampaign: get().selectedCampaign?.id === id ? null : get().selectedCampaign,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to delete campaign:', error)
          set({ isLoading: false })
          throw error
        }
      },

      updateCampaignStatus: async (id: string, status: CampaignStatus) => {
        try {
          await get().updateCampaign(id, { status })
        } catch (error) {
          console.error('Failed to update campaign status:', error)
          throw error
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 })
      },

      setFilter: (filters: any) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          currentPage: 1,
        }))
      },

      clearFilters: () => {
        set({
          searchQuery: '',
          filters: {},
          currentPage: 1,
        })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'campaign-store',
      partialize: (state: CampaignState) => ({ 
        searchQuery: state.searchQuery,
        filters: state.filters 
      }),
    }
  )
)