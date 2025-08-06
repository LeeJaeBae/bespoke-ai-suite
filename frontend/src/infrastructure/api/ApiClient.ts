export interface ApiConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    version: string
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private static instance: ApiClient
  private baseURL: string
  private timeout: number
  private headers: Record<string, string>
  private accessToken?: string

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout || 30000
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
      })
    }
    return ApiClient.instance
  }

  static setInstance(instance: ApiClient): void {
    ApiClient.instance = instance
  }

  setAccessToken(token: string | undefined) {
    this.accessToken = token
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.headers }
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new ApiError(
        errorData?.error?.code || 'UNKNOWN_ERROR',
        errorData?.error?.message || 'An unknown error occurred',
        errorData?.error?.details,
        response.status
      )
    }

    const data: ApiResponse<T> = await response.json()
    
    if (data.status === 'error') {
      throw new ApiError(
        data.error?.code || 'API_ERROR',
        data.error?.message || 'API returned an error',
        data.error?.details
      )
    }
    
    return data.data as T
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key].toString())
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out')
      }
      throw new ApiError('NETWORK_ERROR', 'Network error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out')
      }
      throw new ApiError('NETWORK_ERROR', 'Network error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out')
      }
      throw new ApiError('NETWORK_ERROR', 'Network error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async delete<T = void>(endpoint: string): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out')
      }
      throw new ApiError('NETWORK_ERROR', 'Network error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('TIMEOUT', 'Request timed out')
      }
      throw new ApiError('NETWORK_ERROR', 'Network error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }
}