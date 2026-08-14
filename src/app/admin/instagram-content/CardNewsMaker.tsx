"use client";

import { useCallback, useEffect, useRef } from "react";
import { initCardNewsMaker, type CardNewsMakerActions } from "./cardnews-maker";
import "./cardnews-maker.css";

type EditorAction = <Action extends keyof CardNewsMakerActions>(
  name: Action,
  ...args: Parameters<CardNewsMakerActions[Action]>
) => void;

const CardToolbar = ({ label, cardId, photoId, run }: { label: string; cardId: string; photoId?: string; run: EditorAction }) => (
  <div className="lbl">
    <span>{label}</span>
    <span className="ph-ctl">
      {photoId && <>
        <button type="button" className="btn sec" onClick={() => run("pickById", photoId)}>사진</button>
        <button type="button" className="btn sec" onClick={() => run("clearById", photoId)}>지우기</button>
      </>}
      <button type="button" className="btn sec" onClick={() => run("exp", cardId)} title="이 카드 한 장만 저장">저장</button>
    </span>
  </div>
);

const BrowserFrame = ({ id, label }: { id: string; label: string }) => (
  <div className="frame">
    <div className="chrome"><i /><i /><i /></div>
    <div className="ph pframe" id={id} data-label={label} />
  </div>
);

const EditorMarkup = ({ run }: { run: EditorAction }) => (
  <>
    <div id={"toast"}></div>
    <div id={"phPanel"}>
      <span className={"lbl"}>
        {"크기"}
      </span>
      <input type={"range"} id={"phZoom"} min={"100"} max={"400"} defaultValue={"100"} onInput={(event) => run("phZoomInput", event.currentTarget.value)} />
      <span className={"val"} id={"phZoomVal"}>
        {"100%"}
      </span>
      <button type={"button"} onClick={() => run("phFit")}>
        {"맞춤"}
      </button>
      <span className={"sep"}></span>
      <button type={"button"} onClick={() => run("phReplace")}>
        {"사진 교체"}
      </button>
      <button type={"button"} className={"warn"} onClick={() => run("phDelete")}>
        {"삭제"}
      </button>
    </div>
    <div id={"importModal"} className={"import-modal"} role={"dialog"} aria-modal={"true"} aria-labelledby={"importTitle"} hidden>
      <div className={"import-backdrop"} onClick={() => run("closeImportModal")}></div>
      <section className={"import-dialog"}>
        <div className={"import-head"}>
          <div>
            <p className={"import-kicker"}>
              {"PROMPT IMPORT"}
            </p>
            <h2 className={"import-title"} id={"importTitle"}>
              {"프롬프트 ZIP 가져오기"}
            </h2>
          </div>
          <button type={"button"} className={"import-close"} aria-label={"닫기"} onClick={() => run("closeImportModal")}>
            {"×"}
          </button>
        </div>
        <button type={"button"} id={"archiveDrop"} className={"drop-zone"} onClick={() => run("pickPromptArchive")}>
          <strong>
            {"ZIP 또는 MD 파일을 놓아주세요"}
          </strong>
          <span>
            {"여러 MD가 있으면 아래 드롭다운에서 적용할 파일을 고를 수 있습니다."}
          </span>
        </button>
        <input id={"archiveInput"} type={"file"} accept={".zip,.md,.txt,application/zip,text/markdown,text/plain"} hidden />
        <div id={"archiveChooser"} className={"archive-chooser"} hidden>
          <label htmlFor={"archiveEntrySelect"}>
            {"적용할 프롬프트"}
          </label>
          <select id={"archiveEntrySelect"} onChange={(event) => run("previewArchiveEntry", event.currentTarget.value)}></select>
          <pre id={"archivePreview"} className={"archive-preview"}></pre>
          <div className={"import-actions"}>
            <button type={"button"} className={"btn sec"} onClick={() => run("closeImportModal")}>
              {"취소"}
            </button>
            <button type={"button"} className={"btn"} onClick={() => run("applyArchiveEntry")}>
              {"선택한 MD 적용"}
            </button>
          </div>
        </div>
      </section>
    </div>
    <div className={"tabs"}>
      <button className={"tab active"} data-sys={"Journal"} onClick={(event) => run("switchSys", "Journal", event.currentTarget)}>
        {"성장일지"}
      </button>
      <button className={"tab"} data-sys={"Meetup"} onClick={(event) => run("switchSys", "Meetup", event.currentTarget)}>
        {"정기모임"}
      </button>
      <button className={"tab"} data-sys={"Project"} onClick={(event) => run("switchSys", "Project", event.currentTarget)}>
        {"프로젝트"}
      </button>
      <button className={"tab"} data-sys={"GrowthTalk"} onClick={(event) => run("switchSys", "GrowthTalk", event.currentTarget)}>
        {"그로스톡"}
      </button>
    </div>
    <div className={"top"}>
      <h1 id={"sysTitle"}>
        {"Growth Log · 성장일지 카드뉴스"}
      </h1>
      <button className={"btn sec"} onMouseDown={(event) => event.preventDefault()} onClick={() => run("clearHi")}>
        {"강조 지우기"}
      </button>
      <button className={"btn sec hi-a"} onMouseDown={(event) => event.preventDefault()} onClick={() => run("applyHi", "title")}>
        {"제목 강조"}
      </button>
      <button className={"btn sec hi-b"} onMouseDown={(event) => event.preventDefault()} onClick={() => run("applyHi", "body")}>
        {"본문 강조"}
      </button>
      <span className={"tool-sep"} aria-hidden={"true"}></span>
      <button className={"btn"} onClick={() => run("exportAll")}>
        {"전체 ZIP 저장"}
      </button>
      <button className={"btn"} onClick={() => run("openImportModal")}>
        {"프롬프트 ZIP 가져오기"}
      </button>
      <label className={"page-count"} htmlFor={"pageCount"}>
        {"카드 수\n    "}
        <select id={"pageCount"} defaultValue="4" onChange={(event) => run("setPageCount", event.currentTarget.value)}>
          {Array.from({ length: 7 }, (_, index) => index + 4).map((count) => (
            <option key={count} value={count}>{count}장</option>
          ))}
        </select>
      </label>
      <div className={"zoom"}>
        {"크게 보기\n    "}
        <input type={"range"} id={"zoomRange"} min={"100"} max={"260"} defaultValue={"100"} onInput={(event) => run("setZoom", event.currentTarget.value)} />
      </div>
      <div className={"nameRow"}>
        <label htmlFor={"setName"}>
          {"저장 이름"}
        </label>
        <input id={"setName"} type={"text"} spellCheck={"false"} onInput={() => run("onSetName")} placeholder={"예: 5기-성장일지-01-AI시대개발자"} />
        <select id={"fmtSel"} defaultValue="jpg" onChange={(event) => run("setFmt", event.currentTarget.value)} title={"저장 형식"}>
          <option value={"jpg"}>
            {"JPG · 고화질 (기본)"}
          </option>
          <option value={"png"}>
            {"PNG · 무손실 (용량 큼)"}
          </option>
        </select>
        <span id={"namePreview"}></span>
      </div>
      <p>
        {"탭으로 시스템을 바꿉니다. 텍스트를 클릭해 바로 수정 · "}
        <b>
          {"카드 수"}
        </b>
        {"는 콘텐츠에 따라 4~10장으로 조절 · "}
        <b>
          {"프롬프트 ZIP 가져오기"}
        </b>
        {"에 완성된 ZIP을 놓으면 장수와 카피가 자동 반영 · "}
        <b>
          {"강조"}
        </b>
        {"는 글자를 드래그 선택 후 제목 또는 본문 강조 · "}
        <b>
          {"사진"}
        </b>
        {"은 칸을 클릭하거나 끌어다 놓은 뒤 이동·확대 · "}
        <b>
          {"전체 ZIP 저장"}
        </b>
        {"은 현재 카드 전부를 "}
        <code>
          {"세트이름.zip"}
        </code>
        {" 하나로 받습니다."}
      </p>
    </div>
    <div className={"sys cards"} id={"sysJournal"}>
      <div className={"item"}>
        <CardToolbar label="01 · 표지 (다크)" cardId="j1" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card cover"} id={"j1"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"성장일지 · AI 개발"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"AI가 코드를 대신 짤수록,\n"}
                <mark>
                  {"설명하는 힘"}
                </mark>
                {"이 비싸진다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"AI는 이미 코드를 꽤 잘 짭니다.\n문제는 무엇을 만들지 서로 다르게 이해할 때 생깁니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="02 · BEFORE (라이트)" cardId="j2" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"j2"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"BEFORE · 구현이 빨라지자"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"틀린걸 알았을 땐\n이미 퍼진 뒤입니다"}
              </div>
              <div className={"lead mute"} contentEditable suppressContentEditableWarning>
                {"구현이 느릴 땐 빈틈이 늦게 드러났습니다.\n이제는 잘못된 이해가 코드와 화면과 API로 퍼진 뒤에\n드러납니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="03 · AFTER (스크린샷)" cardId="j3" photoId="jph3" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"j3"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"AFTER · 자리가 옮겨간다"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"코드가 아니라,\n문제·검증·정렬로"}
              </div>
              <div className={"lead strong"} contentEditable suppressContentEditableWarning>
                {"생산성은 얼마나 빨리만드나가 아니라,\n"}
                <mark>
                  {"언제 같은 그림을 보나"}
                </mark>
                {"입니다"}
              </div>
              <div className={"note"} contentEditable suppressContentEditableWarning>
                {"AI를 낮잡아보자는 얘기가 아닙니다.\n역할이 사라지기보다\n재배치되는 겁니다."}
              </div>
              <div className={"ph jshot"} id={"jph3"} data-label={"원문 스크린샷"}></div>
              <div className={"shot-cap"} contentEditable suppressContentEditableWarning>
                {"그로스로그의 성장일지 원문입니다"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="04 · 체크리스트 (마무리)" cardId="j4" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"j4"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"오늘 확인할 것"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"AI에 넘기기 전에,\n이 세 가지를 먼저"}
              </div>
              <div className={"lead mute"} contentEditable suppressContentEditableWarning>
                {"AI는 더 빨리 만들게 할 뿐,\n방향을 대신 정해주지 않습니다."}
              </div>
              <div className={"list"}>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"01"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"요구를 한 문장으로 정의하고 넘겼는가"}
                  </span>
                </div>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"02"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"AI가 준 코드를 '왜 믿는지' 근거를 남겼는가"}
                  </span>
                </div>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"03"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"설계 의도와 리스크를 팀이 읽을 수 있게 적었는가"}
                  </span>
                </div>
              </div>
              <div className={"source"} contentEditable suppressContentEditableWarning>
                {"더 많은 이야기는 그로스로그에서\n출처 : 그로스로그 성장일지 · 'AI 시대에 개발자는 사라지는가' (2026.04)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={"sys cards"} id={"sysMeetup"} hidden>
      <div className={"item"}>
        <CardToolbar label="01 · 표지 (하단 밴드 사진)" cardId="m1" photoId="mph1" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card photocover"} id={"m1"}>
              <div className={"ph band ondark"} id={"mph1"} data-label={"표지 사진"}></div>
              <div className={"veil band"}></div>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"그로스로그 · 정기모임"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"낯설었던 첫만남이\n"}
                <mark>
                  {"대화로 바뀌기"}
                </mark>
                {" 시작했다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"5기 첫 정기모임의 시작과\n그날의 이야기를 기록했습니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="02 · 본문1 (라운드 사진)" cardId="m2" photoId="mph2" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card photoinset"} id={"m2"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"그날 · 군자역 공간나인"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"토요일 오후\n"}
                <mark>
                  {"68명"}
                </mark>
                {"이 모였습니다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"정회원 30명과 신입 38명.\n5기는 팀을 없애고 더 자유롭게, 6인 1조로 모였습니다"}
              </div>
              <div className={"ph inset"} id={"mph2"} data-label={"현장 사진"}></div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="03 · 본문2 (라운드 사진)" cardId="m3" photoId="mph3" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card photoinset"} id={"m3"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"현장 · 그날의 공기"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"긴장한 표정이,\n웃음으로 바뀌었습니다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"쉬는 시간에도 자리를 뜨지 않았고,\n갔다가 다시 돌아온 분도 있었습니다."}
              </div>
              <div className={"ph inset"} id={"mph3"} data-label={"현장 사진"}></div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="04 · 마무리 (풀블리드 사진)" cardId="m4" photoId="mph4" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card photocover"} id={"m4"}>
              <div className={"ph cover ondark"} id={"mph4"} data-label={"마무리 사진"}></div>
              <div className={"veil"}></div>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"그로스로그"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"낯설었던 첫만남이\n대화로 바뀌기 시작했다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"서로 자극받고 응원하며 함께 성장하는 사람들\n다음 모임에선, 당신도."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={"sys cards"} id={"sysProject"} hidden>
      <div className={"item"}>
        <CardToolbar label="01 · 표지 (다크 · 풀블리드)" cardId="p1" photoId="pph1" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card cover"} id={"p1"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"프로젝트 · GROWTH LOG"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"개발자 커뮤니티를\n"}
                <mark>
                  {"한 페이지에"}
                </mark>
                {" 담았다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"About부터 6기 지원까지,\n한 흐름으로 이어지는 growth Log 웹사이트입니다."}
              </div>
              <div className={"ph pbleed ondark"} id={"pph1"} data-label={"표지 스크린샷"}></div>
              <div className={"cover-fade top"}></div>
              <div className={"cover-fade bot"}></div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="02 · 첫 화면 (라이트)" cardId="p2" photoId="pph2" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"p2"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"설계 · 첫 화면"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"3초 안에\n'왜 여기냐'에 답하게"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"\"함께 성장하는 개발자 커뮤니티\" 한 줄과\n[6기 지원하기] 버튼을 첫 화면에 바로 뒀습니다."}
              </div>
              <BrowserFrame id="pph2" label="첫 화면 스크린샷" />
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="03 · 흐름 (라이트)" cardId="p3" photoId="pph3" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"p3"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"설계 · 흐름"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"소개에서 지원까지,\n한 줄기로"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"About us → Activity → Projects → Recruit → Support\n방문자가 자연스럽게 합류까지 읽게 했습니다"}
              </div>
              <BrowserFrame id="pph3" label="흐름 스크린샷" />
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="04 · 신뢰 (라이트)" cardId="p4" photoId="pph4" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"p4"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"설계 · 신뢰"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"결국,\n직접 보면 압니다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"소개-활동-멤버 역량·추천사까지, 말 대신 증거로 담았습니다.\ngrowthlog.org에서 확인해보세요."}
              </div>
              <BrowserFrame id="pph4" label="신뢰 스크린샷" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={"sys cards"} id={"sysGrowthTalk"} hidden>
      <div className={"item"}>
        <CardToolbar label="01 · 표지 (다크 · 사진)" cardId="gt1" photoId="gtph1" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card photocover"} id={"gt1"}>
              <div className={"ph band ondark"} id={"gtph1"} data-label={"발표·현장 사진"}></div>
              <div className={"veil band"}></div>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"그로스로그 · 그로스톡"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"혼자 보던 코드를\n"}
                <mark>
                  {"함께 뜯어보는 시간"}
                </mark>
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"멤버들이 돌아가며 발표하고,\n그 자리에서 바로 묻고 답합니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="02 · 맥락 (라이트)" cardId="gt2" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"gt2"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"TALK · 이번 주제"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"혼자 읽었으면\n그냥 넘어갔을 이야기"}
              </div>
              <div className={"lead mute"} contentEditable suppressContentEditableWarning>
                {"매달 멤버 한 명이 요즘 파고든 주제를 들고 나와,\n다른 멤버들과 함께 뜯어봅니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="03 · 현장 (라이트 · 사진)" cardId="gt3" photoId="gtph3" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"gt3"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"TALK · 현장"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"발표보다 질문이\n더 오래 이어졌습니다"}
              </div>
              <div className={"lead"} contentEditable suppressContentEditableWarning>
                {"정해진 시간을 넘겨서까지\n서로 묻고 답했습니다."}
              </div>
              <div className={"ph inset"} id={"gtph3"} data-label={"그로스톡 현장 사진"}></div>
              <div className={"shot-cap"} contentEditable suppressContentEditableWarning>
                {"그날 그로스톡 현장입니다"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"item"}>
        <CardToolbar label="04 · 요약 (정리)" cardId="gt4" run={run} />
        <div className={"slot"}>
          <div className={"stage"}>
            <div className={"card light"} id={"gt4"}>
              <div className={"tag"} contentEditable suppressContentEditableWarning>
                {"그로스톡 요약"}
              </div>
              <div className={"heading"} contentEditable suppressContentEditableWarning>
                {"이번 그로스톡에서\n남은 이야기"}
              </div>
              <div className={"lead mute"} contentEditable suppressContentEditableWarning>
                {"현장에서 나온 핵심을 세 줄로 정리했습니다."}
              </div>
              <div className={"list"}>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"01"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"발표 주제와 핵심 결론"}
                  </span>
                </div>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"02"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"가장 많이 나온 질문"}
                  </span>
                </div>
                <div className={"row"}>
                  <span className={"num"} contentEditable suppressContentEditableWarning>
                    {"03"}
                  </span>
                  <span className={"txt"} contentEditable suppressContentEditableWarning>
                    {"다음에 더 파볼 것"}
                  </span>
                </div>
              </div>
              <div className={"source"} contentEditable suppressContentEditableWarning>
                {"더 많은 이야기는 그로스로그에서\n출처 : 그로스로그 그로스톡"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export function CardNewsMaker({ active }: { active: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<CardNewsMakerActions | null>(null);

  const run = useCallback<EditorAction>((name, ...args) => {
    if (actionsRef.current) Reflect.apply(actionsRef.current[name], actionsRef.current, args);
  }, []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = initCardNewsMaker(root);
    actionsRef.current = controller.actions;
    root.dataset.initialized = "true";
    return () => {
      controller.destroy();
      actionsRef.current = null;
      delete root.dataset.initialized;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, [active]);

  return <div id="cardnews-maker" ref={rootRef}><EditorMarkup run={run} /></div>;
}
