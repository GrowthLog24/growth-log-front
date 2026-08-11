"use client";

import { useState } from "react";
import { CardNewsMaker } from "./CardNewsMaker";

const promptExample = `$growth-log-cardnews
첨부한 원문을 바탕으로 Growth Log 카드뉴스를 만들어줘.
블로그 URL이면 본문 사진도 가져와 카드에 연결해줘.
개발자 또는 개발에 관심이 있고 함께 성장할 커뮤니티를 찾는 사람이
흥미를 느끼게 구성해줘. 완성된 프롬프트.md, 캡션.md, 원문.md를 ZIP으로 묶어줘.`;

export default function AdminInstagramContentPage() {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="-m-6 min-h-[calc(100vh-3.5rem)] bg-[#F5F5F5] text-[#1A1A1A]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E6E6] bg-[#FAFAFA] px-8 py-5">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#00962B]">
            INSTAGRAM CONTENT
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            카드뉴스 제작
          </h1>
        </div>
        <div className="flex border border-[#BDBDBD] bg-white p-1">
          <button
            type="button"
            className={`cursor-pointer px-4 py-2 text-sm font-bold ${
              !editorOpen ? "bg-[#1A1A1A] text-white" : "text-[#666]"
            }`}
            onClick={() => setEditorOpen(false)}
          >
            처음부터 보기
          </button>
          <button
            type="button"
            className={`cursor-pointer px-4 py-2 text-sm font-bold ${
              editorOpen ? "bg-[#1A1A1A] text-white" : "text-[#666]"
            }`}
            onClick={() => setEditorOpen(true)}
          >
            제작기 열기
          </button>
        </div>
      </header>

      <main
        className="mx-auto max-w-6xl px-8 py-12"
        hidden={editorOpen}
      >
          <section className="max-w-3xl">
            <p className="text-sm font-bold text-[#00962B]">처음 사용하는 분께</p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.035em]">
              원문에서 프롬프트를 만들고,
              <br />ZIP 하나로 카드뉴스를 완성하세요.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#666]">
              통합 스킬이 카피·출처·디자인 규칙을 정리하고, 제작기는 그 결과를
              4장부터 최대 10장까지 편집 가능한 카드로 바꿉니다.
            </p>
          </section>

          <section className="mt-12 grid border-y border-[#E6E6E6] md:grid-cols-3">
            {[
              ["01", "스킬 설치", "ZIP을 내려받아 Codex 또는 Claude의 스킬 폴더에 압축 해제합니다."],
              ["02", "프롬프트 생성", "원문을 첨부하고 아래 요청문으로 에디터용 ZIP을 만듭니다."],
              ["03", "ZIP 가져오기", "제작기에서 ZIP을 끌어놓고 카드 수와 문구를 확인한 뒤 저장합니다."],
            ].map(([number, title, description]) => (
              <article
                key={number}
                className="border-[#E6E6E6] py-7 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"
              >
                <p className="font-mono text-sm font-bold text-[#00962B]">{number}</p>
                <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#666]">{description}</p>
              </article>
            ))}
          </section>

          <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="bg-[#1A1A1A] p-7 text-white">
              <p className="text-xs font-extrabold tracking-[0.18em] text-[#75D565]">
                DOWNLOAD
              </p>
              <h3 className="mt-3 text-2xl font-extrabold">통합 카드뉴스 스킬</h3>
              <p className="mt-3 text-sm leading-6 text-[#DCDCDC]">
                SKILL.md, 통합 디자인 규칙, 에디터 형식, 검수표, 검증 스크립트와
                브랜드 에셋이 들어 있습니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  className="bg-[#75D565] px-4 py-3 text-sm font-extrabold text-[#1A1A1A]"
                  href="/admin/instagram-content/growth-log-cardnews-skill.zip"
                  download
                >
                  스킬 ZIP 다운로드
                </a>
              </div>
              <div className="mt-7 border-t border-[#3A3A3A] pt-5 text-xs leading-6 text-[#BDBDBD]">
                <p>Codex: ~/.codex/skills/growth-log-cardnews/</p>
                <p>Claude Code: .claude/skills/growth-log-cardnews/</p>
              </div>
            </div>

            <div className="border-t-4 border-[#00962B] bg-[#FAFAFA] p-7">
              <p className="text-xs font-extrabold tracking-[0.18em] text-[#00962B]">
                PROMPT
              </p>
              <h3 className="mt-3 text-xl font-extrabold">설치 후 이렇게 요청하세요</h3>
              <pre className="mt-5 overflow-x-auto whitespace-pre-wrap border-y border-[#E6E6E6] py-5 text-sm leading-7 text-[#3A3A3A]">
                {promptExample}
              </pre>
              <p className="mt-4 text-sm leading-6 text-[#666]">
                생성된 ZIP에는 <strong>프롬프트.md</strong>와 참조한 사진이 있어야 합니다. 여러 MD가
                들어 있어도 제작기에서 드롭다운으로 선택할 수 있습니다.
              </p>
            </div>
          </section>

          <section className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-[#E6E6E6] pt-8">
            <div>
              <h3 className="text-xl font-extrabold">준비가 끝났나요?</h3>
              <p className="mt-1 text-sm text-[#666]">
                ZIP을 가져오면 장수도 프롬프트에 맞춰 자동으로 조정됩니다.
              </p>
            </div>
            <button
              type="button"
              className="bg-[#1A1A1A] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#00962B]"
              onClick={() => setEditorOpen(true)}
            >
              카드뉴스 제작 시작
            </button>
          </section>
      </main>

      <div hidden={!editorOpen}>
        <CardNewsMaker active={editorOpen} />
      </div>
    </div>
  );
}
