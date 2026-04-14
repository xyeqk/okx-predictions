import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './LiquidEther.css';

interface LiquidEtherProps {
  colors?: string[];
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  iterationsViscous?: number;
  iterationsPoisson?: number;
  resolution?: number;
  isBounce?: boolean;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  takeoverDuration?: number;
  autoResumeDelay?: number;
  autoRampDuration?: number;
  style?: React.CSSProperties;
  className?: string;
  dt?: number;
  BFECC?: boolean;
  color0?: string;
  color1?: string;
  color2?: string;
}

// Fluid simulation shaders
const FACE_VERT = `attribute vec3 position;uniform vec2 px;uniform vec2 boundarySpace;varying vec2 uv;precision highp float;void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`;
const LINE_VERT = `attribute vec3 position;uniform vec2 px;precision highp float;varying vec2 uv;void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`;
const MOUSE_VERT = `precision highp float;attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`;

const ADVECTION_FRAG = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;uniform vec2 px;varying vec2 uv;void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;if(!isBFECC){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;gl_FragColor=vec4(texture2D(velocity,uv2).xy,0.0,0.0);}else{vec2 sn=uv;vec2 vo=texture2D(velocity,uv).xy;vec2 so=sn-vo*dt*ratio;vec2 vn1=texture2D(velocity,so).xy;vec2 sn2=so+vn1*dt*ratio;vec2 err=sn2-sn;vec2 sn3=sn-err/2.0;vec2 v2=texture2D(velocity,sn3).xy;vec2 so2=sn3-v2*dt*ratio;gl_FragColor=vec4(texture2D(velocity,so2).xy,0.0,0.0);}}`;
const COLOR_FRAG = `precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;varying vec2 uv;void main(){vec2 vel=texture2D(velocity,uv).xy;float lenv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb;vec3 outRGB=mix(bgColor.rgb,c,lenv);float outA=mix(bgColor.a,1.0,lenv);gl_FragColor=vec4(outRGB,outA);}`;
const DIVERGENCE_FRAG = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;void main(){float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x;float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y;gl_FragColor=vec4((x1-x0+y1-y0)/2.0/dt);}`;
const FORCE_FRAG = `precision highp float;uniform vec2 force;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 c=(vUv-0.5)*2.0;float d=1.0-min(length(c),1.0);d*=d;gl_FragColor=vec4(force*d,0.0,1.0);}`;
const POISSON_FRAG = `precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r;float div=texture2D(divergence,uv).r;gl_FragColor=vec4((p0+p1+p2+p3)/4.0-div);}`;
const PRESSURE_FRAG = `precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y)).r;vec2 v=texture2D(velocity,uv).xy;gl_FragColor=vec4(v-vec2(p0-p1,p2-p3)*0.5*dt,0.0,1.0);}`;
const VISCOUS_FRAG = `precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){vec2 old=texture2D(velocity,uv).xy;vec2 n0=texture2D(velocity_new,uv+vec2(px.x*2.0,0.0)).xy;vec2 n1=texture2D(velocity_new,uv-vec2(px.x*2.0,0.0)).xy;vec2 n2=texture2D(velocity_new,uv+vec2(0.0,px.y*2.0)).xy;vec2 n3=texture2D(velocity_new,uv-vec2(0.0,px.y*2.0)).xy;vec2 nv=4.0*old+v*dt*(n0+n1+n2+n3);nv/=4.0*(1.0+v*dt);gl_FragColor=vec4(nv,0.0,0.0);}`;

export default function LiquidEther(props: LiquidEtherProps) {
  const {
    mouseForce = 20, cursorSize = 100, isViscous = false, viscous = 30,
    iterationsViscous = 32, iterationsPoisson = 32, dt = 0.014, BFECC = true,
    resolution = 0.5, isBounce = false, colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
    style = {}, className = '', autoDemo = true, autoSpeed = 0.5, autoIntensity = 2.2,
    takeoverDuration = 0.25, autoResumeDelay = 1000, autoRampDuration = 0.6,
  } = props;

  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Setup renderer
    const rect = el.getBoundingClientRect();
    const W = Math.max(1, Math.floor(rect.width));
    const H = Math.max(1, Math.floor(rect.height));
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    el.prepend(renderer.domElement);

    // Palette texture
    const palArr = colors.length >= 2 ? colors : [colors[0] || '#fff', colors[0] || '#fff'];
    const palData = new Uint8Array(palArr.length * 4);
    palArr.forEach((c, i) => { const col = new THREE.Color(c); palData[i*4]=Math.round(col.r*255); palData[i*4+1]=Math.round(col.g*255); palData[i*4+2]=Math.round(col.b*255); palData[i*4+3]=255; });
    const palTex = new THREE.DataTexture(palData, palArr.length, 1, THREE.RGBAFormat);
    palTex.magFilter = THREE.LinearFilter; palTex.minFilter = THREE.LinearFilter; palTex.needsUpdate = true;

    // FBO helper
    const makeFBO = (w: number, h: number) => new THREE.WebGLRenderTarget(w, h, {
      type: /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType,
      depthBuffer: false, stencilBuffer: false,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });

    const fw = Math.max(1, Math.round(resolution * W));
    const fh = Math.max(1, Math.round(resolution * H));
    const px = new THREE.Vector2(1/fw, 1/fh);
    const fboSize = new THREE.Vector2(fw, fh);

    const vel0 = makeFBO(fw,fh), vel1 = makeFBO(fw,fh);
    const visc0 = makeFBO(fw,fh), visc1 = makeFBO(fw,fh);
    const div = makeFBO(fw,fh);
    const pres0 = makeFBO(fw,fh), pres1 = makeFBO(fw,fh);

    // Shader pass helper
    const makePass = (vs: string, fs: string, uniforms: any) => {
      const mat = new THREE.RawShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat);
      const scene = new THREE.Scene(); scene.add(mesh);
      const cam = new THREE.Camera();
      return { scene, cam, mat, uniforms: mat.uniforms };
    };

    const bs = isBounce ? new THREE.Vector2(0,0) : px.clone();

    const advPass = makePass(FACE_VERT, ADVECTION_FRAG, { boundarySpace:{value:bs}, px:{value:px}, fboSize:{value:fboSize}, velocity:{value:vel0.texture}, dt:{value:dt}, isBFECC:{value:BFECC} });
    const divPass = makePass(FACE_VERT, DIVERGENCE_FRAG, { boundarySpace:{value:bs}, velocity:{value:vel1.texture}, px:{value:px}, dt:{value:dt} });
    const poisPass = makePass(FACE_VERT, POISSON_FRAG, { boundarySpace:{value:bs}, pressure:{value:pres0.texture}, divergence:{value:div.texture}, px:{value:px} });
    const presPass = makePass(FACE_VERT, PRESSURE_FRAG, { boundarySpace:{value:bs}, pressure:{value:pres0.texture}, velocity:{value:visc0.texture}, px:{value:px}, dt:{value:dt} });
    const viscPass = makePass(FACE_VERT, VISCOUS_FRAG, { boundarySpace:{value:bs}, velocity:{value:vel1.texture}, velocity_new:{value:visc0.texture}, v:{value:viscous}, px:{value:px}, dt:{value:dt} });

    // External force (mouse)
    const forceScene = new THREE.Scene();
    const forceCam = new THREE.Camera();
    const forceMat = new THREE.RawShaderMaterial({
      vertexShader: MOUSE_VERT, fragmentShader: FORCE_FRAG,
      blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { px:{value:px}, force:{value:new THREE.Vector2()}, center:{value:new THREE.Vector2()}, scale:{value:new THREE.Vector2(cursorSize,cursorSize)} },
    });
    const forceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1), forceMat);
    forceScene.add(forceMesh);

    // Output color pass
    const colorPass = makePass(FACE_VERT, COLOR_FRAG, { velocity:{value:vel0.texture}, boundarySpace:{value:new THREE.Vector2()}, palette:{value:palTex}, bgColor:{value:new THREE.Vector4(0,0,0,0)} });

    // Mouse state
    const mouse = { coords: new THREE.Vector2(), old: new THREE.Vector2(), diff: new THREE.Vector2(), moved: false };
    let autoTime = 0;
    let lastInteraction = 0;
    let isUserActive = false;

    const onMove = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      mouse.coords.set((cx-r.left)/r.width*2-1, -((cy-r.top)/r.height*2-1));
      mouse.moved = true;
      isUserActive = true;
      lastInteraction = performance.now();
    };
    const onMM = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTM = (e: TouchEvent) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTM, { passive: true });

    const renderPass = (pass: any, target: THREE.WebGLRenderTarget | null) => {
      renderer.setRenderTarget(target);
      renderer.render(pass.scene, pass.cam);
      renderer.setRenderTarget(null);
    };

    let running = true;
    const loop = () => {
      if (!running) return;

      // Auto demo
      if (autoDemo && performance.now() - lastInteraction > autoResumeDelay) {
        isUserActive = false;
        autoTime += 0.016 * autoSpeed;
        const ax = Math.sin(autoTime * 0.7) * 0.6;
        const ay = Math.cos(autoTime * 0.5) * 0.4;
        mouse.coords.set(ax, ay);
        mouse.moved = true;
      }

      mouse.diff.subVectors(mouse.coords, mouse.old);
      if (!isUserActive) mouse.diff.multiplyScalar(autoIntensity);
      mouse.old.copy(mouse.coords);

      // Advection
      advPass.uniforms.velocity.value = vel0.texture;
      renderPass(advPass, vel1);

      // External force
      forceMat.uniforms.force.value.set(mouse.diff.x/2*mouseForce, mouse.diff.y/2*mouseForce);
      forceMat.uniforms.center.value.copy(mouse.coords);
      forceMat.uniforms.scale.value.set(cursorSize, cursorSize);
      renderer.setRenderTarget(vel1);
      renderer.render(forceScene, forceCam);
      renderer.setRenderTarget(null);

      // Viscous
      let velResult = vel1;
      if (isViscous) {
        viscPass.uniforms.velocity.value = vel1.texture;
        let fIn = visc0, fOut = visc1;
        for (let i = 0; i < iterationsViscous; i++) {
          viscPass.uniforms.velocity_new.value = fIn.texture;
          renderPass(viscPass, fOut);
          [fIn, fOut] = [fOut, fIn];
        }
        velResult = fIn;
      }

      // Divergence
      divPass.uniforms.velocity.value = velResult.texture;
      renderPass(divPass, div);

      // Poisson
      let pIn = pres0, pOut = pres1;
      for (let i = 0; i < iterationsPoisson; i++) {
        poisPass.uniforms.pressure.value = pIn.texture;
        renderPass(poisPass, pOut);
        [pIn, pOut] = [pOut, pIn];
      }

      // Pressure
      presPass.uniforms.velocity.value = velResult.texture;
      presPass.uniforms.pressure.value = pIn.texture;
      renderPass(presPass, vel0);

      // Color output
      colorPass.uniforms.velocity.value = vel0.texture;
      renderer.setRenderTarget(null);
      renderer.render(colorPass.scene, colorPass.cam);

      requestAnimationFrame(loop);
    };
    loop();

    stateRef.current = { renderer };

    return () => {
      running = false;
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTM);
      [vel0,vel1,visc0,visc1,div,pres0,pres1].forEach(f => f.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={`liquid-ether-container ${className}`} style={style} />;
}
