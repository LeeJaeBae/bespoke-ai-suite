"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { Textarea } from "@/presentation/components/ui/Textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/presentation/components/ui/Select";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import { useContentStore } from "@/presentation/stores/useContentStore";
import {
  ContentType,
  ContentPlatform,
  ContentStatus,
} from "@/domain/entities/Content";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateContentRequest {
  title: string;
  description?: string;
  type: ContentType;
  platform: ContentPlatform;
  tags?: string[];
  useAI?: boolean;
  aiPrompt?: string;
  targetAudience?: string;
  tone?: string;
  keywords?: string[];
}

const TONE_OPTIONS = [
  { value: "professional", label: "전문적인" },
  { value: "casual", label: "캐주얼한" },
  { value: "friendly", label: "친근한" },
  { value: "humorous", label: "유머러스한" },
  { value: "inspirational", label: "영감을 주는" },
  { value: "educational", label: "교육적인" },
];

export const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createContent, fetchContents } = useContentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [step, setStep] = useState(1);

  // Form states
  const [formData, setFormData] = useState<CreateContentRequest>({
    title: "",
    description: "",
    type: ContentType.TEXT,
    platform: ContentPlatform.INSTAGRAM,
    tags: [],
    useAI: true,
    aiPrompt: "",
    targetAudience: "",
    tone: "professional",
    keywords: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (useAI && !formData.aiPrompt) {
      toast.error("AI 프롬프트를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // AI 생성 요청 데이터 준비
      const requestData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type.toLowerCase(),
        platform: formData.platform.toLowerCase(),
        status: ContentStatus.DRAFT,
        tags: formData.tags,
        metadata: {
          useAI: useAI,
          aiPrompt: formData.aiPrompt,
          targetAudience: formData.targetAudience,
          tone: formData.tone,
          keywords: formData.keywords,
        },
      };

      // AI를 사용하는 경우 AI 생성 플래그 추가
      if (useAI) {
        requestData.aiGeneration = {
          enabled: true,
          prompt: formData.aiPrompt,
          config: {
            targetAudience: formData.targetAudience,
            tone: formData.tone,
            keywords: formData.keywords,
            platform: formData.platform,
            type: formData.type,
          },
        };
      }

      await createContent(requestData);
      
      toast.success(
        useAI
          ? "AI가 콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요."
          : "콘텐츠가 생성되었습니다."
      );
      
      onClose();
      resetForm();
      
      // 목록 새로고침
      setTimeout(() => {
        fetchContents();
      }, 2000);
    } catch (error) {
      console.error("Content creation error:", error);
      toast.error("콘텐츠 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: ContentType.TEXT,
      platform: ContentPlatform.INSTAGRAM,
      tags: [],
      useAI: true,
      aiPrompt: "",
      targetAudience: "",
      tone: "professional",
      keywords: [],
    });
    setTagInput("");
    setKeywordInput("");
    setStep(1);
    setUseAI(true);
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  const addKeyword = () => {
    if (keywordInput && !formData.keywords?.includes(keywordInput)) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((k) => k !== keyword) || [],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading) {
                onClose();
              }
            }}
          />

          {/* Modal Container - Flexbox Centering */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
            style={{ pointerEvents: 'none' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden"
              style={{ 
                maxWidth: 'min(90vw, 640px)', // 더 안전한 모바일 크기
                maxHeight: 'min(90vh, 800px)', // 더 안전한 높이 제한
                minWidth: '320px',
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {useAI ? "AI 콘텐츠 생성" : "콘텐츠 생성"}
                </h2>
              </div>
              <button
                onClick={() => !isLoading && onClose()}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div 
              className="p-4 sm:p-6 overflow-y-auto" 
              style={{ 
                maxHeight: 'calc(min(90vh, 800px) - 140px)', // 헤더와 푸터 높이 고려
                minHeight: '200px' // 최소 높이 보장
              }}
            >
              {/* AI Toggle */}
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-body-md font-medium text-primary-900">
                        AI 콘텐츠 생성
                      </p>
                      <p className="text-body-sm text-primary-700">
                        AI가 자동으로 콘텐츠를 생성합니다
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseAI(!useAI)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useAI ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useAI ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Step Indicator */}
              {useAI && (
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= 1
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > 1 ? <Check className="w-4 h-4" /> : "1"}
                  </div>
                  <div className="flex-1 h-1 bg-gray-200">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{ width: step > 1 ? "100%" : "0%" }}
                    />
                  </div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= 2
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                </div>
              )}

              {/* Form Steps */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* 기본 정보 */}
                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        제목 *
                      </label>
                      <Input
                        placeholder="콘텐츠 제목을 입력하세요"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        설명
                      </label>
                      <Textarea
                        placeholder="콘텐츠 설명을 입력하세요"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-body-sm font-medium text-gray-700 mb-2">
                          콘텐츠 유형
                        </label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              type: value as ContentType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ContentType.TEXT}>
                              텍스트
                            </SelectItem>
                            <SelectItem value={ContentType.IMAGE}>
                              이미지
                            </SelectItem>
                            <SelectItem value={ContentType.VIDEO}>
                              비디오
                            </SelectItem>
                            <SelectItem value={ContentType.CAROUSEL}>
                              캐러셀
                            </SelectItem>
                            <SelectItem value={ContentType.STORY}>
                              스토리
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-body-sm font-medium text-gray-700 mb-2">
                          플랫폼
                        </label>
                        <Select
                          value={formData.platform}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              platform: value as ContentPlatform,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ContentPlatform.INSTAGRAM}>
                              Instagram
                            </SelectItem>
                            <SelectItem value={ContentPlatform.FACEBOOK}>
                              Facebook
                            </SelectItem>
                            <SelectItem value={ContentPlatform.TWITTER}>
                              Twitter
                            </SelectItem>
                            <SelectItem value={ContentPlatform.LINKEDIN}>
                              LinkedIn
                            </SelectItem>
                            <SelectItem value={ContentPlatform.TIKTOK}>
                              TikTok
                            </SelectItem>
                            <SelectItem value={ContentPlatform.EMAIL}>
                              Email
                            </SelectItem>
                            <SelectItem value={ContentPlatform.BLOG}>
                              Blog
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        태그
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="태그를 입력하고 엔터를 누르세요"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTag}
                          disabled={!tagInput}
                        >
                          추가
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ✕
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {!useAI && (
                      <div>
                        <label className="block text-body-sm font-medium text-gray-700 mb-2">
                          콘텐츠 본문
                        </label>
                        <Textarea
                          placeholder="콘텐츠 본문을 입력하세요"
                          rows={6}
                          value={formData.aiPrompt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              aiPrompt: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && useAI && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* AI 설정 */}
                    <div className="p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-body-sm text-blue-900 font-medium">
                            AI 생성 설정
                          </p>
                          <p className="text-body-xs text-blue-700 mt-1">
                            AI가 콘텐츠를 생성할 때 참고할 정보를 입력해주세요.
                            자세할수록 더 좋은 결과를 얻을 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        AI 프롬프트 *
                      </label>
                      <Textarea
                        placeholder="예: 여름 휴가 시즌을 맞아 해외여행 준비 팁에 대한 콘텐츠를 작성해주세요."
                        rows={4}
                        value={formData.aiPrompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aiPrompt: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        타겟 오디언스
                      </label>
                      <Input
                        placeholder="예: 20-30대 직장인, 여행을 좋아하는 사람들"
                        value={formData.targetAudience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetAudience: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        톤 & 매너
                      </label>
                      <Select
                        value={formData.tone}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tone: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((tone) => (
                            <SelectItem key={tone.value} value={tone.value}>
                              {tone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        핵심 키워드
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="키워드를 입력하고 엔터를 누르세요"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addKeyword}
                          disabled={!keywordInput}
                        >
                          추가
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords?.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => removeKeyword(keyword)}
                          >
                            {keyword} ✕
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t bg-gray-50/50 backdrop-blur-sm">
              <Button 
                variant="ghost" 
                onClick={() => !isLoading && onClose()} 
                disabled={isLoading}
                className="order-2 sm:order-1 min-h-[44px]"
              >
                취소
              </Button>
              <div className="flex gap-2 order-1 sm:order-2">
                {useAI && step === 2 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="min-h-[44px] flex-1 sm:flex-initial"
                  >
                    이전
                  </Button>
                )}
                {useAI && step === 1 ? (
                  <Button
                    onClick={() => setStep(2)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    disabled={!formData.title}
                    className="min-h-[44px] flex-1 sm:flex-initial"
                  >
                    다음
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    leftIcon={
                      isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )
                    }
                    className="min-h-[44px] flex-1 sm:flex-initial bg-primary-600 hover:bg-primary-700 text-white font-medium"
                  >
                    {isLoading ? "생성 중..." : "콘텐츠 생성"}
                  </Button>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};