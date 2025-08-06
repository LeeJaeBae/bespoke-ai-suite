"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, clearError } = useAuth({
    redirectIfAuthenticated: "/dashboard",
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      errors.password = "비밀번호는 6자 이상이어야 합니다.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success("로그인되었습니다.");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "로그인에 실패했습니다.");
    }
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
    >
      <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10">
        <div className="mb-6">
          <h2 className="text-center text-heading-lg font-bold text-text-primary">
            로그인
          </h2>
          <p className="mt-2 text-center text-body-sm text-text-secondary">
            AI 마케팅 플랫폼에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-body-sm font-medium text-text-primary mb-1"
            >
              이메일
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="이메일을 입력하세요"
              error={validationErrors.email}
              leftIcon={<Mail className="w-5 h-5" />}
              variant={validationErrors.email ? "error" : "default"}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-body-sm font-medium text-text-primary mb-1"
            >
              비밀번호
            </label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange("password")}
              placeholder="비밀번호를 입력하세요"
              error={validationErrors.password}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              variant={validationErrors.password ? "error" : "default"}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-500 bg-white border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-body-sm text-text-secondary">
                로그인 상태 유지
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              비밀번호 찾기
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
            disabled={isLoading}
          >
            로그인
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-body-xs">
              <span className="px-2 bg-white text-text-tertiary">또는</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => toast.info("소셜 로그인은 준비 중입니다.")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 계속하기
            </Button>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => toast.info("소셜 로그인은 준비 중입니다.")}
              className="bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] hover:border-[#FDD835]"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#000000">
                <path d="M12 3c5.799 0 10.5 4.701 10.5 10.5 0 4.368-2.667 8.112-6.462 9.694-.206.04-.282-.089-.282-.197 0-.135.005-.494.005-.958 0-.325-.111-.538-.235-.646 1.539-.172 3.153-.755 3.153-3.408 0-.753-.268-1.369-.708-1.851.071-.174.307-.876-.068-1.826 0 0-.578-.185-1.893.706a6.593 6.593 0 0 0-1.722-.231 6.593 6.593 0 0 0-1.722.231c-1.315-.891-1.893-.706-1.893-.706-.375.95-.139 1.652-.068 1.826-.44.482-.708 1.098-.708 1.851 0 2.646 1.612 3.238 3.146 3.412-.197.172-.375.476-.437.922-.392.176-1.389.479-2.001-.571 0 0-.363-.659-1.053-.708 0 0-.671-.009-.047.417 0 0 .451.212.764 1.008 0 0 .404 1.228 2.317.85.003.48.008.844.008 1.016 0 .107-.074.236-.276.198C4.167 21.612 1.5 17.868 1.5 13.5 1.5 7.701 6.201 3 12 3z" />
              </svg>
              Kakao로 계속하기
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-body-sm text-text-secondary">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            회원가입
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
