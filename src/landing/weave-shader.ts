/** Original Tiraz artwork. No code or presets from the reference package. */
export function mountWeave(host: HTMLElement, dark: boolean): () => void {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
  });
  if (!gl) return () => {};
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let frame = 0;
  let disposed = false;
  let observer: ResizeObserver | undefined;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    if (!gl.isContextLost()) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    }
    canvas.remove();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    cleanup();
  };
  const compile = (kind: number, source: string) => {
    const shader = gl.createShader(kind);
    if (!shader) throw new Error("No decorative shader");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Decorative shader unavailable");
    return shader;
  };
  try {
    const vertex = compile(
      gl.VERTEX_SHADER,
      "attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }",
    );
    const fragment = compile(
      gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      uniform vec2 size;
      uniform float time;
      uniform vec3 ink;
      void main(){
        vec2 p=(gl_FragCoord.xy-.5*size)/size.y;
        float drift=sin(time*1.5)*.009;
        p.x+=sin(p.y*8.+time)*drift;
        float diamond=abs(p.x)+abs(p.y);
        float mask=(1.-smoothstep(.43,.435,diamond))*smoothstep(.145,.15,diamond);
        vec2 q=vec2(p.x+p.y,p.x-p.y);
        float a=pow(.5+.5*cos(q.x*510.),10.);
        float b=pow(.5+.5*cos(q.y*510.),10.);
        float band=.55+.45*sin(diamond*52.);
        float threads=max(a*.6,b*.35)*band;
        gl_FragColor=vec4(ink,mask*threads*.7);
      }`,
    );
    program = gl.createProgram();
    if (!program) throw new Error("No decorative program");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Decorative program unavailable");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error("No decorative buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const p = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    const size = gl.getUniformLocation(program, "size");
    const time = gl.getUniformLocation(program, "time");
    gl.uniform3f(
      gl.getUniformLocation(program, "ink"),
      ...((dark ? [0.65, 0.79, 0.71] : [0.21, 0.37, 0.3]) as [
        number,
        number,
        number,
      ]),
    );
    let elapsed = 0;
    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(size, canvas.width, canvas.height);
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(host.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(host.clientHeight * ratio));
      draw();
    };
    canvas.className = "lp-weave-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.addEventListener("webglcontextlost", onLost);
    host.append(canvas);
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(host);
    const start = performance.now();
    const animate = (now: number) => {
      if (disposed) return;
      elapsed = Math.min((now - start) / 1000, 4);
      draw();
      if (elapsed < 4) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return cleanup;
  } catch {
    cleanup();
    return () => {};
  }
}
