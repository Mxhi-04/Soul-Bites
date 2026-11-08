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

  float heelSeam(float x) {
    float center = x - 0.46;
    return 0.848 - 0.34 * center * center;
  }

  float lowerPattySeam(float x) {
    float center = x - 0.51;
    return 0.711 - 0.19 * center * center + 0.004 * sin(x * 83.0);
  }

  float upperPattySeam(float x) {
    float center = x - 0.52;
    return 0.589 - 0.17 * center * center + 0.006 * sin(x * 64.0);
  }

  vec4 sampleSlice(vec2 uv, float from, float to) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < from || uv.y >= to)
      return vec4(0.0);
    return texture2D(uBurger, uv);
  }

  vec4 fallingLayer(vec2 uv, float arrival, vec2 drift, int layer) {
    if (arrival <= 0.0) return vec4(0.0);

    uv += (1.0 - arrival) * drift;
    vec4 slice;
    if (layer == 0) {
      slice = sampleSlice(uv, lowerPattySeam(uv.x), heelSeam(uv.x));
    } else if (layer == 1) {
      slice = sampleSlice(uv, upperPattySeam(uv.x), lowerPattySeam(uv.x));
    } else if (layer == 2) {
      slice = sampleSlice(uv, 0.38, upperPattySeam(uv.x));
    } else {
      // Close the gap between the crown and toppings in the source image.
      uv.y -= 0.058 * arrival;
      slice = sampleSlice(uv, 0.0, 0.38);
    }
    slice.a *= smoothstep(0.0, 0.28, arrival);
    return slice;
  }

  vec4 toastedFace(vec2 uv, float covering) {
    // Reuse the photographed crumb on the underside of the crown.
    vec2 face = (uv - vec2(0.496, 0.806)) / vec2(0.409, 0.044);
    float edge = length(face);
    if (edge > 1.02 || covering >= 1.0) return vec4(0.0);
    vec3 crumb = texture2D(uBurger, vec2(0.5, 0.346) + face * vec2(0.36, 0.012)).rgb;
    return vec4(crumb * 1.05, (1.0 - smoothstep(0.97, 1.02, edge)) * (1.0 - covering));
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
    float firstPatty = smoothstep(0.05, 0.34, uProgress);
    float secondPatty = smoothstep(0.23, 0.55, uProgress);
    float toppings = smoothstep(0.43, 0.75, uProgress);
    float crown = smoothstep(0.66, 0.99, uProgress);

    vec4 food = sampleSlice(uv, heelSeam(uv.x), 1.0);
    food = over(toastedFace(uv, smoothstep(0.66, 1.0, firstPatty)), food);
    food = over(fallingLayer(uv, firstPatty, vec2(-0.08, 0.37), 0), food);
    food = over(fallingLayer(uv, secondPatty, vec2(0.07, 0.39), 1), food);
    food = over(fallingLayer(uv, toppings, vec2(-0.055, 0.34), 2), food);
    food = over(fallingLayer(uv, crown, vec2(0.04, 0.24), 3), food);

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
