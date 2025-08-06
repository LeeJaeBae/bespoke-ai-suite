"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Monitor } from "lucide-react";
import { Button } from "../ui/Button";
import { InteractiveCard, TouchFeedback } from "../ui/Interactions";
import { useDeviceInfo } from "./ViewportMeta";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [installSource, setInstallSource] = React.useState<
    "pwa" | "browser" | null
  >(null);
  const deviceInfo = useDeviceInfo();

  // PWA 설치 이벤트 리스너
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setInstallSource("pwa");

      // 설치 프롬프트 표시 조건
      const shouldShowPrompt =
        !isInstalled &&
        !localStorage.getItem("pwa-install-dismissed") &&
        !window.matchMedia("(display-mode: standalone)").matches;

      if (shouldShowPrompt) {
        // 페이지 로드 후 3초 뒤에 표시
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem("pwa-installed", "true");
      toast.success(
        "앱이 성공적으로 설치되었습니다!",
        "홈 화면에서 바로 실행하세요"
      );
    };

    // 이미 설치되었는지 확인
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwa-installed") === "true"
    ) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  // PWA 설치 실행
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info(
        "설치 안내",
        '브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요'
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast.success("설치 중...", "잠시 후 앱이 설치됩니다");
      } else {
        toast.info(
          "설치 취소됨",
          "언제든지 브라우저 메뉴에서 설치할 수 있습니다"
        );
      }

      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error("PWA installation error:", error);
      toast.error("설치 실패", "브라우저에서 직접 설치를 시도해주세요");
    }
  };

  // 프롬프트 닫기
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    toast.info("설치 안내", "언제든지 브라우저 메뉴에서 설치할 수 있습니다");
  };

  // 설치되었거나 표시하지 않는 경우 렌더링하지 않음
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-auto md:max-w-md"
      >
        <InteractiveCard className="bg-white shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start gap-4">
            {/* 아이콘 */}
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
              {deviceInfo.isMobile ? (
                <Smartphone className="w-6 h-6 text-primary-600" />
              ) : (
                <Monitor className="w-6 h-6 text-primary-600" />
              )}
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-body-md font-semibold text-text-primary mb-1">
                앱으로 설치하기
              </h3>
              <p className="text-body-sm text-text-secondary mb-4 line-clamp-2">
                {deviceInfo.isMobile
                  ? "홈 화면에 바로가기를 추가하여 더 빠르고 편리하게 이용하세요"
                  : "데스크탑에 설치하여 네이티브 앱처럼 사용해보세요"}
              </p>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <TouchFeedback>
                  <Button
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleInstallClick}
                    className="flex-1"
                  >
                    설치
                  </Button>
                </TouchFeedback>

                <TouchFeedback>
                  <Button variant="ghost" size="sm" onClick={handleDismiss}>
                    나중에
                  </Button>
                </TouchFeedback>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <TouchFeedback>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors touch-target-small"
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </TouchFeedback>
          </div>

          {/* 설치 후 혜택 */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <div className="grid grid-cols-2 gap-4 text-body-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="text-text-secondary">오프라인 사용</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="text-text-secondary">빠른 실행</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="text-text-secondary">푸시 알림</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="text-text-secondary">네이티브 경험</span>
              </div>
            </div>
          </motion.div>
        </InteractiveCard>
      </motion.div>
    </AnimatePresence>
  );
};

// 설치 상태 확인 훅
export const usePWAInstallStatus = () => {
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    // 이미 설치되었는지 확인
    const checkInstallStatus = () => {
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        localStorage.getItem("pwa-installed") === "true";
      setIsInstalled(installed);
    };

    // 설치 가능한지 확인
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    checkInstallStatus();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return { isInstalled, canInstall };
};
