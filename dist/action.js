var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/gifenc/dist/gifenc.js
var require_gifenc = __commonJS({
  "node_modules/gifenc/dist/gifenc.js"(exports) {
    var __defProp2 = Object.defineProperty;
    var __markAsModule = (target) => __defProp2(target, "__esModule", { value: true });
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    __markAsModule(exports);
    __export(exports, {
      GIFEncoder: () => GIFEncoder2,
      applyPalette: () => applyPalette,
      default: () => src_default,
      nearestColor: () => nearestColor,
      nearestColorIndex: () => nearestColorIndex,
      nearestColorIndexWithDistance: () => nearestColorIndexWithDistance,
      prequantize: () => prequantize,
      quantize: () => quantize,
      snapColorsToPalette: () => snapColorsToPalette
    });
    var constants_default = {
      signature: "GIF",
      version: "89a",
      trailer: 59,
      extensionIntroducer: 33,
      applicationExtensionLabel: 255,
      graphicControlExtensionLabel: 249,
      imageSeparator: 44,
      signatureSize: 3,
      versionSize: 3,
      globalColorTableFlagMask: 128,
      colorResolutionMask: 112,
      sortFlagMask: 8,
      globalColorTableSizeMask: 7,
      applicationIdentifierSize: 8,
      applicationAuthCodeSize: 3,
      disposalMethodMask: 28,
      userInputFlagMask: 2,
      transparentColorFlagMask: 1,
      localColorTableFlagMask: 128,
      interlaceFlagMask: 64,
      idSortFlagMask: 32,
      localColorTableSizeMask: 7
    };
    function createStream(initialCapacity = 256) {
      let cursor = 0;
      let contents = new Uint8Array(initialCapacity);
      return {
        get buffer() {
          return contents.buffer;
        },
        reset() {
          cursor = 0;
        },
        bytesView() {
          return contents.subarray(0, cursor);
        },
        bytes() {
          return contents.slice(0, cursor);
        },
        writeByte(byte) {
          expand(cursor + 1);
          contents[cursor] = byte;
          cursor++;
        },
        writeBytes(data, offset = 0, byteLength = data.length) {
          expand(cursor + byteLength);
          for (let i = 0; i < byteLength; i++) {
            contents[cursor++] = data[i + offset];
          }
        },
        writeBytesView(data, offset = 0, byteLength = data.byteLength) {
          expand(cursor + byteLength);
          contents.set(data.subarray(offset, offset + byteLength), cursor);
          cursor += byteLength;
        }
      };
      function expand(newCapacity) {
        var prevCapacity = contents.length;
        if (prevCapacity >= newCapacity)
          return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
          newCapacity = Math.max(newCapacity, 256);
        const oldContents = contents;
        contents = new Uint8Array(newCapacity);
        if (cursor > 0)
          contents.set(oldContents.subarray(0, cursor), 0);
      }
    }
    var BITS = 12;
    var DEFAULT_HSIZE = 5003;
    var MASKS = [
      0,
      1,
      3,
      7,
      15,
      31,
      63,
      127,
      255,
      511,
      1023,
      2047,
      4095,
      8191,
      16383,
      32767,
      65535
    ];
    function lzwEncode(width, height, pixels, colorDepth, outStream = createStream(512), accum = new Uint8Array(256), htab = new Int32Array(DEFAULT_HSIZE), codetab = new Int32Array(DEFAULT_HSIZE)) {
      const hsize = htab.length;
      const initCodeSize = Math.max(2, colorDepth);
      accum.fill(0);
      codetab.fill(0);
      htab.fill(-1);
      let cur_accum = 0;
      let cur_bits = 0;
      const init_bits = initCodeSize + 1;
      const g_init_bits = init_bits;
      let clear_flg = false;
      let n_bits = g_init_bits;
      let maxcode = (1 << n_bits) - 1;
      const ClearCode = 1 << init_bits - 1;
      const EOFCode = ClearCode + 1;
      let free_ent = ClearCode + 2;
      let a_count = 0;
      let ent = pixels[0];
      let hshift = 0;
      for (let fcode = hsize; fcode < 65536; fcode *= 2) {
        ++hshift;
      }
      hshift = 8 - hshift;
      outStream.writeByte(initCodeSize);
      output(ClearCode);
      const length = pixels.length;
      for (let idx = 1; idx < length; idx++) {
        next_block: {
          const c = pixels[idx];
          const fcode = (c << BITS) + ent;
          let i = c << hshift ^ ent;
          if (htab[i] === fcode) {
            ent = codetab[i];
            break next_block;
          }
          const disp = i === 0 ? 1 : hsize - i;
          while (htab[i] >= 0) {
            i -= disp;
            if (i < 0)
              i += hsize;
            if (htab[i] === fcode) {
              ent = codetab[i];
              break next_block;
            }
          }
          output(ent);
          ent = c;
          if (free_ent < 1 << BITS) {
            codetab[i] = free_ent++;
            htab[i] = fcode;
          } else {
            htab.fill(-1);
            free_ent = ClearCode + 2;
            clear_flg = true;
            output(ClearCode);
          }
        }
      }
      output(ent);
      output(EOFCode);
      outStream.writeByte(0);
      return outStream.bytesView();
      function output(code) {
        cur_accum &= MASKS[cur_bits];
        if (cur_bits > 0)
          cur_accum |= code << cur_bits;
        else
          cur_accum = code;
        cur_bits += n_bits;
        while (cur_bits >= 8) {
          accum[a_count++] = cur_accum & 255;
          if (a_count >= 254) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        if (free_ent > maxcode || clear_flg) {
          if (clear_flg) {
            n_bits = g_init_bits;
            maxcode = (1 << n_bits) - 1;
            clear_flg = false;
          } else {
            ++n_bits;
            maxcode = n_bits === BITS ? 1 << n_bits : (1 << n_bits) - 1;
          }
        }
        if (code == EOFCode) {
          while (cur_bits > 0) {
            accum[a_count++] = cur_accum & 255;
            if (a_count >= 254) {
              outStream.writeByte(a_count);
              outStream.writeBytesView(accum, 0, a_count);
              a_count = 0;
            }
            cur_accum >>= 8;
            cur_bits -= 8;
          }
          if (a_count > 0) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
        }
      }
    }
    var lzwEncode_default = lzwEncode;
    function rgb888_to_rgb565(r, g, b) {
      return r << 8 & 63488 | g << 2 & 992 | b >> 3;
    }
    function rgba8888_to_rgba4444(r, g, b, a) {
      return r >> 4 | g & 240 | (b & 240) << 4 | (a & 240) << 8;
    }
    function rgb888_to_rgb444(r, g, b) {
      return r >> 4 << 8 | g & 240 | b >> 4;
    }
    function clamp(value, min, max) {
      return value < min ? min : value > max ? max : value;
    }
    function sqr(value) {
      return value * value;
    }
    function find_nn(bins, idx, hasAlpha) {
      var nn = 0;
      var err = 1e100;
      const bin1 = bins[idx];
      const n1 = bin1.cnt;
      const wa = bin1.ac;
      const wr = bin1.rc;
      const wg = bin1.gc;
      const wb = bin1.bc;
      for (var i = bin1.fw; i != 0; i = bins[i].fw) {
        const bin = bins[i];
        const n2 = bin.cnt;
        const nerr2 = n1 * n2 / (n1 + n2);
        if (nerr2 >= err)
          continue;
        var nerr = 0;
        if (hasAlpha) {
          nerr += nerr2 * sqr(bin.ac - wa);
          if (nerr >= err)
            continue;
        }
        nerr += nerr2 * sqr(bin.rc - wr);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.gc - wg);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.bc - wb);
        if (nerr >= err)
          continue;
        err = nerr;
        nn = i;
      }
      bin1.err = err;
      bin1.nn = nn;
    }
    function create_bin() {
      return {
        ac: 0,
        rc: 0,
        gc: 0,
        bc: 0,
        cnt: 0,
        nn: 0,
        fw: 0,
        bk: 0,
        tm: 0,
        mtm: 0,
        err: 0
      };
    }
    function create_bin_list(data, format) {
      const bincount = format === "rgb444" ? 4096 : 65536;
      const bins = new Array(bincount);
      const size = data.length;
      if (format === "rgba4444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgba8888_to_rgba4444(r, g, b, a);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.ac += a;
          bin.cnt++;
        }
      } else if (format === "rgb444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb444(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      } else {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb565(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      }
      return bins;
    }
    function quantize(rgba, maxColors, opts = {}) {
      const {
        format = "rgb565",
        clearAlpha = true,
        clearAlphaColor = 0,
        clearAlphaThreshold = 0,
        oneBitAlpha = false
      } = opts;
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      const data = new Uint32Array(rgba.buffer);
      let useSqrt = opts.useSqrt !== false;
      const hasAlpha = format === "rgba4444";
      const bins = create_bin_list(data, format);
      const bincount = bins.length;
      const bincountMinusOne = bincount - 1;
      const heap = new Uint32Array(bincount + 1);
      var maxbins = 0;
      for (var i = 0; i < bincount; ++i) {
        const bin = bins[i];
        if (bin != null) {
          var d = 1 / bin.cnt;
          if (hasAlpha)
            bin.ac *= d;
          bin.rc *= d;
          bin.gc *= d;
          bin.bc *= d;
          bins[maxbins++] = bin;
        }
      }
      if (sqr(maxColors) / maxbins < 0.022) {
        useSqrt = false;
      }
      var i = 0;
      for (; i < maxbins - 1; ++i) {
        bins[i].fw = i + 1;
        bins[i + 1].bk = i;
        if (useSqrt)
          bins[i].cnt = Math.sqrt(bins[i].cnt);
      }
      if (useSqrt)
        bins[i].cnt = Math.sqrt(bins[i].cnt);
      var h, l, l2;
      for (i = 0; i < maxbins; ++i) {
        find_nn(bins, i, false);
        var err = bins[i].err;
        for (l = ++heap[0]; l > 1; l = l2) {
          l2 = l >> 1;
          if (bins[h = heap[l2]].err <= err)
            break;
          heap[l] = h;
        }
        heap[l] = i;
      }
      var extbins = maxbins - maxColors;
      for (i = 0; i < extbins; ) {
        var tb;
        for (; ; ) {
          var b1 = heap[1];
          tb = bins[b1];
          if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm)
            break;
          if (tb.mtm == bincountMinusOne)
            b1 = heap[1] = heap[heap[0]--];
          else {
            find_nn(bins, b1, false);
            tb.tm = i;
          }
          var err = bins[b1].err;
          for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
            if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
              l2++;
            if (err <= bins[h = heap[l2]].err)
              break;
            heap[l] = h;
          }
          heap[l] = b1;
        }
        var nb = bins[tb.nn];
        var n1 = tb.cnt;
        var n2 = nb.cnt;
        var d = 1 / (n1 + n2);
        if (hasAlpha)
          tb.ac = d * (n1 * tb.ac + n2 * nb.ac);
        tb.rc = d * (n1 * tb.rc + n2 * nb.rc);
        tb.gc = d * (n1 * tb.gc + n2 * nb.gc);
        tb.bc = d * (n1 * tb.bc + n2 * nb.bc);
        tb.cnt += nb.cnt;
        tb.mtm = ++i;
        bins[nb.bk].fw = nb.fw;
        bins[nb.fw].bk = nb.bk;
        nb.mtm = bincountMinusOne;
      }
      let palette = [];
      var k = 0;
      for (i = 0; ; ++k) {
        let r = clamp(Math.round(bins[i].rc), 0, 255);
        let g = clamp(Math.round(bins[i].gc), 0, 255);
        let b = clamp(Math.round(bins[i].bc), 0, 255);
        let a = 255;
        if (hasAlpha) {
          a = clamp(Math.round(bins[i].ac), 0, 255);
          if (oneBitAlpha) {
            const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
            a = a <= threshold ? 0 : 255;
          }
          if (clearAlpha && a <= clearAlphaThreshold) {
            r = g = b = clearAlphaColor;
            a = 0;
          }
        }
        const color = hasAlpha ? [r, g, b, a] : [r, g, b];
        const exists = existsInPalette(palette, color);
        if (!exists)
          palette.push(color);
        if ((i = bins[i].fw) == 0)
          break;
      }
      return palette;
    }
    function existsInPalette(palette, color) {
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        let matchesRGB = p[0] === color[0] && p[1] === color[1] && p[2] === color[2];
        let matchesAlpha = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true;
        if (matchesRGB && matchesAlpha)
          return true;
      }
      return false;
    }
    function euclideanDistanceSquared(a, b) {
      var sum = 0;
      var n;
      for (n = 0; n < a.length; n++) {
        const dx = a[n] - b[n];
        sum += dx * dx;
      }
      return sum;
    }
    function roundStep(byte, step) {
      return step > 1 ? Math.round(byte / step) * step : byte;
    }
    function prequantize(rgba, { roundRGB = 5, roundAlpha = 10, oneBitAlpha = null } = {}) {
      const data = new Uint32Array(rgba.buffer);
      for (let i = 0; i < data.length; i++) {
        const color = data[i];
        let a = color >> 24 & 255;
        let b = color >> 16 & 255;
        let g = color >> 8 & 255;
        let r = color & 255;
        a = roundStep(a, roundAlpha);
        if (oneBitAlpha) {
          const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
          a = a <= threshold ? 0 : 255;
        }
        r = roundStep(r, roundRGB);
        g = roundStep(g, roundRGB);
        b = roundStep(b, roundRGB);
        data[i] = a << 24 | b << 16 | g << 8 | r << 0;
      }
    }
    function applyPalette(rgba, palette, format = "rgb565") {
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (palette.length > 256) {
        throw new Error("applyPalette() only works with 256 colors or less");
      }
      const data = new Uint32Array(rgba.buffer);
      const length = data.length;
      const bincount = format === "rgb444" ? 4096 : 65536;
      const index = new Uint8Array(length);
      const cache = new Array(bincount);
      const hasAlpha = format === "rgba4444";
      if (format === "rgba4444") {
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgba8888_to_rgba4444(r, g, b, a);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
          index[i] = idx;
        }
      } else {
        const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgb888_to_key(r, g, b);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
          index[i] = idx;
        }
      }
      return index;
    }
    function nearestColorIndexRGBA(r, g, b, a, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const a2 = px2[3];
        let curdist = sqr2(a2 - a);
        if (curdist > mindist)
          continue;
        const r2 = px2[0];
        curdist += sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function nearestColorIndexRGB(r, g, b, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const r2 = px2[0];
        let curdist = sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function snapColorsToPalette(palette, knownColors, threshold = 5) {
      if (!palette.length || !knownColors.length)
        return;
      const paletteRGB = palette.map((p) => p.slice(0, 3));
      const thresholdSq = threshold * threshold;
      const dim = palette[0].length;
      for (let i = 0; i < knownColors.length; i++) {
        let color = knownColors[i];
        if (color.length < dim) {
          color = [color[0], color[1], color[2], 255];
        } else if (color.length > dim) {
          color = color.slice(0, 3);
        } else {
          color = color.slice();
        }
        const r = nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), euclideanDistanceSquared);
        const idx = r[0];
        const distanceSq = r[1];
        if (distanceSq > 0 && distanceSq <= thresholdSq) {
          palette[idx] = color;
        }
      }
    }
    function sqr2(a) {
      return a * a;
    }
    function nearestColorIndex(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return minDistIndex;
    }
    function nearestColorIndexWithDistance(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return [minDistIndex, minDist];
    }
    function nearestColor(colors, pixel, distanceFn = euclideanDistanceSquared) {
      return colors[nearestColorIndex(colors, pixel, distanceFn)];
    }
    function GIFEncoder2(opt = {}) {
      const { initialCapacity = 4096, auto = true } = opt;
      const stream = createStream(initialCapacity);
      const HSIZE = 5003;
      const accum = new Uint8Array(256);
      const htab = new Int32Array(HSIZE);
      const codetab = new Int32Array(HSIZE);
      let hasInit = false;
      return {
        reset() {
          stream.reset();
          hasInit = false;
        },
        finish() {
          stream.writeByte(constants_default.trailer);
        },
        bytes() {
          return stream.bytes();
        },
        bytesView() {
          return stream.bytesView();
        },
        get buffer() {
          return stream.buffer;
        },
        get stream() {
          return stream;
        },
        writeHeader,
        writeFrame(index, width, height, opts = {}) {
          const {
            transparent = false,
            transparentIndex = 0,
            delay = 0,
            palette = null,
            repeat = 0,
            colorDepth = 8,
            dispose = -1
          } = opts;
          let first = false;
          if (auto) {
            if (!hasInit) {
              first = true;
              writeHeader();
              hasInit = true;
            }
          } else {
            first = Boolean(opts.first);
          }
          width = Math.max(0, Math.floor(width));
          height = Math.max(0, Math.floor(height));
          if (first) {
            if (!palette) {
              throw new Error("First frame must include a { palette } option");
            }
            encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth);
            encodeColorTable(stream, palette);
            if (repeat >= 0) {
              encodeNetscapeExt(stream, repeat);
            }
          }
          const delayTime = Math.round(delay / 10);
          encodeGraphicControlExt(stream, dispose, delayTime, transparent, transparentIndex);
          const useLocalColorTable = Boolean(palette) && !first;
          encodeImageDescriptor(stream, width, height, useLocalColorTable ? palette : null);
          if (useLocalColorTable)
            encodeColorTable(stream, palette);
          encodePixels(stream, index, width, height, colorDepth, accum, htab, codetab);
        }
      };
      function writeHeader() {
        writeUTFBytes(stream, "GIF89a");
      }
    }
    function encodeGraphicControlExt(stream, dispose, delay, transparent, transparentIndex) {
      stream.writeByte(33);
      stream.writeByte(249);
      stream.writeByte(4);
      if (transparentIndex < 0) {
        transparentIndex = 0;
        transparent = false;
      }
      var transp, disp;
      if (!transparent) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }
      if (dispose >= 0) {
        disp = dispose & 7;
      }
      disp <<= 2;
      const userInput = 0;
      stream.writeByte(0 | disp | userInput | transp);
      writeUInt16(stream, delay);
      stream.writeByte(transparentIndex || 0);
      stream.writeByte(0);
    }
    function encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth = 8) {
      const globalColorTableFlag = 1;
      const sortFlag = 0;
      const globalColorTableSize = colorTableSize(palette.length) - 1;
      const fields = globalColorTableFlag << 7 | colorDepth - 1 << 4 | sortFlag << 3 | globalColorTableSize;
      const backgroundColorIndex = 0;
      const pixelAspectRatio = 0;
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      stream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio]);
    }
    function encodeNetscapeExt(stream, repeat) {
      stream.writeByte(33);
      stream.writeByte(255);
      stream.writeByte(11);
      writeUTFBytes(stream, "NETSCAPE2.0");
      stream.writeByte(3);
      stream.writeByte(1);
      writeUInt16(stream, repeat);
      stream.writeByte(0);
    }
    function encodeColorTable(stream, palette) {
      const colorTableLength = 1 << colorTableSize(palette.length);
      for (let i = 0; i < colorTableLength; i++) {
        let color = [0, 0, 0];
        if (i < palette.length) {
          color = palette[i];
        }
        stream.writeByte(color[0]);
        stream.writeByte(color[1]);
        stream.writeByte(color[2]);
      }
    }
    function encodeImageDescriptor(stream, width, height, localPalette) {
      stream.writeByte(44);
      writeUInt16(stream, 0);
      writeUInt16(stream, 0);
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      if (localPalette) {
        const interlace = 0;
        const sorted = 0;
        const palSize = colorTableSize(localPalette.length) - 1;
        stream.writeByte(128 | interlace | sorted | 0 | palSize);
      } else {
        stream.writeByte(0);
      }
    }
    function encodePixels(stream, index, width, height, colorDepth = 8, accum, htab, codetab) {
      lzwEncode_default(width, height, index, colorDepth, stream, accum, htab, codetab);
    }
    function writeUInt16(stream, short) {
      stream.writeByte(short & 255);
      stream.writeByte(short >> 8 & 255);
    }
    function writeUTFBytes(stream, text) {
      for (var i = 0; i < text.length; i++) {
        stream.writeByte(text.charCodeAt(i));
      }
    }
    function colorTableSize(length) {
      return Math.max(Math.ceil(Math.log2(length)), 1);
    }
    var src_default = GIFEncoder2;
  }
});

// src/action.ts
import { appendFile } from "node:fs/promises";

// src/generate.ts
import { readFile as readFile3 } from "node:fs/promises";
import { resolve as resolve3 } from "node:path";

// src/character/load.ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
var FRAME_WIDTH = 12;
var FRAME_HEIGHT = 8;
var HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
var CharacterError = class extends Error {
  name = "CharacterError";
};
async function loadCharacter(path) {
  const characterPath = resolve(path);
  const raw = await readFile(characterPath, "utf8");
  return validateCharacter(parseJson(raw, characterPath));
}
function validateCharacter(value) {
  const pack = requireObject(value, "character");
  assertOnlyKeys(
    pack,
    ["version", "name", "cellSize", "anchor", "palette", "frames"],
    "character"
  );
  if (pack.version !== 1) {
    throw new CharacterError("version must be 1");
  }
  const name = requireString(pack.name, "name");
  const cellSize = requireIntegerInRange(pack.cellSize, "cellSize", 2, 8);
  const anchor = validateAnchor(pack.anchor);
  const palette = validatePalette(pack.palette);
  const frames = validateFrames(pack.frames, palette);
  return {
    version: 1,
    name,
    cellSize,
    anchor,
    palette: Object.freeze(palette),
    frames
  };
}
function validateAnchor(value) {
  const anchor = requireObject(value, "anchor");
  assertOnlyKeys(anchor, ["x", "y"], "anchor");
  return {
    x: requireIntegerInRange(anchor.x, "anchor.x", 0, FRAME_WIDTH - 1),
    y: requireIntegerInRange(anchor.y, "anchor.y", 0, FRAME_HEIGHT - 1)
  };
}
function validatePalette(value) {
  const palette = requireObject(value, "palette");
  const entries = Object.entries(palette);
  if (entries.length === 0 || entries.length > 16) {
    throw new CharacterError("palette must contain between 1 and 16 colors");
  }
  const validated = {};
  for (const [symbol, color] of entries) {
    if (symbol.length !== 1 || symbol === " ") {
      throw new CharacterError("palette keys must be one visible character");
    }
    if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
      throw new CharacterError(`palette.${symbol} must be a six-digit hex color`);
    }
    validated[symbol] = color;
  }
  return validated;
}
function validateFrames(value, palette) {
  const frames = requireObject(value, "frames");
  assertOnlyKeys(frames, ["idle", "blink", "walk"], "frames");
  if (!Array.isArray(frames.walk) || frames.walk.length !== 4) {
    throw new CharacterError("frames.walk must contain exactly four frames");
  }
  const idle = validateFrame(frames.idle, "frames.idle", palette);
  const blink = validateFrame(frames.blink, "frames.blink", palette);
  const walk = frames.walk.map(
    (frame, index) => validateFrame(frame, `frames.walk[${index}]`, palette)
  );
  return {
    idle,
    blink,
    walk: Object.freeze(walk)
  };
}
function validateFrame(value, path, palette) {
  if (!Array.isArray(value) || value.length !== FRAME_HEIGHT) {
    throw new CharacterError(`${path} must contain exactly ${FRAME_HEIGHT} rows`);
  }
  const rows = value.map((row, rowIndex) => {
    if (typeof row !== "string") {
      throw new CharacterError(`${path}[${rowIndex}] must be a string`);
    }
    if (row.length !== FRAME_WIDTH) {
      throw new CharacterError(
        `${path}[${rowIndex}] must contain exactly ${FRAME_WIDTH} symbols`
      );
    }
    for (let column = 0; column < row.length; column += 1) {
      const symbol = row[column];
      if (symbol !== " " && !(symbol in palette)) {
        throw new CharacterError(
          `${path}[${rowIndex}][${column}] uses undeclared symbol '${symbol}'`
        );
      }
    }
    return row;
  });
  return Object.freeze(rows);
}
function parseJson(raw, path) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CharacterError(`${path}: invalid JSON: ${message}`);
  }
}
function requireObject(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CharacterError(`${path} must be an object`);
  }
  return value;
}
function assertOnlyKeys(value, allowed, path) {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new CharacterError(`${path} contains unknown key '${key}'`);
    }
  }
}
function requireString(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CharacterError(`${path} must be a non-empty string`);
  }
  return value;
}
function requireIntegerInRange(value, path, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new CharacterError(
      `${path} must be an integer between ${minimum} and ${maximum}`
    );
  }
  return value;
}

// src/config/load.ts
import { readFile as readFile2 } from "node:fs/promises";
import { dirname, resolve as resolve2 } from "node:path";

// src/config/schema.ts
var USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
var HEX_COLOR_PATTERN2 = /^#[0-9a-f]{6}$/i;
var MAX_FRAME_COUNT = 300;
var ConfigError = class extends Error {
  name = "ConfigError";
};
function validateConfig(value) {
  const config = requireObject2(value, "config");
  assertOnlyKeys2(config, ["version", "github", "character", "output", "theme"], "config");
  if (config.version !== 1) {
    throw new ConfigError("version must be 1");
  }
  const github = requireObject2(config.github, "github");
  assertOnlyKeys2(github, ["username"], "github");
  const username = requireString2(github.username, "github.username");
  if (!USERNAME_PATTERN.test(username)) {
    throw new ConfigError("github.username must be a valid GitHub username");
  }
  const character = requireString2(config.character, "character");
  const output = validateOutput(config.output);
  const theme = validateTheme(config.theme);
  if (output.fps * output.durationSeconds > MAX_FRAME_COUNT) {
    throw new ConfigError(`output must contain at most ${MAX_FRAME_COUNT} frames`);
  }
  return {
    version: 1,
    github: { username },
    character,
    output,
    theme
  };
}
function validateOutput(value) {
  const output = requireObject2(value, "output");
  assertOnlyKeys2(
    output,
    ["path", "width", "height", "fps", "durationSeconds"],
    "output"
  );
  return {
    path: requireString2(output.path, "output.path"),
    width: requireIntegerInRange2(output.width, "output.width", 320, 1600),
    height: requireIntegerInRange2(output.height, "output.height", 160, 800),
    fps: requireNumberInRange(output.fps, "output.fps", 1, 25),
    durationSeconds: requireNumberInRange(
      output.durationSeconds,
      "output.durationSeconds",
      2,
      30
    )
  };
}
function validateTheme(value) {
  const theme = requireObject2(value, "theme");
  assertOnlyKeys2(
    theme,
    ["background", "gridEmpty", "gridLevels", "accent"],
    "theme"
  );
  if (!Array.isArray(theme.gridLevels) || theme.gridLevels.length !== 4) {
    throw new ConfigError("theme.gridLevels must contain exactly four colors");
  }
  const gridLevels = theme.gridLevels.map(
    (color, index) => requireColor(color, `theme.gridLevels[${index}]`)
  );
  return {
    background: requireColor(theme.background, "theme.background"),
    gridEmpty: requireColor(theme.gridEmpty, "theme.gridEmpty"),
    gridLevels,
    accent: requireColor(theme.accent, "theme.accent")
  };
}
function requireObject2(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError(`${path} must be an object`);
  }
  return value;
}
function assertOnlyKeys2(value, allowed, path) {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new ConfigError(`${path} contains unknown key '${key}'`);
    }
  }
}
function requireString2(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ConfigError(`${path} must be a non-empty string`);
  }
  return value;
}
function requireColor(value, path) {
  const color = requireString2(value, path);
  if (!HEX_COLOR_PATTERN2.test(color)) {
    throw new ConfigError(`${path} must be a six-digit hex color`);
  }
  return color;
}
function requireIntegerInRange2(value, path, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new ConfigError(
      `${path} must be an integer between ${minimum} and ${maximum}`
    );
  }
  return value;
}
function requireNumberInRange(value, path, minimum, maximum) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ConfigError(`${path} must be between ${minimum} and ${maximum}`);
  }
  return value;
}

// src/config/load.ts
async function loadConfig(path) {
  const configPath = resolve2(path);
  const raw = await readFile2(configPath, "utf8");
  const parsed = parseJson2(raw, configPath);
  const config = validateConfigWithPath(parsed, configPath);
  const configDirectory = dirname(configPath);
  return {
    ...config,
    configPath,
    characterPath: resolve2(configDirectory, config.character),
    outputPath: resolve2(configDirectory, config.output.path)
  };
}
function validateConfigWithPath(value, path) {
  try {
    return validateConfig(value);
  } catch (error) {
    if (error instanceof ConfigError) {
      throw new ConfigError(`${path}: ${error.message}`);
    }
    throw error;
  }
}
function parseJson2(raw, path) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`${path}: invalid JSON: ${message}`);
  }
}

// src/contributions/github.ts
var GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
var DEFAULT_TIMEOUT_MS = 1e4;
var USERNAME_PATTERN2 = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
var CONTRIBUTION_QUERY = `
  query UbeContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;
async function fetchContributionDays(options) {
  validateOptions(options);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let response;
  try {
    response = await fetchImpl(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
        "User-Agent": "ube-contribution-companion"
      },
      body: JSON.stringify({
        query: CONTRIBUTION_QUERY,
        variables: {
          login: options.username,
          from: options.from,
          to: options.to
        }
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(`GitHub request timed out after ${timeoutMs} ms`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GitHub request failed: ${message}`);
  }
  assertSuccessfulStatus(response);
  const payload = await readJson(response);
  return extractContributionDays(payload, options.username);
}
function validateOptions(options) {
  if (!USERNAME_PATTERN2.test(options.username)) {
    throw new Error("GitHub username is invalid");
  }
  if (options.token.trim().length === 0) {
    throw new Error("GitHub token is required");
  }
  if (!Number.isInteger(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) || (options.timeoutMs ?? DEFAULT_TIMEOUT_MS) < 1) {
    throw new Error("GitHub timeout must be a positive integer");
  }
}
function assertSuccessfulStatus(response) {
  if (response.ok) return;
  if (response.status === 401) {
    throw new Error("GitHub authentication failed");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub rate limit or permission error");
  }
  throw new Error(`GitHub request failed with status ${response.status}`);
}
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error("GitHub returned malformed JSON");
  }
}
function extractContributionDays(payload, username) {
  const root = requireObject3(payload, "GitHub response");
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    const messages = root.errors.map(readGraphqlError).join("; ");
    throw new Error(`GitHub GraphQL error: ${messages}`);
  }
  const data = requireObject3(root.data, "GitHub response.data");
  if (data.user === null) {
    throw new Error(`GitHub user '${username}' was not found`);
  }
  const user = requireObject3(data.user, "GitHub response.data.user");
  const collection = requireObject3(
    user.contributionsCollection,
    "GitHub contributionsCollection"
  );
  const calendar = requireObject3(
    collection.contributionCalendar,
    "GitHub contributionCalendar"
  );
  if (!Array.isArray(calendar.weeks)) {
    throw new Error("GitHub contributionCalendar.weeks must be an array");
  }
  const days = [];
  for (const [weekIndex, weekValue] of calendar.weeks.entries()) {
    const week = requireObject3(weekValue, `GitHub weeks[${weekIndex}]`);
    if (!Array.isArray(week.contributionDays)) {
      throw new Error(`GitHub weeks[${weekIndex}].contributionDays must be an array`);
    }
    for (const [dayIndex, dayValue] of week.contributionDays.entries()) {
      days.push(readContributionDay(dayValue, weekIndex, dayIndex));
    }
  }
  return days;
}
function readContributionDay(value, weekIndex, dayIndex) {
  const path = `GitHub weeks[${weekIndex}].contributionDays[${dayIndex}]`;
  const day = requireObject3(value, path);
  if (typeof day.date !== "string") {
    throw new Error(`${path}.date must be a string`);
  }
  if (!Number.isInteger(day.contributionCount) || day.contributionCount < 0) {
    throw new Error(`${path}.contributionCount must be a non-negative integer`);
  }
  if (typeof day.contributionLevel !== "string") {
    throw new Error(`${path}.contributionLevel must be a string`);
  }
  return {
    date: day.date,
    count: day.contributionCount,
    level: mapLevel(day.contributionLevel)
  };
}
function mapLevel(value) {
  const levels = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4
  };
  const level = levels[value];
  if (level === void 0) {
    throw new Error(`GitHub returned unknown contribution level '${value}'`);
  }
  return level;
}
function readGraphqlError(value) {
  if (value !== null && typeof value === "object" && "message" in value) {
    const message = value.message;
    if (typeof message === "string") return message;
  }
  return "unknown GraphQL error";
}
function requireObject3(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value;
}
function isTimeoutError(value) {
  return value instanceof Error && (value.name === "TimeoutError" || value.name === "AbortError");
}

// src/contributions/normalize.ts
var DAYS_PER_WEEK = 7;
var DISPLAY_WEEKS = 53;
var DISPLAY_DAYS = DAYS_PER_WEEK * DISPLAY_WEEKS;
var MILLISECONDS_PER_DAY = 864e5;
var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
function normalizeCalendar(days, endDate) {
  const endTimestamp = parseDate(endDate, "calendar end date");
  const byDate = validateDays(days);
  const endDayOfWeek = new Date(endTimestamp).getUTCDay();
  const startTimestamp = endTimestamp - (endDayOfWeek + (DISPLAY_WEEKS - 1) * DAYS_PER_WEEK) * MILLISECONDS_PER_DAY;
  const weeks = [];
  for (let weekIndex = 0; weekIndex < DISPLAY_WEEKS; weekIndex += 1) {
    const week = [];
    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      const offset = weekIndex * DAYS_PER_WEEK + dayIndex;
      const timestamp = startTimestamp + offset * MILLISECONDS_PER_DAY;
      const date = formatDate(timestamp);
      const source = timestamp <= endTimestamp ? byDate.get(date) : void 0;
      week.push(
        Object.freeze(
          source ?? {
            date,
            count: 0,
            level: 0
          }
        )
      );
    }
    weeks.push(Object.freeze(week));
  }
  if (weeks.length * DAYS_PER_WEEK !== DISPLAY_DAYS) {
    throw new Error("calendar normalization produced an invalid display size");
  }
  return Object.freeze({
    startDate: formatDate(startTimestamp),
    endDate: formatDate(endTimestamp),
    weeks: Object.freeze(weeks)
  });
}
function validateDays(days) {
  const byDate = /* @__PURE__ */ new Map();
  for (const day of days) {
    parseDate(day.date, "contribution date");
    if (byDate.has(day.date)) {
      throw new Error(`duplicate contribution date ${day.date}`);
    }
    if (!Number.isInteger(day.count) || day.count < 0) {
      throw new Error(`invalid contribution count for ${day.date}`);
    }
    if (!isContributionLevel(day.level)) {
      throw new Error(`invalid contribution level for ${day.date}`);
    }
    byDate.set(day.date, Object.freeze({ ...day }));
  }
  return byDate;
}
function isContributionLevel(value) {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}
function parseDate(value, label) {
  const match = DATE_PATTERN.exec(value);
  if (match === null) {
    throw new Error(`invalid ${label} ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  if (year < 1970 || formatDate(timestamp) !== value) {
    throw new Error(`invalid ${label} ${value}`);
  }
  return timestamp;
}
function formatDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

// src/output/gif.ts
var import_gifenc = __toESM(require_gifenc(), 1);
import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname as dirname2, join } from "node:path";
var GIF_MINIMUM_DELAY_MS = 10;
var pendingWrites = /* @__PURE__ */ new Map();
function encodeGif(frames, delayMs) {
  if (frames.length === 0) {
    throw new Error("cannot encode a GIF without frames");
  }
  if (!Number.isInteger(delayMs) || delayMs < GIF_MINIMUM_DELAY_MS) {
    throw new Error("GIF delay must be an integer of at least 10 ms");
  }
  const firstFrame = frames[0];
  validateFrame2(firstFrame);
  const encoder = (0, import_gifenc.GIFEncoder)({
    initialCapacity: Math.max(4096, firstFrame.pixels.length)
  });
  for (const [index, frame] of frames.entries()) {
    validateCompatibleFrame(frame, firstFrame, index);
    encoder.writeFrame(frame.pixels, frame.width, frame.height, {
      ...index === 0 ? { palette: frame.palette } : {},
      delay: delayMs,
      repeat: 0,
      dispose: 1
    });
  }
  encoder.finish();
  return new Uint8Array(encoder.bytes());
}
async function writeGifAtomic(outputPath, bytes) {
  const previousWrite = pendingWrites.get(outputPath) ?? Promise.resolve();
  const currentWrite = previousWrite.catch(() => void 0).then(() => writeGifAtomicNow(outputPath, bytes));
  pendingWrites.set(outputPath, currentWrite);
  try {
    await currentWrite;
  } finally {
    if (pendingWrites.get(outputPath) === currentWrite) {
      pendingWrites.delete(outputPath);
    }
  }
}
async function writeGifAtomicNow(outputPath, bytes) {
  const outputDirectory = dirname2(outputPath);
  const temporaryPath = join(
    outputDirectory,
    `.${basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`
  );
  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(temporaryPath, bytes);
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}
function validateFrame2(frame) {
  if (!Number.isInteger(frame.width) || frame.width < 1) {
    throw new Error("GIF frame width must be a positive integer");
  }
  if (!Number.isInteger(frame.height) || frame.height < 1) {
    throw new Error("GIF frame height must be a positive integer");
  }
  if (frame.pixels.length !== frame.width * frame.height) {
    throw new Error("GIF frame pixel count does not match its dimensions");
  }
  if (frame.palette.length < 1 || frame.palette.length > 256) {
    throw new Error("GIF palette must contain between 1 and 256 colors");
  }
}
function validateCompatibleFrame(frame, firstFrame, index) {
  validateFrame2(frame);
  if (frame.width !== firstFrame.width || frame.height !== firstFrame.height) {
    throw new Error(`GIF frame ${index} dimensions do not match the first frame`);
  }
  if (!palettesMatch(frame.palette, firstFrame.palette)) {
    throw new Error(`GIF frame ${index} palette does not match the first frame`);
  }
}
function palettesMatch(left, right) {
  return left.length === right.length && left.every(
    (color, index) => color.length === right[index]?.length && color.every((channel, channelIndex) => channel === right[index]?.[channelIndex])
  );
}

// src/animation/walk-cycle.ts
var WALK_POSE_COUNT = 4;
function walkPoseForDistance(distance, stridePixels) {
  if (!Number.isFinite(distance)) {
    throw new RangeError("walk distance must be finite");
  }
  if (!Number.isInteger(stridePixels) || stridePixels < 1) {
    throw new RangeError("stridePixels must be a positive integer");
  }
  const normalizedDistance = Math.max(0, distance);
  return Math.floor(normalizedDistance / stridePixels) % WALK_POSE_COUNT;
}
function bobForPose(pose) {
  return pose === 1 || pose === 3 ? -1 : 0;
}

// src/animation/timeline.ts
var BLINK_FRAMES = /* @__PURE__ */ new Set([34, 35, 82, 83]);
function sampleTimeline(frameIndex, options) {
  validateOptions2(frameIndex, options);
  const startX = -options.characterWidth;
  const endX = options.canvasWidth + options.characterWidth;
  const progress = frameIndex / (options.frameCount - 1);
  const x = Math.round(startX + (endX - startX) * progress);
  const distance = x - startX;
  const pose = walkPoseForDistance(distance, options.stridePixels);
  const wakeColumn = calculateWakeColumn(x, options);
  return {
    x,
    bob: bobForPose(pose),
    pose,
    blink: BLINK_FRAMES.has(frameIndex),
    wakeColumn
  };
}
function calculateWakeColumn(x, options) {
  const centerX = x + options.characterWidth / 2;
  const gridRight = options.gridLeft + options.gridCellStep * options.gridColumns;
  if (centerX < options.gridLeft || centerX >= gridRight) return -1;
  const relativeColumn = Math.floor(
    (centerX - options.gridLeft) / options.gridCellStep
  );
  return relativeColumn;
}
function validateOptions2(frameIndex, options) {
  if (!Number.isInteger(options.frameCount) || options.frameCount < 2) {
    throw new RangeError("frameCount must be an integer greater than one");
  }
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= options.frameCount) {
    throw new RangeError("frameIndex is outside the animation timeline");
  }
  for (const [name, value] of Object.entries({
    canvasWidth: options.canvasWidth,
    characterWidth: options.characterWidth,
    stridePixels: options.stridePixels,
    gridCellStep: options.gridCellStep,
    gridColumns: options.gridColumns
  })) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`${name} must be a positive integer`);
    }
  }
  if (!Number.isInteger(options.gridLeft)) {
    throw new RangeError("gridLeft must be an integer");
  }
}

// src/render/framebuffer.ts
var MAX_PALETTE_INDEX = 255;
var FrameBuffer = class {
  constructor(width, height, fillIndex = 0) {
    this.width = width;
    this.height = height;
    requirePositiveInteger(width, "width");
    requirePositiveInteger(height, "height");
    requirePaletteIndex(fillIndex);
    this.pixels = new Uint8Array(width * height);
    this.pixels.fill(fillIndex);
  }
  width;
  height;
  pixels;
  clear(paletteIndex) {
    requirePaletteIndex(paletteIndex);
    this.pixels.fill(paletteIndex);
  }
  setPixel(x, y, paletteIndex) {
    requirePaletteIndex(paletteIndex);
    if (!this.isInside(x, y)) return;
    this.pixels[y * this.width + x] = paletteIndex;
  }
  getPixel(x, y) {
    if (!this.isInside(x, y)) {
      throw new RangeError(`pixel (${x}, ${y}) is outside ${this.width}x${this.height}`);
    }
    return this.pixels[y * this.width + x];
  }
  fillRect(x, y, width, height, paletteIndex) {
    requireInteger(x, "x");
    requireInteger(y, "y");
    requireNonNegativeInteger(width, "width");
    requireNonNegativeInteger(height, "height");
    requirePaletteIndex(paletteIndex);
    const startX = Math.max(0, x);
    const endX = Math.min(this.width, x + width);
    const startY = Math.max(0, y);
    const endY = Math.min(this.height, y + height);
    if (startX >= endX || startY >= endY) return;
    for (let row = startY; row < endY; row += 1) {
      const rowOffset = row * this.width;
      this.pixels.fill(paletteIndex, rowOffset + startX, rowOffset + endX);
    }
  }
  isInside(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
};
function requirePositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}
function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}
function requireInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer`);
  }
}
function requirePaletteIndex(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PALETTE_INDEX) {
    throw new RangeError("palette index must be an integer between 0 and 255");
  }
}

// src/render/palette.ts
var HEX_COLOR_PATTERN3 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
var MAX_COLORS = 256;
var Palette = class {
  colors = [];
  indices = /* @__PURE__ */ new Map();
  constructor(background) {
    this.index(background);
  }
  index(hex) {
    const normalized = normalizeHex(hex);
    const existing = this.indices.get(normalized);
    if (existing !== void 0) return existing;
    if (this.colors.length >= MAX_COLORS) {
      throw new RangeError("palette cannot contain more than 256 colors");
    }
    const index = this.colors.length;
    this.indices.set(normalized, index);
    this.colors.push(parseHex(normalized));
    return index;
  }
  toRgb() {
    return this.colors.map((color) => [...color]);
  }
};
function normalizeHex(value) {
  if (!HEX_COLOR_PATTERN3.test(value)) {
    throw new Error(`invalid six-digit hex color '${value}'`);
  }
  return value.toUpperCase();
}
function parseHex(value) {
  const match = HEX_COLOR_PATTERN3.exec(value);
  if (match === null) {
    throw new Error(`invalid six-digit hex color '${value}'`);
  }
  const red = Number.parseInt(match[1], 16);
  const green = Number.parseInt(match[2], 16);
  const blue = Number.parseInt(match[3], 16);
  return [red, green, blue];
}

// src/render/primitives.ts
function drawSprite(buffer, palette, frame, character, anchorX, baselineY) {
  const cellSize = character.cellSize;
  const originX = anchorX - character.anchor.x * cellSize;
  const originY = baselineY - (character.anchor.y + 1) * cellSize;
  for (const [rowIndex, row] of frame.entries()) {
    for (let column = 0; column < row.length; column += 1) {
      const symbol = row[column];
      if (symbol === " ") continue;
      const color = character.palette[symbol];
      if (color === void 0) {
        throw new Error(`sprite uses undeclared palette symbol '${symbol}'`);
      }
      buffer.fillRect(
        originX + column * cellSize,
        originY + rowIndex * cellSize,
        cellSize,
        cellSize,
        palette.index(color)
      );
    }
  }
}

// src/render/scene.ts
var GRID_COLUMNS = 53;
var GRID_ROWS = 7;
var GRID_CELL_SIZE = 10;
var GRID_CELL_GAP = 5;
var GRID_MINIMUM_GAP = 1;
var GRID_BOTTOM_MARGIN = 18;
var CHARACTER_GRAPH_GAP = 8;
var CHARACTER_STRIDE_CELLS = 3;
function createScene(config, character) {
  const layout = createLayout(config.output.width, config.output.height);
  const palette = createPalette(config, character);
  const frameCount = Math.round(
    config.output.fps * config.output.durationSeconds
  );
  const characterWidth = character.frames.idle[0]?.length ?? 0;
  const scaledCharacterWidth = characterWidth * character.cellSize;
  const gridStep = layout.cellSize + layout.cellGap;
  return Object.freeze({
    layout,
    render(calendar, frameIndex) {
      validateCalendar(calendar);
      const sample = sampleTimeline(frameIndex, {
        frameCount,
        canvasWidth: config.output.width,
        characterWidth: scaledCharacterWidth,
        stridePixels: character.cellSize * CHARACTER_STRIDE_CELLS,
        gridLeft: layout.gridLeft,
        gridCellStep: gridStep,
        gridColumns: layout.columns
      });
      const buffer = new FrameBuffer(
        config.output.width,
        config.output.height,
        0
      );
      drawBackground(buffer, palette, config);
      drawBaseline(buffer, palette, config, layout);
      drawCalendar(buffer, palette, config, layout, calendar, sample.wakeColumn);
      drawCharacter(
        buffer,
        palette,
        character,
        chooseFrame(character, sample.pose, sample.blink),
        sample.x,
        layout.baselineY + sample.bob
      );
      return {
        width: buffer.width,
        height: buffer.height,
        pixels: buffer.pixels,
        palette: palette.toRgb()
      };
    }
  });
}
function createLayout(width, height) {
  const { cellSize, cellGap } = fitGridToWidth(width);
  const gridWidth = GRID_COLUMNS * cellSize + (GRID_COLUMNS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const gridLeft = Math.floor((width - gridWidth) / 2);
  const gridTop = height - GRID_BOTTOM_MARGIN - gridHeight;
  if (gridLeft < 0 || gridTop < 0) {
    throw new RangeError("canvas is too small for the contribution scene");
  }
  return Object.freeze({
    gridLeft,
    gridTop,
    cellSize,
    cellGap,
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    baselineY: gridTop - CHARACTER_GRAPH_GAP
  });
}
function fitGridToWidth(width) {
  for (let cellSize = GRID_CELL_SIZE; cellSize >= 1; cellSize -= 1) {
    const availableGap = Math.floor(
      (width - GRID_COLUMNS * cellSize) / (GRID_COLUMNS - 1)
    );
    if (availableGap >= GRID_MINIMUM_GAP) {
      return {
        cellSize,
        cellGap: Math.min(GRID_CELL_GAP, availableGap)
      };
    }
  }
  throw new RangeError("canvas is too narrow for the contribution scene");
}
function createPalette(config, character) {
  const palette = new Palette(config.theme.background);
  palette.index(mixHex(config.theme.background, config.theme.accent, 0.08));
  palette.index(mixHex(config.theme.background, config.theme.accent, 0.04));
  palette.index(config.theme.gridEmpty);
  for (const color of config.theme.gridLevels) palette.index(color);
  palette.index(mixHex(config.theme.gridEmpty, config.theme.accent, 0.35));
  for (const color of Object.values(character.palette)) palette.index(color);
  return palette;
}
function drawBackground(buffer, palette, config) {
  const topColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.08)
  );
  const middleColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.04)
  );
  const topHeight = Math.floor(buffer.height * 0.3);
  const middleHeight = Math.floor(buffer.height * 0.25);
  buffer.fillRect(0, 0, buffer.width, topHeight, topColor);
  buffer.fillRect(0, topHeight, buffer.width, middleHeight, middleColor);
}
function drawBaseline(buffer, palette, config, layout) {
  const width = layout.columns * layout.cellSize + (layout.columns - 1) * layout.cellGap;
  const color = palette.index(
    mixHex(config.theme.gridEmpty, config.theme.accent, 0.35)
  );
  buffer.fillRect(layout.gridLeft, layout.baselineY, width, 1, color);
}
function drawCalendar(buffer, palette, config, layout, calendar, wakeColumn) {
  const step = layout.cellSize + layout.cellGap;
  for (let column = 0; column < layout.columns; column += 1) {
    const week = calendar.weeks[column];
    if (week === void 0) {
      throw new Error(`calendar is missing week ${column}`);
    }
    for (let row = 0; row < layout.rows; row += 1) {
      const day = week[row];
      if (day === void 0) {
        throw new Error(`calendar week ${column} is missing day ${row}`);
      }
      const level = column === wakeColumn ? brightenLevel(day.level) : day.level;
      const color = contributionColor(config, level);
      buffer.fillRect(
        layout.gridLeft + column * step,
        layout.gridTop + row * step,
        layout.cellSize,
        layout.cellSize,
        palette.index(color)
      );
    }
  }
}
function drawCharacter(buffer, palette, character, frame, leftX, baselineY) {
  const anchorX = leftX + character.anchor.x * character.cellSize;
  drawSprite(buffer, palette, frame, character, anchorX, baselineY);
}
function chooseFrame(character, pose, blink) {
  if (blink) return character.frames.blink;
  return character.frames.walk[pose];
}
function contributionColor(config, level) {
  if (level === 0) return config.theme.gridEmpty;
  const color = config.theme.gridLevels[level - 1];
  if (color === void 0) {
    throw new Error(`theme is missing contribution level ${level}`);
  }
  return color;
}
function brightenLevel(level) {
  return Math.min(4, level + 1);
}
function validateCalendar(calendar) {
  if (calendar.weeks.length !== GRID_COLUMNS) {
    throw new Error(`calendar must contain exactly ${GRID_COLUMNS} weeks`);
  }
  if (!calendar.weeks.every((week) => week.length === GRID_ROWS)) {
    throw new Error(`each calendar week must contain exactly ${GRID_ROWS} days`);
  }
}
function mixHex(base, accent, ratio) {
  const baseRgb = parseHex2(base);
  const accentRgb = parseHex2(accent);
  const mixed = baseRgb.map(
    (channel, index) => Math.round(channel + (accentRgb[index] - channel) * ratio)
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
function parseHex2(value) {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16)
  ];
}

// src/generate.ts
var MILLISECONDS_PER_DAY2 = 864e5;
var DISPLAY_WEEK_OFFSET = 52 * 7;
async function generate(options) {
  const config = await loadConfig(options.configPath);
  const character = await loadCharacter(config.characterPath);
  const source = options.fixturePath ? await loadFixture(options.fixturePath) : await fetchLiveDays(config.github.username, options.token, options.now);
  const calendar = normalizeCalendar(source.days, source.endDate);
  const scene = createScene(config, character);
  const frameCount = Math.round(
    config.output.fps * config.output.durationSeconds
  );
  const frames = [];
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    frames.push(scene.render(calendar, frameIndex));
  }
  const delayMs = Math.round(1e3 / config.output.fps);
  const bytes = encodeGif(frames, delayMs);
  const outputPath = options.outputPath ? resolve3(options.outputPath) : config.outputPath;
  await writeGifAtomic(outputPath, bytes);
  return {
    path: outputPath,
    frames: frameCount,
    width: config.output.width,
    height: config.output.height
  };
}
async function loadFixture(fixturePath) {
  const path = resolve3(fixturePath);
  const raw = await readFile3(path, "utf8");
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${path}: invalid fixture JSON: ${message}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path}: fixture must be an object`);
  }
  const fixture = value;
  if (typeof fixture.endDate !== "string" || !Array.isArray(fixture.days)) {
    throw new Error(`${path}: fixture must contain endDate and days`);
  }
  return {
    endDate: fixture.endDate,
    days: fixture.days
  };
}
async function fetchLiveDays(username, token, now = /* @__PURE__ */ new Date()) {
  if (token === void 0 || token.trim().length === 0) {
    throw new Error("GITHUB_TOKEN is required unless --fixture is used");
  }
  if (Number.isNaN(now.getTime())) {
    throw new Error("generation date is invalid");
  }
  const endDate = now.toISOString().slice(0, 10);
  const endTimestamp = Date.parse(`${endDate}T00:00:00Z`);
  const endDayOfWeek = new Date(endTimestamp).getUTCDay();
  const startTimestamp = endTimestamp - (endDayOfWeek + DISPLAY_WEEK_OFFSET) * MILLISECONDS_PER_DAY2;
  const startDate = new Date(startTimestamp).toISOString().slice(0, 10);
  const days = await fetchContributionDays({
    username,
    token,
    from: `${startDate}T00:00:00Z`,
    to: `${endDate}T23:59:59Z`
  });
  return { endDate, days };
}

// src/action.ts
var DEFAULT_RUNTIME = {
  env: process.env,
  appendOutput: appendFile,
  generateImpl: generate,
  writeError: (message) => console.error(message)
};
async function runAction(runtime = DEFAULT_RUNTIME) {
  try {
    const configPath = readInput(runtime.env, "INPUT_CONFIG") || "ube.config.json";
    const token = readInput(runtime.env, "INPUT_TOKEN") || runtime.env.GITHUB_TOKEN;
    const outputPath = readInput(runtime.env, "INPUT_OUTPUT");
    const githubOutput = runtime.env.GITHUB_OUTPUT;
    if (githubOutput === void 0 || githubOutput.trim().length === 0) {
      throw new Error("GITHUB_OUTPUT is unavailable");
    }
    const result = await runtime.generateImpl({
      configPath,
      ...token ? { token } : {},
      ...outputPath ? { outputPath } : {}
    });
    await runtime.appendOutput(
      githubOutput,
      formatEnvironmentOutput("path", result.path)
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtime.writeError(`::error::${escapeWorkflowCommand(message)}`);
    return 1;
  }
}
function readInput(env, name) {
  return env[name]?.trim() ?? "";
}
function escapeWorkflowData(value) {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
function escapeWorkflowCommand(value) {
  return escapeWorkflowData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}
function formatEnvironmentOutput(name, value) {
  const valueLines = value.split(/\r\n|\r|\n/);
  let delimiter = "UBE_OUTPUT_PATH";
  while (valueLines.includes(delimiter)) {
    delimiter += "_";
  }
  return `${name}<<${delimiter}
${value}
${delimiter}
`;
}

// src/action-entry.ts
process.exitCode = await runAction();
//# sourceMappingURL=action.js.map
