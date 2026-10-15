/** Original texture shader. Image geometry stays fixed; only texture sampling/light change. */
export interface WeaveAppearance {
  tint: string;
  dark: boolean;
}
export interface WeaveController {
  update(appearance: WeaveAppearance): void;
  setRunning(running: boolean): void;
  dispose(): void;
}
export function mountWeave(
  host: HTMLElement,
  image: HTMLImageElement,
  appearance: WeaveAppearance,
): WeaveController | undefined {
  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });
  } catch {
    return;
  }
  if (!gl) return;
  const gpu = gl;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let observer: ResizeObserver | undefined;
  let disposed = false,
    running = false,
    frame = 0,
    elapsed = 0,
    last = 0;
  let current = appearance;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    if (!gpu.isContextLost()) {
      shaders.forEach((s) => gpu.deleteShader(s));
      gpu.deleteBuffer(buffer);
      gpu.deleteTexture(texture);
      gpu.deleteProgram(program);
      gpu.getExtension("WEBGL_lose_context")?.loseContext();
    }
    canvas.remove();
    host.dataset.effect = "fallback";
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    dispose();
  };
  const compile = (type: number, source: string) => {
    const shader = gpu.createShader(type);
    if (!shader) throw new Error("No shader");
    shaders.push(shader);
    gpu.shaderSource(shader, source);
    gpu.compileShader(shader);
    if (!gpu.getShaderParameter(shader, gpu.COMPILE_STATUS))
      throw new Error("Shader unavailable");
    return shader;
  };
  try {
    const vertex = compile(
      gpu.VERTEX_SHADER,
      "attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}",
    );
    const fragment = compile(
      gpu.FRAGMENT_SHADER,
      `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D cloth;
      uniform vec2 size;
      uniform vec2 imageSize;
      uniform vec3 tint;
      uniform float time;
      uniform float dark;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 q=vec2(uv.x,1.-uv.y);
        float viewAspect=size.x/size.y, imageAspect=imageSize.x/imageSize.y;
        vec2 crop=viewAspect>imageAspect?vec2(1.,imageAspect/viewAspect):vec2(viewAspect/imageAspect,1.);
        // Match object-fit:cover and the responsive static image's crop exactly.
        vec2 sampleUV=(q-.5)*crop+.5;
        float quiet=1.-smoothstep(.30,.72,q.x);
        // Broad, millimetric cloth drift plus a finer weave movement; fixed vertices.
        float fold=sin(q.y*10.-time*.78+sin(q.x*6.+time*.32)*.35);
        float thread=sin(sampleUV.y*640.+time*.82);
        sampleUV+=vec2(fold*.0036+thread*.00035,sin(q.x*9.+time*.65)*.0028)*quiet;
        vec3 color=texture2D(cloth,clamp(sampleUV,0.,1.)).rgb;
        float ink=clamp((color.g-color.r)*5.5+(1.-dot(color,vec3(.299,.587,.114)))*.32,0.,1.);
        color=mix(color,color*(.58+tint*.75),ink*.28);
        // A soft directional light crosses the weave; wrap happens outside the image.
        float lightPosition=mod(time*.045+.35,1.7)-.3;
        float shimmer=exp(-pow((q.x*.85+q.y*.22-lightPosition)*7.,2.));
        color+=vec3(.15,.138,.108)*shimmer*quiet;
        // Stable cells along one lower edge. Accent changes never alter their geometry.
        vec2 cell=floor(vec2(q.x*size.x,q.y*size.y)/16.);
        float edge=smoothstep(.70,.97,q.y)*(1.-smoothstep(.25,.58,q.x));
        float removed=smoothstep(.72,.96,hash(cell))*edge*.28;
        vec3 paper=mix(vec3(.965,.953,.923),vec3(.065,.095,.078),dark);
        color=mix(color,paper,removed);
        gl_FragColor=vec4(color,1.);
      }`,
    );
    program = gpu.createProgram();
    if (!program) throw new Error("No program");
    gpu.attachShader(program, vertex);
    gpu.attachShader(program, fragment);
    gpu.linkProgram(program);
    if (!gpu.getProgramParameter(program, gpu.LINK_STATUS))
      throw new Error("Program unavailable");
    gpu.useProgram(program);
    buffer = gpu.createBuffer();
    texture = gpu.createTexture();
    if (!buffer || !texture) throw new Error("No texture");
    gpu.bindBuffer(gpu.ARRAY_BUFFER, buffer);
    gpu.bufferData(
      gpu.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gpu.STATIC_DRAW,
    );
    const position = gpu.getAttribLocation(program, "p");
    gpu.enableVertexAttribArray(position);
    gpu.vertexAttribPointer(position, 2, gpu.FLOAT, false, 0, 0);
    gpu.activeTexture(gpu.TEXTURE0);
    gpu.bindTexture(gpu.TEXTURE_2D, texture);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.LINEAR);
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR);
    gpu.texImage2D(
      gpu.TEXTURE_2D,
      0,
      gpu.RGB,
      gpu.RGB,
      gpu.UNSIGNED_BYTE,
      image,
    );
    gpu.uniform1i(gpu.getUniformLocation(program, "cloth"), 0);
    gpu.uniform2f(
      gpu.getUniformLocation(program, "imageSize"),
      image.naturalWidth,
      image.naturalHeight,
    );
    const size = gpu.getUniformLocation(program, "size"),
      time = gpu.getUniformLocation(program, "time"),
      tint = gpu.getUniformLocation(program, "tint"),
      dark = gpu.getUniformLocation(program, "dark");
    const draw = () => {
      if (disposed) return;
      const hex = current.tint.replace("#", "");
      gpu.uniform3f(
        tint,
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      );
      gpu.uniform1f(time, elapsed);
      gpu.uniform1f(dark, current.dark ? 1 : 0);
      gpu.uniform2f(size, canvas.width, canvas.height);
      gpu.viewport(0, 0, canvas.width, canvas.height);
      gpu.drawArrays(gpu.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(host.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(host.clientHeight * ratio));
      draw();
    };
    const animate = (now: number) => {
      if (!running || disposed) return;
      elapsed += Math.min((now - last) / 1000, 0.05);
      last = now;
      draw();
      frame = requestAnimationFrame(animate);
    };
    const setRunning = (next: boolean) => {
      if (disposed || next === running) return;
      running = next;
      cancelAnimationFrame(frame);
      host.dataset.effect = next ? "running" : "paused";
      if (next) {
        last = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    canvas.className = "lp-weave-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.addEventListener("webglcontextlost", onLost);
    resize();
    host.append(canvas);
    host.dataset.effect = "paused";
    observer = new ResizeObserver(resize);
    observer.observe(host);
    return {
      update(next) {
        current = next;
        draw();
      },
      setRunning,
      dispose,
    };
  } catch {
    dispose();
    return;
  }
}
