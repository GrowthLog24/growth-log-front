import { toJpeg, toPng } from "html-to-image";
import html2canvas from "html2canvas";
import JSZip from "jszip";

type CardNewsSystem = "Journal" | "Meetup" | "Project";

type EditorEventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;
type EditorEvent<Target extends EventTarget, Name extends keyof EditorEventMap> = EditorEventMap[Name] & {
  currentTarget: Target;
};
type PhotoTransform = { s: number; ox: number; oy: number };
type PhotoSlot = HTMLElement & {
  _t?: PhotoTransform;
};
type CardField = [label: string, selector: string];
type CardConfig = { id: string; key: string; f: CardField[] };
type SystemConfig = { title: string; file: string; setName: string; bulk: CardConfig[] };
type ParsedCard = Record<string, string | string[] | undefined> & {
  항목?: string[];
  사진?: string;
};
type ParsedPrompt = Record<string, ParsedCard | string | number | undefined> & {
  __set?: string;
  __count?: number;
};
type ArchiveEntry = { name: string; text: string };

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export function initCardNewsMaker(root: HTMLElement) {
const byId=<ElementType extends HTMLElement = HTMLElement>(id: string): ElementType=>{
  const element=root.querySelector<ElementType>('#'+id);
  if(!element)throw new Error(id+' 요소를 찾을 수 없습니다.');
  return element;
};
const controller=new AbortController();
const listen=<Target extends EventTarget,Name extends keyof EditorEventMap>(target: Target,type: Name,handler: (event: EditorEvent<Target,Name>)=>void,options: AddEventListenerOptions={})=>
  target.addEventListener(type,handler as EventListener,{...options,signal:controller.signal});
const LOGO=`<svg viewBox="3.4 5.9 47.2 22.2" aria-label="Growth Log symbol"><g fill="none" stroke="#129C39" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18,7.5 5,17 18,26.5"/><polyline points="36,7.5 49,17 36,26.5"/></g><g fill="#129C39"><path d="M27 21.5 C 20 21.5 19 13.8 23.2 11.5 C 25.7 14 27 17.4 27 21.5 Z"/><path d="M27 21.5 C 34 21.5 35 13.8 30.8 11.5 C 28.3 14 27 17.4 27 21.5 Z"/></g><rect x="26.1" y="19.5" width="1.8" height="7.2" rx="0.9" fill="#129C39"/></svg>`;

/* ===== 시스템 정의 ===== */
const SYS: Record<CardNewsSystem,SystemConfig>={
  Journal:{title:'Growth Log · 성장일지 카드뉴스', file:'journal', setName:'5기-성장일지-01-AI시대개발자',
    bulk:[
      {id:'j1',key:'표지',      f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'j2',key:'BEFORE',    f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'j3',key:'AFTER',     f:[['라벨','.tag'],['제목','.heading'],['받침','.lead'],['보조','.note'],['캡션','.shot-cap']]},
      {id:'j4',key:'체크리스트',f:[['라벨','.tag'],['제목','.heading'],['받침','.lead'],['항목','.list .txt'],['출처','.source']]},
    ]},
  Meetup:{title:'Growth Log · 정기모임 카드뉴스', file:'meetup', setName:'5기-정기모임-3월',
    bulk:[
      {id:'m1',key:'표지', f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'m2',key:'본문1',f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'m3',key:'본문2',f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'m4',key:'마무리',f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
    ]},
  Project:{title:'Growth Log · 프로젝트 카드뉴스', file:'project', setName:'5기-프로젝트-그로스로그사이트',
    bulk:[
      {id:'p1',key:'표지',  f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'p2',key:'첫화면',f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'p3',key:'흐름',  f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
      {id:'p4',key:'신뢰',  f:[['라벨','.tag'],['제목','.heading'],['받침','.lead']]},
    ]},
};
let CUR: CardNewsSystem='Journal';
function cfg(){ return SYS[CUR]; }
function switchSys(k: CardNewsSystem,btn: HTMLElement){
  CUR=k;
  root.querySelectorAll<HTMLElement>('.sys').forEach(s=>s.hidden = (s.id!=='sys'+k));
  root.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===btn));
  byId('sysTitle').textContent=cfg().title;
  byId<HTMLSelectElement>('pageCount').value=String(cfg().bulk.length);
  refreshNameUI();
  closePhPanel();
  fitZoom();
  // 보이게 된 탭의 사진 다시 배치 (숨김 상태에선 크기가 0이라 계산 불가)
  root.querySelectorAll<PhotoSlot>('#sys'+k+' .ph.filled').forEach(layoutShot);
}

const MIN_PAGES=4, MAX_PAGES=10;
const PAGE_PREFIX={Journal:'j',Meetup:'m',Project:'p'};
function pad2(value: number){ return String(value).padStart(2,'0'); }
function addCardChrome(card: HTMLElement,index: number,total: number){
  if(card.querySelector('.logo'))return;
  card.insertAdjacentHTML('beforeend',
    `<div class="handle" contenteditable>@growth_log.official</div>
     <div class="divider"></div>
     <div class="logo">${LOGO}<span class="word">GROWTH LOG</span></div>
     <div class="foot" contenteditable>AI와 함께 성장하는 개발 커뮤니티 <span class="en">Learn, Connect, Build</span></div>
     <div class="pagenum" contenteditable>${pad2(index)} / ${pad2(total)}</div>`);
}
function refreshPageNumbers(systemKey: CardNewsSystem){
  const cards=root.querySelectorAll<HTMLElement>('#sys'+systemKey+' .card');
  cards.forEach((card,index)=>{
    const number=card.querySelector('.pagenum');
    if(number) number.textContent=pad2(index+1)+' / '+pad2(cards.length);
  });
}
function extraCardConfig(systemKey: CardNewsSystem,index: number): CardConfig{
  return {id:PAGE_PREFIX[systemKey]+index,key:'카드'+index,
    f:[['라벨','.tag'],['제목','.heading'],['받침','.lead'],['항목','.list .txt'],['출처','.source']]};
}
function createExtraCard(systemKey: CardNewsSystem,index: number){
  const config=extraCardConfig(systemKey,index);
  const item=document.createElement('div');
  item.className='item';
  item.innerHTML=`<div class="lbl"><span>${pad2(index)} · 추가 카드</span><span class="ph-ctl"><button type="button" class="btn sec" data-card-action="pick" data-card-id="${config.id}-ph">사진</button><button type="button" class="btn sec" data-card-action="clear" data-card-id="${config.id}-ph">지우기</button><button type="button" class="btn sec" data-card-action="export" data-card-id="${config.id}" title="이 카드 한 장만 저장">저장</button></span></div>
    <div class="slot"><div class="stage"><div class="card extra-card" id="${config.id}">
      <div class="tag" contenteditable>POINT · 추가 내용</div>
      <div class="heading" contenteditable>한 카드에 하나의\n메시지를 적어주세요</div>
      <div class="lead" contenteditable>근거나 사례가 독립된 메시지일 때만 카드를 추가합니다.</div>
      <div class="ph extra-shot" id="${config.id}-ph" data-label="본문 사진" hidden></div>
      <div class="list">
        <div class="row"><span class="num">01</span><span class="txt" contenteditable>첫 번째 근거</span></div>
        <div class="row"><span class="num">02</span><span class="txt" contenteditable>두 번째 근거</span></div>
        <div class="row"><span class="num">03</span><span class="txt" contenteditable>세 번째 근거</span></div>
      </div>
      <div class="source" contenteditable>출처 또는 보충 설명</div>
    </div></div></div>`;
  const card=item.querySelector<HTMLElement>('.card');
  if(!card)throw new Error(config.id+' 카드를 만들지 못했습니다.');
  addCardChrome(card,index,index);
  bindPhotoSlot(item.querySelector<PhotoSlot>('.ph'));
  return {item,config};
}
function setPageCount(value: string|number,systemKey: CardNewsSystem=CUR){
  const wanted=Math.max(MIN_PAGES,Math.min(MAX_PAGES,Number(value)||MIN_PAGES));
  const system=SYS[systemKey], container=byId('sys'+systemKey);
  while(system.bulk.length<wanted){
    const next=system.bulk.length+1;
    const created=createExtraCard(systemKey,next);
    system.bulk.push(created.config); container.appendChild(created.item);
  }
  while(system.bulk.length>wanted){
    const removed=system.bulk.pop();
    if(!removed)break;
    byId(removed.id).closest('.item')?.remove();
  }
  refreshPageNumbers(systemKey);
  if(systemKey===CUR){
    byId<HTMLSelectElement>('pageCount').value=String(system.bulk.length);
    refreshNameUI(); fitZoom();
  }
}

/* ===== 미리보기 배율 : 한 줄에 4장이 꽉 차게 자동 계산 ===== */
let ZOOM_MUL=1;
function fitZoom(){
  // 카드 박스(slot) 실제 폭에 stage를 맞춘다. 여기서 ZOOM_MUL을 또 곱하면
  // 박스는 그대로인데 안의 내용만 커져서 넘친다 (이전 버그).
  const slot=root.querySelector('.sys:not([hidden]) .slot');
  if(!slot||!slot.clientWidth) return;
  root.style.setProperty('--z',(slot.clientWidth/1080).toFixed(4));
}
function setZoom(v: string){
  ZOOM_MUL=Number(v)/100;                                   // 박스 자체를 키운다(넘치면 가로 스크롤)
  const base=Math.min(1560, root.clientWidth);
  root.querySelectorAll<HTMLElement>('.cards').forEach(c=>{
    if(ZOOM_MUL<=1){ c.style.width=''; c.style.maxWidth='1560px'; }
    else{ const w=Math.round(base*ZOOM_MUL); c.style.maxWidth='none'; c.style.width=w+'px'; }
  });
  fitZoom();
  root.querySelectorAll<PhotoSlot>('.ph.filled').forEach(layoutShot);
}
listen(window,'resize',fitZoom);

/* ===== 공통 요소 자동 생성 (핸들 · 푸터 · 사진칸 내부) ===== */
root.querySelectorAll<HTMLElement>('.sys').forEach(sys=>{
  const cards=sys.querySelectorAll<HTMLElement>('.card');
  cards.forEach((card,i)=>addCardChrome(card,i+1,cards.length));
});
function decoratePhotoSlot(el: PhotoSlot){
  if(el.querySelector('.ph-empty'))return;
  el.insertAdjacentHTML('afterbegin',
    `<div class="ph-empty"><span>${el.dataset.label||'사진'} — 클릭 또는 여기로 끌어다 놓기</span></div>
     <div class="zhint">드래그로 이동 · 휠로 확대/축소</div>`);
}
root.querySelectorAll<PhotoSlot>('.ph').forEach(decoratePhotoSlot);

/* ===== 저장 파일명 =====
   규칙: {세트이름}-{장번호}.png   예) 5기-성장일지-01-AI시대개발자-1.png
   세트이름을 폴더명과 같게 두면 다운로드 폴더에서 안 겹치고, 그대로 폴더에 옮기면 됩니다. */
function safeName(s: string){
  return s.trim().replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
let EXPORT_FMT='jpg';   // 기본 저장 형식
function setFmt(v: string){ EXPORT_FMT=(v==='jpg'?'jpg':'png'); refreshNameUI(); }
function setNameOf(){ return safeName(cfg().setName) || ('growthlog-'+cfg().file); }
function fileNameFor(id: string){
  const i=cfg().bulk.findIndex(b=>b.id===id);
  return setNameOf()+'-'+(i>=0?i+1:1)+'.'+EXPORT_FMT;
}
function onSetName(){
  cfg().setName=byId<HTMLInputElement>('setName').value;
  refreshNameUI();
}
function refreshNameUI(){
  const inp=byId<HTMLInputElement>('setName');
  if(document.activeElement!==inp) inp.value=cfg().setName;
  const ext='.'+EXPORT_FMT;
  byId('namePreview').textContent='→ '+setNameOf()+'-1'+ext+' … -'+cfg().bulk.length+ext;
}

/* ===== PNG 저장 =====
   크롬은 연속 다운로드를 막을 수 있어(파일 2개째부터 차단) blob + 앵커를 DOM에 붙이고
   간격을 넉넉히 둔다. 주소창에 '여러 파일 다운로드' 안내가 뜨면 '허용'을 눌러야 4장이 다 받아진다. */
function saveBlob(blob: Blob,name: string){
  return new Promise<void>(res=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=name; a.style.display='none';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); res(); },400);
  });
}
function b64ToBlob(b64: string,type: string){
  const bin=atob(b64), arr=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type});
}
/* 카드 → PNG(base64)
   · 화면의 미리보기는 건드리지 않는다. 같은 .sys 안에 화면 밖 사본을 만들어 원본 크기(1080×1350)로 렌더링
     → 저장할 때 카드가 커졌다가 돌아오는 현상 없음(스타일 규칙이 #sysXXX 기준이라 사본도 같은 컨테이너 안에 둔다)
   · toBlob은 브라우저·메모리 상황에 따라 null을 주는 일이 있어 toDataURL을 쓴다 */
async function renderPngB64(id: string){
  const card=byId(id);
  closePhPanel();
  card.querySelectorAll<PhotoSlot>('.ph.filled').forEach(layoutShot);

  const sys=card.closest<HTMLElement>('.sys');
  if(!sys)throw new Error(id+' 카드 시스템을 찾을 수 없습니다.');
  const holder=document.createElement('div');
  holder.style.cssText='position:fixed;left:-20000px;top:0;width:1080px;height:1350px;overflow:visible';
  const clone=card.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.transform='none';
  holder.appendChild(clone); sys.appendChild(holder);

  root.classList.add('exporting');
  let url: string|null=null, lastErr: unknown=null;
  try{
    // 1) 브라우저 렌더링을 그대로 담는 엔진 (미리보기와 동일하게 나온다)
    try{
      const opt={width:1080,height:1350,pixelRatio:2,cacheBust:false,style:{transform:'none',margin:'0'}};
      const u=(EXPORT_FMT==='jpg')
        ? await toJpeg(clone,Object.assign({quality:0.95,backgroundColor:'#ffffff'},opt))
        : await toPng(clone,opt);
      if(u&&u.indexOf('base64,')>=0) url=u;
    }catch(err){ lastErr=err; }
    // 2) 실패하면 html2canvas로 대체
    if(!url){
      for(const sc of [2,1.5,1]){
        try{
          const canvas=await html2canvas(clone,{width:1080,height:1350,scale:sc,useCORS:true,
            backgroundColor:(EXPORT_FMT==='jpg'?'#ffffff':null),logging:false});
          const u=canvas&&(EXPORT_FMT==='jpg'?canvas.toDataURL('image/jpeg',0.95):canvas.toDataURL('image/png'));
          if(canvas) canvas.width=canvas.height=0;
          if(u&&u.indexOf('base64,')>=0){ url=u; flash(sc===2?'대체 엔진으로 저장했습니다':'해상도를 '+sc+'배로 낮춰 저장했습니다'); break; }
        }catch(err){ lastErr=err; }
      }
    }
  } finally { root.classList.remove('exporting'); holder.remove(); }
  if(!url) throw new Error(lastErr ? errorMessage(lastErr) : '이미지 생성 실패');
  return url.split('base64,')[1];
}
async function shot(id: string){ await saveBlob(b64ToBlob(await renderPngB64(id), EXPORT_FMT==='jpg'?'image/jpeg':'image/png'), fileNameFor(id)); }
async function exp(id: string){                        // 낱장 저장 (미리보기 배율 그대로)
  try{ await shot(id); flash('저장 · '+fileNameFor(id)); }
  catch(e){ console.error(e); flash('저장 실패: '+errorMessage(e)); }
}
let EXPORTING=false;
async function exportAll(){                    // 전체 = ZIP 한 개로 저장
  if(EXPORTING) return;
  EXPORTING=true;
  const list=cfg().bulk;
  let done=0;
  try{
    const pages=[];
    for(let i=0;i<list.length;i++){
      flash('만드는 중 '+(i+1)+'/'+list.length+' …');
      try{
        pages.push({name:fileNameFor(list[i].id), b64:await renderPngB64(list[i].id)});
        done++;
      }catch(err){ throw new Error((i+1)+'번 카드에서 실패 — '+errorMessage(err)); }
      await new Promise(r=>setTimeout(r,120));   // 렌더 사이 숨 돌리기(메모리)
    }
    flash('압축하는 중 …');
    const zip=new JSZip();
    pages.forEach(p=>zip.file(p.name,p.b64,{base64:true}));
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
    await saveBlob(blob, setNameOf()+'.zip');
    flash('완료 · '+setNameOf()+'.zip ('+pages.length+'장)');
  }catch(e){
    console.error(e);
    flash('저장 실패('+done+'/'+list.length+'장 완료): '+errorMessage(e));
  }finally{
    EXPORTING=false;
  }
}

/* ===== 초록 강조 : 씌우기 / 지우기 ===== */
let lastRange: Range|null=null;
listen(document,'selectionchange',()=>{
  const s=window.getSelection();
  if(s?.rangeCount && !s.isCollapsed){
    const n=s.anchorNode, host=(n&&n.nodeType===3?n.parentElement:n);
    if(host instanceof Element && root.contains(host) && host.closest('[contenteditable]')) lastRange=s.getRangeAt(0).cloneRange();
  }
});
function liveRange(){
  const s=window.getSelection();
  if(s?.rangeCount && !s.isCollapsed){
    const n=s.anchorNode, host=(n&&n.nodeType===3?n.parentElement:n);
    if(host instanceof Element && root.contains(host) && host.closest('[contenteditable]')) return s.getRangeAt(0);
  }
  return lastRange;
}
function editableOf(r: Range){ const n=r.commonAncestorContainer; const e=(n.nodeType===3?n.parentElement:n); return e instanceof Element?e.closest<HTMLElement>('[contenteditable]'):null; }
function applyHi(kind: 'title'|'body'){
  const r=liveRange();
  if(!r||r.collapsed){ alert('강조할 글자를 드래그로 선택한 뒤 눌러주세요.'); return; }
  const m=document.createElement('mark');
  if(kind==='title') m.className='t';          // 제목용 = 진한 초록
  try{ r.surroundContents(m); }
  catch{ m.appendChild(r.extractContents()); r.insertNode(m); }
  const host=editableOf(r); if(host) host.normalize();
  window.getSelection()?.removeAllRanges(); lastRange=null;
}
function clearHi(){
  const r=liveRange();
  if(!r){ alert('지울 강조 부분을 드래그로 선택한 뒤 눌러주세요.'); return; }
  const host=editableOf(r); if(!host) return;
  host.querySelectorAll('mark').forEach(mk=>{
    let hit; try{ hit = r.collapsed ? mk.contains(r.startContainer) : r.intersectsNode(mk); }catch{ hit=true; }
    if(hit){ const p=mk.parentNode; if(p){ while(mk.firstChild)p.insertBefore(mk.firstChild,mk); p.removeChild(mk); } }
  });
  host.normalize();
  window.getSelection()?.removeAllRanges(); lastRange=null;
}

/* ===== 사진 : 틀 고정, 안에서 이동(드래그)·확대축소(휠) ===== */
function curZoom(){ return parseFloat(getComputedStyle(root).getPropertyValue('--z'))||0.46; }
function transformOf(el: PhotoSlot){ return el._t??={s:1,ox:0,oy:0}; }
function coverBase(el: PhotoSlot){
  const fw=el.clientWidth, fh=el.clientHeight;
  const nw=Number(el.dataset.nw)||fw, nh=Number(el.dataset.nh)||fh;
  const s=Math.max(fw/nw, fh/nh);
  return {w:nw*s, h:nh*s};
}
/* 확대는 기본 6배(600%)까지 자유롭게.
   아주 극단적인 경우에만 걸리는 안전 상한만 남긴다(저장 실패 시엔 해상도를 낮춰 자동 재시도). */
const SAFE_PX=30000;
function maxScaleOf(el: PhotoSlot){
  const b=coverBase(el);
  const big=Math.max(b.w,b.h)||1;
  return Math.max(1, Math.min(6, SAFE_PX/big));
}
/* 사진은 CSS 배경이 아니라 실제 <img> 로 넣는다.
   배경으로 넣으면 저장(html2canvas) 시 저해상도로 다시 그려져 흐려진다. */
function layoutShot(el: PhotoSlot){
  if(!el.clientWidth||!el.clientHeight) return;   // 숨겨진 탭 → 보일 때 다시 계산
  const img=el.querySelector<HTMLImageElement>('img.phimg'); if(!img) return;
  const t=transformOf(el), b=coverBase(el);
  t.s=Math.max(1,Math.min(t.s,maxScaleOf(el)));   // 안전 범위로 제한
  const w=b.w*t.s, h=b.h*t.s;
  const maxX=Math.max(0,(w-el.clientWidth)/2), maxY=Math.max(0,(h-el.clientHeight)/2);
  t.ox=Math.max(-maxX,Math.min(maxX,t.ox)); t.oy=Math.max(-maxY,Math.min(maxY,t.oy));
  img.style.width=w+'px'; img.style.height=h+'px';
  img.style.left=((el.clientWidth-w)/2+t.ox)+'px';
  img.style.top =((el.clientHeight-h)/2+t.oy)+'px';
}
/* 원본을 그대로 쓰는 것이 원칙(화질 보존).
   브라우저가 감당 못 할 만큼 극단적으로 큰 경우에만 줄이고, 그때도 무손실 PNG로 유지한다. */
const IMG_MAX_PIXELS=40e6;      // 총 화소 상한 (이보다 작으면 손대지 않음)
const IMG_MAX_SIDE=20000;       // 한 변 상한
function fitImage(im: HTMLImageElement){
  const w0=im.naturalWidth, h0=im.naturalHeight;
  let k=1;
  if(w0*h0>IMG_MAX_PIXELS) k=Math.sqrt(IMG_MAX_PIXELS/(w0*h0));
  if(Math.max(w0,h0)*k>IMG_MAX_SIDE) k=Math.min(k, IMG_MAX_SIDE/Math.max(w0,h0));
  if(k>=1) return null;                              // 그대로 사용 = 원본 화질
  const w=Math.max(1,Math.round(w0*k)), h=Math.max(1,Math.round(h0*k));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d');
  if(!x)throw new Error('이미지 캔버스를 만들지 못했습니다.');
  x.imageSmoothingQuality='high';
  x.drawImage(im,0,0,w,h);
  const out=c.toDataURL('image/png');                // 무손실
  c.width=c.height=0;
  return {url:out,w,h};
}
function setShotImg(el: PhotoSlot,file: File){
  if(!file.type.startsWith('image/'))return;
  const r=new FileReader();
  r.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      let out=null;
      try{ out=fitImage(im); }catch{ out=null; }
      if(!out) out={url:String(r.result||''),w:im.naturalWidth,h:im.naturalHeight};  // 원본 그대로
      el.dataset.nw=String(out.w); el.dataset.nh=String(out.h);
      el._t={s:1,ox:0,oy:0};
      let ph=el.querySelector<HTMLImageElement>('img.phimg');
      if(!ph){ ph=document.createElement('img'); ph.className='phimg'; ph.alt=''; el.insertBefore(ph,el.firstChild); }
      ph.src=out.url;
      el.hidden=false; el.classList.add('filled'); layoutShot(el);
      if(PH_CUR===el) syncPhPanel();
    };
    im.onerror=()=>alert('이미지를 읽지 못했습니다.');
    im.src=String(r.result||'');
  };
  r.readAsDataURL(file);
}
function pickShot(el: PhotoSlot|null,force=false){
  if(!el)return;
  if(el.classList.contains('filled') && !force) return;
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const file=inp.files?.[0]; if(file)setShotImg(el,file); }; inp.click();
}
function clearShot(el: PhotoSlot|null){
  if(!el)return;
  el.classList.remove('filled');
  const img=el.querySelector('img.phimg'); if(img) img.remove();
  el._t={s:1,ox:0,oy:0};
  if(el.classList.contains('extra-shot'))el.hidden=true;
}
function pickById(id: string){ pickShot(byId<PhotoSlot>(id),true); }
function clearById(id: string){ clearShot(byId<PhotoSlot>(id)); }
function bindPhotoSlot(el: PhotoSlot|null){
  if(!el||el.dataset.bound)return;
  const slot=el;
  transformOf(slot);
  decoratePhotoSlot(el); el.dataset.bound='true';
  listen(el,'dragover',e=>{e.preventDefault();el.classList.add('dragover');});
  listen(el,'dragleave',()=>el.classList.remove('dragover'));
  listen(el,'drop',e=>{e.preventDefault();el.classList.remove('dragover');
    const file=e.dataTransfer?.files[0]; if(file)setShotImg(el,file);});
  let on=false,sx=0,sy=0,ox0=0,oy0=0,moved=false;
  listen(el,'pointerdown',e=>{
    if(!el.classList.contains('filled'))return;
    on=true; moved=false; const t=transformOf(el); sx=e.clientX; sy=e.clientY; ox0=t.ox; oy0=t.oy;
    e.preventDefault();
    window.addEventListener('pointermove',mv,{signal:controller.signal});
    window.addEventListener('pointerup',up,{signal:controller.signal});
  });
  function mv(e: PointerEvent){ if(!on)return; const z=curZoom();
    if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>3) moved=true;
    const t=transformOf(slot);
    t.ox=ox0+(e.clientX-sx)/z; t.oy=oy0+(e.clientY-sy)/z; layoutShot(slot);
    if(PH_CUR===slot) placePhPanel(); }
  function up(){ on=false; window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); }
  listen(el,'wheel',e=>{
    if(!el.classList.contains('filled'))return;
    e.preventDefault();
    const t=transformOf(el); t.s=Math.min(maxScaleOf(el),Math.max(1,t.s*(e.deltaY<0?1.08:1/1.08)));
    layoutShot(el); if(PH_CUR===el) syncPhPanel();
  },{passive:false});
  listen(el,'click',()=>{
    if(!el.classList.contains('filled')){ pickShot(el); return; }
    if(moved){ moved=false; return; }       // 드래그 끝난 클릭은 무시
    openPhPanel(el);
  });
}
root.querySelectorAll<PhotoSlot>('.ph').forEach(bindPhotoSlot);
listen(window,'resize',()=>{root.querySelectorAll<PhotoSlot>('.ph.filled').forEach(layoutShot);closePhPanel();});

/* ===== 사진 조절 패널 : 사진 클릭 → 아래에 표시, 바깥 클릭 → 사라짐 ===== */
let PH_CUR: PhotoSlot|null=null;
const phPanel=byId('phPanel');
function placePhPanel(){
  if(!PH_CUR)return;
  const r=PH_CUR.getBoundingClientRect();
  const w=phPanel.offsetWidth||430, vw=document.documentElement.clientWidth;
  let left=r.left, top=r.bottom+9;
  if(left+w>vw-10) left=Math.max(10,vw-w-10);
  if(top+46>document.documentElement.clientHeight) top=Math.max(10,r.top-46); // 화면 아래 넘치면 위로
  phPanel.style.left=Math.max(10,left)+'px'; phPanel.style.top=top+'px';
}
function syncPhPanel(){
  if(!PH_CUR)return;
  const maxPct=Math.round(maxScaleOf(PH_CUR)*100);
  const rng=byId<HTMLInputElement>('phZoom');
  rng.max=String(Math.max(110,maxPct));                    // 사진마다 안전한 최대치까지만
  const pct=Math.round(transformOf(PH_CUR).s*100);
  rng.value=String(Math.min(+rng.max,pct));
  byId('phZoomVal').textContent=pct+'%';
}
function openPhPanel(el: PhotoSlot){
  root.querySelectorAll('.ph.active').forEach(n=>n.classList.remove('active'));
  PH_CUR=el; el.classList.add('active');
  phPanel.classList.add('on'); syncPhPanel(); placePhPanel();
}
function closePhPanel(){
  if(PH_CUR) PH_CUR.classList.remove('active');
  PH_CUR=null; phPanel.classList.remove('on');
}
function phZoomInput(v: string){
  if(!PH_CUR)return;
  const t=transformOf(PH_CUR);
  t.s=Math.min(maxScaleOf(PH_CUR),Math.max(1,Number(v)/100)); layoutShot(PH_CUR);
  byId('phZoomVal').textContent=Math.round(t.s*100)+'%';
}
function phFit(){ if(!PH_CUR)return; PH_CUR._t={s:1,ox:0,oy:0}; layoutShot(PH_CUR); syncPhPanel(); }
function phReplace(){ if(PH_CUR) pickShot(PH_CUR,true); }
function phDelete(){ if(!PH_CUR)return; clearShot(PH_CUR); closePhPanel(); }
listen(document,'mousedown',e=>{           // 다른 곳 클릭하면 닫힘
  if(!PH_CUR)return;
  if(e.target instanceof Element&&(e.target.closest('#phPanel')||e.target.closest('.ph')))return;
  closePhPanel();
});
listen(window,'scroll',closePhPanel,{capture:true});

/* ===== 카드 카피 적용 ===== */
function esc(s: string){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function toHTML(v: string){ return esc(v)
  .replace(/\{\{(.+?)\}\}/g,'<mark class="t">$1</mark>')   // {{제목강조}} = 진한 초록
  .replace(/\[\[(.+?)\]\]/g,'<mark>$1</mark>'); }          // [[본문강조]] = 연한 초록
function parse(text: string): ParsedPrompt{
  const cards: ParsedPrompt={}; let cur: string|null=null,field: string|null=null;
  for(const raw of text.split('\n')){
    const line=raw.replace(/\r$/,'');
    // 카드 구분 [표지] — 대괄호 안에 대괄호가 없어야 한다.
    // (한 줄 전체가 [[형광펜]] 인 경우를 카드 구분으로 오인하지 않도록)
    const cm=line.match(/^\[([^\[\]]+)\]\s*$/);
    if(cm){ cur=cm[1].trim(); cards[cur]={}; field=null; continue; }
    const meta=line.match(/^(세트이름|시스템|장수)\s*:\s*(.*)$/);
    if(meta){
      if(meta[1]==='세트이름') cards.__set=meta[2].trim();
      if(meta[1]==='장수') cards.__count=Number(meta[2].trim());
      field=null; continue;
    }
    if(cur==null)continue;
    const fm=line.match(/^(라벨|제목|받침|보조|항목|출처|캡션|사진)\s*:\s?(.*)$/);
    const card=cards[cur] as ParsedCard;
    if(fm){ field=fm[1];
      if(field==='항목'){ (card.항목=card.항목||[]).push(fm[2]); field='항목*'; }
      // 같은 항목이 여러 줄로 반복되면(예: 출처: 두 줄) 덮어쓰지 않고 이어붙인다
      else card[field]=(card[field]!=null? String(card[field])+'\n'+fm[2] : fm[2]);
    } else if(field){
      if(field==='항목*'){ const a=card.항목; if(a?.length)a[a.length-1]+='\n'+line; }
      else card[field]=String(card[field]||'')+'\n'+line;
    }
  }
  return cards;
}
function cardData(data: ParsedPrompt,config: CardConfig,index: number): ParsedCard|undefined{
  const aliases=[config.key,'카드'+(index+1),String(index+1),pad2(index+1)];
  if(index===0) aliases.push('표지');
  return aliases.map(key=>data[key]).find(value=>typeof value==='object') as ParsedCard|undefined;
}
function inferredPageCount(data: ParsedPrompt){
  const numbered=Object.keys(data).map(key=>key.match(/^카드(\d+)$/)).filter((match): match is RegExpMatchArray=>Boolean(match)).map(match=>Number(match[1]));
  return numbered.length ? Math.max(...numbered) : 0;
}
function loadCopyText(raw: string,fname: string){
  const sys=detectSys(raw);
  if(sys && sys!==CUR){                       // 붙여넣기만 해도 맞는 탭으로
    const tab=root.querySelector<HTMLElement>(`.tab[data-sys="${sys}"]`);
    if(tab)switchSys(sys,tab);
  }
  const data=parse(raw);
  const requested=data.__count||inferredPageCount(data);
  if(requested) setPageCount(requested);
  let applied=0;
  cfg().bulk.forEach((c,index)=>{
    const d=cardData(data,c,index); if(!d)return; const card=byId(c.id);
    for(const [label,sel] of c.f){
      if(label==='항목'){
        const rows=card.querySelectorAll<HTMLElement>(sel), values=(d.항목||[]).map(v=>v.trim()).filter(Boolean);
        rows.forEach((n,i)=>{ const row=n.closest<HTMLElement>('.row'); if(row)row.hidden=!values[i]; if(values[i]){n.innerHTML=toHTML(values[i]); applied++;} });
        const list=card.querySelector<HTMLElement>('.list'); if(list)list.hidden=!values.length;
      }else{
        const n=card.querySelector<HTMLElement>(sel); if(!n)continue;
        const field=d[label], value=typeof field==='string'?field.trim():'';
        if(value){ n.hidden=false; n.innerHTML=toHTML(value); applied++; }
        else if(['보조','캡션','출처'].includes(label)){ n.hidden=true; n.innerHTML=''; }
      }
    }
  });
  let extra='';
  const nextName=data.__set||nameFromFile(fname); // 파일 안 세트이름이 파일명보다 우선
  if(nextName){
    cfg().setName=nextName; refreshNameUI(); markNameChanged();
    extra=' · 저장 이름 → '+setNameOf();
  }
  flash('적용됨 · '+applied+'개 항목 반영'+extra);
}
function markNameChanged(){
  const el=byId('setName');
  el.classList.add('changed'); setTimeout(()=>el.classList.remove('changed'),2200);
}

/* ===== 프롬프트 적용 =====
   템플릿 파일명이 곧 세트 이름이 됩니다.
   5기-성장일지-04-MQTT-카피템플릿.md  →  5기-성장일지-04-MQTT
   (파일 안에 '세트이름:' 줄이 있으면 그 값이 우선) */
function nameFromFile(fname: string){
  let s=fname.replace(/\.[^.]+$/,'');
  s=s.replace(/[-_\s]*카피[-_\s]*템플릿.*$/,'')
     .replace(/[-_\s]*템플릿.*$/,'')
     .replace(/[-_\s]*copy[-_\s]*template.*$/i,'')
     .replace(/[-_\s]+$/,'').trim();
  return s.length>=3 ? s : '';
}
function detectSys(text: string): CardNewsSystem|null{                    // 카피의 카드 키로 어느 탭인지 판별
  const explicit=text.match(/^시스템\s*:\s*(성장일지|정기모임|프로젝트)\s*$/m);
  if(explicit) return {성장일지:'Journal',정기모임:'Meetup',프로젝트:'Project'}[explicit[1] as '성장일지'|'정기모임'|'프로젝트'] as CardNewsSystem;
  let best: CardNewsSystem|null=null,bestN=0;
  for(const k of Object.keys(SYS) as CardNewsSystem[]){
    const n=SYS[k].bulk.filter(b=>new RegExp('^\\['+b.key+'\\]\\s*$','m').test(text)).length;
    if(n>bestN){bestN=n;best=k;}
  }
  return bestN>0?best:null;
}
/* ===== 프롬프트 ZIP / MD 가져오기 ===== */
let ARCHIVE_ENTRIES: ArchiveEntry[]=[];
let ARCHIVE_IMAGES=new Map<string,JSZip.JSZipObject>();
function openImportModal(){
  const modal=byId('importModal');
  modal.hidden=false; document.body.style.overflow='hidden';
  setTimeout(()=>byId('archiveDrop').focus(),0);
}
function closeImportModal(){
  byId('importModal').hidden=true;
  document.body.style.overflow='';
}
function pickPromptArchive(){ byId<HTMLInputElement>('archiveInput').click(); }
function readPlainFile(file: File){
  return new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsText(file,'utf-8');
  });
}
function archivePriority(name: string){
  return /(^|\/)(프롬프트|prompt)([^\/]*)\.(md|txt)$/i.test(name) ? 0 : 1;
}
function archivePath(name: string){ return name.replace(/\\/g,'/').replace(/^\.\//,''); }
function archiveImage(promptName: string,path: string){
  const wanted=archivePath(path), base=archivePath(promptName).replace(/[^/]*$/,'');
  return ARCHIVE_IMAGES.get(archivePath(base+wanted))
    || ARCHIVE_IMAGES.get(wanted)
    || [...ARCHIVE_IMAGES].find(([name])=>name.split('/').pop()===wanted.split('/').pop())?.[1];
}
function imageMime(name: string){
  const ext=name.split('.').pop()?.toLowerCase()||'';
  return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'} as Record<string,string>)[ext]||'application/octet-stream';
}
async function applyArchivePhotos(text: string,promptName: string){
  if(!ARCHIVE_IMAGES.size)return 0;
  const data=parse(text); let applied=0;
  for(let index=0;index<cfg().bulk.length;index++){
    const config=cfg().bulk[index], card=cardData(data,config,index);
    if(!card?.사진)continue;
    const target=byId(config.id).querySelector<PhotoSlot>('.ph');
    const entry=archiveImage(promptName,card.사진.trim());
    if(!target||!entry)continue;
    const blob=await entry.async('blob'), name=entry.name.split('/').pop()||entry.name;
    setShotImg(target,new File([blob],name,{type:imageMime(name)}));
    applied++;
  }
  return applied;
}
async function loadPromptArchive(file: File){
  try{
    flash('프롬프트 파일을 읽는 중 …');
    if(/\.zip$/i.test(file.name)){
      const zip=await JSZip.loadAsync(file);
      const entries=Object.values(zip.files).filter(entry=>!entry.dir&&!entry.name.startsWith('__MACOSX/'));
      const files=entries.filter(entry=>/\.(md|txt)$/i.test(entry.name));
      ARCHIVE_IMAGES=new Map(entries.filter(entry=>/\.(jpe?g|png|webp|gif)$/i.test(entry.name)).map(entry=>[archivePath(entry.name),entry]));
      ARCHIVE_ENTRIES=await Promise.all(files.map(async entry=>({name:entry.name,text:await entry.async('string')})));
      ARCHIVE_ENTRIES.sort((a,b)=>archivePriority(a.name)-archivePriority(b.name)||a.name.localeCompare(b.name,'ko'));
    }else{
      ARCHIVE_ENTRIES=[{name:file.name,text:await readPlainFile(file)}];
      ARCHIVE_IMAGES=new Map<string,JSZip.JSZipObject>();
    }
    if(!ARCHIVE_ENTRIES.length) throw new Error('ZIP 안에서 MD 또는 TXT 파일을 찾지 못했습니다.');
    const select=byId<HTMLSelectElement>('archiveEntrySelect');
    select.replaceChildren(...ARCHIVE_ENTRIES.map((entry,index)=>{
      const option=document.createElement('option'); option.value=String(index); option.textContent=entry.name; return option;
    }));
    byId('archiveChooser').hidden=false;
    previewArchiveEntry('0');
    flash(ARCHIVE_ENTRIES.length+'개 문서 · 사진 '+ARCHIVE_IMAGES.size+'개를 찾았습니다.');
  }catch(error){ console.error(error); flash('가져오기 실패: '+errorMessage(error)); }
}
function previewArchiveEntry(index: string){
  const entry=ARCHIVE_ENTRIES[Number(index)||0];
  byId('archivePreview').textContent=entry ? entry.text.slice(0,3000) : '';
}
async function applyArchiveEntry(){
  const index=Number(byId<HTMLSelectElement>('archiveEntrySelect').value)||0;
  const entry=ARCHIVE_ENTRIES[index]; if(!entry)return;
  loadCopyText(entry.text,entry.name.split('/').pop()||entry.name);
  const photos=await applyArchivePhotos(entry.text,entry.name);
  closeImportModal();
  flash('카피 적용됨 · 사진 '+photos+'개 연결');
}
let TOAST_T: ReturnType<typeof setTimeout>|null=null;
function flash(msg: string){
  const t=byId('toast');
  t.textContent=msg; t.classList.add('on');
  if(TOAST_T)clearTimeout(TOAST_T);
  TOAST_T=setTimeout(()=>t.classList.remove('on'),3200);
}
listen(byId<HTMLInputElement>('archiveInput'),'change',event=>{ const file=event.currentTarget.files?.[0]; if(file)loadPromptArchive(file); });
const archiveDrop=byId('archiveDrop');
listen(archiveDrop,'dragover',event=>{event.preventDefault();archiveDrop.classList.add('dragover');});
listen(archiveDrop,'dragleave',()=>archiveDrop.classList.remove('dragover'));
listen(archiveDrop,'drop',event=>{
  event.preventDefault(); archiveDrop.classList.remove('dragover');
  const file=event.dataTransfer?.files[0]; if(file)loadPromptArchive(file);
});
listen(document,'keydown',event=>{
  if(event.key==='Escape'&&!byId('importModal').hidden) closeImportModal();
});
(Object.keys(SYS) as CardNewsSystem[]).forEach(refreshPageNumbers);
refreshNameUI();
fitZoom();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>root.isConnected&&fitZoom());
listen(root,'click',event=>{
  if(!(event.target instanceof Element))return;
  const button=event.target.closest<HTMLElement>('[data-card-action]');
  if(!button)return;
  const action=button.dataset.cardAction, id=button.dataset.cardId;
  if(action==='pick'&&id)pickById(id);
  if(action==='clear'&&id)clearById(id);
  if(action==='export'&&id)exp(id);
});
const actions = {
  phZoomInput, phFit, phReplace, phDelete, closeImportModal, pickPromptArchive,
  previewArchiveEntry, applyArchiveEntry, switchSys, clearHi, applyHi, exportAll,
  openImportModal, setPageCount, setZoom, setFmt, onSetName,
  pickById, clearById, exp
};
return {actions,destroy(){
  controller.abort();
  if(TOAST_T)clearTimeout(TOAST_T);
  closePhPanel();
  document.body.style.overflow='';
  root.querySelectorAll<HTMLElement>('.ph[data-bound]').forEach(slot=>delete slot.dataset.bound);
}};
}

export type CardNewsMakerActions = ReturnType<typeof initCardNewsMaker>["actions"];
