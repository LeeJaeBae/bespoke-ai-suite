'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  Megaphone, 
  BarChart3, 
  Menu,
  Plus 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

const bottomNavItems: BottomNavItem[] = [
  { 
    id: 'dashboard', 
    label: '홈', 
    icon: LayoutDashboard, 
    href: '/dashboard' 
  },
  { 
    id: 'content', 
    label: '콘텐츠', 
    icon: FileText, 
    href: '/content' 
  },
  { 
    id: 'campaigns', 
    label: '캠페인', 
    icon: Megaphone, 
    href: '/campaigns' 
  },
  { 
    id: 'analytics', 
    label: '분석', 
    icon: BarChart3, 
    href: '/analytics' 
  },
  { 
    id: 'more', 
    label: '더보기', 
    icon: Menu, 
    href: '/settings' 
  },
]

interface BottomNavigationProps {
  className?: string
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  className 
}) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-white/95 backdrop-blur-md border-t border-gray-200",
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 상단 인디케이터 바 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />
      
      <div className="flex items-center justify-around px-2 pt-2 pb-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {bottomNavItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[60px] py-2 px-3 rounded-xl",
                "transition-colors duration-200"
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* 활성 상태 배경 */}
              {active && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 bg-primary-50 rounded-xl"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}

              {/* 아이콘 */}
              <motion.div
                className="relative z-10 mb-1"
                animate={active ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    active 
                      ? "text-primary-600" 
                      : "text-gray-500"
                  )} 
                />
                
                {/* 배지 */}
                {item.badge && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] 
                             bg-red-500 text-white text-xs font-medium 
                             rounded-full flex items-center justify-center
                             px-1"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </motion.div>

              {/* 라벨 */}
              <span 
                className={cn(
                  "text-xs font-medium transition-colors duration-200 relative z-10",
                  active 
                    ? "text-primary-700" 
                    : "text-gray-500"
                )}
              >
                {item.label}
              </span>

              {/* 활성 상태 점 */}
              {active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 
                           w-1 h-1 bg-primary-500 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}

// FAB (Floating Action Button) 컴포넌트
interface FABProps {
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  label?: string
  className?: string
}

export const FAB: React.FC<FABProps> = ({ 
  onClick,
  icon: Icon = Plus,
  label = "콘텐츠 생성",
  className 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <motion.div
      className={cn(
        "fixed bottom-20 right-4 z-40 lg:hidden",
        "flex flex-col items-end gap-3",
        className
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5
      }}
    >
      {/* 확장된 액션들 */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-col items-end gap-2"
        >
          <FABAction 
            icon={FileText} 
            label="콘텐츠 작성"
            onClick={() => {
              setIsExpanded(false)
              // 콘텐츠 작성 페이지로 이동
            }}
          />
          <FABAction 
            icon={Megaphone} 
            label="캠페인 생성"
            onClick={() => {
              setIsExpanded(false)
              // 캠페인 생성 페이지로 이동
            }}
          />
        </motion.div>
      )}

      {/* 메인 FAB 버튼 */}
      <motion.button
        onClick={() => {
          if (isExpanded) {
            setIsExpanded(false)
          } else if (onClick) {
            onClick()
          } else {
            setIsExpanded(true)
          }
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-primary-500 to-primary-600",
          "flex items-center justify-center",
          "text-white transition-all duration-200"
        )}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-6 h-6" />
      </motion.button>

      {/* 툴팁 */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ 
          opacity: isExpanded ? 0 : 1, 
          x: isExpanded ? 10 : 0 
        }}
        className="absolute right-16 top-1/2 -translate-y-1/2
                   bg-gray-800 text-white text-sm px-3 py-1 rounded-lg
                   pointer-events-none whitespace-nowrap"
      >
        {label}
        <div className="absolute left-full top-1/2 -translate-y-1/2
                        w-0 h-0 border-y-4 border-y-transparent
                        border-l-4 border-l-gray-800" />
      </motion.div>
    </motion.div>
  )
}

// FAB 서브 액션 컴포넌트
interface FABActionProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}

const FABAction: React.FC<FABActionProps> = ({ icon: Icon, label, onClick }) => (
  <motion.div
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="flex items-center gap-3"
  >
    <span className="text-sm font-medium text-gray-700 bg-white 
                   px-3 py-1 rounded-full shadow-sm">
      {label}
    </span>
    <motion.button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-white shadow-lg
               flex items-center justify-center text-primary-600
               border border-primary-200"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  </motion.div>
)

// 바텀 네비게이션과 함께 사용할 페이지 패딩 컴포넌트
export const BottomNavigationSpacer: React.FC<{ 
  children: React.ReactNode 
}> = ({ children }) => (
  <div className="pb-16 lg:pb-0">
    {children}
  </div>
)