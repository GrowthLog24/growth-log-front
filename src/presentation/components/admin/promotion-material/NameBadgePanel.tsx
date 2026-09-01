"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2, Search, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import type { Member } from "@/domain/entities";
import {
  BADGES_PER_SHEET,
  BLANK_BADGE_SHEET_LIMIT,
  downloadBlankNameBadgePdf,
  downloadNameBadgePdf,
  toBadgeRoleText,
  type NameBadgeMember,
} from "@/shared/utils/nameBadgePdf";
import { buildMemberAchievementUrl } from "@/shared/utils/memberLink";

/** 기수 필터의 "전체" 값 */
const ALL_GENERATIONS = "all";

/** 무기명 명찰 장수 입력의 기본값 */
const DEFAULT_BLANK_SHEETS = "1";

/**
 * 회원 명찰 생성 패널
 *
 * 회원을 골라 명찰 PDF를 만듭니다. A4 한 장에 2명씩 배치되며, 각 명찰의 QR은
 * 해당 회원의 개인 업적 페이지로 연결됩니다.
 *
 * @returns {React.ReactElement} 명찰 생성 UI
 */
export function NameBadgePanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [blankGenerating, setBlankGenerating] = useState(false);
  const [blankSheets, setBlankSheets] = useState(DEFAULT_BLANK_SHEETS);

  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState(ALL_GENERATIONS);
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        setMembers(await memberAdminRepository.getAll());
      } catch (error) {
        console.error("Failed to fetch members:", error);
        toast.error("회원 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  /** 등록된 기수 목록 (내림차순) */
  const generations = useMemo(() => {
    const unique = new Set(members.map((member) => member.generation));
    return [...unique].sort((a, b) => b - a);
  }, [members]);

  /** 필터를 통과한 회원 목록 */
  const filteredMembers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      if (activeOnly && !member.isActive) return false;
      if (
        generationFilter !== ALL_GENERATIONS &&
        member.generation !== Number(generationFilter)
      ) {
        return false;
      }
      if (!keyword) return true;
      return (
        member.memberName.toLowerCase().includes(keyword) ||
        (member.field ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [members, searchQuery, generationFilter, activeOnly]);

  /** 필터를 통과한 회원 중 선택된 회원 */
  const selectedMembers = useMemo(
    () => filteredMembers.filter((member) => selectedIds.has(member.id)),
    [filteredMembers, selectedIds]
  );

  const isAllFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) => selectedIds.has(member.id));

  const toggleMember = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      for (const member of filteredMembers) {
        if (isAllFilteredSelected) {
          next.delete(member.id);
        } else {
          next.add(member.id);
        }
      }
      return next;
    });
  };

  /** 입력한 장수 (정수가 아니거나 범위를 벗어나면 NaN 취급) */
  const blankSheetCount = Number(blankSheets);
  const isBlankSheetCountValid =
    Number.isInteger(blankSheetCount) &&
    blankSheetCount >= 1 &&
    blankSheetCount <= BLANK_BADGE_SHEET_LIMIT;

  /**
   * 이름·직무 없이 QR만 있는 무기명 명찰을 만들어 내려받습니다.
   *
   * 게스트에게 수기로 이름을 적어 나눠 줄 때 씁니다.
   */
  const generateBlank = async () => {
    setBlankGenerating(true);
    try {
      await downloadBlankNameBadgePdf(blankSheetCount);
      toast.success(
        `무기명 명찰 ${blankSheetCount}장(${blankSheetCount * BADGES_PER_SHEET}개)을 만들었습니다.`
      );
    } catch (error) {
      console.error("Failed to generate blank name badges:", error);
      toast.error(
        error instanceof Error ? error.message : "명찰을 만들지 못했습니다."
      );
    } finally {
      setBlankGenerating(false);
    }
  };

  /**
   * 회원 목록으로 명찰 PDF를 만들어 내려받습니다.
   *
   * @param {readonly Member[]} targets - 명찰을 만들 회원
   */
  const generate = async (targets: readonly Member[]) => {
    if (targets.length === 0) {
      toast.error("명찰을 만들 회원을 한 명 이상 선택해주세요.");
      return;
    }

    setGenerating(true);
    try {
      const badgeMembers: NameBadgeMember[] = targets.map((member) => ({
        memberName: member.memberName,
        generation: member.generation,
        field: member.field,
      }));
      await downloadNameBadgePdf(badgeMembers);

      const sheetCount = Math.ceil(targets.length / BADGES_PER_SHEET);
      toast.success(`명찰 ${targets.length}명분(${sheetCount}장)을 만들었습니다.`);
    } catch (error) {
      console.error("Failed to generate name badges:", error);
      toast.error(
        error instanceof Error ? error.message : "명찰을 만들지 못했습니다."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름, 기술 분야로 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={generationFilter} onValueChange={setGenerationFilter}>
          <SelectTrigger className="md:w-36">
            <SelectValue placeholder="기수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GENERATIONS}>전체 기수</SelectItem>
            {generations.map((generation) => (
              <SelectItem key={generation} value={String(generation)}>
                {generation}기
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5 cursor-pointer accent-primary"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          가입 회원만
        </label>
      </div>

      {/* 생성 버튼 */}
      <div className="flex flex-col gap-2 rounded-lg border bg-gray-6/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMembers.length}명 중 {selectedMembers.length}명 선택 · A4 한
          장에 {BADGES_PER_SHEET}명씩 들어갑니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* 무기명 명찰: 게스트에게 수기로 이름을 적어 나눠 줄 때 씁니다. */}
          <Button
            variant="ghost"
            disabled={blankGenerating || !isBlankSheetCountValid}
            onClick={generateBlank}
            title="이름·직무 없이 QR만 있는 명찰입니다. 게스트에게 수기로 이름을 적어 나눠 줄 때 사용하세요."
          >
            {blankGenerating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            무기명 명찰
          </Button>
          <label className="mr-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Input
              type="number"
              min={1}
              max={BLANK_BADGE_SHEET_LIMIT}
              value={blankSheets}
              onChange={(event) => setBlankSheets(event.target.value)}
              aria-label="무기명 명찰 장수"
              className="h-9 w-16"
            />
            장
          </label>

          <Button
            variant="outline"
            disabled={generating || filteredMembers.length === 0}
            onClick={() => generate(filteredMembers)}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            전체 생성 ({filteredMembers.length}명)
          </Button>
          <Button
            disabled={generating || selectedMembers.length === 0}
            onClick={() => generate(selectedMembers)}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            선택 {selectedMembers.length}명 생성
          </Button>
        </div>
      </div>

      {/* 회원 목록 */}
      {filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          조건에 맞는 회원이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-6">
              <tr>
                <th className="w-10 p-2">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label="목록 전체 선택/해제"
                      className="size-3.5 cursor-pointer accent-primary"
                      checked={isAllFilteredSelected}
                      onChange={toggleAllFiltered}
                    />
                  </label>
                </th>
                <th className="p-2 text-left font-medium">이름</th>
                <th className="p-2 text-left font-medium">기수</th>
                <th className="p-2 text-left font-medium">직무 (명찰 표기)</th>
                <th className="p-2 text-left font-medium">QR 연결 주소</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMembers.map((member) => {
                const roleText = toBadgeRoleText(member.field);
                return (
                  <tr
                    key={member.id}
                    className="cursor-pointer hover:bg-gray-6/50"
                    onClick={() => toggleMember(member.id)}
                  >
                    <td className="p-2">
                      <label
                        className="flex items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`${member.memberName} 선택`}
                          className="size-3.5 cursor-pointer accent-primary"
                          checked={selectedIds.has(member.id)}
                          onChange={() => toggleMember(member.id)}
                        />
                      </label>
                    </td>
                    <td className="p-2 font-medium">
                      <span className="flex items-center gap-2">
                        {member.memberName}
                        {!member.isActive && (
                          <Badge variant="outline" className="text-xs">
                            미가입
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="p-2">{member.generation}기</td>
                    <td className="p-2">
                      {roleText ? (
                        roleText
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          기술 분야 없음 (직무 없이 생성)
                        </span>
                      )}
                    </td>
                    <td className="max-w-[280px] truncate p-2 text-xs text-muted-foreground">
                      {decodeURIComponent(
                        buildMemberAchievementUrl(
                          member.generation,
                          member.memberName
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
