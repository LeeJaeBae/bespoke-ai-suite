"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Header } from "@/presentation/components/layout/Navigation";
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
import { useCampaignStore } from "@/presentation/stores/useCampaignStore";
import { CampaignStatus, CampaignObjective } from "@/domain/entities/Campaign";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

// 애니메이션 설정
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

export default function CampaignsPage() {
  const {
    campaigns,
    totalCampaigns,
    currentPage,
    totalPages,
    isLoading,
    fetchCampaigns,
    updateCampaignStatus,
    deleteCampaign,
    setSearchQuery,
    setFilter,
  } = useCampaignStore();

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">(
    "all"
  );
  const [objectiveFilter, setObjectiveFilter] = useState<
    CampaignObjective | "all"
  >("all");
  const [searchInput, setSearchInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

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
      status?: CampaignStatus[];
      objective?: CampaignObjective[];
    } = {};
    if (statusFilter !== "all") filter.status = [statusFilter];
    if (objectiveFilter !== "all") filter.objective = [objectiveFilter];
    setFilter(filter);
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, objectiveFilter]);

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      await updateCampaignStatus(id, status);
      toast.success(
        `캠페인 상태가 ${getStatusLabel(status)}(으)로 변경되었습니다.`
      );
    } catch (error) {
      toast.error("캠페인 상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`정말로 "${name}" 캠페인을 삭제하시겠습니까?`)) {
      try {
        await deleteCampaign(id);
        toast.success("캠페인이 삭제되었습니다.");
      } catch (error) {
        toast.error("캠페인 삭제에 실패했습니다.");
      }
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const config = {
      [CampaignStatus.DRAFT]: {
        label: "초안",
        variant: "secondary" as const,
        icon: <Edit className="w-3 h-3" />,
      },
      [CampaignStatus.ACTIVE]: {
        label: "진행중",
        variant: "success" as const,
        icon: <Play className="w-3 h-3" />,
      },
      [CampaignStatus.PAUSED]: {
        label: "일시정지",
        variant: "warning" as const,
        icon: <Pause className="w-3 h-3" />,
      },
      [CampaignStatus.COMPLETED]: {
        label: "완료",
        variant: "info" as const,
        icon: <CheckCircle className="w-3 h-3" />,
      },
      [CampaignStatus.CANCELLED]: {
        label: "취소됨",
        variant: "error" as const,
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const { label, variant, icon } = config[status];
    return (
      <Badge variant={variant} size="sm" className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const getStatusLabel = (status: CampaignStatus) => {
    const labels = {
      [CampaignStatus.DRAFT]: "초안",
      [CampaignStatus.ACTIVE]: "진행중",
      [CampaignStatus.PAUSED]: "일시정지",
      [CampaignStatus.COMPLETED]: "완료",
      [CampaignStatus.CANCELLED]: "취소됨",
    };
    return labels[status];
  };

  const getObjectiveBadge = (objective: CampaignObjective) => {
    const config = {
      [CampaignObjective.AWARENESS]: {
        label: "인지도",
        color: "bg-purple-100 text-purple-700",
      },
      [CampaignObjective.CONSIDERATION]: {
        label: "고려",
        color: "bg-blue-100 text-blue-700",
      },
      [CampaignObjective.CONVERSION]: {
        label: "전환",
        color: "bg-green-100 text-green-700",
      },
      [CampaignObjective.RETENTION]: {
        label: "유지",
        color: "bg-orange-100 text-orange-700",
      },
    };

    const { label, color } = config[objective];
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        <Target className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const getPerformanceBadge = (
    performanceScore: "good" | "average" | "poor"
  ) => {
    const config = {
      good: {
        label: "우수",
        variant: "success" as const,
        icon: <TrendingUp className="w-3 h-3" />,
      },
      average: {
        label: "보통",
        variant: "warning" as const,
        icon: <BarChart3 className="w-3 h-3" />,
      },
      poor: {
        label: "개선필요",
        variant: "error" as const,
        icon: <TrendingDown className="w-3 h-3" />,
      },
    };

    const { label, variant, icon } = config[performanceScore];
    return (
      <Badge variant={variant} size="sm" className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  return (
    <>
      <Header
        title="캠페인 관리"
        subtitle={`총 ${totalCampaigns}개의 캠페인`}
        action={
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              캠페인 생성
            </Button>
          </motion.div>
        }
      />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container py-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* 검색 및 필터 */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div className="flex-1" whileFocus={{ scale: 1.01 }}>
                <Input
                  placeholder="캠페인 검색..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="transition-all duration-200 hover:shadow-md focus:shadow-lg"
                />
              </motion.div>

              <motion.div
                className="flex gap-2"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item}>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as CampaignStatus | "all")
                    }
                  >
                    <SelectTrigger className="w-[140px] hover:shadow-md transition-shadow">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value={CampaignStatus.DRAFT}>초안</SelectItem>
                      <SelectItem value={CampaignStatus.ACTIVE}>
                        진행중
                      </SelectItem>
                      <SelectItem value={CampaignStatus.PAUSED}>
                        일시정지
                      </SelectItem>
                      <SelectItem value={CampaignStatus.COMPLETED}>
                        완료
                      </SelectItem>
                      <SelectItem value={CampaignStatus.CANCELLED}>
                        취소됨
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div variants={item}>
                  <Select
                    value={objectiveFilter}
                    onValueChange={(value) =>
                      setObjectiveFilter(value as CampaignObjective | "all")
                    }
                  >
                    <SelectTrigger className="w-[140px] hover:shadow-md transition-shadow">
                      <SelectValue placeholder="목표" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 목표</SelectItem>
                      <SelectItem value={CampaignObjective.AWARENESS}>
                        인지도
                      </SelectItem>
                      <SelectItem value={CampaignObjective.CONSIDERATION}>
                        고려
                      </SelectItem>
                      <SelectItem value={CampaignObjective.CONVERSION}>
                        전환
                      </SelectItem>
                      <SelectItem value={CampaignObjective.RETENTION}>
                        유지
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* 캠페인 그리드 */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-64"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
                  />
                </motion.div>
              ) : campaigns.length === 0 ? (
                <motion.div
                  key="empty"
                  variants={item}
                  className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
                    캠페인이 없습니다
                  </h3>
                  <p className="text-body-md text-text-secondary mb-6">
                    첫 번째 마케팅 캠페인을 생성해보세요
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      캠페인 생성
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="campaigns"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {campaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign.id}
                      variants={item}
                      custom={index}
                      layout
                    >
                      <motion.div
                        variants={cardHover}
                        initial="rest"
                        whileHover="hover"
                        className="h-full"
                      >
                        <Card className="h-full overflow-hidden bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
                          {/* 캠페인 헤더 */}
                          <div className="p-6 pb-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-heading-sm font-semibold text-text-primary line-clamp-2 mb-2">
                                  {campaign.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-3">
                                  {getStatusBadge(campaign.status)}
                                  {getObjectiveBadge(campaign.objective)}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-text-tertiary" />
                              </motion.button>
                            </div>

                            {campaign.description && (
                              <p className="text-body-sm text-text-secondary line-clamp-2 mb-4">
                                {campaign.description}
                              </p>
                            )}
                          </div>

                          <CardContent className="px-6 pb-6">
                            {/* 진행률 */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-body-xs text-text-secondary">
                                  진행률
                                </span>
                                <span className="text-body-xs font-medium text-text-primary">
                                  {campaign.progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${campaign.progress}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: index * 0.1,
                                  }}
                                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                />
                              </div>
                            </div>

                            {/* 예산 정보 */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-body-xs text-text-secondary">
                                  예산 사용률
                                </span>
                                <span className="text-body-xs font-medium text-text-primary">
                                  {campaign.budgetUtilization.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-body-sm">
                                <span className="text-text-secondary">
                                  {formatCurrency(campaign.spentBudget)}
                                </span>
                                <span className="font-medium text-text-primary">
                                  / {formatCurrency(campaign.budget)}
                                </span>
                              </div>
                            </div>

                            {/* 성과 지표 */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Users className="w-4 h-4 text-primary-500" />
                                  <span className="text-body-xs text-text-secondary">
                                    도달
                                  </span>
                                </div>
                                <span className="text-body-sm font-medium text-text-primary">
                                  {formatNumber(campaign.performance.reach)}
                                </span>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <TrendingUp className="w-4 h-4 text-success" />
                                  <span className="text-body-xs text-text-secondary">
                                    ROI
                                  </span>
                                </div>
                                <span className="text-body-sm font-medium text-text-primary">
                                  {campaign.performance.roi.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* 성과 점수 */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-body-sm text-text-secondary">
                                성과
                              </span>
                              {getPerformanceBadge(campaign.performanceScore)}
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="flex gap-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  fullWidth
                                  leftIcon={<Edit className="w-3 h-3" />}
                                  disabled={!campaign.canEdit}
                                >
                                  수정
                                </Button>
                              </motion.div>

                              {campaign.status === CampaignStatus.ACTIVE ? (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Pause className="w-3 h-3" />}
                                    onClick={() =>
                                      handleStatusChange(
                                        campaign.id,
                                        CampaignStatus.PAUSED
                                      )
                                    }
                                  >
                                    일시정지
                                  </Button>
                                </motion.div>
                              ) : campaign.status === CampaignStatus.PAUSED ? (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<Play className="w-3 h-3" />}
                                    onClick={() =>
                                      handleStatusChange(
                                        campaign.id,
                                        CampaignStatus.ACTIVE
                                      )
                                    }
                                  >
                                    재시작
                                  </Button>
                                </motion.div>
                              ) : (
                                campaign.canEdit && (
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      leftIcon={<Play className="w-3 h-3" />}
                                      onClick={() =>
                                        handleStatusChange(
                                          campaign.id,
                                          CampaignStatus.ACTIVE
                                        )
                                      }
                                    >
                                      시작
                                    </Button>
                                  </motion.div>
                                )
                              )}
                            </div>

                            {/* 메타 정보 */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-body-xs text-text-tertiary">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {formatDate(new Date(campaign.createdAt))}
                                </span>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, color: "#ef4444" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  handleDelete(campaign.id, campaign.name)
                                }
                                className="p-1 rounded hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3 text-text-tertiary hover:text-red-500" />
                              </motion.button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <motion.div variants={item} className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => fetchCampaigns(currentPage - 1)}
                  className="hover:scale-105 transition-transform"
                >
                  이전
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <motion.div
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant={
                            pageNum === currentPage ? "primary" : "ghost"
                          }
                          size="sm"
                          onClick={() => fetchCampaigns(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => fetchCampaigns(currentPage + 1)}
                  className="hover:scale-105 transition-transform"
                >
                  다음
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
