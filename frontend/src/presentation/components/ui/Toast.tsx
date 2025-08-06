"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Sparkles,
  Trophy,
  Gift,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 글로벌 토스트 상태 관리
let toastCounter = 0;
const toastManagerCallbacks = new Set<(toasts: ToastData[]) => void>();
let globalToasts: ToastData[] = [];

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant:
    | "default"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "celebration"
    | "achievement";
  duration?: number;
  position?: "top" | "bottom" | "top-center" | "bottom-center";
  action?: ToastActionElement;
  showProgress?: boolean;
  dismissible?: boolean;
}

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & {
    position?: "top" | "bottom" | "top-center" | "bottom-center";
  }
>(({ className, position = "bottom", ...props }, ref) => {
  const positionClasses = {
    top: "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:top-0 sm:right-0 md:max-w-[420px]",
    bottom:
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 md:max-w-[420px]",
    "top-center":
      "fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full max-w-md flex-col p-4",
    "bottom-center":
      "fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full max-w-md flex-col-reverse p-4",
  };

  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(positionClasses[position], className)}
      {...props}
    />
  );
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-5 pr-6 shadow-lg transition-all",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
    "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
    "sm:data-[state=closed]:slide-out-to-right-full sm:data-[state=open]:slide-in-from-bottom-full",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white text-text-primary shadow-md",
        success:
          "border-green-200 bg-gradient-to-r from-green-50 to-green-100/80 text-green-900 shadow-green-100",
        error:
          "border-red-200 bg-gradient-to-r from-red-50 to-red-100/80 text-red-900 shadow-red-100",
        warning:
          "border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100/80 text-yellow-900 shadow-yellow-100",
        info: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-900 shadow-blue-100",
        celebration:
          "border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-yellow-50 text-purple-900 shadow-xl shadow-purple-100/50",
        achievement:
          "border-orange-200 bg-gradient-to-r from-orange-50 via-yellow-50 to-green-50 text-orange-900 shadow-xl shadow-orange-100/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// 파티클 효과 컴포넌트 (셀레브레이션용)
const ParticleEffect: React.FC<{ variant: string }> = ({ variant }) => {
  if (variant !== "celebration" && variant !== "achievement") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute w-2 h-2 rounded-full",
            variant === "celebration" ? "bg-purple-400" : "bg-orange-400"
          )}
          initial={{
            opacity: 0,
            x: "50%",
            y: "50%",
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// 진행률 바 컴포넌트
const ProgressBar: React.FC<{
  duration: number;
  variant: string;
  onComplete: () => void;
}> = ({ duration, variant, onComplete }) => {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100);
        if (newProgress <= 0) {
          onComplete();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const getProgressColor = () => {
    switch (variant) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      case "celebration":
        return "bg-purple-500";
      case "achievement":
        return "bg-orange-500";
      default:
        return "bg-primary-500";
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
      <motion.div
        className={cn("h-full rounded-b-2xl", getProgressColor())}
        initial={{ width: "100%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      showProgress?: boolean;
      dismissible?: boolean;
    }
>(({ className, variant, showProgress, dismissible = true, ...props }, ref) => {
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{
        opacity: dismissed ? 0 : 1,
        y: dismissed ? -50 : 0,
        scale: dismissed ? 0.95 : 1,
      }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      drag={dismissible ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(event, info: PanInfo) => {
        if (dismissible && Math.abs(info.offset.x) > 100) {
          handleDismiss();
        }
      }}
      whileDrag={{ scale: 1.02, rotate: 0 }}
      className="relative"
    >
      <ToastPrimitives.Root
        ref={ref}
        className={cn(
          toastVariants({ variant: variant || "default" }),
          className
        )}
        {...props}
      >
        <ParticleEffect variant={variant || "default"} />
        {showProgress && (
          <ProgressBar
            duration={props.duration || 5000}
            variant={variant || "default"}
            onComplete={handleDismiss}
          />
        )}
      </ToastPrimitives.Root>
    </motion.div>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-200",
      "bg-transparent px-3 text-body-sm font-medium transition-colors",
      "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.success]:border-green-200 group-[.success]:hover:bg-green-100",
      "group-[.error]:border-red-200 group-[.error]:hover:bg-red-100",
      "group-[.warning]:border-yellow-200 group-[.warning]:hover:bg-yellow-100",
      "group-[.info]:border-blue-200 group-[.info]:hover:bg-blue-100",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1 text-text-tertiary transition-colors",
      "hover:bg-gray-100 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500",
      "disabled:pointer-events-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-body-md font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-body-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

// 글로벌 토스트 관리 함수들
const addToast = (toast: Omit<ToastData, "id">) => {
  const id = `toast-${++toastCounter}`;
  const newToast: ToastData = {
    id,
    duration: 5000,
    position: "bottom",
    dismissible: true,
    showProgress: false,
    ...toast,
    variant: toast.variant || "default",
  };

  globalToasts = [...globalToasts, newToast];
  toastManagerCallbacks.forEach((callback) => callback(globalToasts));

  // 자동 삭제
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }
};

const removeToast = (id: string) => {
  globalToasts = globalToasts.filter((toast) => toast.id !== id);
  toastManagerCallbacks.forEach((callback) => callback(globalToasts));
};

const removeAllToasts = () => {
  globalToasts = [];
  toastManagerCallbacks.forEach((callback) => callback(globalToasts));
};

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  React.useEffect(() => {
    setToasts(globalToasts);

    const callback = (newToasts: ToastData[]) => {
      setToasts([...newToasts]);
    };

    toastManagerCallbacks.add(callback);

    return () => {
      toastManagerCallbacks.delete(callback);
    };
  }, []);

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    dismissAll: removeAllToasts,
  };
}

// Enhanced Toaster Component
export function Toaster() {
  const { toasts, dismiss } = useToast();

  const icons = {
    default: null,
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    celebration: <Sparkles className="h-5 w-5 text-purple-600" />,
    achievement: <Trophy className="h-5 w-5 text-orange-600" />,
  };

  return (
    <ToastProvider>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            duration={toast.duration || 5000}
            showProgress={toast.showProgress}
            dismissible={toast.dismissible}
            open={true}
            onOpenChange={(open) => {
              if (!open) dismiss(toast.id);
            }}
          >
            {/* 아이콘 */}
            {icons[toast.variant] && (
              <motion.div
                className="flex-shrink-0 absolute left-4 top-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: 0.1,
                }}
              >
                {icons[toast.variant]}
              </motion.div>
            )}

            {/* 제목과 설명을 Toast의 직접 자식으로 */}
            {toast.title && (
              <ToastTitle className="font-semibold ml-12">
                {toast.title}
              </ToastTitle>
            )}
            {toast.description && (
              <ToastDescription className="text-sm opacity-90 ml-12">
                {toast.description}
              </ToastDescription>
            )}

            {toast.action}

            {toast.dismissible && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <ToastClose />
              </motion.div>
            )}
          </Toast>
        ))}
      </AnimatePresence>
      <ToastViewport position="bottom" />
    </ToastProvider>
  );
}

// 편리한 toast 함수들
const toast = {
  // 기본 토스트
  default: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "default",
    });
  },

  // 성공 토스트
  success: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "success",
      duration: 4000,
    });
  },

  // 에러 토스트
  error: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "error",
      duration: 6000,
      showProgress: true,
    });
  },

  // 경고 토스트
  warning: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "warning",
      duration: 5000,
      showProgress: true,
    });
  },

  // 정보 토스트
  info: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "info",
      duration: 4000,
    });
  },

  // 축하 토스트 (파티클 효과 포함)
  celebration: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "celebration",
      duration: 8000,
      position: "top-center",
      showProgress: true,
      dismissible: true,
    });
  },

  // 성취 토스트 (파티클 효과 포함)
  achievement: (title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: "achievement",
      duration: 7000,
      position: "top-center",
      showProgress: true,
      dismissible: true,
    });
  },

  // 로딩 토스트 (수동 제거 필요)
  loading: (title: string, description?: string) => {
    const id = `toast-${++toastCounter}`;
    const loadingToast: ToastData = {
      id,
      title,
      description,
      variant: "info",
      duration: 0, // 자동 제거 안함
      dismissible: false,
      showProgress: false,
    };

    globalToasts = [...globalToasts, loadingToast];
    toastManagerCallbacks.forEach((callback) => callback(globalToasts));

    // 수동 제거를 위한 함수 반환
    return {
      id,
      dismiss: () => removeToast(id),
      update: (newTitle: string, newDescription?: string) => {
        globalToasts = globalToasts.map((toast) =>
          toast.id === id
            ? { ...toast, title: newTitle, description: newDescription }
            : toast
        );
        toastManagerCallbacks.forEach((callback) => callback(globalToasts));
      },
    };
  },

  // 프로미스 토스트 (로딩 -> 성공/실패)
  promise: <T = any,>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    } = {}
  ) => {
    const {
      loading = "처리 중...",
      success = "완료되었습니다!",
      error = "오류가 발생했습니다",
    } = options;
    const loadingToast = toast.loading(loading);

    promise
      .then((data) => {
        loadingToast.dismiss();
        const successMessage =
          typeof success === "function" ? success(data) : success;
        toast.success(successMessage);
        return data;
      })
      .catch((err) => {
        loadingToast.dismiss();
        const errorMessage = typeof error === "function" ? error(err) : error;
        toast.error(errorMessage);
        throw err;
      });

    return promise;
  },

  // 모든 토스트 제거
  dismiss: removeToast,
  dismissAll: removeAllToasts,
};

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toast,
};
