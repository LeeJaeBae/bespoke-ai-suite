"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Send,
  MoreVertical,
  FileText,
  Image,
  Video,
  Grid3X3,
  Play,
  Filter,
  Trash2,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { Card, CardContent } from "@/presentation/components/ui/Card";
import { Badge } from "@/presentation/components/ui/Badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/presentation/components/ui/Select";
import { toast } from "sonner";
import {
  PageSkeleton,
  CardSkeleton,
} from "@/presentation/components/ui/Skeleton";
import {
  LoadingSpinner,
  PageLoading,
} from "@/presentation/components/ui/Loading";
import {
  InteractiveCard,
  TouchFeedback,
} from "@/presentation/components/ui/Interactions";
import { ListPageWrapper } from "@/presentation/components/layout/PageWrapper";
import { useContentStore } from "@/presentation/stores/useContentStore";
import {
  ContentStatus,
  ContentPlatform,
  ContentType,
} from "@/domain/entities/Content";
import { formatDate } from "@/lib/utils";
import { CreateContentModal } from "@/presentation/components/content/CreateContentModal";

// 애니메이션 설정
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ContentPage() {
  const {
    contents,
    totalContents,
    currentPage,
    totalPages,
    isLoading,
    fetchContents,
    publishContent,
    setSearchQuery,
    setFilter,
  } = useContentStore();

  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">(
    "all"
  );
  const [platformFilter, setPlatformFilter] = useState<ContentPlatform | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    // 디바운스 처리
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleFilterChange = () => {
    const filter: {
      status?: ContentStatus[];
      platform?: ContentPlatform[];
      type?: ContentType[];
    } = {};
    if (statusFilter !== "all") filter.status = [statusFilter];
    if (platformFilter !== "all") filter.platform = [platformFilter];
    if (typeFilter !== "all") filter.type = [typeFilter];
    setFilter(filter);
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, platformFilter, typeFilter]);

  // const handleDelete = async (id: string) => {
  //   if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
  //     try {
  //       await deleteContent(id)
  //       toast.success('콘텐츠가 삭제되었습니다.')
  //     } catch (error) {
  //       toast.error('콘텐츠 삭제에 실패했습니다.')
  //     }
  //   }
  // }

  const handlePublish = async (id: string) => {
    try {
      await publishContent(id);
      toast.success("콘텐츠가 게시되었습니다.");
    } catch (error) {
      toast.error("콘텐츠 게시에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    const config = {
      [ContentStatus.DRAFT]: { label: "초안", variant: "secondary" as const },
      [ContentStatus.REVIEW]: { label: "검토 중", variant: "warning" as const },
      [ContentStatus.APPROVED]: { label: "승인됨", variant: "info" as const },
      [ContentStatus.SCHEDULED]: { label: "예약됨", variant: "info" as const },
      [ContentStatus.PUBLISHED]: {
        label: "게시됨",
        variant: "success" as const,
      },
      [ContentStatus.ARCHIVED]: {
        label: "보관됨",
        variant: "secondary" as const,
      },
    };

    const { label, variant } = config[status];
    return (
      <Badge variant={variant} size="sm">
        {label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: ContentPlatform) => {
    const icons = {
      [ContentPlatform.INSTAGRAM]: "📷",
      [ContentPlatform.FACEBOOK]: "👤",
      [ContentPlatform.TWITTER]: "🐦",
      [ContentPlatform.LINKEDIN]: "💼",
      [ContentPlatform.TIKTOK]: "🎵",
      [ContentPlatform.EMAIL]: "📧",
      [ContentPlatform.BLOG]: "📝",
    };
    return icons[platform] || "📄";
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.TEXT:
        return <FileText className="w-4 h-4" />;
      case ContentType.IMAGE:
        return <Image className="w-4 h-4" />;
      case ContentType.VIDEO:
        return <Video className="w-4 h-4" />;
      case ContentType.CAROUSEL:
        return <Grid3X3 className="w-4 h-4" />;
      case ContentType.STORY:
        return <Play className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 컨텍스트 메뉴 아이템들
  const contextMenuItems = [
    {
      label: "선택 삭제",
      icon: Trash2,
      onClick: () => toast.info("선택 삭제 기능은 곧 제공됩니다"),
    },
    {
      label: "일괄 다운로드",
      icon: Download,
      onClick: () => toast.info("일괄 다운로드 기능은 곧 제공됩니다"),
    },
    {
      label: "공유",
      icon: Share2,
      onClick: () => toast.info("공유 기능은 곧 제공됩니다"),
    },
  ];

  // 콘텐츠 카드 렌더링 함수
  const renderContentCard = (content: any) => (
    <InteractiveCard
      key={content.id}
      glowOnHover={true}
      hoverScale={1.02}
      tapScale={0.98}
      className="h-full"
    >
      <Card className="border-0 shadow-md h-full">
        {/* 썸네일 영역 */}
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          {content.metadata?.thumbnailUrl ? (
            <img
              src={content.metadata.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl">
                {getPlatformIcon(content.platform)}
              </div>
            </div>
          )}

          {/* 상태 배지 */}
          <div className="absolute top-2 left-2">
            {getStatusBadge(content.status)}
          </div>

          {/* 액션 버튼 */}
          <div className="absolute top-2 right-2">
            <TouchFeedback>
              <button className="p-1.5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow touch-target-small">
                <MoreVertical className="w-4 h-4" />
              </button>
            </TouchFeedback>
          </div>
        </div>

        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
          {/* 제목 및 설명 */}
          <div className="flex-1">
            <h3 className="text-body-md font-semibold text-text-primary line-clamp-1">
              {content.title}
            </h3>
            {content.description && (
              <p className="text-body-sm text-text-secondary line-clamp-2 mt-1">
                {content.description}
              </p>
            )}
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-body-xs text-text-tertiary">
            <div className="flex items-center gap-1">
              {getTypeIcon(content.type)}
              <span>{content.type}</span>
            </div>
            <span>•</span>
            <span>{formatDate(content.createdAt)}</span>
          </div>

          {/* 분석 정보 */}
          {content.analytics && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-text-tertiary" />
                <span className="text-body-xs font-medium">
                  {content.analytics.views.toLocaleString()}
                </span>
              </div>
              <div className="text-body-xs">
                <span className="font-medium text-primary-600">
                  {content.analytics.engagementRate.toFixed(1)}%
                </span>
                <span className="text-text-tertiary ml-1">참여율</span>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <TouchFeedback feedbackScale={0.95}>
              <Button
                variant="ghost"
                size="xs"
                fullWidth
                leftIcon={<Eye className="w-3 h-3" />}
              >
                미리보기
              </Button>
            </TouchFeedback>
            <TouchFeedback feedbackScale={0.95}>
              <Button
                variant="ghost"
                size="xs"
                fullWidth
                leftIcon={<Edit className="w-3 h-3" />}
              >
                수정
              </Button>
            </TouchFeedback>
            {content.canPublish() && (
              <TouchFeedback feedbackScale={0.95}>
                <Button
                  variant="primary"
                  size="xs"
                  fullWidth
                  leftIcon={<Send className="w-3 h-3" />}
                  onClick={() => handlePublish(content.id)}
                >
                  게시
                </Button>
              </TouchFeedback>
            )}
          </div>
        </CardContent>
      </Card>
    </InteractiveCard>
  );

  // 빈 상태 컴포넌트
  const emptyState = (
    <InteractiveCard className="text-center py-12">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
        콘텐츠가 없습니다
      </h3>
      <p className="text-body-md text-text-secondary mb-6">
        첫 번째 콘텐츠를 생성해보세요
      </p>
      <TouchFeedback>
        <Button 
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          콘텐츠 생성
        </Button>
      </TouchFeedback>
    </InteractiveCard>
  );

  return (
    <ListPageWrapper
      title="콘텐츠 관리"
      subtitle={`총 ${totalContents}개의 콘텐츠`}
      loading={isLoading}
      action={
        <TouchFeedback>
          <Button 
            leftIcon={<Plus className="w-4 h-4" />} 
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            콘텐츠 생성
          </Button>
        </TouchFeedback>
      }
      items={contents.map(renderContentCard)}
      emptyState={emptyState}
      itemClassName="h-full"
    >
      {/* 검색 및 필터 컨트롤 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4 mb-6"
      >
        {/* 검색 바 */}
        <motion.div variants={item}>
          <Input
            placeholder="콘텐츠 검색..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
            className="w-full"
          />
        </motion.div>

        {/* 필터 */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ContentStatus | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value={ContentStatus.DRAFT}>초안</SelectItem>
              <SelectItem value={ContentStatus.REVIEW}>검토 중</SelectItem>
              <SelectItem value={ContentStatus.APPROVED}>승인됨</SelectItem>
              <SelectItem value={ContentStatus.SCHEDULED}>예약됨</SelectItem>
              <SelectItem value={ContentStatus.PUBLISHED}>게시됨</SelectItem>
              <SelectItem value={ContentStatus.ARCHIVED}>보관됨</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={platformFilter}
            onValueChange={(value) =>
              setPlatformFilter(value as ContentPlatform | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="플랫폼 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 플랫폼</SelectItem>
              <SelectItem value={ContentPlatform.INSTAGRAM}>
                Instagram
              </SelectItem>
              <SelectItem value={ContentPlatform.FACEBOOK}>Facebook</SelectItem>
              <SelectItem value={ContentPlatform.TWITTER}>Twitter</SelectItem>
              <SelectItem value={ContentPlatform.LINKEDIN}>LinkedIn</SelectItem>
              <SelectItem value={ContentPlatform.TIKTOK}>TikTok</SelectItem>
              <SelectItem value={ContentPlatform.EMAIL}>Email</SelectItem>
              <SelectItem value={ContentPlatform.BLOG}>Blog</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as ContentType | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="유형 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 유형</SelectItem>
              <SelectItem value={ContentType.TEXT}>텍스트</SelectItem>
              <SelectItem value={ContentType.IMAGE}>이미지</SelectItem>
              <SelectItem value={ContentType.VIDEO}>비디오</SelectItem>
              <SelectItem value={ContentType.CAROUSEL}>캐러셀</SelectItem>
              <SelectItem value={ContentType.STORY}>스토리</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
          <TouchFeedback>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => fetchContents(currentPage - 1)}
            >
              이전
            </Button>
          </TouchFeedback>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page =
                Math.max(
                  1,
                  Math.min(totalPages - 4, Math.max(1, currentPage - 2))
                ) + i;
              return (
                <TouchFeedback key={page}>
                  <Button
                    variant={page === currentPage ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => fetchContents(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                </TouchFeedback>
              );
            })}
          </div>

          <TouchFeedback>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => fetchContents(currentPage + 1)}
            >
              다음
            </Button>
          </TouchFeedback>
        </div>
      )}

      {/* AI 콘텐츠 생성 모달 */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </ListPageWrapper>
  );
}
