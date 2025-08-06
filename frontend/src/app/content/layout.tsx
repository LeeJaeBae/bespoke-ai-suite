import { MainLayout } from '@/presentation/components/layout/Navigation'

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}