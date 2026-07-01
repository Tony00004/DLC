import { useState, useEffect } from "react";

export function DrawingZone({ onChange, initialShapes = [] }) {
  const [tool,      setTool]     = useState("select");
  const [color,     setColor]    = useState("#1a1a2e");
  const [fontSize,  setFontSize] = useState(16);
  const [bold,      setBold]     = useState(false);
  const [italic,    setItalic]   = useState(false);
  const [underline, setUnderline]= useState(false);
  const [shapes,    setShapes]   = useState(initialShapes);

  // Propager les formes au parent à chaque modification
  useEffect(() => { onChange(shapes); }, [shapes]); // eslint-disable-line react-hooks/exhaustive-deps
  const [drawing,   setDrawing]  = useState(null);
  const [clipboard, setClipboard]= useState(null);
  const [selected,  setSelected] = useState(null);
  const [drag,      setDrag]     = useState(null);
  const [resize,    setResize]   = useState(null);
  const [textEdit,  setTextEdit] = useState(null);
  const [textVal,   setTextVal]  = useState("");
  const [inputEl,   setInputEl]  = useState(null);

  // Focus sur l'input texte quand il s'ouvre
  useEffect(() => {
    if (textEdit && inputEl) setTimeout(() => { try { inputEl.focus(); } catch(e){} }, 30);
  }, [textEdit, inputEl]);

  // Copier / Coller / Suppr clavier
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey||e.metaKey) && e.key==="c" && selected) {
        const s = shapes.find(x=>x.id===selected);
        if (s) setClipboard(s);
      }
      if ((e.ctrlKey||e.metaKey) && e.key==="v" && clipboard) {
        const id=Date.now(), off=18;
        let s={...clipboard,id};
        if (s.type==="rect"||s.type==="text") s={...s,x:s.x+off,y:s.y+off};
        if (s.type==="ellipse") s={...s,cx:s.cx+off,cy:s.cy+off};
        if (s.type==="arrow")   s={...s,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
        setShapes(prev=>[...prev,s]);
        setSelected(id);
      }
      if ((e.key==="Delete"||e.key==="Backspace") && selected) {
        setShapes(prev=>prev.filter(x=>x.id!==selected));
        setSelected(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [selected, clipboard, shapes]);

  const TOOLS = [
    {id:"select",  icon:"↖", label:"Déplacer / Redim."},
    {id:"rect",    icon:"□", label:"Rectangle"},
    {id:"ellipse", icon:"○", label:"Cercle / Ovale"},
    {id:"arrow",   icon:"→", label:"Flèche"},
    {id:"text",    icon:"T", label:"Texte"},
  ];

  function getSvgPos(e) {
    const el = document.getElementById("draw-svg");
    if (!el) return {x:0,y:0};
    const r  = el.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    // Convertir les pixels rendus en coordonnées viewBox (0-760 × 0-440)
    const scaleX = 760 / r.width;
    const scaleY = 440 / r.height;
    return {x: Math.round((cx - r.left) * scaleX), y: Math.round((cy - r.top) * scaleY)};
  }

  // ── Clic SVG ─────────────────────────────────────────────────────────────
  function onSvgDown(e) {
    const pos = getSvgPos(e);

    // Mode texte : placer un texte même sur une forme existante
    if (tool === "text") {
      setTextEdit({x:pos.x, y:pos.y});
      setTextVal("");
      setSelected(null);
      e.preventDefault();
      return;
    }

    // Mode sélection : les clics sur formes/poignées sont gérés par onShapeDown / onHandleDown
    if (tool === "select" && (e.target.closest("[data-shape]") || e.target.closest("[data-handle]"))) return;

    setSelected(null);
    setResize(null);
    if (tool === "select") return;

    setDrawing({x0:pos.x, y0:pos.y, x1:pos.x, y1:pos.y});
    e.preventDefault();
  }

  function onSvgMove(e) {
    const pos = getSvgPos(e);
    if (drawing) { setDrawing(d=>({...d,x1:pos.x,y1:pos.y})); return; }
    if (drag) {
      setShapes(prev=>prev.map(s=>{
        if (s.id!==drag.id) return s;
        if (s.type==="rect"||s.type==="text") return {...s,x:pos.x-drag.ox,y:pos.y-drag.oy};
        if (s.type==="ellipse") return {...s,cx:pos.x-drag.ox,cy:pos.y-drag.oy};
        if (s.type==="arrow") { const dx=(pos.x-drag.ox)-s.x0,dy=(pos.y-drag.oy)-s.y0; return {...s,x0:s.x0+dx,y0:s.y0+dy,x1:s.x1+dx,y1:s.y1+dy}; }
        return s;
      }));
      return;
    }
    if (resize) {
      setShapes(prev=>prev.map(s=>{
        if (s.id!==resize.id) return s;
        const dx=pos.x-resize.ox, dy=pos.y-resize.oy;
        if (s.type==="rect") {
          const h=resize.handle;
          let {x,y,w,h:ht}=s;
          if (h.includes("e")) w=Math.max(8,resize.snap.w+dx);
          if (h.includes("s")) ht=Math.max(8,resize.snap.h+dy);
          if (h.includes("w")) {x=Math.min(resize.snap.x+resize.snap.w-8,resize.snap.x+dx);w=Math.max(8,resize.snap.w-dx);}
          if (h.includes("n")) {y=Math.min(resize.snap.y+resize.snap.h-8,resize.snap.y+dy);ht=Math.max(8,resize.snap.h-dy);}
          return {...s,x,y,w,h:ht};
        }
        if (s.type==="ellipse") {
          let {rx,ry}=s;
          const h=resize.handle;
          if (h==="e"||h==="w") rx=Math.max(4,resize.snap.rx+Math.abs(dx));
          if (h==="n"||h==="s") ry=Math.max(4,resize.snap.ry+Math.abs(dy));
          if (h==="ne"||h==="nw"||h==="se"||h==="sw") {rx=Math.max(4,resize.snap.rx+Math.abs(dx));ry=Math.max(4,resize.snap.ry+Math.abs(dy));}
          return {...s,rx,ry};
        }
        if (s.type==="arrow") {
          if (resize.handle==="start") return {...s,x0:pos.x,y0:pos.y};
          if (resize.handle==="end")   return {...s,x1:pos.x,y1:pos.y};
        }
        return s;
      }));
    }
  }

  function onSvgUp() {
    if (drag)   { setDrag(null);   return; }
    if (resize) { setResize(null); return; }
    if (!drawing) return;
    const {x0,y0,x1,y1}=drawing;
    if (Math.abs(x1-x0)<5&&Math.abs(y1-y0)<5) { setDrawing(null); return; }
    const id=Date.now();
    let s={id,color};
    if (tool==="rect")    s={...s,type:"rect",   x:Math.min(x0,x1),y:Math.min(y0,y1),w:Math.abs(x1-x0),h:Math.abs(y1-y0)};
    if (tool==="ellipse") s={...s,type:"ellipse",cx:Math.round((x0+x1)/2),cy:Math.round((y0+y1)/2),rx:Math.max(4,Math.round(Math.abs(x1-x0)/2)),ry:Math.max(4,Math.round(Math.abs(y1-y0)/2))};
    if (tool==="arrow")   s={...s,type:"arrow",  x0,y0,x1,y1};
    setShapes(prev=>[...prev,s]);
    setSelected(id);
    setDrawing(null);
  }

  function onShapeDown(e, s) {
    if (tool==="text") {
      e.stopPropagation();
      const pos = getSvgPos(e);
      setTextEdit({x:pos.x, y:pos.y});
      setTextVal("");
      setSelected(null);
      e.preventDefault();
      return;
    }
    // Outils de dessin (rect/ellipse/arrow) : laisser l'événement remonter à onSvgDown
    if (tool!=="select") return;
    e.stopPropagation();
    setSelected(s.id);
    const pos=getSvgPos(e);
    const ax=s.type==="ellipse"?s.cx:s.x0!==undefined?s.x0:s.x;
    const ay=s.type==="ellipse"?s.cy:s.y0!==undefined?s.y0:s.y;
    setDrag({id:s.id,ox:pos.x-ax,oy:pos.y-ay});
    e.preventDefault();
  }

  function onHandleDown(e, s, handle) {
    e.stopPropagation(); e.preventDefault();
    const pos=getSvgPos(e);
    const snap=s.type==="rect"?{x:s.x,y:s.y,w:s.w,h:s.h}:s.type==="ellipse"?{rx:s.rx,ry:s.ry}:{};
    setResize({id:s.id,handle,ox:pos.x,oy:pos.y,snap});
    setDrag(null);
  }

  function onShapeDblClick(e, s) {
    e.stopPropagation();
    if (s.type==="text") { setTextEdit({id:s.id,x:s.x,y:s.y}); setTextVal(s.text); }
  }

  function commitText() {
    const t=(textVal||"").trim();
    if (t) {
      if (textEdit&&textEdit.id) {
        setShapes(prev=>prev.map(s=>s.id===textEdit.id?{...s,text:t}:s));
      } else if (textEdit) {
        const id=Date.now();
        setShapes(prev=>[...prev,{id,type:"text",x:textEdit.x,y:textEdit.y,text:t,color,fs:fontSize,bold,italic,underline}]);
        setSelected(id);
      }
    }
    setTextEdit(null); setTextVal(""); setInputEl(null);
  }

  // ── Changer la couleur d'une forme sélectionnée ───────────────────────────
  function applyColorToSelected(newColor) {
    setColor(newColor);
    if (selected) setShapes(prev=>prev.map(s=>s.id===selected?{...s,color:newColor}:s));
  }

  // ── Changer le style texte d'une forme sélectionnée ──────────────────────
  function applyTextStyle(prop, value) {
    if (selected) {
      const s = shapes.find(x=>x.id===selected);
      if (s && s.type==="text") setShapes(prev=>prev.map(sh=>sh.id===selected?{...sh,[prop]:value}:sh));
    }
    if (prop==="bold")      setBold(value);
    if (prop==="italic")    setItalic(value);
    if (prop==="underline") setUnderline(value);
    if (prop==="fs")        setFontSize(value);
  }

  function deleteSelected() { setShapes(prev=>prev.filter(s=>s.id!==selected)); setSelected(null); }

  function duplicateSelected() {
    const s=shapes.find(x=>x.id===selected);
    if (!s) return;
    setClipboard(s);
    const id=Date.now(),off=18;
    let ns={...s,id};
    if (s.type==="rect"||s.type==="text") ns={...ns,x:s.x+off,y:s.y+off};
    if (s.type==="ellipse") ns={...ns,cx:s.cx+off,cy:s.cy+off};
    if (s.type==="arrow")   ns={...ns,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
    setShapes(prev=>[...prev,ns]);
    setSelected(id);
  }

  function preview() {
    if (!drawing) return null;
    const {x0,y0,x1,y1}=drawing;
    const p={fill:color+"15",stroke:color,strokeWidth:1.5,strokeDasharray:"5 3"};
    if (tool==="rect")    return <rect x={Math.min(x0,x1)} y={Math.min(y0,y1)} width={Math.abs(x1-x0)} height={Math.abs(y1-y0)} {...p}/>;
    if (tool==="ellipse") return <ellipse cx={Math.round((x0+x1)/2)} cy={Math.round((y0+y1)/2)} rx={Math.max(4,Math.round(Math.abs(x1-x0)/2))} ry={Math.max(4,Math.round(Math.abs(y1-y0)/2))} {...p}/>;
    if (tool==="arrow")   return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#pah)"/>;
    return null;
  }

  function renderHandles(s) {
    const hs={style:{pointerEvents:"all",cursor:"pointer"},fill:"#0284c7","data-handle":true};
    const H=7;
    if (s.type==="rect") {
      const pts=[["n",s.x+s.w/2,s.y],["ne",s.x+s.w,s.y],["e",s.x+s.w,s.y+s.h/2],["se",s.x+s.w,s.y+s.h],["s",s.x+s.w/2,s.y+s.h],["sw",s.x,s.y+s.h],["w",s.x,s.y+s.h/2],["nw",s.x,s.y]];
      return pts.map(([h,hx,hy])=><rect key={h} {...hs} x={hx-H/2} y={hy-H/2} width={H} height={H} rx={1} style={{...hs.style,cursor:h==="n"||h==="s"?"ns-resize":h==="e"||h==="w"?"ew-resize":"nwse-resize"}} onMouseDown={e=>onHandleDown(e,s,h)}/>);
    }
    if (s.type==="ellipse") {
      const pts=[["n",s.cx,s.cy-s.ry],["e",s.cx+s.rx,s.cy],["s",s.cx,s.cy+s.ry],["w",s.cx-s.rx,s.cy],["ne",s.cx+s.rx,s.cy-s.ry],["se",s.cx+s.rx,s.cy+s.ry],["sw",s.cx-s.rx,s.cy+s.ry],["nw",s.cx-s.rx,s.cy-s.ry]];
      return pts.map(([h,hx,hy])=><rect key={h} {...hs} x={hx-H/2} y={hy-H/2} width={H} height={H} rx={1} style={{...hs.style,cursor:"nwse-resize"}} onMouseDown={e=>onHandleDown(e,s,h)}/>);
    }
    if (s.type==="arrow") return [
      <circle key="s" {...hs} cx={s.x0} cy={s.y0} r={5} style={{...hs.style,cursor:"crosshair"}} onMouseDown={e=>onHandleDown(e,s,"start")}/>,
      <circle key="e" {...hs} cx={s.x1} cy={s.y1} r={5} style={{...hs.style,cursor:"crosshair"}} onMouseDown={e=>onHandleDown(e,s,"end")}/>,
    ];
    return null;
  }

  const sel = shapes.find(s=>s.id===selected);
  const isSelText = sel && sel.type==="text";

  // Synchro des contrôles de style quand on sélectionne une forme
  useEffect(() => {
    if (sel) {
      setColor(sel.color||"#1a1a2e");
      if (sel.type==="text") {
        setFontSize(sel.fs||16);
        setBold(!!sel.bold);
        setItalic(!!sel.italic);
        setUnderline(!!sel.underline);
      }
    }
  }, [selected]);

  const btnTool = id => ({
    padding:"5px 10px",fontSize:11,borderRadius:5,cursor:"pointer",fontWeight:tool===id?700:500,
    background:tool===id?"#04043C":"#f3f4f6",color:tool===id?"#fff":"#374151",
    border:tool===id?"1.5px solid #04043C":"1.5px solid #d1d5db",
  });

  const btnStyle = (active) => ({
    padding:"4px 8px",fontSize:12,borderRadius:4,cursor:"pointer",fontWeight:700,
    background:active?"#04043C":"#f3f4f6",color:active?"#fff":"#374151",
    border:active?"1.5px solid #04043C":"1.5px solid #d1d5db",
  });

  return (
    <div>
      {/* Barre d'outils — outils de dessin */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6,alignItems:"center",padding:"7px 10px",background:"#f8f9fa",border:"1px solid #e5e7eb",borderRadius:"8px 8px 0 0"}}>
        <span style={{fontSize:11,color:"#6b7280",marginRight:2,fontWeight:600}}>Outil :</span>
        {TOOLS.map(t=>(
          <button key={t.id} type="button" style={btnTool(t.id)}
            onClick={()=>{setTool(t.id);if(t.id!=="select")setSelected(null);setTextEdit(null);}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Barre d'outils — apparence */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center",padding:"6px 10px",background:"#f0f4f8",border:"1px solid #e5e7eb",borderTop:"none"}}>
        <span style={{fontSize:11,color:"#6b7280",marginRight:2,fontWeight:600}}>Couleur :</span>
        <input type="color" value={color} onChange={e=>applyColorToSelected(e.target.value)}
          style={{width:28,height:24,border:"1px solid #d1d5db",borderRadius:3,padding:1,cursor:"pointer"}}/>

        {/* Taille texte (toujours visible) */}
        <span style={{fontSize:11,color:"#6b7280",marginLeft:6,fontWeight:600}}>Texte :</span>
        <select value={fontSize} onChange={e=>applyTextStyle("fs",Number(e.target.value))}
          style={{fontSize:11,border:"1px solid #d1d5db",borderRadius:4,padding:"2px 4px",cursor:"pointer"}}>
          {[10,12,14,16,18,22,28].map(sz=><option key={sz} value={sz}>{sz}px</option>)}
        </select>
        <button type="button" style={btnStyle(bold)}    onClick={()=>applyTextStyle("bold",    !bold)}>    <b>G</b></button>
        <button type="button" style={btnStyle(italic)}  onClick={()=>applyTextStyle("italic",  !italic)}>  <i>I</i></button>
        <button type="button" style={{...btnStyle(underline),textDecoration:"underline"}} onClick={()=>applyTextStyle("underline",!underline)}>S</button>

        {/* Actions sur la sélection */}
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {selected && <>
            <button type="button" onClick={duplicateSelected}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#e0f2fe",color:"#0369a1",border:"1px solid #7dd3fc",cursor:"pointer"}}>⧉ Copier</button>
            {clipboard && <button type="button" onClick={()=>{
              const id=Date.now(),off=18,s=clipboard;
              let ns={...s,id};
              if(s.type==="rect"||s.type==="text")ns={...ns,x:s.x+off,y:s.y+off};
              if(s.type==="ellipse")ns={...ns,cx:s.cx+off,cy:s.cy+off};
              if(s.type==="arrow")ns={...ns,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
              setShapes(prev=>[...prev,ns]);setSelected(id);
            }} style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#dcfce7",color:"#166534",border:"1px solid #86efac",cursor:"pointer"}}>⧉ Coller</button>}
            {isSelText && <button type="button" onClick={()=>{setTextEdit({id:sel.id,x:sel.x,y:sel.y});setTextVal(sel.text);}}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#f3f4f6",color:"#374151",border:"1px solid #d1d5db",cursor:"pointer"}}>✎ Modifier</button>}
            <button type="button" onClick={deleteSelected}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#fee2e2",color:"#b42318",border:"1px solid #fca5a5",cursor:"pointer",fontWeight:700}}>🗑 Supprimer</button>
          </>}
          {shapes.length>0 && <button type="button" onClick={()=>{if(window.confirm("Effacer tout ?"))setShapes([]);}}
            style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#f3f4f6",color:"#6b7280",border:"1px solid #d1d5db",cursor:"pointer"}}>Tout effacer</button>}
        </div>
      </div>

      {/* Aide contextuelle */}
      <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,minHeight:14,paddingLeft:2}}>
        {tool==="select"&&!selected&&"Cliquez pour sélectionner · Glissez pour déplacer · Tirez les poignées pour redimensionner"}
        {tool==="select"&&selected&&"Glissez pour déplacer · Tirez les poignées bleues pour redimensionner · Suppr pour effacer"}
        {(tool==="rect"||tool==="ellipse"||tool==="arrow")&&"Cliquez et glissez pour dessiner la forme"}
        {tool==="text"&&!textEdit&&"Cliquez n'importe où — même sur une forme — pour placer un texte"}
        {tool==="text"&&textEdit&&"Tapez votre texte · Entrée pour valider · Échap pour annuler"}
      </div>

      {/* Canvas SVG */}
      <div style={{position:"relative"}}>
        <svg id="draw-svg" width="100%" viewBox="0 0 760 440"
          style={{display:"block",border:"2px solid #d1d5db",borderRadius:"0 0 8px 8px",background:"#fff",
            cursor:drag||resize?"grabbing":tool==="text"?"text":tool==="select"?"default":"crosshair",
            userSelect:"none",touchAction:"none"}}
          onMouseDown={onSvgDown} onMouseMove={onSvgMove} onMouseUp={onSvgUp}
          onMouseLeave={()=>{if(drag)setDrag(null);if(resize)setResize(null);if(drawing)setDrawing(null);}}>

          <defs>
            <pattern id="g20" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0L0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.6"/>
            </pattern>
            <pattern id="g100" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#g20)"/>
              <path d="M100 0L0 0 0 100" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
            <marker id="ah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill={color}/>
            </marker>
            <marker id="pah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill={color} opacity="0.5"/>
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="url(#g100)"/>

          {/* ── Passe 1 : formes géométriques (arrière-plan) ── */}
          {shapes.filter(s=>s.type!=="text").map(s=>{
            const isSel=s.id===selected;
            const sc=isSel?"#0284c7":s.color;
            const sw=isSel?2.5:1.8;
            const dd=isSel?"6 3":"none";
            const cur=tool==="text"?"text":tool==="select"?(drag?.id===s.id||resize?.id===s.id?"grabbing":"grab"):"default";
            const sp={"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),onDoubleClick:e=>onShapeDblClick(e,s),style:{cursor:cur}};

            if (s.type==="rect") return (
              <g key={s.id}>
                <rect {...sp} x={s.x} y={s.y} width={s.w} height={s.h}
                  fill={s.color+"20"} stroke={sc} strokeWidth={sw} strokeDasharray={dd} rx={2}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            if (s.type==="ellipse") return (
              <g key={s.id}>
                <ellipse {...sp} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
                  fill={s.color+"20"} stroke={sc} strokeWidth={sw} strokeDasharray={dd}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            if (s.type==="arrow") return (
              <g key={s.id}>
                <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}
                  stroke="transparent" strokeWidth={14}
                  {...{"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),style:{cursor:tool==="text"?"text":tool==="select"?"grab":"default"}}}/>
                <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}
                  stroke={sc} strokeWidth={isSel?3:2} strokeDasharray={dd} markerEnd="url(#ah)" style={{pointerEvents:"none"}}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            return null;
          })}

          {/* ── Passe 2 : textes (avant-plan, toujours par-dessus) ── */}
          {shapes.filter(s=>s.type==="text").map(s=>{
            const isSel=s.id===selected;
            const cur=tool==="text"?"text":tool==="select"?(drag?.id===s.id?"grabbing":"grab"):"default";
            const sp={"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),onDoubleClick:e=>onShapeDblClick(e,s),style:{cursor:cur}};
            return (
              <g key={s.id}>
                {isSel&&<rect x={s.x-4} y={s.y-(s.fs||16)-4}
                  width={Math.max(50,(s.text||"").length*(s.fs||16)*0.56+8)} height={(s.fs||16)+14}
                  fill="#e0f2fe44" stroke="#0284c7" strokeWidth={1.5} strokeDasharray="4 2" rx={3} style={{pointerEvents:"none"}}/>}
                <text {...sp} x={s.x} y={s.y} fill={isSel?"#0284c7":s.color}
                  fontSize={s.fs||16} fontFamily="Arial,sans-serif"
                  fontWeight={s.bold?"bold":"500"} fontStyle={s.italic?"italic":"normal"}
                  textDecoration={s.underline?"underline":"none"}>
                  {s.text}
                </text>
              </g>
            );
          })}

          {preview()}
          <text x="8" y="434" fontSize="11" fill="#c0c4cc" style={{pointerEvents:"none"}}>
            {shapes.length} objet{shapes.length!==1?"s":""}
          </text>
        </svg>

        {/* Overlay saisie texte */}
        {textEdit && (
          <div style={{
            position:"absolute",
            left:Math.min(textEdit.x||40, 400),
            top:Math.max((textEdit.y||40)-fontSize-4, 0),
            zIndex:20,background:"rgba(255,255,255,0.97)",
            border:"2px solid #0284c7",borderRadius:6,padding:"6px 8px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.18)",minWidth:160,
          }} onMouseDown={e=>e.stopPropagation()}>
            <div style={{fontSize:11,color:"#0369a1",marginBottom:4,fontWeight:600}}>
              {textEdit.id?"Modifier le texte":"Nouveau texte"}
            </div>
            <input
              ref={el=>{if(el&&!inputEl){setInputEl(el);el.focus();}}}
              value={textVal}
              onChange={e=>setTextVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){e.preventDefault();commitText();}
                if(e.key==="Escape"){setTextEdit(null);setTextVal("");setInputEl(null);}
                e.stopPropagation();
              }}
              placeholder="Tapez votre texte…"
              style={{
                fontSize:fontSize,fontFamily:"Arial,sans-serif",color:color,
                fontWeight:bold?"bold":"normal",fontStyle:italic?"italic":"normal",
                textDecoration:underline?"underline":"none",
                border:"none",outline:"none",background:"transparent",width:200,display:"block",
              }}
            />
            <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
              <button type="button" onMouseDown={e=>{e.stopPropagation();setTextEdit(null);setTextVal("");setInputEl(null);}}
                style={{fontSize:11,padding:"2px 8px",borderRadius:4,border:"1px solid #d1d5db",background:"#f3f4f6",cursor:"pointer"}}>Annuler</button>
              <button type="button" onMouseDown={e=>{e.stopPropagation();commitText();}}
                style={{fontSize:11,padding:"2px 8px",borderRadius:4,border:"none",background:"#0284c7",color:"#fff",cursor:"pointer",fontWeight:700}}>✓ Placer</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
