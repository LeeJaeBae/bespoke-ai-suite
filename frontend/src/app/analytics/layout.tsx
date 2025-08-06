import type { Metadata } from 'next'
import { MainLayout } from '@/presentation/components/layout/Navigation'

export const metadata: Metadata = {
  title: '분석 대시보드 - Bespoke AI Suite',
  description: 'AI 기반 마케팅 성과를 분석하고 인사이트를 얻으세요',
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}