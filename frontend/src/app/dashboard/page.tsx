"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileText,
  Megaphone,
  Users,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Header } from "@/presentation/components/layout/Navigation";
import {
  StatCard,
  Card,
  CardHeader,
  CardContent,
} from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import {
  InteractiveCard,
  TouchFeedback,
} from "@/presentation/components/ui/Interactions";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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

export default function DashboardPage() {
  // 실제로는 API에서 데이터를 가져와야 합니다
  const stats = [
    {
      label: "총 콘텐츠",
      value: formatNumber(1234),
      change: { value: 12.5, type: "increase" as const },
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: "활성 캠페인",
      value: formatNumber(42),
      change: { value: 5.2, type: "increase" as const },
      icon: <Megaphone className="w-6 h-6" />,
    },
    {
      label: "총 도달",
      value: formatNumber(523456),
      change: { value: 8.7, type: "increase" as const },
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: "전환율",
      value: "3.24%",
      change: { value: 2.1, type: "decrease" as const },
      icon: <TrendingUp className="w-6 h-6" />,
    },
  ];

  const recentContents = [
    {
      id: "1",
      title: "2024 여름 세일 프로모션",
      type: "Instagram",
      status: "published",
      engagement: 4.5,
      date: "2024-06-15",
    },
    {
      id: "2",
      title: "신제품 출시 캠페인",
      type: "Facebook",
      status: "draft",
      engagement: 0,
      date: "2024-06-14",
    },
    {
      id: "3",
      title: "고객 감사 이벤트",
      type: "Email",
      status: "scheduled",
      engagement: 3.2,
      date: "2024-06-13",
    },
  ];

  const activeCampaigns = [
    {
      id: "1",
      name: "여름 세일 캠페인",
      progress: 65,
      budget: 5000000,
      spent: 3250000,
      performance: "good",
    },
    {
      id: "2",
      name: "신규 고객 확보",
      progress: 42,
      budget: 3000000,
      spent: 1260000,
      performance: "average",
    },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      published: { label: "게시됨", variant: "success" as const },
      draft: { label: "초안", variant: "secondary" as const },
      scheduled: { label: "예약됨", variant: "info" as const },
    };

    const { label, variant } = config[status as keyof typeof config];
    return (
      <Badge variant={variant} size="sm">
        {label}
      </Badge>
    );
  };

  const getPerformanceBadge = (performance: string) => {
    const config = {
      good: { label: "양호", variant: "success" as const },
      average: { label: "보통", variant: "warning" as const },
      poor: { label: "부진", variant: "error" as const },
    };

    const { label, variant } = config[performance as keyof typeof config];
    return (
      <Badge variant={variant} size="sm">
        {label}
      </Badge>
    );
  };

  return (
    <>
      <Header
        title="대시보드"
        subtitle="마케팅 성과를 한눈에 확인하세요"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                // 다양한 토스트 테스트
                toast.success("성공! 토스트가 정상적으로 작동합니다 🎉");
                setTimeout(() => toast.error("에러 메시지 예시입니다"), 1000);
                setTimeout(() => toast.info("정보 메시지입니다"), 2000);
                setTimeout(() => toast.warning("경고 메시지입니다"), 3000);
                setTimeout(() => toast("일반 메시지입니다"), 4000);
              }}
            >
              토스트 테스트
            </Button>
            <Button size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              콘텐츠 생성
            </Button>
          </div>
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
            {/* 통계 카드 */}
            <motion.div
              variants={item}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {stats.map((stat, index) => (
                <InteractiveCard
                  key={index}
                  hoverScale={1.03}
                  tapScale={0.97}
                  glowOnHover={true}
                >
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                  />
                </InteractiveCard>
              ))}
            </motion.div>

            {/* 차트 영역 */}
            <motion.div
              variants={item}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* 최근 콘텐츠 */}
              <InteractiveCard
                hoverScale={1.01}
                tapScale={0.99}
                glowOnHover={true}
              >
                <Card className="shadow-md border-0">
                  <CardHeader
                    title="최근 콘텐츠"
                    action={
                      <TouchFeedback feedbackScale={0.95}>
                        <Button
                          variant="ghost"
                          size="xs"
                          rightIcon={<ArrowUpRight className="w-3 h-3" />}
                        >
                          전체보기
                        </Button>
                      </TouchFeedback>
                    }
                  />
                  <CardContent>
                    <div className="space-y-3">
                      {recentContents.map((content) => (
                        <div
                          key={content.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body-md font-medium text-text-primary truncate">
                              {content.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-body-xs text-text-tertiary">
                                {content.type}
                              </span>
                              <span className="text-body-xs text-text-tertiary">
                                {content.date}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {content.engagement > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-body-sm font-medium">
                                  {content.engagement}%
                                </span>
                                <TrendingUp className="w-4 h-4 text-success" />
                              </div>
                            )}
                            {getStatusBadge(content.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </InteractiveCard>

              {/* 활성 캠페인 */}
              <InteractiveCard
                hoverScale={1.01}
                tapScale={0.99}
                glowOnHover={true}
              >
                <Card className="shadow-md border-0">
                  <CardHeader
                    title="활성 캠페인"
                    action={
                      <TouchFeedback feedbackScale={0.95}>
                        <Button
                          variant="ghost"
                          size="xs"
                          rightIcon={<ArrowUpRight className="w-3 h-3" />}
                        >
                          전체보기
                        </Button>
                      </TouchFeedback>
                    }
                  />
                  <CardContent>
                    <div className="space-y-4">
                      {activeCampaigns.map((campaign) => (
                        <div key={campaign.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-body-md font-medium text-text-primary">
                              {campaign.name}
                            </h4>
                            {getPerformanceBadge(campaign.performance)}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-body-xs">
                              <span className="text-text-secondary">
                                진행률
                              </span>
                              <span className="font-medium">
                                {campaign.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${campaign.progress}%` }}
                                transition={{
                                  duration: 1,
                                  ease: "easeOut",
                                }}
                                className="h-full bg-primary-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between text-body-sm">
                            <span className="text-text-secondary">
                              예산 사용
                            </span>
                            <span className="font-medium">
                              {formatCurrency(campaign.spent)} /{" "}
                              {formatCurrency(campaign.budget)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </InteractiveCard>
            </motion.div>

            {/* 추가 차트나 위젯을 여기에 추가할 수 있습니다 */}
          </motion.div>
        </div>
      </main>
    </>
  );
}
