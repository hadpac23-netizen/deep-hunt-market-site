(() => {
  const H=window.HuntCore;
  if(!H)return;

  const videos=[
    {
      id:"_yru79c5iqg",
      title:"Spring / Summer Fashion Edit",
      source:"Mytheresa · Official",
      category:"women",
      note:"Luxury styling inspiration"
    },
    {
      id:"SmZUO62zGsE",
      title:"Spring / Summer Looks",
      source:"H&M Middle East · Official",
      category:"women",
      note:"Seasonal fashion inspiration"
    },
    {
      id:"KxOLDtVVEU8",
      title:"501 Originals",
      source:"Levi's · Official",
      category:"women",
      note:"Denim and everyday styling"
    }
  ];

  function esc(v){return H.esc(String(v??""))}
  function card(video){
    const thumb="https://i.ytimg.com/vi/"+encodeURIComponent(video.id)+"/hqdefault.jpg";
    return '<article class="hd-fashion-video-card" data-fashion-video="'+esc(video.id)+'" data-fashion-category="'+esc(video.category)+'">'+
      '<button class="hd-fashion-video-thumb" type="button" aria-label="Play '+esc(video.title)+'">'+
        '<img src="'+thumb+'" alt="" loading="lazy" referrerpolicy="no-referrer">'+
        '<span class="hd-fashion-play" aria-hidden="true">▶</span>'+
        '<span class="hd-fashion-official">OFFICIAL VIDEO</span>'+
      '</button>'+
      '<div class="hd-fashion-video-copy">'+
        '<small>'+esc(video.source)+'</small>'+
        '<h3>'+esc(video.title)+'</h3>'+
        '<p>'+esc(video.note)+'</p>'+
      '</div>'+
    '</article>';
  }

  function mount(){
    if(document.querySelector("#hd-fashion-lookbook"))return;
    const section=document.createElement("section");
    section.id="hd-fashion-lookbook";
    section.className="hd-fashion-lookbook";
    section.innerHTML=
      '<div class="hd-fashion-lookbook-head">'+
        '<div><small>HUNT FASHION LOOKBOOK</small><h2>See the style, not just the product card.</h2>'+
        '<p>Official fashion videos for inspiration. Video presence does not mean a commercial partnership with HUNT.</p></div>'+
        '<a href="category.html?c=women">Shop Women →</a>'+
      '</div>'+
      '<div class="hd-fashion-video-grid">'+videos.map(card).join("")+'</div>';

    const promo=document.querySelector("#hd-boom-promotions");
    const wow=document.querySelector("#hd-wow-showcase");
    const survey=document.querySelector("#hd-shopping-survey");
    if(promo)promo.after(section);
    else if(wow)wow.after(section);
    else if(survey)survey.after(section);
    else document.querySelector("#shop")?.before(section);
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.(".hd-fashion-video-thumb");
    if(!button)return;
    const cardEl=button.closest("[data-fashion-video]");
    if(!cardEl)return;
    const id=cardEl.dataset.fashionVideo||"";
    if(!/^[A-Za-z0-9_-]{6,20}$/.test(id))return;
    const category=cardEl.dataset.fashionCategory||"women";
    H.recordSignal?.(category,"view");
    const frame=document.createElement("iframe");
    frame.className="hd-fashion-video-frame";
    frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=1&rel=0";
    frame.title=cardEl.querySelector("h3")?.textContent||"Fashion video";
    frame.loading="lazy";
    frame.allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share";
    frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allowFullscreen=true;
    button.replaceWith(frame);
  });

  window.addEventListener("hunt:shelves",mount,{once:true});
  window.addEventListener("DOMContentLoaded",()=>setTimeout(mount,600),{once:true});
})();
