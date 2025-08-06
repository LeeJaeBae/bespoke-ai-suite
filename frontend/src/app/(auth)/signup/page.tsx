"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, clearError } = useAuth({
    redirectIfAuthenticated: "/dashboard",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // 비밀번호 강도 체크
  const passwordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordStrengthScore =
    Object.values(passwordStrength).filter(Boolean).length;
  const passwordStrengthLabel =
    passwordStrengthScore === 0
      ? ""
      : passwordStrengthScore <= 2
        ? "약함"
        : passwordStrengthScore <= 4
          ? "보통"
          : "강함";

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name) {
      errors.name = "이름을 입력해주세요.";
    } else if (formData.name.length < 2) {
      errors.name = "이름은 2자 이상이어야 합니다.";
    }

    if (!formData.email) {
      errors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 8) {
      errors.password = "비밀번호는 8자 이상이어야 합니다.";
    } else if (passwordStrengthScore < 3) {
      errors.password = "비밀번호가 너무 약합니다.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "비밀번호를 다시 입력해주세요.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    const result = await register(
      formData.email,
      formData.password,
      formData.name
    );

    if (result.success) {
      toast.success("회원가입이 완료되었습니다.");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "회원가입에 실패했습니다.");
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
            회원가입
          </h2>
          <p className="mt-2 text-center text-body-sm text-text-secondary">
            AI 마케팅의 새로운 시작
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-body-sm font-medium text-text-primary mb-1"
            >
              이름
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="이름을 입력하세요"
              error={validationErrors.name}
              leftIcon={<User className="w-5 h-5" />}
              variant={validationErrors.name ? "error" : "default"}
            />
          </div>

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
              autoComplete="new-password"
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

            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-body-xs text-text-secondary">
                    비밀번호 강도
                  </span>
                  <span
                    className={`text-body-xs font-medium ${
                      passwordStrengthScore <= 2
                        ? "text-error"
                        : passwordStrengthScore <= 4
                          ? "text-warning"
                          : "text-success"
                    }`}
                  >
                    {passwordStrengthLabel}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrengthScore
                          ? passwordStrengthScore <= 2
                            ? "bg-error"
                            : passwordStrengthScore <= 4
                              ? "bg-warning"
                              : "bg-success"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries({
                    hasMinLength: "8자 이상",
                    hasUpperCase: "대문자 포함",
                    hasLowerCase: "소문자 포함",
                    hasNumber: "숫자 포함",
                    hasSpecialChar: "특수문자 포함",
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1">
                      {passwordStrength[
                        key as keyof typeof passwordStrength
                      ] ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-text-tertiary" />
                      )}
                      <span
                        className={`text-body-xs ${
                          passwordStrength[key as keyof typeof passwordStrength]
                            ? "text-success"
                            : "text-text-tertiary"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-body-sm font-medium text-text-primary mb-1"
            >
              비밀번호 확인
            </label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              placeholder="비밀번호를 다시 입력하세요"
              error={validationErrors.confirmPassword}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              variant={validationErrors.confirmPassword ? "error" : "default"}
            />
          </div>

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-primary-500 bg-white border-gray-300 rounded focus:ring-primary-500"
                required
              />
              <span className="text-body-sm text-text-secondary">
                <Link
                  href="/terms"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  이용약관
                </Link>
                {" 및 "}
                <Link
                  href="/privacy"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
            disabled={isLoading}
          >
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-text-secondary">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            로그인
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
