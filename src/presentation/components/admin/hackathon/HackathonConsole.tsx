"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import { buildDefaultConfig, DEFAULT_END_TIME, DEFAULT_START_TIME } from "./hackathonAdminUtils";
import { saveConfigPatch } from "./saveConfigPatch";
import {
  useHackathonLiveData,
  useHackathonReferenceData,
  useHackathonSecrets,
} from "./useHackathonAdminData";
import { ControlSection } from "./ControlSection";
import { TeamsSection } from "./TeamsSection";
import { SubmissionsSection } from "./SubmissionsSection";
import { ScoresSection } from "./ScoresSection";
import { VotesSection } from "./VotesSection";
import { ExportSection } from "./ExportSection";

interface HackathonConsoleProps {
  hackathonId: string;
}

/**
 * /admin/hackathon 운영 콘솔. 설정·제출·채점·투표를 실시간 구독해 탭으로 보여줍니다.
 */
export function HackathonConsole({ hackathonId }: HackathonConsoleProps) {
  const live = useHackathonLiveData(hackathonId);
  const reference = useHackathonReferenceData();
  const { secrets, updateCodes, reloadSecrets } = useHackathonSecrets(hackathonId);
  const { config, submissions, scores, votes } = live;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">해커톤 운영</h1>
        <p className="text-sm text-muted-foreground">
          행사 ID <span className="font-mono">{hackathonId}</span>
          {hackathonId !== CURRENT_HACKATHON_ID && " (테스트 행사)"} · 모든 시각은 KST · 실시간 반영
        </p>
      </header>
      {config === undefined && <LoadingBlock />}
      {config === null && (
        <CreateDefaultConfigCard hackathonId={hackathonId} checkinMeetingId={reference.checkinMeetingId} />
      )}
      {config && (
        <Tabs defaultValue="control">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="control">진행 제어</TabsTrigger>
            <TabsTrigger value="teams">팀 & 코드 ({config.teams.length})</TabsTrigger>
            <TabsTrigger value="submissions">제출 현황 ({submissions.length})</TabsTrigger>
            <TabsTrigger value="scores">AI 채점 ({scores.length})</TabsTrigger>
            <TabsTrigger value="votes">휴먼 투표 ({votes.length})</TabsTrigger>
            <TabsTrigger value="export">내보내기</TabsTrigger>
          </TabsList>
          <TabsContent value="control">
            <ControlSection
              hackathonId={hackathonId}
              config={config}
              meetings={reference.meetings}
              checkinMeetingId={reference.checkinMeetingId}
            />
          </TabsContent>
          <TabsContent value="teams">
            <TeamsSection
              hackathonId={hackathonId}
              config={config}
              members={reference.members}
              submissions={submissions}
              secrets={secrets}
              updateCodes={updateCodes}
              reloadSecrets={reloadSecrets}
            />
          </TabsContent>
          <TabsContent value="submissions">
            <SubmissionsSection teams={config.teams} submissions={submissions} />
          </TabsContent>
          <TabsContent value="scores">
            <ScoresSection teams={config.teams} submissions={submissions} scores={scores} />
          </TabsContent>
          <TabsContent value="votes">
            <VotesSection teams={config.teams} votes={votes} />
          </TabsContent>
          <TabsContent value="export">
            <ExportSection config={config} submissions={submissions} scores={scores} votes={votes} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> 행사 설정을 불러오는 중…
    </div>
  );
}

function CreateDefaultConfigCard(props: { hackathonId: string; checkinMeetingId: string | null }) {
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    const config = buildDefaultConfig({ now: Date.now(), meetingId: props.checkinMeetingId });
    await saveConfigPatch(props.hackathonId, config, "기본 설정을 만들었습니다.");
    setCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">행사 설정이 없습니다</CardTitle>
        <CardDescription>
          hackathons/{props.hackathonId} 문서가 없습니다. 오늘 {DEFAULT_START_TIME}~{DEFAULT_END_TIME} (KST), 팀 없음으로
          기본 설정을 만든 뒤 팀을 추가하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={create} disabled={creating}>
          {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          기본 설정 만들기
        </Button>
      </CardContent>
    </Card>
  );
}
