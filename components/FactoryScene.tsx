"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pause, Play, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export default function FactoryScene({machines}:{machines:any[]}) {
  const host=useRef<HTMLDivElement>(null),pauseRef=useRef(false),controlsRef=useRef<OrbitControls|null>(null);
  const [paused,setPaused]=useState(false),[selected,setSelected]=useState<any>(null),[error,setError]=useState("");
  useEffect(()=>{
    if(!host.current)return;
    const el=host.current;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{setError("3D rendering is unavailable in this browser. Machine data remains available in the dashboard.");return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-label","Interactive 3D factory floor");renderer.domElement.dataset.frames="0";el.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color("#edf3ef");
    const camera=new THREE.PerspectiveCamera(40,1,.1,150);camera.position.set(19,21,23);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.15;controls.minDistance=12;controls.maxDistance=100;controlsRef.current=controls;
    scene.add(new THREE.HemisphereLight(0xffffff,0x7a9984,2.8));
    const light=new THREE.DirectionalLight(0xfffcf1,4);light.position.set(8,20,12);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-18;light.shadow.camera.right=18;light.shadow.camera.top=18;light.shadow.camera.bottom=-18;scene.add(light);
    const materials:THREE.Material[]=[];const geometries:THREE.BufferGeometry[]=[];
    function mat(color:string,metalness=.2){const m=new THREE.MeshStandardMaterial({color,roughness:.55,metalness});materials.push(m);return m;}
    const white=mat("#e1e9e7"),dark=mat("#354745"),teal=mat("#269e88"),glass=mat("#234c58",.6),yellow=mat("#eab74e"),steel=mat("#889c9e",.6),red=mat("#e58354");
    function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function cylinder(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){const g=new THREE.CylinderGeometry(r,r,h,24);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
    box(23,.3,18,mat("#dfe8e2"),0,-.2,0);
    const grid=new THREE.GridHelper(23,23,0xcbd7ce,0xd2ddd5);grid.position.y=-.03;scene.add(grid);
    for(let z=-7;z<=7;z+=7){box(21,.02,.12,yellow,0,.01,z);}
    box(.12,.02,15,yellow,-10,.01,0);box(.12,.02,15,yellow,10,.01,0);
    const motors:THREE.Object3D[]=[],belts:THREE.Object3D[]=[],selectable:THREE.Object3D[]=[];
    const shown=machines.slice(0,9);
    shown.forEach((machine,i)=>{
      const group=new THREE.Group();group.position.set((i%3-1)*6.4,0,(Math.floor(i/3)-1)*5);scene.add(group);
      const accent=machine.status==="attention"?red:teal;
      box(4.5,.12,3.7,mat("#c9d5cc"),0,.03,0,group);
      if(machine.kind==='cnc'){
        box(3.4,2.5,2.3,white,0,1.35,0,group);box(3.5,.3,2.4,accent,0,2.75,0,group);
        box(2.1,1.6,.07,glass,-.35,1.55,1.19,group);box(.1,1.6,.12,steel,-.35,1.55,1.24,group);
        box(.48,.85,.25,dark,1.4,1.65,1.3,group);box(.35,.35,.02,teal,1.4,1.85,1.44,group);
        const motor=cylinder(.35,.13,steel,0,1.3,1.29,group);motor.rotation.x=Math.PI/2;motors.push(motor);
      }else if(machine.kind==='assembly'){
        cylinder(.7,.45,dark,0,.32,0,group);const arm=new THREE.Group();arm.position.set(0,.55,0);group.add(arm);
        cylinder(.25,1.5,accent,0,.75,0,arm);box(1.5,.32,.34,accent,.6,1.5,0,arm);cylinder(.22,.35,steel,1.3,1.35,0,arm);
        box(.4,.6,.35,dark,1.3,1.05,0,arm);motors.push(arm);
        box(3.5,.4,1,dark,0,.7,1.3,group);
        for(let k=0;k<10;k++){const roller=cylinder(.1,.95,steel,-1.5+k*.33,.95,1.3,group);roller.rotation.x=Math.PI/2;}
        const parcel=box(.5,.4,.55,yellow,-1.1,1.2,1.3,group);belts.push(parcel);
      }else{
        box(2.8,1.5,2.2,white,0,.9,0,group);box(3.1,.2,2.5,accent,0,1.72,0,group);
        for(const x of [-.75,.75]){cylinder(.5,1.6,steel,x,2.5,0,group);cylinder(.52,.1,accent,x,3.32,0,group);}
        box(.7,.5,.08,glass,0,1,1.15,group);const fan=cylinder(.3,.1,dark,0,1.7,.7,group);motors.push(fan);
      }
      cylinder(.06,.6,steel,1.5,3.1,-.7,group);cylinder(.13,.2,machine.status==="offline"?dark:accent,1.5,3.5,-.7,group);
      group.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.machine=machine;selectable.push(o);}});
      const canvas=document.createElement("canvas");canvas.width=512;canvas.height=80;const ctx=canvas.getContext("2d")!;
      ctx.fillStyle="#ffffff";ctx.fillRect(0,0,512,80);ctx.fillStyle="#355a4b";ctx.font="bold 27px Arial";ctx.textAlign="center";ctx.fillText(machine.name,256,49);
      const tex=new THREE.CanvasTexture(canvas);const sm=new THREE.SpriteMaterial({map:tex});materials.push(sm);const label=new THREE.Sprite(sm);label.scale.set(3,.48,1);label.position.set(0,4.2,0);group.add(label);
    });
    // Overhead pipework and a perimeter service rack anchor the equipment in a factory space.
    for(const x of [-10,10]){for(const z of [-7,7])box(.18,4.2,.18,steel,x,2,z);box(.18,.18,14,steel,x,4.1,0);}
    box(20,.18,.18,steel,0,4.1,-7);box(20,.1,.1,teal,0,3.7,-7);
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let downX=0,downY=0;
    const down=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;};
    const pick=(e:PointerEvent)=>{if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>8)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(selectable)[0];if(hit)setSelected(hit.object.userData.machine);};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointerup",pick);
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;const distance=Math.max(37, 39 / camera.aspect);camera.position.set(19,21,23).normalize().multiplyScalar(distance);camera.updateProjectionMatrix();renderer.setSize(w,h);controls.update();};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    let frame=0,raf=0;const clock=new THREE.Clock();
    function animate(){raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();if(!pauseRef.current){motors.forEach((m,i)=>{m.rotation.y=Math.sin(t*.7+i)*.7;});belts.forEach((b,i)=>b.position.x=((t*.6+i)%2.8)-1.4);}controls.update();renderer.render(scene,camera);renderer.domElement.dataset.frames=String(++frame);}
    animate();
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointerup",pick);geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m instanceof THREE.SpriteMaterial)m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[machines]);
  const machine=selected||machines[0];
  function zoom(f:number){const c=controlsRef.current;if(c){c.object.position.sub(c.target).multiplyScalar(f).add(c.target);c.update();}}
  return <div className="twin-stage"><div ref={host} style={{width:"100%",height:"100%"}}/>{error&&<div className="error-banner">{error}</div>}<div className="twin-toolbar"><button className="icon-btn" title={paused?"Play animation":"Pause animation"} aria-label={paused?"Play animation":"Pause animation"} onClick={()=>{pauseRef.current=!paused;setPaused(!paused);}}>{paused?<Play size={17}/>:<Pause size={17}/>}</button><button className="icon-btn" title="Reset view" aria-label="Reset view" onClick={()=>{const c=controlsRef.current;if(c){c.object.position.set(19,21,23);c.target.set(0,1,0);c.update();}}}><RotateCcw size={17}/></button><button className="icon-btn" title="Zoom in" aria-label="Zoom in" onClick={()=>zoom(.85)}><ZoomIn size={17}/></button><button className="icon-btn" title="Zoom out" aria-label="Zoom out" onClick={()=>zoom(1.15)}><ZoomOut size={17}/></button></div>{machine&&<aside className="twin-info"><span className={`status ${machine.status}`}>{machine.status}</span><h2>{machine.name}</h2><p>{machine.plant}</p><>{machine.kind!=="utility"?<><p>Shift A OEE <strong>{machine.oee}%</strong></p><p>Total output <strong>{machine.production} pcs</strong></p></>:<><p>Motor rating <strong>{machine.rating} kW</strong></p><p>DE vibration <strong>{machine.vibration} mm/s</strong></p><p>DE temperature <strong>{machine.temperature} °C</strong></p><p>Speed <strong>{machine.rpm} rpm</strong></p></>}</></aside>}<div className="twin-legend"><span><i style={{background:"#269e88"}}/>Running</span><span><i style={{background:"#e58354"}}/>Attention</span><span><i style={{background:"#354745"}}/>Offline</span></div><div className="twin-label">Plant 01 · Simplified equipment geometry</div></div>;
}
