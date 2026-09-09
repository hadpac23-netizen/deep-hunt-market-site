(() => {
  const key="hunt_mission_v1";
  const form=document.querySelector("#hd-mission-form");
  if(!form)return;
  const query=document.querySelector("#hd-mission-query");
  const budget=document.querySelector("#hd-mission-budget");
  const deadline=document.querySelector("#hd-mission-deadline");
  const status=document.querySelector("#hd-mission-status");
  try{
    const saved=JSON.parse(localStorage.getItem(key)||"null");
    if(saved){ query.value=saved.query||""; budget.value=saved.budget||""; deadline.value=saved.deadline||""; }
  }catch{}
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const q=String(query.value||"").trim().slice(0,120);
    if(!q)return;
    const b=Number(budget.value||0);
    const mission={query:q,budget:Number.isFinite(b)&&b>0?b:null,deadline:String(deadline.value||"")||null,created_at:new Date().toISOString()};
    localStorage.setItem(key,JSON.stringify(mission));
    if(status)status.textContent="Mission saved on this device. Live search started; automated watch is not active yet.";
    const searchInput=document.querySelector("#hd-search-input");
    const searchForm=document.querySelector("#hd-search-form");
    if(searchInput)searchInput.value=q;
    searchForm?.requestSubmit();
  });
})();
