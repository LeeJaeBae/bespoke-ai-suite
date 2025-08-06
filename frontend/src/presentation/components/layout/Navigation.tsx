"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/presentation/components/ui/Button";
import { useAuth } from "@/presentation/hooks/useAuth";
import { toast } from "sonner";
import {
  BottomNavigation,
  FAB,
  BottomNavigationSpacer,
} from "./BottomNavigation";
// Gesture components removed

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "content",
    label: "콘텐츠",
    href: "/content",
    icon: FileText,
  },
  {
    id: "campaigns",
    label: "캠페인",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    id: "analytics",
    label: "분석",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "설정",
    href: "/settings",
    icon: Settings,
  },
];

interface NavigationProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

export function Navigation({
  isCollapsed = false,
  onToggle,
  isMobileOpen = false,
  onMobileToggle,
}: NavigationProps) {
  const pathname = usePathname();
  const [internalMobileOpen, setInternalMobileOpen] = React.useState(false);
  const { user, logout } = useAuth();

  // 모바일 메뉴 상태 관리 (외부 prop이 있으면 사용, 없으면 내부 상태 사용)
  const mobileMenuOpen = onMobileToggle ? isMobileOpen : internalMobileOpen;
  const setMobileMenuOpen = onMobileToggle || setInternalMobileOpen;

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃되었습니다.");
    } catch (error) {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return (
    <>
      {/* Mobile Navigation Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-md lg:hidden touch-target"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 240,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        className={cn(
          // 기본적으로 모바일에서는 화면 밖에 숨김
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-200",
          "flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-out",
          // 모바일에서 메뉴가 열렸을 때만 보이도록
          mobileMenuOpen && "translate-x-0"
        )}
        style={{
          // Framer Motion으로 width만 제어하고, 위치는 CSS 클래스로 처리
          width: isCollapsed ? 80 : 240,
        }}
      >
        {/* Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-heading-sm">Bespoke AI</span>
            </Link>
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Collapse Button - Desktop Only */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  "hover:bg-gray-50",
                  active && "bg-primary-50 text-primary-700",
                  !active && "text-text-secondary hover:text-text-primary"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-body-md font-medium">{item.label}</span>
                )}
                {active && !isCollapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1 h-4 bg-primary-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-text-primary truncate">
                    {user?.name || "사용자"}
                  </p>
                  <p className="text-body-xs text-text-tertiary truncate">
                    {user?.email.toString() || "user@example.com"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <button
              className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mx-auto text-text-secondary" />
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

// Header Component
interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-heading-md font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-body-sm text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

// Main Layout Component
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleFABAction = () => {
    toast.success("콘텐츠 생성", "새로운 콘텐츠를 만들어보세요!");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Navigation
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <BottomNavigationSpacer>
          <div className="h-full">
            {children}
          </div>
        </BottomNavigationSpacer>
      </div>

      {/* 모바일 전용 네비게이션 */}
      <BottomNavigation />
      <FAB onClick={handleFABAction} />
    </div>
  );
}
