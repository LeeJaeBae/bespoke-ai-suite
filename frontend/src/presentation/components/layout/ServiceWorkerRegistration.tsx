"use client";

import * as React from "react";
import { toast } from "sonner";

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export const ServiceWorkerRegistration: React.FC<ServiceWorkerConfig> = ({
  onUpdate,
  onSuccess,
  onError,
}) => {
  const [registration, setRegistration] =
    React.useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    // 서비스 워커가 지원되는 환경인지 확인
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setRegistration(registration);
      console.log("ServiceWorker registered successfully:", registration);

      // 업데이트 확인
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // 새 버전이 사용 가능
              setUpdateAvailable(true);
              onUpdate?.(registration);
              showUpdateNotification();
            } else if (newWorker.state === "installed") {
              // 첫 설치 완료
              onSuccess?.(registration);
              toast.success(
                "오프라인 지원",
                "이제 오프라인에서도 일부 기능을 사용할 수 있습니다"
              );
            }
          });
        }
      });

      // 이미 설치된 서비스 워커가 있는 경우
      if (registration.active) {
        onSuccess?.(registration);
      }
    } catch (error) {
      console.error("ServiceWorker registration failed:", error);
      onError?.(error as Error);
    }
  };

  const showUpdateNotification = () => {
    toast.info(
      "새 버전 사용 가능",
      "페이지를 새로고침하여 최신 버전을 적용하세요"
    );
  };

  // 수동 업데이트 확인
  const checkForUpdate = async () => {
    if (registration) {
      try {
        const updateRegistration = await registration.update();
        console.log("Checked for updates:", updateRegistration);
      } catch (error) {
        console.error("Update check failed:", error);
      }
    }
  };

  // 업데이트 적용
  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  // 서비스 워커 상태 정보 반환
  const getServiceWorkerInfo = () => ({
    isSupported: "serviceWorker" in navigator,
    isRegistered: !!registration,
    updateAvailable,
    checkForUpdate,
    applyUpdate,
  });

  return null; // UI가 없는 유틸리티 컴포넌트
};

// 서비스 워커 상태를 관리하는 훅
export const useServiceWorker = (config?: ServiceWorkerConfig) => {
  const [swInfo, setSwInfo] = React.useState({
    isSupported: false,
    isRegistered: false,
    updateAvailable: false,
    checkForUpdate: () => {},
    applyUpdate: () => {},
  });

  const registrationRef =
    React.useRef<React.ComponentRef<typeof ServiceWorkerRegistration>>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      setSwInfo((prev) => ({ ...prev, isSupported: true }));
    }
  }, []);

  return {
    swInfo,
    ServiceWorkerComponent: () => (
      <ServiceWorkerRegistration
        onUpdate={(registration) => {
          setSwInfo((prev) => ({ ...prev, updateAvailable: true }));
          config?.onUpdate?.(registration);
        }}
        onSuccess={(registration) => {
          setSwInfo((prev) => ({ ...prev, isRegistered: true }));
          config?.onSuccess?.(registration);
        }}
        onError={config?.onError}
      />
    ),
  };
};

// 오프라인 상태를 관리하는 훅
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success("연결 복원", "인터넷 연결이 복원되었습니다");
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning("오프라인 모드", "인터넷 연결을 확인해주세요");
    };

    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

// 캐시된 데이터를 관리하는 훅 (향후 확장)
export const useCacheManager = () => {
  const clearCache = async (cacheName?: string) => {
    if ("caches" in window) {
      if (cacheName) {
        await caches.delete(cacheName);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      toast.success("캐시 삭제 완료", "페이지를 새로고침해주세요");
    }
  };

  const getCacheSize = async (): Promise<number> => {
    if (!("caches" in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  };

  return {
    clearCache,
    getCacheSize,
  };
};
