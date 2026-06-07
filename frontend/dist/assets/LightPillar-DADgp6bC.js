import{r as t,j as D}from"./query-vendor-Dqjn2BoN.js";import{V as Q,S as re,O as ne,W as oe,a as ue,P as ie,M as ae,C as se,b as le}from"./three-vendor-33aQJGgk.js";const Y={low:{iterations:24,waveIterations:1,pixelRatio:.5,precision:"mediump",stepMultiplier:1.5},medium:{iterations:40,waveIterations:2,pixelRatio:.65,precision:"mediump",stepMultiplier:1.2},high:{iterations:80,waveIterations:4,pixelRatio:Math.min(window.devicePixelRatio,2),precision:"highp",stepMultiplier:1}},R=c=>{const i=new se(c);return new le(i.r,i.g,i.b)};function me({topColor:c="#5227FF",bottomColor:i="#FF9FFC",intensity:w=1,rotationSpeed:g=.3,interactive:a=!1,className:z="",glowAmount:C=.005,pillarWidth:x=3,pillarHeight:P=.4,noiseIntensity:E=.5,mixBlendMode:q="screen",pillarRotation:M=0,quality:d="high"}){const s=t.useRef(null),f=t.useRef(null),o=t.useRef(null),e=t.useRef(null),h=t.useRef(null),p=t.useRef(null),S=t.useRef(null),L=t.useRef(new Q(0,0)),F=t.useRef(0),A=t.useRef(g),[T,G]=t.useState(!0);return t.useEffect(()=>{const r=document.createElement("canvas");r.getContext("webgl")||r.getContext("experimental-webgl")||G(!1)},[]),t.useEffect(()=>{if(!s.current||!T)return;const r=s.current,y=r.clientWidth,_=r.clientHeight,j=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),J=j||navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4;let m=d;J&&d==="high"&&(m="medium"),j&&d!=="low"&&(m="low");const l=Y[m]||Y.medium,N=new re,K=new ne(-1,1,1,-1,0,1);h.current=N,p.current=K;let v;try{v=new oe({antialias:!1,alpha:!0,powerPreference:m==="high"?"high-performance":"low-power",precision:l.precision,stencil:!1,depth:!1})}catch{G(!1);return}v.setSize(y,_),v.setPixelRatio(l.pixelRatio),r.appendChild(v.domElement),o.current=v;const Z=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,ee=`
      precision ${l.precision} float;

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

      const float STEP_MULT = ${l.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${l.iterations};
      const int WAVE_ITER = ${l.waveIterations};

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
    `,k=M*Math.PI/180,B=new ue({vertexShader:Z,fragmentShader:ee,uniforms:{uTime:{value:0},uResolution:{value:new Q(y,_)},uMouse:{value:L.current},uTopColor:{value:R(c)},uBottomColor:{value:R(i)},uIntensity:{value:w},uInteractive:{value:a},uGlowAmount:{value:C},uPillarWidth:{value:x},uPillarHeight:{value:P},uNoiseIntensity:{value:E},uRotCos:{value:1},uRotSin:{value:0},uPillarRotCos:{value:Math.cos(k)},uPillarRotSin:{value:Math.sin(k)},uWaveSin:{value:Math.sin(.4)},uWaveCos:{value:Math.cos(.4)}},transparent:!0,depthWrite:!1,depthTest:!1});e.current=B;const U=new ie(2,2),te=new ae(U,B);S.current=U,N.add(te);let I=null;const $=u=>{if(!a||I)return;I=window.setTimeout(()=>{I=null},16);const n=r.getBoundingClientRect();L.current.set((u.clientX-n.left)/n.width*2-1,-((u.clientY-n.top)/n.height)*2+1)};a&&r.addEventListener("mousemove",$,{passive:!0});let H=performance.now();const V=1e3/(m==="low"?30:60),O=u=>{if(!e.current||!o.current||!h.current||!p.current)return;const n=u-H;if(n>=V){F.current+=.016*A.current;const b=F.current;e.current.uniforms.uTime.value=b,e.current.uniforms.uRotCos.value=Math.cos(b*.3),e.current.uniforms.uRotSin.value=Math.sin(b*.3),o.current.render(h.current,p.current),H=u-n%V}f.current=requestAnimationFrame(O)};f.current=requestAnimationFrame(O);let W=null;const X=()=>{W&&clearTimeout(W),W=window.setTimeout(()=>{if(!o.current||!e.current||!s.current)return;const u=s.current.clientWidth,n=s.current.clientHeight;o.current.setSize(u,n),e.current.uniforms.uResolution.value.set(u,n)},150)};return window.addEventListener("resize",X,{passive:!0}),()=>{var u,n;window.removeEventListener("resize",X),a&&r.removeEventListener("mousemove",$),f.current&&cancelAnimationFrame(f.current),o.current&&(o.current.dispose(),o.current.forceContextLoss(),r.contains(o.current.domElement)&&r.removeChild(o.current.domElement)),(u=e.current)==null||u.dispose(),(n=S.current)==null||n.dispose(),o.current=null,e.current=null,h.current=null,p.current=null,S.current=null,f.current=null}},[T,d]),t.useEffect(()=>{A.current=g},[g]),t.useEffect(()=>{e.current&&(e.current.uniforms.uTopColor.value=R(c))},[c]),t.useEffect(()=>{e.current&&(e.current.uniforms.uBottomColor.value=R(i))},[i]),t.useEffect(()=>{e.current&&(e.current.uniforms.uIntensity.value=w)},[w]),t.useEffect(()=>{e.current&&(e.current.uniforms.uInteractive.value=a)},[a]),t.useEffect(()=>{e.current&&(e.current.uniforms.uGlowAmount.value=C)},[C]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarWidth.value=x)},[x]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarHeight.value=P)},[P]),t.useEffect(()=>{e.current&&(e.current.uniforms.uNoiseIntensity.value=E)},[E]),t.useEffect(()=>{if(!e.current)return;const r=M*Math.PI/180;e.current.uniforms.uPillarRotCos.value=Math.cos(r),e.current.uniforms.uPillarRotSin.value=Math.sin(r)},[M]),T?D.jsx("div",{ref:s,className:`light-pillar-container ${z}`,style:{mixBlendMode:q}}):D.jsx("div",{className:`light-pillar-fallback ${z}`,style:{mixBlendMode:q},children:"WebGL not supported"})}export{me as default};
