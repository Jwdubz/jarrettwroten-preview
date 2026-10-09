/* jarrettwroten.com DRAFT motion (2026-10-09). Forked from the live jw.js; changes are marked "DRAFT:".
   Motion runs regardless of OS motion settings. The only control is Pause / Play (WCAG 2.2.2).
   Tags: [M] measured · [M~] matched to a measured profile · [P] proxy · [U] UNMEASURED-DEFAULT. Sources: /workspace/sotd-playbook */
(function(){
  var d=document, html=d.documentElement, paused=false;
  var hasG = typeof window.gsap!=="undefined";
  function $$(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s));}
  function revealAll(){ $$("[data-reveal],[data-hero],[data-hero-w]").forEach(function(el){el.style.opacity=1;el.style.transform="none";}); }
  if(!hasG){ revealAll(); }

  /* split headings into words */
  $$("[data-split]").forEach(function(h){
    var words=h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label",h.textContent.trim());
    h.innerHTML=words.map(function(w){return '<span class="w" aria-hidden="true" style="overflow:hidden;display:inline-block;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em"><span class="wi" style="display:inline-block">'+w+'</span></span>';}).join(" ");
  });

  /* smooth scroll */
  var lenis=null;
  if(window.Lenis){
    /* Scroll feel = live b16d611 exactly (Jarrett, 10-09): Lenis 1.1.13, lerp 0.1. */
    lenis=new Lenis({lerp:0.1,wheelMultiplier:1,smoothWheel:true});
    if(hasG&&window.ScrollTrigger){ lenis.on("scroll",ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000);}); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0); }
    window.__lenis=lenis;
    $$('a[href^="#"]').forEach(function(a){a.addEventListener("click",function(e){var id=a.getAttribute("href");if(id.length<2)return;var t=d.querySelector(id);if(!t)return;e.preventDefault();lenis.scrollTo(t,{offset:-10,duration:1.2});history.replaceState(null,"",id);});});
  }

  /* header */
  var hdr=d.getElementById("hdr");
  function onScroll(){ if(hdr) hdr.classList.toggle("is-solid", window.scrollY>24); }
  window.addEventListener("scroll",onScroll,{passive:true}); onScroll();

  /* menu */
  var mb=d.getElementById("menuBtn"), menu=d.getElementById("menu");
  if(mb&&menu){
    var menuT=0;
    /* DRAFT: panel reveal (R5): clip-path 600ms [M duration], ease pairing [U] */
    function setMenu(open){ mb.setAttribute("aria-expanded",open?"true":"false"); mb.textContent=open?"Close":"Menu"; clearTimeout(menuT);
      if(open){ menu.hidden=false; void menu.offsetWidth; menu.classList.add("is-open"); }
      else { menu.classList.remove("is-open"); menuT=setTimeout(function(){ menu.hidden=true; },600); }
      if(lenis){open?lenis.stop():lenis.start();} d.body.style.overflow=open?"hidden":""; }
    mb.addEventListener("click",function(){setMenu(mb.getAttribute("aria-expanded")!=="true");});
    $$("a",menu).forEach(function(a){a.addEventListener("click",function(){setMenu(false);});});
    d.addEventListener("keydown",function(e){if(e.key==="Escape"&&!menu.hidden){setMenu(false);mb.focus();}});
  }

  /* looping concept films: play in view, pause out of view */
  var loops=$$("video[data-loop]");
  var vis=new Map();
  function tryPlay(v){ if(paused) return; var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){vis.set(en.target,en.isIntersecting); if(en.isIntersecting){ if(en.target.preload==="none"){en.target.preload="auto";} tryPlay(en.target);} else en.target.pause();});},{rootMargin:"200px 0px"});
    loops.forEach(function(v){v.muted=true;io.observe(v);});
  } else loops.forEach(function(v){v.muted=true;tryPlay(v);});

  /* motion toggle */
  var mt=d.getElementById("motionBtn");
  function setPaused(p){
    paused=p; html.classList.toggle("is-paused",p);
    if(mt){ mt.setAttribute("aria-pressed",p?"true":"false"); mt.setAttribute("aria-label",p?"Play Motion":"Pause Motion"); mt.querySelector(".motion__txt").textContent=p?"Play":"Pause"; }
    if(hasG){ p?gsap.globalTimeline.pause():gsap.globalTimeline.resume(); }
    loops.forEach(function(v){ if(p) v.pause(); else if(vis.get(v)) tryPlay(v); });
    /* DRAFT: Pause also stops smooth scroll (R7) */
    if(lenis){ p?lenis.stop():lenis.start(); }
  }
  if(mt) mt.addEventListener("click",function(){setPaused(!paused);});

  if(hasG){
    if(window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    var E="expo.out";
    /* hero entrance */
    var tl=gsap.timeline({delay:.15});
    /* DRAFT: hero entrance 1.2s [M] (9 sites); expo.out + stagger [U] */
    tl.to("[data-hero-w]",{opacity:1,y:0,duration:1.2,ease:E,stagger:.09})
      .to("[data-hero]",{opacity:1,y:0,duration:1.0,ease:E,stagger:.1},"-=0.95");
    /* DRAFT: the film plate opens from an inset rounded frame to full bleed as the hero scrolls away (scrubbed, ease none) */
    var pf=d.getElementById("plateFrame"), hh=d.querySelector(".hero__head");
    if(pf&&hh&&window.ScrollTrigger){
      var st={p:0};
      var apply=function(){ var px=parseFloat(getComputedStyle(hh).paddingLeft)||0, r=(window.innerWidth<=900?14:18), k=1-st.p;
        pf.style.clipPath="inset(0 "+(px*k).toFixed(1)+"px 0 "+(px*k).toFixed(1)+"px round "+(r*k).toFixed(1)+"px)"; };
      var hdrH=function(){ var h=d.getElementById("hdr"); return h?h.offsetHeight:72; };
      var top0=function(){ return pf.getBoundingClientRect().top+window.scrollY; };
      apply();
      gsap.to(st,{p:1,ease:"none",onUpdate:apply,scrollTrigger:{trigger:pf,start:function(){return 0;},end:function(){return Math.max(1,top0()-hdrH());},scrub:true,invalidateOnRefresh:true,onRefresh:apply}});
      window.addEventListener("resize",apply);
    }
    if(window.ScrollTrigger){
      /* headings */
      $$("[data-split]").forEach(function(h){
        gsap.from($$(".wi",h),{yPercent:110,duration:1.1,ease:E,stagger:.06,scrollTrigger:{trigger:h,start:"top 86%"}});
      });
      ScrollTrigger.batch("[data-reveal]",{start:"top 90%",onEnter:function(b){gsap.to(b,{opacity:1,y:0,duration:1.1,ease:E,stagger:.12,overwrite:true});}});
      /* path line draw */
      var pl=d.getElementById("pathLine");
      if(pl){ var L=pl.getTotalLength(); pl.style.strokeDasharray=L; pl.style.strokeDashoffset=L;
        gsap.to(pl,{strokeDashoffset:0,ease:"none",scrollTrigger:{trigger:"#path",start:"top 80%",end:"bottom 55%",scrub:.6}}); }
      /* count up */
      $$("[data-count]").forEach(function(el){ var to=parseFloat(el.getAttribute("data-count")), o={v:0};
        ScrollTrigger.create({trigger:el,start:"top 85%",once:true,onEnter:function(){ gsap.to(o,{v:to,duration:2.2,ease:"power3.out",onUpdate:function(){el.textContent="$"+o.v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}}); }}); });
      /* portrait parallax */
      var ph=d.querySelector(".how__photo img");
      if(ph) gsap.fromTo(ph,{yPercent:-6},{yPercent:6,ease:"none",scrollTrigger:{trigger:ph,start:"top bottom",end:"bottom top",scrub:true}});
      /* card media drift */
      $$(".card__frame .media").forEach(function(m){ gsap.fromTo(m,{yPercent:3},{yPercent:-3,ease:"none",scrollTrigger:{trigger:m,start:"top bottom",end:"bottom top",scrub:true}}); });
      var wv=d.querySelector(".walk__v");
      if(wv) gsap.fromTo(wv,{scale:1.18},{scale:1,ease:"none",scrollTrigger:{trigger:".walk",start:"top bottom",end:"bottom bottom",scrub:true}});
    }
    /* magnetic buttons */
    if(window.matchMedia("(pointer:fine)").matches){
      $$(".magnetic").forEach(function(b){
        var x=gsap.quickTo(b,"x",{duration:.6,ease:"power3"}), y=gsap.quickTo(b,"y",{duration:.6,ease:"power3"});
        b.addEventListener("pointermove",function(e){var r=b.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.25);y((e.clientY-r.top-r.height/2)*.35);});
        b.addEventListener("pointerleave",function(){x(0);y(0);});
      });
    }
    setTimeout(function(){ $$("[data-hero],[data-hero-w]").forEach(function(el){ if(getComputedStyle(el).opacity==="0"&&!paused){el.style.opacity=1;el.style.transform="none";} }); },4000);
  }


  /* land deep links (e.g. /portfolio/#c-rana) after fonts and layout settle */
  if(location.hash.length>1){
    var tgt=d.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(tgt){
      var userMoved=false;
      ["wheel","touchstart","keydown"].forEach(function(ev){ window.addEventListener(ev,function(){userMoved=true;},{passive:true,once:true}); });
      var land=function(){
        if(userMoved) return;
        var shift=0, el=tgt;
        while(el&&el!==d.body){ var t=getComputedStyle(el).transform; if(t&&t!=="none"){ var m=t.match(/matrix(3d)?\(([^)]+)\)/); if(m){ var v=m[2].split(",").map(parseFloat); shift+= m[1]? v[13] : v[5]; } } el=el.parentElement; }
        var y=Math.max(0,tgt.getBoundingClientRect().top-shift+window.scrollY-(window.innerWidth<=900?84:96));
        if(lenis) lenis.scrollTo(y,{immediate:true,force:true}); else window.scrollTo(0,y);
      };
      window.addEventListener("load",function(){ (d.fonts&&d.fonts.ready?d.fonts.ready:Promise.resolve()).then(function(){ [120,600,1300,2200].forEach(function(ms,i){ setTimeout(function(){ if(i===1&&window.ScrollTrigger) ScrollTrigger.refresh(); land(); },ms); }); }); });
    }
  }
  /* walkthrough (opt-in) */
  var wo=d.getElementById("walkOpen"), dlg=d.getElementById("walkDialog");
  if(wo&&dlg&&dlg.showModal){
    var v=d.getElementById("walkVideo"), sc=d.getElementById("walkScrub"), end=d.getElementById("walkEnd"), cl=d.getElementById("walkClose"), rp=d.getElementById("walkReplay");
    function start(){ end.hidden=true; v.currentTime=0; var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
    wo.addEventListener("click",function(){ dlg.showModal(); if(lenis)lenis.stop(); v.preload="auto"; start(); cl.focus(); });
    function closeIt(){ v.pause(); if(dlg.open) dlg.close(); }
    cl.addEventListener("click",closeIt);
    dlg.addEventListener("close",function(){ v.pause(); if(lenis)lenis.start(); wo.focus(); });
    rp.addEventListener("click",start);
    v.addEventListener("timeupdate",function(){ if(v.duration) sc.value=Math.round(v.currentTime/v.duration*1000); });
    v.addEventListener("ended",function(){ end.hidden=false; });
    sc.addEventListener("input",function(){ if(v.duration){ v.pause(); v.currentTime=sc.value/1000*v.duration; end.hidden=true; } });
    sc.addEventListener("change",function(){ if(v.currentTime<v.duration-0.05){ var p=v.play(); if(p&&p.catch)p.catch(function(){}); } });
  } else if(wo&&dlg){ wo.addEventListener("click",function(){ window.location.href="/assets/golden-arrival/golden-arrival-approved.mp4"; }); }

  /* DRAFT: hero film caption follows the montage (6 cuts x 2.2s, cut on the box with ffmpeg from the live concept loops; raw, no filters) */
  var pv=d.getElementById("plateVideo");
  if(pv){
    var segs=[["Rainbow Gardens","Wedding Venue","https://rainbow.jarrettwroten.com/"],["Generations Kitchen","Hawaiian Restaurant","https://generations.jarrettwroten.com/"],["Rana Levy","Fine Jewelry And Lapidary","https://rana.jarrettwroten.com/"],["Wrapstar","Wraps, Ceramic Coating And Tint","https://wrapstar.jarrettwroten.com/"],["Pā‘ina Café","Hawaiian Café","https://paina.jarrettwroten.com/"],["Stirling Club","Wedding And Event Venue","https://stirling.jarrettwroten.com/"]];
    var pn=d.getElementById("plateName"), pc=d.getElementById("plateCat"), pl=d.getElementById("plateLink"), cur=0;
    pv.addEventListener("timeupdate",function(){ var i=Math.min(segs.length-1,Math.floor(pv.currentTime/2.2)); if(i===cur) return; cur=i;
      pn.textContent=segs[i][0]; pc.textContent=segs[i][1]; pl.href=segs[i][2]; pl.setAttribute("aria-label","Open the "+segs[i][0]+" concept in a new tab"); });
  }

  /* DRAFT: reel is a slow auto-row you can drag (R3 / #17). touch-action:pan-y in CSS, so a vertical swipe that starts on it still scrolls the page (#28 [M]).
     Speed kept from the live marquee (one half-track per 70s). Hover still pauses, as on live. */
  var rs=d.getElementById("reelStrip"), rt=d.getElementById("reelTrack");
  if(rs&&rt){
    var x=0, half=0, last=0, hover=false, drag=null, moved=0;
    var measure=function(){ half=rt.scrollWidth/2; };
    measure(); window.addEventListener("resize",measure);
    var wrap=function(){ if(half>0){ while(x<=-half) x+=half; while(x>0) x-=half; } };
    var tick=function(t){ var dt=last?Math.min(64,t-last):16; last=t;
      if(!paused && !hover && !drag && half>0){ x-=half/70000*dt; }
      wrap(); rt.style.transform="translate3d("+x.toFixed(2)+"px,0,0)"; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    rs.addEventListener("pointerenter",function(e){ if(e.pointerType==="mouse") hover=true; });
    rs.addEventListener("pointerleave",function(e){ if(e.pointerType==="mouse") hover=false; });
    rs.addEventListener("focusin",function(){ hover=true; }); rs.addEventListener("focusout",function(){ hover=false; });
    rs.addEventListener("pointerdown",function(e){ if(e.button>0) return; drag={id:e.pointerId,sx:e.clientX,x0:x}; moved=0; });
    rs.addEventListener("pointermove",function(e){ if(!drag||e.pointerId!==drag.id) return; var dx=e.clientX-drag.sx; moved=Math.max(moved,Math.abs(dx));
      if(moved>6){ rs.classList.add("is-drag"); try{rs.setPointerCapture(e.pointerId);}catch(_){} } x=drag.x0+dx; });
    var end=function(e){ if(!drag||(e&&e.pointerId!==drag.id)) return; drag=null; rs.classList.remove("is-drag"); };
    rs.addEventListener("pointerup",end); rs.addEventListener("pointercancel",end);
    rs.addEventListener("click",function(e){ if(moved>6){ e.preventDefault(); e.stopPropagation(); moved=0; } },true);
  }

  /* DRAFT: back-to-top as an eased scroll (R8): sutera measured 3229px->0 in 1733ms [M]; curve fits cubic-bezier(0.70,0,0.30,1) [M];
     the cubic in-out below is our stand-in [U]. Real <button> >=44px (sutera's Top did nothing on Android touch [M]). */
  var tb=d.getElementById("toTop");
  if(tb){ tb.addEventListener("click",function(){ var io3=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
    if(lenis&&!paused) lenis.scrollTo(0,{duration:1.7,easing:io3,force:true}); else window.scrollTo({top:0,behavior:"smooth"});
    var h=d.getElementById("heroTitle"); setTimeout(function(){ var m=d.querySelector(".hdr__mark"); if(m) m.focus({preventScroll:true}); },1750); }); }
})();
