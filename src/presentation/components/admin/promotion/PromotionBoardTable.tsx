"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PromotionBoard, PromotionBoardSnapshot, PromotionBoardStatus, PromotionBoardType } from "@/domain/entities";
import { GOOGLE_SHEETS_URL } from "@/infrastructure/external/knouBoards/boardSheetSource";

type PromotionBoardTableProps = {
  snapshot: PromotionBoardSnapshot;
  isRefreshing: boolean;
  error: string;
  onRefresh: () => void;
  onSelectionChange: (boards: PromotionBoard[]) => void;
};

type SortKey = "type" | "name" | "status" | "lastChecked" | "firstPostDate" | "firstPostCount" | "totalPosts";
type SortState = { key: SortKey; direction: "asc" | "desc" } | null;

const statusBadgeClass: Record<PromotionBoardStatus, string> = {
  "준비됨": "bg-emerald-500 hover:bg-emerald-500 text-white border-0",
  "확인 필요": "bg-amber-500 hover:bg-amber-500 text-white border-0",
  "게시판 없음": "bg-destructive hover:bg-destructive text-white border-0",
};

const countFormatter = new Intl.NumberFormat("ko-KR");

function CountCell({ value }: { value: number | null }) {
  return value === null
    ? <span className="text-muted-foreground">—</span>
    : <span className="font-mono text-xs font-medium">{countFormatter.format(value)}</span>;
}

function formatSyncedAt(value: string) {
  if (!value.includes("T")) return `${value} 기준`;
  return `${new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))} 동기화`;
}

function sortValue(board: PromotionBoard, key: SortKey): string | number {
  switch (key) {
    case "type": return board.type;
    case "name": return board.name;
    case "status": return board.status;
    case "lastChecked": return board.lastChecked;
    case "firstPostDate": return board.postings[0]?.postedAt ?? "";
    case "firstPostCount": return board.postings[0]?.count ?? -1;
    case "totalPosts": return board.totalPosts ?? -1;
    default: return "";
  }
}

/**
 * 방송대 홍보 게시 대상(학과·지역대학 게시판) 현황판.
 * 검색·유형 필터·정렬·페이지네이션·행 선택을 별도 라이브러리 없이 직접 구현합니다.
 */
export function PromotionBoardTable({ snapshot, isRefreshing, error, onRefresh, onSelectionChange }: PromotionBoardTableProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"전체" | PromotionBoardType>("전체");
  const [sort, setSort] = useState<SortState>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return snapshot.boards.filter((board) => {
      if (typeFilter !== "전체" && board.type !== typeFilter) return false;
      if (!keyword) return true;
      const haystack = `${board.group} ${board.name} ${board.boardName} ${board.status} ${board.note}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [snapshot.boards, typeFilter, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return 0;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = sorted.slice(currentPageIndex * pageSize, currentPageIndex * pageSize + pageSize);

  useEffect(() => {
    setPageIndex(0);
  }, [query, typeFilter, pageSize]);

  useEffect(() => {
    const validIds = new Set(snapshot.boards.map((board) => board.id));
    onSelectionChange(snapshot.boards.filter((board) => selectedIds.has(board.id) && validIds.has(board.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, snapshot.boards]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const toggleRow = (boardId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  };

  // 검색·유형 필터에 걸린 전체 게시판(모든 페이지)을 대상으로 전체 선택/해제합니다.
  const selectableFilteredIds = filtered.filter((board) => board.status !== "게시판 없음").map((board) => board.id);
  const isAllFilteredSelected = selectableFilteredIds.length > 0 && selectableFilteredIds.every((id) => selectedIds.has(id));
  const isSomeFilteredSelected = selectableFilteredIds.some((id) => selectedIds.has(id));

  const toggleAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isAllFilteredSelected) {
        selectableFilteredIds.forEach((id) => next.delete(id));
      } else {
        selectableFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const typeTabs: Array<{ label: "전체" | PromotionBoardType; count: number }> = [
    { label: "전체", count: snapshot.boards.length },
    { label: "학과", count: snapshot.boards.filter((board) => board.type === "학과").length },
    { label: "지역대학", count: snapshot.boards.filter((board) => board.type === "지역대학").length },
  ];

  return (
    <div className="rounded-md border">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold">게시판 미리보기</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={error ? "text-amber-600" : snapshot.sourceLabel === "Google Sheets" ? "text-emerald-600" : "text-muted-foreground"}>
                {error ? "Google Sheets 연결 오류 · 저장된 스냅샷 표시 중" : `${snapshot.sourceLabel} · ${formatSyncedAt(snapshot.syncedAt)}`}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">1분마다 자동 갱신</span>
              <a className="font-medium text-primary hover:underline" href={GOOGLE_SHEETS_URL} target="_blank" rel="noreferrer">원본 시트</a>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button variant="outline" size="sm" disabled={isRefreshing} onClick={onRefresh}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "동기화 중…" : "지금 갱신"}
            </Button>
            <div className="relative w-full sm:w-48">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="학과·지역 검색" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 overflow-x-auto" role="group" aria-label="게시판 유형 필터">
            {typeTabs.map((tab) => (
              <Button
                key={tab.label}
                variant={typeFilter === tab.label ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter(tab.label)}
              >
                {tab.label}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-foreground">{tab.count}</span>
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
            disabled={selectableFilteredIds.length === 0}
            onClick={toggleAllFiltered}
          >
            {isAllFilteredSelected ? "전체 해제" : `전체 선택${typeFilter === "전체" ? "" : ` (${typeFilter})`}`}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 p-0 text-center">
              <label
                className="flex cursor-pointer items-center justify-center px-2 py-2"
                title="검색된 게시판 전체 선택/해제"
              >
                <input
                  className="size-3.5 cursor-pointer accent-primary"
                  aria-label="검색된 게시판 전체 선택/해제"
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !isAllFilteredSelected && isSomeFilteredSelected;
                  }}
                  onChange={toggleAllFiltered}
                />
              </label>
            </TableHead>
            <SortableHead label="구분" sortKey="type" sort={sort} onSort={toggleSort} />
            <SortableHead label="게시 대상" sortKey="name" sort={sort} onSort={toggleSort} />
            <SortableHead label="상태" sortKey="status" sort={sort} onSort={toggleSort} />
            <SortableHead label="마지막 확인" sortKey="lastChecked" sort={sort} onSort={toggleSort} />
            <SortableHead label="1차 게시 날짜" sortKey="firstPostDate" sort={sort} onSort={toggleSort} />
            <TableHead>1차 게시 링크</TableHead>
            <SortableHead label="1차 소계" sortKey="firstPostCount" sort={sort} onSort={toggleSort} className="text-right" />
            <SortableHead label="총계" sortKey="totalPosts" sort={sort} onSort={toggleSort} className="text-right" />
            <TableHead>게시판</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length > 0 ? pageRows.map((board) => (
            <TableRow key={board.id} data-state={selectedIds.has(board.id) ? "selected" : undefined}>
              <TableCell className="p-0 text-center">
                <label className={`flex items-center justify-center px-2 py-2 ${board.status === "게시판 없음" ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    className="size-3.5 cursor-pointer accent-primary disabled:cursor-not-allowed"
                    aria-label={`${board.name} 선택`}
                    type="checkbox"
                    checked={selectedIds.has(board.id)}
                    disabled={board.status === "게시판 없음"}
                    onChange={() => toggleRow(board.id)}
                  />
                </label>
              </TableCell>
              <TableCell><Badge variant="outline">{board.type}</Badge></TableCell>
              <TableCell className="whitespace-normal">
                <strong className="block text-xs">{board.name}</strong>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{board.group} · {board.boardName}</span>
              </TableCell>
              <TableCell><Badge className={statusBadgeClass[board.status]}>{board.status}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{board.lastChecked || "—"}</TableCell>
              <TableCell className="font-mono text-xs">
                {board.postings[0]?.postedAt || <span className="text-muted-foreground">미게시</span>}
              </TableCell>
              <TableCell>
                {board.postings[0]?.postUrl ? (
                  <a className="text-xs font-medium text-primary hover:underline" href={board.postings[0].postUrl} target="_blank" rel="noreferrer">글 URL 열기</a>
                ) : (
                  <span className="text-xs text-muted-foreground">URL 없음</span>
                )}
              </TableCell>
              <TableCell className="text-right"><CountCell value={board.postings[0]?.count ?? null} /></TableCell>
              <TableCell className="text-right"><CountCell value={board.totalPosts} /></TableCell>
              <TableCell>
                <a className="text-xs font-medium text-primary hover:underline" href={board.boardUrl} target="_blank" rel="noreferrer" title={board.note || `${board.name} 게시판 열기`}>
                  {board.status === "게시판 없음" ? "홈페이지" : "게시판 열기"}
                </a>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">검색 조건에 맞는 게시판이 없습니다.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{sorted.length}개 게시판 · {selectedIds.size}개 선택</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">페이지당
            <select
              className="h-7 rounded-md border bg-transparent px-2 text-xs"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              {[5, 10, 25].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <span>{currentPageIndex + 1} / {pageCount} 페이지</span>
          <Button variant="outline" size="icon-sm" disabled={currentPageIndex === 0} onClick={() => setPageIndex(currentPageIndex - 1)} aria-label="이전 페이지">‹</Button>
          <Button variant="outline" size="icon-sm" disabled={currentPageIndex >= pageCount - 1} onClick={() => setPageIndex(currentPageIndex + 1)} aria-label="다음 페이지">›</Button>
        </div>
      </div>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isSorted = sort?.key === sortKey;
  return (
    <TableHead className={className} aria-sort={isSorted ? (sort?.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span className="text-[10px] text-muted-foreground">{isSorted ? (sort?.direction === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </TableHead>
  );
}
