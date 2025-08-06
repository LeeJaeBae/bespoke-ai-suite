import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Content, ContentStatus, ContentPlatform } from '@/domain/entities/Content'
import { contentApiClient, API_ENDPOINTS } from '@/infrastructure/api'
import { ContentFilter, PaginatedResult } from '@/application/interfaces/IContentRepository'

interface ContentState {
  contents: Content[]
  selectedContent: Content | null
  totalContents: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: string | null
  filter: ContentFilter
  searchQuery: string
}

interface ContentActions {
  fetchContents: (page?: number, filter?: ContentFilter) => Promise<void>
  fetchContentById: (id: string) => Promise<void>
  createContent: (data: Partial<Content>) => Promise<Content>
  updateContent: (id: string, data: Partial<Content>) => Promise<void>
  deleteContent: (id: string) => Promise<void>
  publishContent: (id: string) => Promise<void>
  scheduleContent: (id: string, scheduledAt: Date) => Promise<void>
  setSelectedContent: (content: Content | null) => void
  setFilter: (filter: ContentFilter) => void
  setSearchQuery: (query: string) => void
  clearError: () => void
  reset: () => void
}

type ContentStore = ContentState & ContentActions

const initialState: ContentState = {
  contents: [],
  selectedContent: null,
  totalContents: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filter: {},
  searchQuery: '',
}

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchContents: async (page = 1, filter?: ContentFilter) => {
        set({ isLoading: true, error: null })
        try {
          const params = {
            page,
            limit: 12,
            ...filter,
            search: get().searchQuery || undefined,
          }

          const response = await contentApiClient.get<any>(
            '/contents',
            params
          )

          // API 응답 데이터 변환
          const data = response.data || response
          const items = data.items || data.contents || []
          
          const contents = items.map((item: any) => 
            Content.fromPersistence({
              ...item,
              authorId: { getValue: () => item.authorId || item.author_id },
              createdAt: new Date(item.createdAt || item.created_at),
              updatedAt: new Date(item.updatedAt || item.updated_at),
              publishedAt: item.publishedAt || item.published_at ? new Date(item.publishedAt || item.published_at) : undefined,
              scheduledAt: item.scheduledAt || item.scheduled_at ? new Date(item.scheduledAt || item.scheduled_at) : undefined,
            })
          )

          set({
            contents,
            totalContents: data.total || items.length,
            currentPage: data.page || page,
            totalPages: data.totalPages || data.total_pages || Math.ceil((data.total || items.length) / 12),
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠를 불러오는데 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      fetchContentById: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await contentApiClient.get<any>(
            `/contents/${id}`
          )

          const content = Content.fromPersistence({
            ...response,
            authorId: { getValue: () => response.authorId },
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            publishedAt: response.publishedAt ? new Date(response.publishedAt) : undefined,
            scheduledAt: response.scheduledAt ? new Date(response.scheduledAt) : undefined,
          })

          set({
            selectedContent: content,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠를 불러오는데 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      createContent: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await contentApiClient.post<any>(
            '/contents',
            data
          )

          const content = Content.fromPersistence({
            ...response,
            authorId: { getValue: () => response.authorId },
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
          })

          // 목록 갱신
          await get().fetchContents(get().currentPage, get().filter)

          set({ isLoading: false })
          return content
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠 생성에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      updateContent: async (id, data) => {
        set({ isLoading: true, error: null })
        try {
          await contentApiClient.put(
            `/contents/${id}`,
            data
          )

          // 목록 갱신
          await get().fetchContents(get().currentPage, get().filter)

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠 수정에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      deleteContent: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await contentApiClient.delete(`/contents/${id}`)

          // 목록 갱신
          await get().fetchContents(get().currentPage, get().filter)

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠 삭제에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      publishContent: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await contentApiClient.post(`/contents/${id}/publish`)

          // 목록 갱신
          await get().fetchContents(get().currentPage, get().filter)

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠 게시에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      scheduleContent: async (id, scheduledAt) => {
        set({ isLoading: true, error: null })
        try {
          await contentApiClient.post(`/contents/${id}/schedule`, {
            scheduledAt: scheduledAt.toISOString(),
          })

          // 목록 갱신
          await get().fetchContents(get().currentPage, get().filter)

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '콘텐츠 예약에 실패했습니다.',
            isLoading: false,
          })
          throw error
        }
      },

      setSelectedContent: (content) => {
        set({ selectedContent: content })
      },

      setFilter: (filter) => {
        set({ filter })
        get().fetchContents(1, filter)
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
        get().fetchContents(1, get().filter)
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'ContentStore',
    }
  )
)