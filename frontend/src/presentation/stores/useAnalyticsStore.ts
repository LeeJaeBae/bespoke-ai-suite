import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ApiClient } from '@/infrastructure/api/ApiClient'

export interface AnalyticsOverview {
  totalCampaigns: number
  activeCampaigns: number
  totalBudget: number
  spentBudget: number
  totalReach: number
  totalConversions: number
  averageRoi: number
  averageEngagementRate: number
}

export interface TimeSeriesDataPoint {
  date: string
  reach: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  roi: number
  engagementRate: number
}

export interface CampaignPerformance {
  id: string
  name: string
  reach: number
  conversions: number
  roi: number
  engagementRate: number
  spend: number
  budget: number
  status: string
  trend: 'up' | 'down' | 'stable'
}

export interface ChannelPerformance {
  channel: string
  reach: number
  conversions: number
  spend: number
  roi: number
  engagementRate: number
  share: number
}

export interface AudienceInsights {
  demographics: {
    age: Array<{ range: string; percentage: number }>
    gender: Array<{ type: string; percentage: number }>
    location: Array<{ region: string; percentage: number }>
  }
  interests: Array<{ category: string; percentage: number }>
  devices: Array<{ type: string; percentage: number }>
}

export interface ConversionFunnelStage {
  stage: string
  count: number
  conversionRate: number
}

export interface Insight {
  id: string
  type: 'optimization' | 'alert' | 'recommendation'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  action: string
  createdAt: string
}

export interface Predictions {
  nextMonth: {
    expectedReach: number
    expectedConversions: number
    expectedSpend: number
    expectedRoi: number
    confidence: number
  }
  quarterEnd: {
    expectedReach: number
    expectedConversions: number
    expectedSpend: number
    expectedRoi: number
    confidence: number
  }
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  timeSeriesData: TimeSeriesDataPoint[]
  campaignPerformance: CampaignPerformance[]
  channelPerformance: ChannelPerformance[]
  audienceInsights: AudienceInsights
  conversionFunnel: ConversionFunnelStage[]
  insights: Insight[]
  predictions: Predictions
}

interface AnalyticsState {
  // State
  data: AnalyticsData | null
  isLoading: boolean
  error: string | null
  dateRange: string
  selectedMetric: string | null
  lastUpdated: string | null

  // Actions
  fetchAnalytics: (dateRange?: string, metric?: string) => Promise<void>
  setDateRange: (range: string) => void
  setSelectedMetric: (metric: string | null) => void
  dismissInsight: (insightId: string) => Promise<void>
  generateReport: (options: any) => Promise<void>
  refreshData: () => Promise<void>
  reset: () => void
}

const initialState = {
  data: null,
  isLoading: false,
  error: null,
  dateRange: '30',
  selectedMetric: null,
  lastUpdated: null,
}

export const useAnalyticsStore = create<AnalyticsState>()( 
  devtools(
    (set, get) => ({
      ...initialState,

      fetchAnalytics: async (dateRange = '30', metric = 'all') => {
        set({ isLoading: true, error: null })

        try {
          const params = new URLSearchParams()
          if (dateRange !== '30') params.append('dateRange', dateRange)
          if (metric !== 'all') params.append('metric', metric)

          const apiClient = ApiClient.getInstance()
          const response = await apiClient.get<any>(`/api/analytics?${params}`)

          if (response.status === 'success') {
            set({
              data: response.data,
              isLoading: false,
              error: null,
              dateRange,
              selectedMetric: metric === 'all' ? null : metric,
              lastUpdated: new Date().toISOString(),
            })
          } else {
            throw new Error(response.error?.message || '데이터를 불러오는 중 오류가 발생했습니다.')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
          console.error('Failed to fetch analytics:', error)
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      setDateRange: (range: string) => {
        const state = get()
        if (state.dateRange !== range) {
          set({ dateRange: range })
          // 자동으로 새 데이터 가져오기
          state.fetchAnalytics(range, state.selectedMetric || 'all')
        }
      },

      setSelectedMetric: (metric: string | null) => {
        set({ selectedMetric: metric })
      },

      dismissInsight: async (insightId: string) => {
        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.post<any>('/api/analytics', {
            action: 'dismissInsight',
            data: { insightId },
          })

          if (response.status === 'success') {
            // 로컬 상태에서 인사이트 제거
            const state = get()
            if (state.data?.insights) {
              const updatedInsights = state.data.insights.filter(insight => insight.id !== insightId)
              set({
                data: {
                  ...state.data,
                  insights: updatedInsights,
                },
              })
            }
          }
        } catch (error) {
          console.error('Failed to dismiss insight:', error)
          throw error
        }
      },

      generateReport: async (options: any) => {
        try {
          const apiClient = ApiClient.getInstance()
          const response = await apiClient.post<any>('/api/analytics', {
            action: 'generateReport',
            data: options,
          })

          if (response.status === 'success') {
            return response.data
          }
        } catch (error) {
          console.error('Failed to generate report:', error)
          throw error
        }
      },

      refreshData: async () => {
        const state = get()
        await state.fetchAnalytics(state.dateRange, state.selectedMetric || 'all')
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'analytics-store',
      partialize: (state: AnalyticsState) => ({
        dateRange: state.dateRange,
        selectedMetric: state.selectedMetric,
      }),
    }
  )
)