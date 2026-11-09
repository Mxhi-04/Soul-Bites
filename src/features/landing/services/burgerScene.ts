const vertexSource = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uIngredients;
  uniform vec2 uResolution;
  uniform float uSize;
  uniform float uProgress;
  uniform vec3 uGold;

  vec4 over(vec4 front, vec4 back) {
    float a = front.a + back.a * (1.0 - front.a);
    vec3 rgb = front.rgb * front.a + back.rgb * back.a * (1.0 - front.a);
    return vec4(rgb / max(a, 0.001), a);
  }

  vec4 ingredient(vec2 uv, vec2 atlasRow, vec4 destination) {
    vec2 local = (uv - destination.xy) / destination.zw;
    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0))))
      return vec4(0.0);
    vec2 atlas = (vec2(4.0, atlasRow.x) + local * vec2(640.0, atlasRow.y)) / vec2(648.0, 1081.0);
    return texture2D(uIngredients, atlas);
  }

  vec4 falling(vec2 uv, vec2 atlasRow, vec4 destination, vec2 timing, float drift) {
    float arrival = clamp((uProgress - timing.x) / (timing.y - timing.x), 0.0, 1.0);
    if (arrival <= 0.0) return vec4(0.0);

    // Ingredients enter above the artwork and accelerate toward their place in the stack.
    float remaining = 1.0 - arrival * arrival * (2.0 - arrival);
    uv += vec2(drift, destination.y + 0.56) * remaining;
    vec4 layer = ingredient(uv, atlasRow, destination);
    layer.a *= smoothstep(0.0, 0.16, arrival);
    return layer;
  }

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  void main() {
    vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 p = (pixel - uResolution * 0.5) / uSize;
    vec2 uv = p + 0.5;
    // Atlas rows give the source y and height in pixels, ordered from heel to crown.
    vec4 food = ingredient(uv, vec2(4.0, 192.0), vec4(0.075, 0.700, 0.850, 0.255));
    food = over(falling(uv, vec2(204.0, 122.0), vec4(0.020, 0.624, 0.960, 0.183), vec2(0.04, 0.26), -0.050), food);
    food = over(falling(uv, vec2(334.0, 157.0), vec4(0.054, 0.515, 0.892, 0.219), vec2(0.16, 0.40), 0.045), food);
    food = over(falling(uv, vec2(499.0, 104.0), vec4(0.063, 0.469, 0.874, 0.142), vec2(0.30, 0.53), -0.042), food);
    food = over(falling(uv, vec2(611.0, 106.0), vec4(0.098, 0.403, 0.804, 0.133), vec2(0.43, 0.65), 0.040), food);
    food = over(falling(uv, vec2(725.0, 111.0), vec4(0.066, 0.330, 0.868, 0.150), vec2(0.55, 0.78), -0.035), food);
    food = over(falling(uv, vec2(844.0, 233.0), vec4(0.068, 0.059, 0.864, 0.315), vec2(0.70, 0.99), 0.015), food);

    // Embers sit at two depths and travel at different speeds during the reveal.
    vec2 dust = p * vec2(14.0, 12.0) + vec2(-uProgress, uProgress * 2.0);
    vec2 cell = floor(dust);
    float seed = hash(cell);
    vec2 speck = fract(dust) - vec2(0.2 + 0.6 * seed, 0.2 + 0.6 * hash(cell + 13.0));
    float ember = (1.0 - smoothstep(0.018, 0.048, length(speck)))
      * step(0.62, seed) * (1.0 - smoothstep(0.30, 0.8, length(p)))
      * (0.28 + 0.46 * sin(3.14159 * uProgress));
    vec2 shadow = (p - vec2(0.0, 0.52)) * vec2(3.0, 21.0);
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
  ingredients: HTMLImageElement,
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
      ingredients,
    );
  } catch {
    dispose();
    return null;
  }
  if (gl.getError() !== gl.NO_ERROR) {
    dispose();
    return null;
  }
  gl.uniform1i(gl.getUniformLocation(program, "uIngredients"), 0);
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
