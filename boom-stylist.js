(() => {
  "use strict";
  const STYLE_VARS={
    cinematic:{accent:"#85d6ff",accent2:"#8d82ff",glow:"rgba(107,160,255,.18)",surface:"rgba(12,16,25,.94)"},
    editorial:{accent:"#d8e4f5",accent2:"#a8b8ce",glow:"rgba(181,202,229,.13)",surface:"rgba(20,22,27,.95)"},
    "quiet-luxury":{accent:"#dff7ff",accent2:"#b7a8ff",glow:"rgba(180,210,255,.16)",surface:"rgba(13,14,20,.95)"},
    electric:{accent:"#7fe7ff",accent2:"#9e80ff",glow:"rgba(99,181,255,.22)",surface:"rgba(8,13,24,.95)"}
  };
  const LINES={
    en:{
      discover:["A little closer to your taste.","The edit changes as you explore.","More signal, less noise."],
      style:["Let the pieces talk to each other.","Build the mood, not just the cart.","One look can open the next."],
      compare:["Slow down the choice, not the experience.","Keep the facts visible while you decide.","Clear options, calmer decisions."],
      "complete-look":["Start with one piece. Let HUNT connect the rest.","A stronger look is often in the pairing.","Follow the shape of the whole set."],
      explore:["Switch the world. Keep the relevance.","A different lane, still tuned to you.","Discovery without losing your thread."]
    },
    he:{
      discover:["קצת יותר קרוב לטעם שלך.","העריכה משתנה ככל שמגלים.","יותר אותות, פחות רעש."],
      style:["תן לפריטים לדבר אחד עם השני.","בונים אווירה, לא רק סל.","לוק אחד יכול לפתוח את הבא."],
      compare:["מאטים את הבחירה, לא את החוויה.","העובדות נשארות מול העיניים בזמן הבחירה.","אפשרויות ברורות, החלטה רגועה יותר."],
      "complete-look":["מתחילים בפריט אחד. HUNT מחבר את ההמשך.","לפעמים כל הלוק נמצא בחיבור בין הפריטים.","רואים את כל הסט, לא רק מוצר אחד."],
      explore:["מחליפים עולם ושומרים על הרלוונטיות.","מסלול אחר, עדיין מותאם אליך.","מגלים בלי לאבד את החוט."]
    },
    ar:{
      discover:["أقرب شوي لذوقك.","الاختيارات بتتغيّر مع اكتشافك.","إشارات أكثر وضجيج أقل."],
      style:["خلّي القطع تحكي مع بعض.","ابنِ الجو، مش بس السلة.","لوك واحد ممكن يفتح اللي بعده."],
      compare:["هدّي القرار، مش التجربة.","خلي الحقائق قدامك وإنت بتختار.","خيارات أوضح وقرار أهدأ."],
      "complete-look":["ابدأ بقطعة وخلّي HUNT يكمل الباقي.","أحيانًا جمال اللوك بالتركيب بين القطع.","شوف المجموعة كاملة، مش قطعة لحالها."],
      explore:["غيّر العالم وخلي الملاءمة موجودة.","مسار جديد ولسه مناسب إلك.","اكتشاف بدون ما تضيع الخيط."]
    },
    es:{
      discover:["Un poco más cerca de tu gusto.","La edición cambia mientras exploras.","Más señal, menos ruido."],
      style:["Deja que las piezas hablen entre sí.","Construye el ambiente, no solo el carrito.","Un look puede abrir el siguiente."],
      compare:["Calma la elección, no la experiencia.","Mantén los datos visibles mientras decides.","Opciones claras, decisiones más tranquilas."],
      "complete-look":["Empieza con una pieza y deja que HUNT conecte el resto.","Un look fuerte suele estar en la combinación.","Mira el conjunto, no solo una pieza."],
      explore:["Cambia de mundo sin perder relevancia.","Otra ruta, todavía afinada contigo.","Descubre sin perder el hilo."]
    },
    fr:{
      discover:["Un peu plus proche de vos goûts.","La sélection évolue pendant votre exploration.","Plus de signal, moins de bruit."],
      style:["Laissez les pièces dialoguer entre elles.","Construisez l'ambiance, pas seulement le panier.","Un look peut ouvrir le suivant."],
      compare:["Ralentissez le choix, pas l'expérience.","Gardez les faits visibles pendant la décision.","Des options claires, une décision plus calme."],
      "complete-look":["Commencez par une pièce, HUNT relie la suite.","Un look fort naît souvent de l'association.","Voyez l'ensemble, pas seulement une pièce."],
      explore:["Changez d'univers sans perdre la pertinence.","Une autre voie, toujours adaptée à vous.","Découvrez sans perdre le fil."]
    },
    ja:{
      discover:["好みにもう少し近づける。","探索するほど編集が変わる。","ノイズを減らして、シグナルを増やす。"],
      style:["アイテム同士の相性を見つける。","カートだけでなくムードをつくる。","ひとつのルックが次につながる。"],
      compare:["選択はゆっくり、体験は軽やかに。","判断中も事実を見えるままに。","選択肢を明確に、判断を穏やかに。"],
      "complete-look":["ひとつから始めて、HUNTが続きをつなぐ。","強いルックは組み合わせにある。","単品ではなく全体を見る。"],
      explore:["世界を変えても関連性は保つ。","別のルートでも、あなた向け。","流れを失わずに発見する。"]
    },
    zh:{
      discover:["更靠近你的偏好一点。","探索越多，编辑方式越会变化。","更多有效信号，更少噪音。"],
      style:["让单品彼此呼应。","构建氛围，不只是购物车。","一个造型可以打开下一个灵感。"],
      compare:["放慢选择，不拖慢体验。","做决定时让事实保持可见。","选项更清晰，决定更从容。"],
      "complete-look":["从一件开始，让HUNT连接其余部分。","更完整的造型常在搭配之间。","看整体，不只看单品。"],
      explore:["切换世界，也保持相关性。","换一条路径，仍然贴合你。","发现更多，但不丢失主线。"]
    }
  };

  let plan=null,lineIndex=0,timer=null,visible=true;
  const root=document.documentElement;
  const body=()=>document.body;

  function locale(){return window.HuntExperienceI18n?.current?.()||"en"}
  function words(intent){
    const l=LINES[locale()]||LINES.en;
    return l[intent]||l.discover;
  }
  function ensureWhisper(){
    if(location.pathname.endsWith("index.html")||location.pathname==="/"||location.pathname===""){
      const host=document.querySelector(".hd-discovery-status");
      if(host&&!document.querySelector("#hd-boom-whisper")){
        const el=document.createElement("div");
        el.id="hd-boom-whisper";
        el.className="hd-boom-whisper";
        el.setAttribute("aria-live","polite");
        el.innerHTML='<i aria-hidden="true"></i><span></span>';
        host.insertAdjacentElement("afterend",el);
      }
    }
  }
  function safeText(value,max){
    const text=String(value||"").replace(/\s+/g," ").trim().slice(0,max);
    return /\b(last chance|hurry|act now|only \d+ left|trending now|best seller|lowest price|guaranteed|fomo)\b/i.test(text)?"":text;
  }
  function applyVars(next){
    const vars=STYLE_VARS[next.style_mode]||STYLE_VARS.cinematic;
    root.style.setProperty("--boom-accent",vars.accent);
    root.style.setProperty("--boom-accent-2",vars.accent2);
    root.style.setProperty("--boom-glow",vars.glow);
    root.style.setProperty("--boom-surface",vars.surface);
  }
  function renderWhisper(){
    const el=document.querySelector("#hd-boom-whisper");
    if(!el||!plan)return;
    const ai=safeText(plan.microcopy?.headline,72);
    const lines=words(plan.intent);
    const text=lineIndex===0&&ai?ai:lines[(lineIndex-(ai?1:0)+lines.length)%lines.length];
    const span=el.querySelector("span");
    if(span){
      span.classList.remove("is-switching");
      void span.offsetWidth;
      span.textContent=text;
      span.classList.add("is-switching");
    }
    el.dataset.source=body()?.dataset.boomBrainSource||"local";
    lineIndex=(lineIndex+1)%(lines.length+(ai?1:0));
  }
  function schedule(){
    clearTimeout(timer);
    if(!visible||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    timer=setTimeout(()=>{renderWhisper();schedule()},13800);
  }
  function apply(next){
    plan=next;
    if(!plan)return;
    applyVars(plan);
    ensureWhisper();
    const b=body();
    if(b){
      b.dataset.boomStyle=plan.style_mode;
      b.dataset.boomEnergy=plan.motion_energy;
      b.dataset.boomDensity=plan.density;
      b.dataset.boomIntent=plan.intent;
    }

    const productCopy=document.querySelector("#hd-product-boom");
    if(productCopy){
      const line=safeText(plan.microcopy?.subline,110)||words(plan.intent)[0];
      productCopy.textContent=line;
    }

    const discovery=document.querySelector("#hunt-now");
    if(discovery){
      discovery.dataset.boomStyle=plan.style_mode;
      discovery.dataset.boomEnergy=plan.motion_energy;
    }
    const night=document.querySelector("#hunt-night-edit");
    if(night)night.dataset.boomStyle=plan.style_mode;

    lineIndex=0;
    renderWhisper();
    schedule();
    window.dispatchEvent(new CustomEvent("boom:stylist-applied",{detail:{plan}}));
  }

  window.addEventListener("boom:plan",e=>apply(e.detail?.plan));
  window.addEventListener("hunt:experience-language",()=>{lineIndex=0;renderWhisper()});
  document.addEventListener("visibilitychange",()=>{visible=!document.hidden;visible?schedule():clearTimeout(timer)});

  window.BoomStylist=Object.freeze({
    plan:()=>plan,
    apply,
    copyFor:(intent)=>words(intent||plan?.intent||"discover")[0],
    createMission:(options={})=>window.BoomStylistCore?.createMission?.(options)||null,
    tasteProfile:(events=[])=>window.BoomTasteDNA?.buildProfile?.(events)||null
  });

  function boot(){
    ensureWhisper();
    const initial=window.BoomCommerceBrain?.plan?.();
    if(initial)apply(initial);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();