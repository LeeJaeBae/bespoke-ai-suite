import type { Metadata } from 'next'
import { MainLayout } from '@/presentation/components/layout/Navigation'

export const metadata: Metadata = {
  title: '캠페인 관리 - Bespoke AI Suite',
  description: 'AI 기반 마케팅 캠페인을 생성하고 관리하세요',
}

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}