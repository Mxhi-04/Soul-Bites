const vertexSource = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uBurger;
  uniform vec2 uResolution;
  uniform float uSize;
  uniform float uProgress;
  uniform vec3 uGold;

  vec4 over(vec4 front, vec4 back) {
    float a = front.a + back.a * (1.0 - front.a);
    vec3 rgb = front.rgb * front.a + back.rgb * back.a * (1.0 - front.a);
    return vec4(rgb / max(a, 0.001), a);
  }

  vec4 sampleLayer(vec2 uv, bool top) {
    // The transparent gap in the source art separates the bun and the stack.
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))
        || (top && uv.y > 0.38) || (!top && uv.y < 0.38)) return vec4(0.0);
    return texture2D(uBurger, uv);
  }

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  void main() {
    vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 p = (pixel - uResolution * 0.5) / uSize;
    float opening = sin(3.14159 * smoothstep(0.08, 0.92, uProgress));
    float settling = smoothstep(0.65, 1.0, uProgress);
    float turn = sin(uProgress * 4.5) * 0.095;
    mat2 rotation = mat2(cos(turn), -sin(turn), sin(turn), cos(turn));
    vec2 burger = rotation * (p - vec2(0.035 * opening, 0.025 * settling));
    burger /= 1.0 + 0.055 * opening + 0.04 * settling;

    vec2 bun = burger + vec2(0.5 + 0.035 * opening, 0.5 + 0.13 * opening - 0.034 * settling);
    vec2 stack = burger + vec2(0.5, 0.5 - 0.05 * opening);
    vec4 food = over(sampleLayer(bun, true), sampleLayer(stack, false));
    food.rgb *= 1.0 + 0.05 * opening;

    // Embers sit at two depths and travel at different speeds during the reveal.
    vec2 dust = p * vec2(14.0, 12.0) + vec2(-uProgress, uProgress * 2.0);
    vec2 cell = floor(dust);
    float seed = hash(cell);
    vec2 speck = fract(dust) - vec2(0.2 + 0.6 * seed, 0.2 + 0.6 * hash(cell + 13.0));
    float ember = (1.0 - smoothstep(0.018, 0.048, length(speck)))
      * step(0.62, seed) * (1.0 - smoothstep(0.30, 0.8, length(p)))
      * (0.45 + 0.35 * opening);
    vec2 shadow = (p - vec2(0.0, 0.52 + 0.02 * settling)) * vec2(3.0, 21.0);
    float shade = exp(-dot(shadow, shadow)) * 0.48;
    gl_FragColor = over(food, over(vec4(uGold, ember), vec4(vec3(0.0), shade)));
  }
`;

function compile(gl: WebGLRenderingContext, kind: number, source: string) {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createBurgerScene(
  canvas: HTMLCanvasElement,
  artwork: HTMLImageElement,
) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const dispose = () => {
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };
  if (!vertex || !fragment || !program || !buffer || !texture) {
    dispose();
    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  try {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      artwork,
    );
  } catch {
    dispose();
    return null;
  }
  if (gl.getError() !== gl.NO_ERROR) {
    dispose();
    return null;
  }
  gl.uniform1i(gl.getUniformLocation(program, "uBurger"), 0);
  const gold = getComputedStyle(canvas)
    .getPropertyValue("--color-golden-yellow")
    .trim();
  const rgb = Number.parseInt(gold.slice(1), 16);
  gl.uniform3f(
    gl.getUniformLocation(program, "uGold"),
    ((rgb >> 16) & 255) / 255,
    ((rgb >> 8) & 255) / 255,
    (rgb & 255) / 255,
  );

  const resolution = gl.getUniformLocation(program, "uResolution");
  const size = gl.getUniformLocation(program, "uSize");
  const progress = gl.getUniformLocation(program, "uProgress");

  return {
    draw(amount: number, width: number, height: number, burgerWidth: number) {
      const density = Math.min(
        window.devicePixelRatio,
        1.5,
        1280 / width,
        960 / height,
      );
      const w = Math.max(1, Math.round(width * density));
      const h = Math.max(1, Math.round(height * density));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(resolution, w, h);
      gl.uniform1f(size, burgerWidth * density);
      gl.uniform1f(progress, amount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose,
  };
}
