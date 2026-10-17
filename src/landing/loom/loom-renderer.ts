import { createLoomClock } from "./loom-clock";
import type { LoomPalette, RGB } from "./loom-palette";

/** CSS-pixel geometry of the hero and its woven band, plus the band's cell mask. */
export interface LoomLayout {
  width: number;
  height: number;
  dpr: number;
  bandTop: number;
  bandHeight: number;
  cols: number;
  rows: number;
  mask: Uint8Array;
}

export interface LoomController {
  setLayout(layout: LoomLayout): void;
  setPalette(palette: LoomPalette): void;
  /** Coordinates are CSS pixels relative to the canvas. */
  setPointer(x: number, y: number, inside: boolean): void;
  setRunning(running: boolean): void;
  dispose(): void;
}

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

// Warp threads string outward from the band; a weft thread then weaves each
// row from the right, bottom row first. Geometry is analytic per pixel.
const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr, uTime, uRows, uWeave, uWarp, uPointerOn, uDark;
uniform vec2 uPointer;
uniform vec4 uBand;
uniform vec3 uBg, uWarpColor, uGround, uInk, uBorder, uShuttle;
uniform sampler2D uMask;
float hash(float n){return fract(sin(n*12.9898)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ripple(float x){return (sin(x*.0042+uTime*.55)*5.+sin(x*.011-uTime*.8)*1.6)*uWarp;}
void main(){
  vec2 res=uRes/uDpr;
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
  float top=uBand.x, bot=uBand.y, cell=uBand.z, cols=uBand.w;
  float off=(res.x-cols*cell)*.5;
  float key=exp(-length((p-vec2(res.x*.82,-res.y*.15))/res.y)*1.5);
  vec3 col=uBg+mix(vec3(.012,.01,.006),vec3(.05,.045,.032),uDark)*key;
  vec2 dm=p-uPointer;
  float spot=exp(-dot(dm,dm)/(2.*240.*240.))*uPointerOn;
  col+=mix(vec3(.015),vec3(.03,.028,.022),uDark)*spot;

  float py=p.y-ripple(p.x);
  float slope=(cos(p.x*.0042+uTime*.55)*.021+cos(p.x*.011-uTime*.8)*.0176)*uWarp;
  float inBand=step(top,py)*step(py,bot);
  float distBand=max(0.,max(top-py,py-bot));
  float free=smoothstep(0.,90.,distBand);
  float near=exp(-dm.y*dm.y/(2.*140.*140.));
  float push=sign(dm.x)*26.*exp(-dm.x*dm.x/(2.*52.*52.))*near*uPointerOn*free;
  float column0=floor((p.x-off)/cell);
  float sway=sin(p.y*.011+uTime*.7+column0*.37)*1.1*free;
  float wx=p.x-off-push-sway;
  float ci=floor(wx/cell);
  float cu=fract(wx/cell)*2.-1.;
  float W=.42;
  float warpShape=smoothstep(W,W-.2,abs(cu));
  float roundness=sqrt(max(0.,1.-pow(cu/W,2.)));
  float twist=.82+.18*sin(p.y*1.7+cu*2.6+ci*1.9);
  float reach=uWarp*res.y*(1.05-.35*hash(ci+3.));
  float strung=step(distBand,reach);
  float light=.55+.6*key+.9*spot;
  vec3 warpCol=uWarpColor*mix(1.,roundness*twist,uDark)*mix(1.,light,uDark);

  // Until the band is woven, its warp is as faint as the rest of the loom;
  // the edge glow and shadow arrive with the cloth.
  float done=smoothstep(0.,1.,uWeave/uRows);
  float faint=mix(.1,.13,uDark)*(1.+spot*3.);
  if(inBand<.5){
    float edge=mix(faint,mix(.32,.55,uDark),done);
    float a=strung*warpShape*(mix(.008,.012,uDark)+edge*exp(-distBand/(res.y*.075)))*(1.+spot*3.);
    a*=mix(roundness,1.,uDark);
    col=mix(col,warpCol,clamp(a,0.,1.));
    col*=1.-mix(.18,.5,uDark)*done*exp(-(py-bot)/22.)*step(bot,py);
  } else {
    float r=floor((py-top)/cell);
    float rv=fract((py-top)/cell)*2.-1.;
    float fromBottom=uRows-1.-r;
    float fromRight=cols-1.-ci;
    float row=floor(uWeave);
    float head=fract(uWeave)*cols;
    bool woven=fromBottom<row||(fromBottom==row&&fromRight<head);
    float m=texture2D(uMask,vec2((ci+.5)/cols,(r+.5)/uRows)).r;
    vec3 weft=m>.75?uInk:(m>.25?uBorder:uGround);
    float bx=(p.x-off)/cell+mod(r,2.)*.5;
    float bu=fract(bx)*2.-1.;
    float sv=sqrt(max(0.,1.-rv*rv*.92));
    float su=sqrt(max(0.,1.-pow(abs(bu),3.)));
    float bead=sv*mix(.5,1.,su);
    float fibre=.86+.14*sin((bu*.6+rv*.9)*5.5+r*1.7+floor(bx)*2.3);
    float lit=(mix(.78,.6,uDark)+mix(.2,.55,uDark)*key+.6*spot)*(1.+slope*9.);
    float sweep=exp(-pow(((p.x+p.y*.7)/res.x)-(fract(uTime*.06)*2.4-.7),2.)*90.);
    vec3 wovenCol=weft*mix(.72+.28*bead,bead,uDark)*fibre*lit+vec3(1.,.95,.85)*sweep*mix(.05,.12,uDark)*bead;
    // Threads near the row being woven catch a little light.
    float front=uWeave<uRows?.45*exp(-abs(fromBottom-row)/2.5):0.;
    vec3 bare=mix(col,warpCol,clamp(strung*warpShape*(faint+front)*mix(roundness,1.,uDark),0.,1.));
    vec3 c=woven?wovenCol:bare;
    if(fromBottom==row&&!woven){
      float wave=sin(fromRight*.22-uTime*4.)*.18;
      float thread=smoothstep(.34,.12,abs(rv-wave));
      float fade=exp(-(fromRight-head)/(cols*.45));
      c=mix(c,uInk*(.7+.3*sv),thread*fade);
    }
    col=c;
  }
  if(uWeave<uRows){
    float rowFromTop=uRows-1.-floor(uWeave);
    float hx=off+(cols-fract(uWeave)*cols)*cell;
    vec2 hp=vec2(hx,top+(rowFromTop+.5)*cell+ripple(hx));
    vec2 dh=p-hp;
    float glow=exp(-dot(dh,dh)/(2.*16.*16.));
    float core=exp(-dot(dh,dh)/(2.*3.*3.));
    col=mix(col,uShuttle*mix(1.,1.25,uDark),glow*.85);
    col+=mix(uShuttle*.4,vec3(1.),uDark)*core*.8;
  }
  vec2 q=(p-res*.5)/res;
  col*=1.-mix(.16,.55,uDark)*pow(length(q*vec2(1.,1.25)),2.4);
  col+=(hash2(p+fract(uTime*7.)*91.)-.5)*mix(.018,.028,uDark);
  gl_FragColor=vec4(col,1.);
}`;

const UNIFORMS = [
  "uRes",
  "uDpr",
  "uTime",
  "uRows",
  "uWeave",
  "uWarp",
  "uPointerOn",
  "uDark",
  "uPointer",
  "uBand",
  "uBg",
  "uWarpColor",
  "uGround",
  "uInk",
  "uBorder",
  "uShuttle",
  "uMask",
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);

export interface MountOptions {
  palette: LoomPalette;
  /** Reduced motion: a single finished frame, rendered only when inputs change. */
  still: boolean;
  /** Development aid: begin this many seconds into the timeline. */
  startAt?: number;
  onLost(): void;
}

export function mountLoom(
  canvas: HTMLCanvasElement,
  options: MountOptions,
): LoomController | undefined {
  if (typeof WebGLRenderingContext === "undefined") return undefined;
  let context: WebGLRenderingContext | null = null;
  try {
    context = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
  } catch {
    return undefined;
  }
  if (!context) return undefined;
  const gl = context;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  const uniforms = {} as Record<
    (typeof UNIFORMS)[number],
    WebGLUniformLocation | null
  >;
  let layout: LoomLayout | undefined;
  let palette = options.palette;
  let shownPalette = palette;
  let paletteFrom = palette;
  let paletteStart = 0;
  let disposed = false;
  let running = false;
  let frame = 0;
  const clock = createLoomClock(options.startAt);
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: 0, target: 0 };

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader unavailable");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Shader compile failed");
    return shader;
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    dispose();
    options.onLost();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(frame);
    canvas.removeEventListener("webglcontextlost", onLost);
    if (!gl.isContextLost()) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  };

  try {
    program = gl.createProgram();
    if (!program) throw new Error("Program unavailable");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Program link failed");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    UNIFORMS.forEach(
      (name) => (uniforms[name] = gl.getUniformLocation(program!, name)),
    );
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    canvas.addEventListener("webglcontextlost", onLost);
  } catch {
    dispose();
    return undefined;
  }

  const color = (name: (typeof UNIFORMS)[number], value: RGB) =>
    gl.uniform3f(uniforms[name], value[0], value[1], value[2]);

  const draw = (now: number) => {
    if (!layout || disposed) return;
    const t = clock.seconds;
    const warp = options.still ? 1 : easeOut(clamp((t - 0.05) / 1.4));
    const weave = options.still
      ? layout.rows
      : layout.rows * smooth(clamp((t - 0.7) / 3.6));
    pointer.x += (pointer.tx - pointer.x) * 0.14;
    pointer.y += (pointer.ty - pointer.y) * 0.14;
    pointer.on += (pointer.target - pointer.on) * 0.06;
    const k = paletteStart ? easeOut(clamp((now - paletteStart) / 600)) : 1;
    const blend = (key: Exclude<keyof LoomPalette, "dark">) =>
      paletteFrom[key].map(
        (value, index) => value + (palette[key][index] - value) * k,
      ) as unknown as RGB;
    shownPalette = {
      dark: palette.dark,
      background: blend("background"),
      warp: blend("warp"),
      ground: blend("ground"),
      inscription: blend("inscription"),
      border: blend("border"),
      shuttle: blend("shuttle"),
    };
    gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uDpr, layout.dpr);
    gl.uniform1f(uniforms.uTime, options.still ? 0 : t);
    gl.uniform1f(uniforms.uRows, layout.rows);
    gl.uniform1f(
      uniforms.uWeave,
      weave >= layout.rows - 0.001 ? layout.rows : weave,
    );
    gl.uniform1f(uniforms.uWarp, warp);
    gl.uniform1f(uniforms.uPointerOn, options.still ? 0 : pointer.on);
    gl.uniform1f(uniforms.uDark, palette.dark ? 1 : 0);
    gl.uniform2f(uniforms.uPointer, pointer.x, pointer.y);
    gl.uniform4f(
      uniforms.uBand,
      layout.bandTop,
      layout.bandTop + layout.bandHeight,
      layout.bandHeight / layout.rows,
      layout.cols,
    );
    color("uBg", shownPalette.background);
    color("uWarpColor", shownPalette.warp);
    color("uGround", shownPalette.ground);
    color("uInk", shownPalette.inscription);
    color("uBorder", shownPalette.border);
    color("uShuttle", shownPalette.shuttle);
    gl.uniform1i(uniforms.uMask, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return k < 1;
  };

  const loop = (now: number) => {
    frame = 0;
    if (disposed) return;
    clock.tick(now);
    draw(now);
    if (running) frame = requestAnimationFrame(loop);
  };
  const redraw = () => {
    if (running || disposed) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(function still(now) {
      frame = 0;
      if (draw(now)) frame = requestAnimationFrame(still);
    });
  };

  return {
    setLayout(next) {
      if (disposed) return;
      layout = next;
      canvas.width = Math.max(1, Math.round(next.width * next.dpr));
      canvas.height = Math.max(1, Math.round(next.height * next.dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        next.cols,
        next.rows,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        next.mask,
      );
      redraw();
    },
    setPalette(next) {
      paletteFrom = shownPalette;
      palette = next;
      paletteStart = performance.now();
      redraw();
    },
    setPointer(x, y, inside) {
      pointer.tx = x;
      pointer.ty = y;
      if (inside && pointer.x < -1e3) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.target = inside ? 1 : 0;
    },
    setRunning(next) {
      const should = next && !options.still && !disposed;
      if (should === running) return;
      running = should;
      if (running) {
        clock.pause();
        frame = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        redraw();
      }
    },
    dispose,
  };
}
