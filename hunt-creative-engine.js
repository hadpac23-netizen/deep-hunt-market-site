(() => {
  const safeHttps=value=>{try{return new URL(String(value||"")).protocol==="https:"}catch{return false}};
  function storyAt(stories,index){return stories[(index+stories.length)%stories.length]||null}
  function compose(stories,index=0){
    const rows=(stories||[]).filter(x=>x?.item?.item_id);
    if(!rows.length)return {format:"empty",stories:[]};
    const primary=storyAt(rows,index);
    const same=rows.filter((x,i)=>i!==index&&x.interest===primary.interest);
    const next=[storyAt(rows,index+1),storyAt(rows,index+2),storyAt(rows,index+3)].filter(Boolean);
    const format=["spotlight","duo","mosaic","look"][index%4];
    if(format==="spotlight")return {format,stories:[primary]};
    if(format==="duo")return {format,stories:[primary,...next.slice(0,1)]};
    if(format==="look"){
      const companions=[...same,...next].filter((x,i,a)=>x&&a.findIndex(y=>y.item.item_id===x.item.item_id&&y.item.provider===x.item.provider)===i).slice(0,2);
      return {format:"look",stories:[primary,...companions]};
    }
    return {format:"mosaic",stories:[primary,...next.slice(0,2)]};
  }
  function approvedVideo(story){
    const item=story?.item||{};
    return item.creative_approved===true&&safeHttps(item.creative_video_url)?item.creative_video_url:"";
  }
  window.HuntCreative=Object.freeze({compose,approvedVideo});
})();