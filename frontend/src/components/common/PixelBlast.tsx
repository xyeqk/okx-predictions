import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PixelBlastProps {
  color?: string;
  pixelSize?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  edgeFade?: number;
}

const VERT = `void main(){gl_Position=vec4(position,1.0);}`;
const FRAG = `
precision highp float;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uEdgeFade;
out vec4 fragColor;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);float a=hash(i);float b=hash(i+vec2(1,0));float c=hash(i+vec2(0,1));float d=hash(i+vec2(1,1));vec2 u=f*f*(3.0-2.0*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p,float t){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p+t*0.1);p*=1.25;a*=1.0;}return v;}
float bayer(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}

void main(){
  vec2 fc=gl_FragCoord.xy-uResolution*.5;
  vec2 pid=floor(fc/uPixelSize);
  float n=fbm(pid*0.08,uTime*0.5);
  n=n*0.5-0.65+0.15;
  float b=bayer(fc/uPixelSize)-0.5;
  float m=step(0.5,n+b);
  float h=hash(pid);
  m*=1.0+(h-0.5)*0.0;
  if(uEdgeFade>0.0){
    vec2 nm=gl_FragCoord.xy/uResolution;
    float edge=min(min(nm.x,nm.y),min(1.0-nm.x,1.0-nm.y));
    m*=smoothstep(0.0,uEdgeFade,edge);
  }
  fragColor=vec4(uColor,m);
}`;

export default function PixelBlast({ color='#B19EEF', pixelSize=4, speed=0.5, className='', style, edgeFade=0.25 }: PixelBlastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const col = new THREE.Color(color);
    const uniforms = {
      uColor: { value: col },
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: Math.random()*1000 },
      uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
      uEdgeFade: { value: edgeFade },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false, glslVersion: THREE.GLSL3 });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const clock = new THREE.Clock();
    let raf: number;
    const loop = () => {
      uniforms.uTime.value += clock.getDelta() * speed;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      mat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [color, pixelSize, speed, edgeFade]);

  return <div ref={ref} className={`w-full h-full relative overflow-hidden ${className}`} style={style} />;
}
