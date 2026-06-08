import{r as t,j as Y}from"./query-vendor-Dqjn2BoN.js";import{V as J,S as ne,O as ue,W as oe,a as ie,P as ae,M as le,C as se,b as ce}from"./three-vendor-CdRBQ4aM.js";const K={low:{iterations:24,waveIterations:1,pixelRatio:.5,precision:"mediump",stepMultiplier:1.5},medium:{iterations:40,waveIterations:2,pixelRatio:.65,precision:"mediump",stepMultiplier:1.2},high:{iterations:80,waveIterations:4,pixelRatio:Math.min(window.devicePixelRatio,2),precision:"highp",stepMultiplier:1}},w=f=>{const i=new se(f);return new ce(i.r,i.g,i.b)};function ve({topColor:f="#5227FF",bottomColor:i="#FF9FFC",intensity:g=1,rotationSpeed:C=.3,interactive:l=!1,className:j="",glowAmount:P=.005,pillarWidth:x=3,pillarHeight:M=.4,noiseIntensity:S=.5,mixBlendMode:A="screen",pillarRotation:T=0,quality:h="high",onWebGLError:a}){const s=t.useRef(null),m=t.useRef(null),o=t.useRef(null),e=t.useRef(null),p=t.useRef(null),R=t.useRef(null),I=t.useRef(null),W=t.useRef(new J(0,0)),_=t.useRef(0),b=t.useRef(C),[y,N]=t.useState(!0);return t.useEffect(()=>{const r=document.createElement("canvas");r.getContext("webgl2",{failIfMajorPerformanceCaveat:!1})||r.getContext("webgl",{failIfMajorPerformanceCaveat:!1})||r.getContext("experimental-webgl",{failIfMajorPerformanceCaveat:!1})||(N(!1),a==null||a())},[a]),t.useEffect(()=>{if(!s.current||!y)return;const r=s.current,E=r.clientWidth,k=r.clientHeight,B=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),Z=B||navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4;let v=h;Z&&h==="high"&&(v="medium"),B&&h!=="low"&&(v="low");const c=K[v]||K.medium,U=new ne,G=new ue(-1,1,1,-1,0,1);p.current=U,R.current=G;let d;try{d=new oe({antialias:!1,alpha:!0,powerPreference:v==="high"?"high-performance":"low-power",precision:c.precision,stencil:!1,depth:!1})}catch(n){N(!1),a==null||a(n);return}d.setSize(E,k),d.setPixelRatio(c.pixelRatio),r.appendChild(d.domElement),o.current=d;const ee=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,te=`
      precision ${c.precision} float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin;
      uniform float uWaveCos;
      varying vec2 vUv;

      const float STEP_MULT = ${c.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${c.iterations};
      const int WAVE_ITER = ${c.waveIterations};

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

        vec3 ro = vec3(0.0, 0.0, -10.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        float rotC = uRotCos;
        float rotS = uRotSin;
        if (uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
          float a = uMouse.x * 6.283185;
          rotC = cos(a);
          rotS = sin(a);
        }

        vec3 col = vec3(0.0);
        float t = 0.1;

        for (int i = 0; i < MAX_ITER; i++) {
          vec3 p = ro + rd * t;
          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

          vec3 q = p;
          q.y = p.y * uPillarHeight + uTime;

          float freq = 1.0;
          float amp = 1.0;
          for (int j = 0; j < WAVE_ITER; j++) {
            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
            freq *= 2.0;
            amp *= 0.5;
          }

          float d = length(cos(q.xz)) - 0.2;
          float bound = length(p.xz) - uPillarWidth;
          float k = 4.0;
          float h = max(k - abs(d - bound), 0.0);
          d = max(d, bound) + h * h * 0.0625 / k;
          d = abs(d) * 0.15 + 0.01;

          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
          col += mix(uBottomColor, uTopColor, grad) / d;

          t += d * STEP_MULT;
          if (t > 50.0) break;
        }

        float widthNorm = uPillarWidth / 3.0;
        col = tanh(col * uGlowAmount / widthNorm);
        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;

        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `,$=T*Math.PI/180,H=new ie({vertexShader:ee,fragmentShader:te,uniforms:{uTime:{value:0},uResolution:{value:new J(E,k)},uMouse:{value:W.current},uTopColor:{value:w(f)},uBottomColor:{value:w(i)},uIntensity:{value:g},uInteractive:{value:l},uGlowAmount:{value:P},uPillarWidth:{value:x},uPillarHeight:{value:M},uNoiseIntensity:{value:S},uRotCos:{value:1},uRotSin:{value:0},uPillarRotCos:{value:Math.cos($)},uPillarRotSin:{value:Math.sin($)},uWaveSin:{value:Math.sin(.4)},uWaveCos:{value:Math.cos(.4)}},transparent:!0,depthWrite:!1,depthTest:!1});e.current=H;const V=new ae(2,2),re=new le(V,H);I.current=V,U.add(re);let z=null;const O=n=>{if(!l||z)return;z=window.setTimeout(()=>{z=null},16);const u=r.getBoundingClientRect();W.current.set((n.clientX-u.left)/u.width*2-1,-((n.clientY-u.top)/u.height)*2+1)};l&&r.addEventListener("mousemove",O,{passive:!0});let X=performance.now();const D=1e3/(v==="low"?30:60),L=n=>{if(!e.current||!o.current||!p.current||!R.current)return;const u=n-X;if(u>=D){_.current+=.016*b.current;const F=_.current;e.current.uniforms.uTime.value=F,e.current.uniforms.uRotCos.value=Math.cos(F*.3),e.current.uniforms.uRotSin.value=Math.sin(F*.3),o.current.render(p.current,R.current),X=n-u%D}m.current=requestAnimationFrame(L)};m.current=requestAnimationFrame(L);let q=null;const Q=()=>{q&&clearTimeout(q),q=window.setTimeout(()=>{if(!o.current||!e.current||!s.current)return;const n=s.current.clientWidth,u=s.current.clientHeight;o.current.setSize(n,u),e.current.uniforms.uResolution.value.set(n,u)},150)};return window.addEventListener("resize",Q,{passive:!0}),()=>{var n,u;window.removeEventListener("resize",Q),l&&r.removeEventListener("mousemove",O),m.current&&cancelAnimationFrame(m.current),o.current&&(o.current.dispose(),r.contains(o.current.domElement)&&r.removeChild(o.current.domElement)),(n=e.current)==null||n.dispose(),(u=I.current)==null||u.dispose(),o.current=null,e.current=null,p.current=null,R.current=null,I.current=null,m.current=null}},[y,h]),t.useEffect(()=>{b.current=C},[C]),t.useEffect(()=>{e.current&&(e.current.uniforms.uTopColor.value=w(f))},[f]),t.useEffect(()=>{e.current&&(e.current.uniforms.uBottomColor.value=w(i))},[i]),t.useEffect(()=>{e.current&&(e.current.uniforms.uIntensity.value=g)},[g]),t.useEffect(()=>{e.current&&(e.current.uniforms.uInteractive.value=l)},[l]),t.useEffect(()=>{e.current&&(e.current.uniforms.uGlowAmount.value=P)},[P]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarWidth.value=x)},[x]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarHeight.value=M)},[M]),t.useEffect(()=>{e.current&&(e.current.uniforms.uNoiseIntensity.value=S)},[S]),t.useEffect(()=>{if(!e.current)return;const r=T*Math.PI/180;e.current.uniforms.uPillarRotCos.value=Math.cos(r),e.current.uniforms.uPillarRotSin.value=Math.sin(r)},[T]),y?Y.jsx("div",{ref:s,className:`light-pillar-container ${j}`,style:{mixBlendMode:A}}):Y.jsx("div",{className:`light-pillar-fallback ${j}`,style:{mixBlendMode:A}})}export{ve as default};
