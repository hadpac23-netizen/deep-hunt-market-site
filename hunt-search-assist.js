(() => {
  "use strict";
  const H=window.HuntCore;
  const input=document.getElementById("hd-ai-search-input");
  const form=document.getElementById("hd-ai-search-form");
  if(!H||!input||!form)return;

  form.classList.add("hd-search-assist");
  const panel=document.createElement("div");
  panel.id="hd-search-assist-panel";
  panel.className="hd-search-assist-panel";
  panel.setAttribute("role","listbox");
  panel.hidden=true;
  form.appendChild(panel);

  const recentKey="hunt_search_recent_v1";
  const aliases={
    bottoms:["jeans","denim","pants","trousers","ג'ינס","גינס","מכנס","جينز","بنطلون","vaqueros","jean","ジーンズ","牛仔裤"],
    dresses:["dress","dresses","שמלה","שמלות","فستان","فساتين","vestido","robe","ドレス","连衣裙"],
    shoes:["shoe","shoes","sneaker","נעל","נעליים","حذاء","أحذية","zapatos","chaussures","靴","鞋"],
    bags:["bag","bags","handbag","תיק","תיקים","حقيبة","حقائب","bolso","sac","バッグ","包"],
    beauty:["beauty","makeup","skincare","איפור","טיפוח","مكياج","بشرة","belleza","beauté","美容","美妆"],
    phoneaccessories:["phone case","case","iphone","כיסוי","מגן","جراب","غطاء","funda","coque","ケース","手机壳"],
    tech:["tech","electronics","טכנולוגיה","אלקטרוניקה","تقنية","الكترونيات","tecnología","technologie","テック","电子"],
    men:["men","mens","גברים","גבר","رجال","رجالي","hombre","hommes","メンズ","男装"],
    women:["women","womens","נשים","אישה","نساء","نسائي","mujer","femmes","レディース","女装"]
  };

  const normalize=v=>String(v||"").normalize("NFKC").toLocaleLowerCase().trim();
  const readRecent=()=>{
    try{return JSON.parse(localStorage.getItem(recentKey)||"[]")}
    catch{return[]}
  };
  const saveRecent=q=>{
    const clean=String(q||"").trim();
    if(!clean)return;
    const next=[clean,...readRecent().filter(x=>normalize(x)!==normalize(clean))].slice(0,8);
    try{localStorage.setItem(recentKey,JSON.stringify(next))}catch{}
  };

  function categoryRows(q){
    const needle=normalize(q);
    if(!needle)return [];
    const rows=[];
    for(const [slug,def] of Object.entries(H.categoryDefs||{})){
      const pool=[slug,def.title,def.query,...(aliases[slug]||[])].map(normalize);
      const exactPrefix=pool.some(x=>x.startsWith(needle));
      const contains=pool.some(x=>x.includes(needle));
      if(exactPrefix||contains)rows.push({slug,title:def.title,query:(aliases[slug]||[])[0]||def.query,score:exactPrefix?2:1});
    }
    return rows.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,6);
  }
  function option(row){
    const sub=row.sub ? "<small>"+H.esc(row.sub)+"</small>" : "";
    return '<button class="hd-search-assist-option" type="button" role="option" data-assist-type="'+H.esc(row.type)+'" data-assist-value="'+H.esc(row.value)+'"><b>'+H.esc(row.icon)+'</b><span class="hd-search-assist-copy"><strong>'+H.esc(row.label)+'</strong>'+sub+'</span></button>';
  }

  function render(){
    const raw=input.value.trim();
    if(!raw){panel.hidden=true;panel.innerHTML="";return;}
    const cats=categoryRows(raw);
    const recent=readRecent().filter(x=>normalize(x).includes(normalize(raw))).slice(0,3);
    let html="";
    if(cats.length){
      html+='<div class="hd-search-assist-group">Categories</div>';
      html+=cats.map(x=>option({icon:"↗",label:x.title,sub:"Search "+x.query,value:x.query,type:"category"})).join("");
    }
    if(recent.length){
      html+='<div class="hd-search-assist-group">Recent searches</div>';
      html+=recent.map(x=>option({icon:"↺",label:x,value:x,type:"recent"})).join("");
    }
    html+='<div class="hd-search-assist-group">AI search</div>';
    html+=option({icon:"✦",label:'Search all HUNT for “'+raw+'”',sub:"Natural-language search across the current catalog",value:raw,type:"ai"});
    panel.innerHTML=html;
    panel.hidden=false;
  }

  let timer=0;
  input.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(render,60)});
  input.addEventListener("focus",render);
  input.addEventListener("keydown",event=>{
    if(event.key==="Escape"){panel.hidden=true;return;}
    const options=[...panel.querySelectorAll(".hd-search-assist-option")];
    if(!options.length||!["ArrowDown","ArrowUp","Enter"].includes(event.key))return;
    const current=options.findIndex(x=>x.getAttribute("aria-selected")==="true");
    if(event.key==="Enter"&&current<0)return;
    event.preventDefault();
    let next=current;
    if(event.key==="ArrowDown")next=(current+1)%options.length;
    if(event.key==="ArrowUp")next=current<=0?options.length-1:current-1;
    options.forEach((x,i)=>x.setAttribute("aria-selected",String(i===next)));
    if(event.key==="Enter")options[next].click();
  });

  panel.addEventListener("click",event=>{
    const btn=event.target.closest(".hd-search-assist-option");
    if(!btn)return;
    input.value=btn.dataset.assistValue||"";
    saveRecent(input.value);
    panel.hidden=true;
    form.requestSubmit();
  });

  form.addEventListener("submit",()=>{
    saveRecent(input.value);
    panel.hidden=true;
  },{capture:true});

  document.addEventListener("click",event=>{
    if(!form.contains(event.target))panel.hidden=true;
  });
})();
