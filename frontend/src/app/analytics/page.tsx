"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { Header } from "@/presentation/components/layout/Navigation";
import { Button } from "@/presentation/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card";
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
  StatCardSkeleton,
} from "@/presentation/components/ui/Skeleton";
import { LoadingSpinner } from "@/presentation/components/ui/Loading";
import {
  InteractiveCard,
  TouchFeedback,
} from "@/presentation/components/ui/Interactions";
import { useAnalyticsStore } from "@/presentation/stores/useAnalyticsStore";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

// 애니메이션 설정
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const chartAnimation = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.1, type: "spring", duration: 1.5, bounce: 0 },
      opacity: { delay: i * 0.1, duration: 0.3 },
    },
  }),
};

export default function AnalyticsPage() {
  const {
    data,
    isLoading,
    error,
    dateRange,
    fetchAnalytics,
    setDateRange,
    dismissInsight,
    refreshData,
  } = useAnalyticsStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      toast.success("데이터가 업데이트되었습니다.");
    } catch (error) {
      toast.error("데이터 업데이트에 실패했습니다.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      await dismissInsight(insightId);
      toast.success("인사이트가 숨겨졌습니다.");
    } catch (error) {
      toast.error("인사이트 숨기기에 실패했습니다.");
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <Zap className="w-4 h-4" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4" />;
      case "recommendation":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (type === "alert" && priority === "high")
      return "bg-red-50 border-red-200 text-red-800";
    if (type === "optimization" && priority === "high")
      return "bg-orange-50 border-orange-200 text-orange-800";
    if (type === "recommendation")
      return "bg-blue-50 border-blue-200 text-blue-800";
    return "bg-green-50 border-green-200 text-green-800";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-3 h-3 text-green-600" />;
      case "down":
        return <ArrowDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "모바일":
        return <Smartphone className="w-4 h-4" />;
      case "태블릿":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // 간단한 미니 차트 컴포넌트
  const MiniLineChart = ({
    data,
    color = "primary-500",
    height = 40,
  }: {
    data: number[];
    color?: string;
    height?: number;
  }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = ((max - value) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height={height} className="overflow-visible">
        <motion.polyline
          fill="none"
          stroke={`rgb(var(--${color}))`}
          strokeWidth="2"
          points={points}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="drop-shadow-sm"
        />
      </svg>
    );
  };

  // 원형 진행률 컴포넌트
  const CircularProgress = ({
    percentage,
    size = 60,
    color = "primary-500",
  }: {
    percentage: number;
    size?: number;
    color?: string;
  }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(229 231 235)"
            strokeWidth="4"
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`rgb(var(--${color}))`}
            strokeWidth="4"
            fill="none"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-text-primary">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
            데이터 로딩 오류
          </h3>
          <p className="text-body-md text-text-secondary mb-4">{error}</p>
          <Button onClick={handleRefresh}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="분석 대시보드"
        subtitle={`최근 ${dateRange}일간의 마케팅 성과`}
        action={
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7일</SelectItem>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
                <SelectItem value="365">1년</SelectItem>
              </SelectContent>
            </Select>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={
                  <RefreshCw
                    className={cn("w-4 h-4", refreshing && "animate-spin")}
                  />
                }
                onClick={handleRefresh}
                disabled={refreshing}
              >
                새로고침
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() =>
                  toast.info("리포트 다운로드 기능을 준비중입니다.")
                }
              >
                리포트 다운로드
              </Button>
            </motion.div>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container py-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PageSkeleton
                  title="분석 데이터 로딩 중..."
                  showStats={true}
                  cardCount={6}
                />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {/* 핵심 지표 카드들 */}
                {data?.overview && (
                  <motion.div variants={item}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* 총 도달 */}
                      <InteractiveCard
                        hoverScale={1.03}
                        tapScale={0.97}
                        glowOnHover={false}
                      >
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-md border-0">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-body-sm text-blue-700 mb-1">
                                  총 도달
                                </p>
                                <p className="text-heading-lg font-bold text-blue-900">
                                  {formatNumber(data.overview.totalReach)}
                                </p>
                              </div>
                              <div className="p-3 bg-blue-200 rounded-xl">
                                <Users className="w-6 h-6 text-blue-700" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </InteractiveCard>

                      {/* 총 전환 */}
                      <InteractiveCard
                        hoverScale={1.03}
                        tapScale={0.97}
                        glowOnHover={false}
                      >
                        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-md border-0">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-body-sm text-green-700 mb-1">
                                  총 전환
                                </p>
                                <p className="text-heading-lg font-bold text-green-900">
                                  {formatNumber(data.overview.totalConversions)}
                                </p>
                              </div>
                              <div className="p-3 bg-green-200 rounded-xl">
                                <Target className="w-6 h-6 text-green-700" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </InteractiveCard>

                      {/* 평균 ROI */}
                      <InteractiveCard
                        hoverScale={1.03}
                        tapScale={0.97}
                        glowOnHover={false}
                      >
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-md border-0">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-body-sm text-purple-700 mb-1">
                                  평균 ROI
                                </p>
                                <p className="text-heading-lg font-bold text-purple-900">
                                  {data.overview.averageRoi.toFixed(1)}%
                                </p>
                              </div>
                              <div className="p-3 bg-purple-200 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-purple-700" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </InteractiveCard>

                      {/* 광고 지출 */}
                      <InteractiveCard
                        hoverScale={1.03}
                        tapScale={0.97}
                        glowOnHover={false}
                      >
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 shadow-md border-0">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-body-sm text-orange-700 mb-1">
                                  광고 지출
                                </p>
                                <p className="text-heading-lg font-bold text-orange-900">
                                  {formatCurrency(data.overview.spentBudget)}
                                </p>
                                <p className="text-body-xs text-orange-600 mt-1">
                                  / {formatCurrency(data.overview.totalBudget)}
                                </p>
                              </div>
                              <div className="p-3 bg-orange-200 rounded-xl">
                                <DollarSign className="w-6 h-6 text-orange-700" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </InteractiveCard>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* 왼쪽: 시계열 차트 & 캠페인 성과 */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* 성과 트렌드 */}
                    {data?.timeSeriesData && (
                      <motion.div variants={item}>
                        <motion.div
                          variants={cardHover}
                          initial="rest"
                          whileHover="hover"
                        >
                          <Card>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <h3 className="text-heading-md font-semibold text-text-primary">
                                  성과 트렌드
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" size="sm">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    최근 {dateRange}일
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64 relative">
                                {/* 간단한 트렌드 시각화 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <BarChart3 className="w-16 h-16 text-primary-300 mx-auto mb-4" />
                                    <p className="text-body-sm text-text-secondary">
                                      상세한 차트는 곧 제공될 예정입니다
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* 캠페인별 성과 */}
                    {data?.campaignPerformance && (
                      <motion.div variants={item}>
                        <motion.div
                          variants={cardHover}
                          initial="rest"
                          whileHover="hover"
                        >
                          <Card>
                            <CardHeader>
                              <h3 className="text-heading-md font-semibold text-text-primary">
                                캠페인별 성과
                              </h3>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {data.campaignPerformance.map(
                                  (campaign, index) => (
                                    <motion.div
                                      key={campaign.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h4 className="text-body-md font-medium text-text-primary truncate">
                                            {campaign.name}
                                          </h4>
                                          <Badge
                                            variant={
                                              campaign.status === "ACTIVE"
                                                ? "success"
                                                : "secondary"
                                            }
                                            size="sm"
                                          >
                                            {campaign.status}
                                          </Badge>
                                          {getTrendIcon(campaign.trend)}
                                        </div>
                                        <div className="flex items-center gap-4 text-body-sm text-text-secondary">
                                          <span>
                                            도달: {formatNumber(campaign.reach)}
                                          </span>
                                          <span>
                                            전환:{" "}
                                            {formatNumber(campaign.conversions)}
                                          </span>
                                          <span>
                                            ROI: {campaign.roi.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <CircularProgress
                                          percentage={Math.min(
                                            (campaign.spend / campaign.budget) *
                                              100,
                                            100
                                          )}
                                          size={50}
                                        />
                                      </div>
                                    </motion.div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* 오른쪽: 인사이트 & 예측 */}
                  <div className="space-y-6">
                    {/* 주요 인사이트 */}
                    {data?.insights && (
                      <motion.div variants={item}>
                        <motion.div
                          variants={cardHover}
                          initial="rest"
                          whileHover="hover"
                        >
                          <Card>
                            <CardHeader>
                              <h3 className="text-heading-md font-semibold text-text-primary">
                                주요 인사이트
                              </h3>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {data.insights
                                  .slice(0, 3)
                                  .map((insight, index) => (
                                    <motion.div
                                      key={insight.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      className={cn(
                                        "p-4 rounded-xl border",
                                        getInsightColor(
                                          insight.type,
                                          insight.priority
                                        )
                                      )}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          {getInsightIcon(insight.type)}
                                          <span className="text-body-sm font-medium">
                                            {insight.title}
                                          </span>
                                        </div>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() =>
                                            handleDismissInsight(insight.id)
                                          }
                                          className="p-1 rounded hover:bg-black/10 transition-colors"
                                        >
                                          ×
                                        </motion.button>
                                      </div>
                                      <p className="text-body-xs mb-2 opacity-90">
                                        {insight.description}
                                      </p>
                                      <p className="text-body-xs font-medium opacity-95">
                                        💡 {insight.impact}
                                      </p>
                                    </motion.div>
                                  ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* 예측 데이터 */}
                    {data?.predictions && (
                      <motion.div variants={item}>
                        <motion.div
                          variants={cardHover}
                          initial="rest"
                          whileHover="hover"
                        >
                          <Card>
                            <CardHeader>
                              <h3 className="text-heading-md font-semibold text-text-primary">
                                성과 예측
                              </h3>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-body-md font-medium text-primary-900">
                                      다음 달 예측
                                    </h4>
                                    <Badge variant="success" size="sm">
                                      신뢰도{" "}
                                      {data.predictions.nextMonth.confidence}%
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-body-sm">
                                    <div>
                                      <p className="text-primary-700">도달</p>
                                      <p className="font-medium text-primary-900">
                                        {formatNumber(
                                          data.predictions.nextMonth
                                            .expectedReach
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-primary-700">전환</p>
                                      <p className="font-medium text-primary-900">
                                        {formatNumber(
                                          data.predictions.nextMonth
                                            .expectedConversions
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-primary-700">예산</p>
                                      <p className="font-medium text-primary-900">
                                        {formatCurrency(
                                          data.predictions.nextMonth
                                            .expectedSpend
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-primary-700">ROI</p>
                                      <p className="font-medium text-primary-900">
                                        {data.predictions.nextMonth.expectedRoi.toFixed(
                                          1
                                        )}
                                        %
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-body-md font-medium text-blue-900">
                                      분기말 예측
                                    </h4>
                                    <Badge variant="info" size="sm">
                                      신뢰도{" "}
                                      {data.predictions.quarterEnd.confidence}%
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-body-sm">
                                    <div>
                                      <p className="text-blue-700">도달</p>
                                      <p className="font-medium text-blue-900">
                                        {formatNumber(
                                          data.predictions.quarterEnd
                                            .expectedReach
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-blue-700">ROI</p>
                                      <p className="font-medium text-blue-900">
                                        {data.predictions.quarterEnd.expectedRoi.toFixed(
                                          1
                                        )}
                                        %
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 하단: 채널 성과 & 오디언스 인사이트 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 채널별 성과 */}
                  {data?.channelPerformance && (
                    <motion.div variants={item}>
                      <motion.div
                        variants={cardHover}
                        initial="rest"
                        whileHover="hover"
                      >
                        <Card>
                          <CardHeader>
                            <h3 className="text-heading-md font-semibold text-text-primary">
                              채널별 성과
                            </h3>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {data.channelPerformance.map((channel, index) => (
                                <motion.div
                                  key={channel.channel}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-body-md font-medium text-text-primary">
                                        {channel.channel}
                                      </span>
                                      <span className="text-body-sm text-text-secondary">
                                        {channel.share.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-body-sm text-text-secondary mb-2">
                                      <span>
                                        ROI: {channel.roi.toFixed(1)}%
                                      </span>
                                      <span>
                                        참여율:{" "}
                                        {channel.engagementRate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${channel.share}%` }}
                                        transition={{
                                          duration: 1,
                                          delay: index * 0.1,
                                        }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* 오디언스 인사이트 */}
                  {data?.audienceInsights && (
                    <motion.div variants={item}>
                      <motion.div
                        variants={cardHover}
                        initial="rest"
                        whileHover="hover"
                      >
                        <Card>
                          <CardHeader>
                            <h3 className="text-heading-md font-semibold text-text-primary">
                              오디언스 인사이트
                            </h3>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              {/* 기기별 */}
                              <div>
                                <h4 className="text-body-md font-medium text-text-primary mb-3">
                                  기기별 분포
                                </h4>
                                <div className="space-y-2">
                                  {data.audienceInsights.devices.map(
                                    (device, index) => (
                                      <motion.div
                                        key={device.type}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          {getDeviceIcon(device.type)}
                                          <span className="text-body-sm text-text-primary">
                                            {device.type}
                                          </span>
                                        </div>
                                        <span className="text-body-sm font-medium text-text-primary">
                                          {device.percentage}%
                                        </span>
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* 관심사별 */}
                              <div>
                                <h4 className="text-body-md font-medium text-text-primary mb-3">
                                  주요 관심사
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {data.audienceInsights.interests
                                    .slice(0, 6)
                                    .map((interest, index) => (
                                      <motion.div
                                        key={interest.category}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                      >
                                        <Badge
                                          variant="outline"
                                          className="hover:bg-primary-50"
                                        >
                                          {interest.category} (
                                          {interest.percentage}%)
                                        </Badge>
                                      </motion.div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* 전환 깔때기 */}
                {data?.conversionFunnel && (
                  <motion.div variants={item}>
                    <motion.div
                      variants={cardHover}
                      initial="rest"
                      whileHover="hover"
                    >
                      <Card>
                        <CardHeader>
                          <h3 className="text-heading-md font-semibold text-text-primary">
                            전환 깔때기
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {data.conversionFunnel.map((stage, index) => {
                              const maxCount = data.conversionFunnel[0].count;
                              const widthPercentage =
                                (stage.count / maxCount) * 100;

                              return (
                                <motion.div
                                  key={stage.stage}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="relative"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-body-md font-medium text-text-primary">
                                      {stage.stage}
                                    </span>
                                    <div className="text-body-sm text-text-secondary">
                                      {formatNumber(stage.count)} (
                                      {stage.conversionRate.toFixed(1)}%)
                                    </div>
                                  </div>
                                  <div className="h-8 bg-gray-200 rounded-lg overflow-hidden relative">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${widthPercentage}%` }}
                                      transition={{
                                        duration: 1,
                                        delay: index * 0.2,
                                      }}
                                      className={cn(
                                        "h-full rounded-lg flex items-center justify-center text-white text-body-xs font-medium",
                                        index === 0
                                          ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                          : index === 1
                                            ? "bg-gradient-to-r from-purple-500 to-purple-400"
                                            : index === 2
                                              ? "bg-gradient-to-r from-orange-500 to-orange-400"
                                              : index === 3
                                                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                                : index === 4
                                                  ? "bg-gradient-to-r from-green-500 to-green-400"
                                                  : "bg-gradient-to-r from-primary-500 to-primary-400"
                                      )}
                                    >
                                      {stage.conversionRate.toFixed(1)}%
                                    </motion.div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
