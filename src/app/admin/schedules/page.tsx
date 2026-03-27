"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { monthlyScheduleAdminRepository } from "@/infrastructure/repositories/admin/monthlyScheduleAdminRepository";
import { DEFAULT_MONTHLY_SCHEDULES } from "@/infrastructure/repositories/monthlyScheduleRepository";
import type { MonthlySchedule } from "@/domain/entities";

/**
 * 월별 일정 라벨
 */
const PHASE_LABELS: Record<number, string> = {
  0: "0개월차 프로그램",
  1: "1개월차 프로그램",
  2: "2개월차 프로그램",
  3: "3개월차 프로그램",
  4: "4개월차 프로그램",
  5: "5개월차 프로그램",
  6: "6개월차 프로그램",
  7: "매월 소모임 프로그램",
};

/**
 * 월별 일정 관리 페이지 (실시간 저장)
 */
export default function AdminSchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [savingPhase, setSavingPhase] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<MonthlySchedule[]>([]);
  const [newActivities, setNewActivities] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await monthlyScheduleAdminRepository.getSchedules();
        // 기본값과 병합하여 모든 phase가 있도록 보장
        const mergedSchedules = DEFAULT_MONTHLY_SCHEDULES.map((defaultSchedule) => {
          const existing = data.find((s) => s.phase === defaultSchedule.phase);
          return existing || defaultSchedule;
        });
        setSchedules(mergedSchedules);
      } catch (error) {
        console.error("Failed to fetch schedules:", error);
        toast.error("월별 일정을 불러오는데 실패했습니다.");
        setSchedules(DEFAULT_MONTHLY_SCHEDULES);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 단일 일정 저장 (실시간)
  const saveSchedule = async (schedule: MonthlySchedule) => {
    setSavingPhase(schedule.phase);
    try {
      await monthlyScheduleAdminRepository.updateSchedule(schedule);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSavingPhase(null);
    }
  };

  const addActivity = async (phase: number) => {
    const activity = newActivities[phase]?.trim();
    if (!activity) return;

    const updatedSchedule = schedules.find((s) => s.phase === phase);
    if (!updatedSchedule) return;

    const newSchedule = {
      ...updatedSchedule,
      activities: [...updatedSchedule.activities, activity],
    };

    setSchedules((prev) =>
      prev.map((s) => (s.phase === phase ? newSchedule : s))
    );
    setNewActivities((prev) => ({ ...prev, [phase]: "" }));

    // 실시간 저장
    await saveSchedule(newSchedule);
  };

  const removeActivity = async (phase: number, index: number) => {
    const updatedSchedule = schedules.find((s) => s.phase === phase);
    if (!updatedSchedule) return;

    const newSchedule = {
      ...updatedSchedule,
      activities: updatedSchedule.activities.filter((_, i) => i !== index),
    };

    setSchedules((prev) =>
      prev.map((s) => (s.phase === phase ? newSchedule : s))
    );

    // 실시간 저장
    await saveSchedule(newSchedule);
  };

  const handleKeyDown = (e: React.KeyboardEvent, phase: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addActivity(phase);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">월별 일정 관리</h2>
        <p className="text-sm text-muted-foreground">
          About Us 페이지에 표시되는 월별 일정을 관리합니다. 변경 사항은 자동으로 저장됩니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {schedules.map((schedule) => (
          <Card key={schedule.phase}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {PHASE_LABELS[schedule.phase]}
                  </CardTitle>
                  {savingPhase === schedule.phase && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-1">
                  {schedule.months.split(",").map((month, idx) => (
                    <Badge key={idx} variant="secondary">
                      {month.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardDescription>
                활동 내용을 추가하세요. About Us 페이지에 bullet point로 표시됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 기존 활동 목록 */}
              {schedule.activities.length > 0 && (
                <div className="space-y-2">
                  {schedule.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-6 rounded-md"
                    >
                      <span className="flex-1 text-sm">• {activity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeActivity(schedule.phase, index)}
                        disabled={savingPhase === schedule.phase}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 활동 추가 */}
              <div className="flex gap-2">
                <Input
                  placeholder="새 활동 추가..."
                  value={newActivities[schedule.phase] || ""}
                  onChange={(e) =>
                    setNewActivities((prev) => ({
                      ...prev,
                      [schedule.phase]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, schedule.phase)}
                  className="flex-1"
                  disabled={savingPhase === schedule.phase}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addActivity(schedule.phase)}
                  disabled={!newActivities[schedule.phase]?.trim() || savingPhase === schedule.phase}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
