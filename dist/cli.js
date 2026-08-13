#!/usr/bin/env node
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

// src/character/load.ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// src/character/validate.ts
var FRAME_WIDTH = 12;
var FRAME_HEIGHT = 8;
var HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
var CharacterError = class extends Error {
  name = "CharacterError";
};
function parseCharacterJson(raw, path) {
  try {
    return validateCharacter(JSON.parse(raw));
  } catch (error) {
    if (error instanceof CharacterError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new CharacterError(`${path}: invalid JSON: ${message}`);
  }
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

// src/character/load.ts
async function loadCharacter(path) {
  const characterPath = resolve(path);
  const raw = await readFile(characterPath, "utf8");
  try {
    return parseCharacterJson(raw, characterPath);
  } catch (error) {
    if (error instanceof CharacterError && !error.message.startsWith(characterPath)) {
      throw new CharacterError(`${characterPath}: ${error.message}`);
    }
    throw error;
  }
}

// src/config/load.ts
import { readFile as readFile2 } from "node:fs/promises";
import { dirname, resolve as resolve2 } from "node:path";

// src/experience/defaults.ts
var DEFAULT_TARGET_BYTES = 2e6;
var DEFAULT_HARD_MAX_BYTES = 5e6;
function createDefaultExperience() {
  return {
    habitat: "moonlit-garden",
    calendar: { timezone: "UTC", hemisphere: "north" },
    stats: { period: "displayed-weeks", showStreak: true, showTotal: true },
    identity: {
      enabled: false,
      name: "",
      role: "",
      style: "quiet-label"
    },
    link: "",
    budget: {
      targetBytes: DEFAULT_TARGET_BYTES,
      hardMaxBytes: DEFAULT_HARD_MAX_BYTES
    }
  };
}
function normalizeExperience(input) {
  const defaults = createDefaultExperience();
  if (input === void 0) return defaults;
  const calendar = input.calendar;
  const stats = input.stats;
  const identity = input.identity;
  const budget = input.budget;
  return {
    habitat: "moonlit-garden",
    calendar: {
      timezone: typeof calendar?.timezone === "string" ? calendar.timezone : defaults.calendar.timezone,
      hemisphere: isHemisphere(calendar?.hemisphere) ? calendar.hemisphere : defaults.calendar.hemisphere
    },
    stats: {
      period: isStatsPeriod(stats?.period) ? stats.period : defaults.stats.period,
      showStreak: typeof stats?.showStreak === "boolean" ? stats.showStreak : defaults.stats.showStreak,
      showTotal: typeof stats?.showTotal === "boolean" ? stats.showTotal : defaults.stats.showTotal
    },
    identity: {
      enabled: typeof identity?.enabled === "boolean" ? identity.enabled : defaults.identity.enabled,
      name: typeof identity?.name === "string" ? identity.name : defaults.identity.name,
      role: typeof identity?.role === "string" ? identity.role : defaults.identity.role,
      style: isIdentityStyle(identity?.style) ? identity.style : defaults.identity.style
    },
    link: typeof input.link === "string" ? input.link : defaults.link,
    budget: {
      targetBytes: typeof budget?.targetBytes === "number" ? budget.targetBytes : defaults.budget.targetBytes,
      hardMaxBytes: typeof budget?.hardMaxBytes === "number" ? budget.hardMaxBytes : defaults.budget.hardMaxBytes
    }
  };
}
function isHemisphere(value) {
  return value === "north" || value === "south";
}
function isStatsPeriod(value) {
  return value === "displayed-weeks" || value === "calendar-year";
}
function isIdentityStyle(value) {
  return value === "quiet-label" || value === "combined-sign";
}

// src/config/schema.ts
var USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
var HEX_COLOR_PATTERN2 = /^#[0-9a-f]{6}$/i;
var MAX_FRAME_COUNT = 300;
var MAX_LINK_LENGTH = 2048;
var MAX_IDENTITY_LENGTH = 80;
var MIN_TARGET_BYTES = 1e5;
var MAX_HARD_MAX_BYTES = 5e6;
var ConfigError = class extends Error {
  name = "ConfigError";
};
function validateConfig(value) {
  const config = requireObject2(value, "config");
  assertOnlyKeys2(
    config,
    ["version", "github", "character", "output", "theme", "experience"],
    "config"
  );
  if (config.version !== 1 && config.version !== 2) {
    throw new ConfigError("version must be 1 or 2");
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
  const experience = config.experience === void 0 ? void 0 : validateExperience(config.experience);
  return {
    version: config.version,
    github: { username },
    character,
    output,
    theme,
    ...experience ? { experience } : {}
  };
}
function validateExperience(value) {
  const experience = requireObject2(value, "experience");
  assertOnlyKeys2(
    experience,
    ["habitat", "calendar", "stats", "identity", "link", "budget"],
    "experience"
  );
  if (experience.habitat !== void 0 && experience.habitat !== "moonlit-garden") {
    throw new ConfigError("experience.habitat must be moonlit-garden");
  }
  const calendar = requireObject2(experience.calendar ?? {}, "experience.calendar");
  assertOnlyKeys2(calendar, ["timezone", "hemisphere"], "experience.calendar");
  const timezone = calendar.timezone === void 0 ? "UTC" : requireString2(calendar.timezone, "experience.calendar.timezone");
  const hemisphere = calendar.hemisphere === void 0 ? "north" : calendar.hemisphere;
  if (!isHemisphere(hemisphere)) {
    throw new ConfigError("experience.calendar.hemisphere must be north or south");
  }
  const stats = requireObject2(experience.stats ?? {}, "experience.stats");
  assertOnlyKeys2(
    stats,
    ["period", "showStreak", "showTotal"],
    "experience.stats"
  );
  const period = stats.period === void 0 ? "displayed-weeks" : stats.period;
  if (!isStatsPeriod(period)) {
    throw new ConfigError(
      "experience.stats.period must be displayed-weeks or calendar-year"
    );
  }
  const showStreak = stats.showStreak === void 0 ? true : requireBoolean(stats.showStreak, "experience.stats.showStreak");
  const showTotal = stats.showTotal === void 0 ? true : requireBoolean(stats.showTotal, "experience.stats.showTotal");
  const identity = requireObject2(experience.identity ?? {}, "experience.identity");
  assertOnlyKeys2(
    identity,
    ["enabled", "name", "role", "style"],
    "experience.identity"
  );
  const enabled = identity.enabled === void 0 ? false : requireBoolean(identity.enabled, "experience.identity.enabled");
  const name = identity.name === void 0 ? "" : requireOptionalBoundedString(identity.name, "experience.identity.name", MAX_IDENTITY_LENGTH);
  const role = identity.role === void 0 ? "" : requireOptionalBoundedString(identity.role, "experience.identity.role", MAX_IDENTITY_LENGTH);
  const style = identity.style === void 0 ? "quiet-label" : identity.style;
  if (!isIdentityStyle(style)) {
    throw new ConfigError(
      "experience.identity.style must be quiet-label or combined-sign"
    );
  }
  const link = experience.link === void 0 ? "" : requireLink(experience.link, "experience.link");
  const budget = requireObject2(experience.budget ?? {}, "experience.budget");
  assertOnlyKeys2(
    budget,
    ["targetBytes", "hardMaxBytes"],
    "experience.budget"
  );
  const targetBytes = budget.targetBytes === void 0 ? 2e6 : requireIntegerInRange2(
    budget.targetBytes,
    "experience.budget.targetBytes",
    MIN_TARGET_BYTES,
    MAX_HARD_MAX_BYTES
  );
  const hardMaxBytes = budget.hardMaxBytes === void 0 ? 5e6 : requireIntegerInRange2(
    budget.hardMaxBytes,
    "experience.budget.hardMaxBytes",
    targetBytes,
    MAX_HARD_MAX_BYTES
  );
  return {
    habitat: "moonlit-garden",
    calendar: { timezone, hemisphere },
    stats: { period, showStreak, showTotal },
    identity: { enabled, name, role, style },
    link,
    budget: { targetBytes, hardMaxBytes }
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
function requireOptionalBoundedString(value, path, maximumLength) {
  if (typeof value !== "string") {
    throw new ConfigError(`${path} must be a string`);
  }
  if (value.length > maximumLength) {
    throw new ConfigError(`${path} must contain at most ${maximumLength} characters`);
  }
  return value;
}
function requireBoolean(value, path) {
  if (typeof value !== "boolean") {
    throw new ConfigError(`${path} must be a boolean`);
  }
  return value;
}
function requireLink(value, path) {
  if (typeof value !== "string") {
    throw new ConfigError(`${path} must be a string`);
  }
  if (value.length > MAX_LINK_LENGTH) {
    throw new ConfigError(`${path} must contain at most ${MAX_LINK_LENGTH} characters`);
  }
  const link = value;
  if (link.length === 0) return link;
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    throw new ConfigError(`${path} must be an absolute http or https URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError(`${path} must be an absolute http or https URL`);
  }
  return link;
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
  const parsed = parseJson(raw, configPath);
  const config = validateConfigWithPath(parsed, configPath);
  const configDirectory = dirname(configPath);
  return {
    ...config,
    experience: normalizeExperience(config.experience),
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
function parseJson(raw, path) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`${path}: invalid JSON: ${message}`);
  }
}

// src/generate.ts
import { readFile as readFile3 } from "node:fs/promises";
import { resolve as resolve3 } from "node:path";

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

// src/output/budget.ts
function selectFramesWithinBudget(frames, encode, options) {
  if (frames.length === 0) throw new Error("cannot budget an empty frame list");
  if (!Number.isInteger(options.targetBytes) || options.targetBytes < 1) {
    throw new RangeError("targetBytes must be a positive integer");
  }
  if (!Number.isInteger(options.hardMaxBytes) || options.hardMaxBytes < options.targetBytes) {
    throw new RangeError("hardMaxBytes must be greater than or equal to targetBytes");
  }
  const candidates = candidateCounts(frames.length);
  let largestWithinHardMax;
  for (const count of candidates) {
    const sampled = sampleFrames(frames, count);
    const bytes = encode(sampled);
    const result = { frames: sampled, bytes };
    if (bytes.length <= options.targetBytes) return result;
    if (bytes.length <= options.hardMaxBytes && largestWithinHardMax === void 0) {
      largestWithinHardMax = result;
    }
  }
  if (largestWithinHardMax !== void 0) return largestWithinHardMax;
  throw new Error("cannot fit one GIF frame within the hard byte budget");
}
function candidateCounts(frameCount) {
  const counts = /* @__PURE__ */ new Set([frameCount, 1]);
  for (const ratio of [0.8, 0.66, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1]) {
    counts.add(Math.max(1, Math.floor(frameCount * ratio)));
  }
  return [...counts].sort((left, right) => right - left);
}
function sampleFrames(frames, count) {
  if (count >= frames.length) return [...frames];
  const sampled = [];
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.round(index * (frames.length - 1) / (count - 1 || 1));
    sampled.push(frames[sourceIndex]);
  }
  return sampled;
}

// src/output/png.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { mkdir as mkdir2, rename as rename2, rm as rm2, writeFile as writeFile2 } from "node:fs/promises";
import { basename as basename2, dirname as dirname3, join as join2 } from "node:path";
import { deflateSync } from "node:zlib";
var PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
var pendingWrites2 = /* @__PURE__ */ new Map();
function encodePng(frame) {
  validateFrame3(frame);
  const raw = new Uint8Array(frame.height * (1 + frame.width * 3));
  for (let y = 0; y < frame.height; y += 1) {
    const rowStart = y * (1 + frame.width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < frame.width; x += 1) {
      const paletteIndex = frame.pixels[y * frame.width + x];
      const color = frame.palette[paletteIndex] ?? frame.palette[0];
      const pixelStart = rowStart + 1 + x * 3;
      raw[pixelStart] = color[0];
      raw[pixelStart + 1] = color[1];
      raw[pixelStart + 2] = color[2];
    }
  }
  const header = new Uint8Array(13);
  writeUint32(header, 0, frame.width);
  writeUint32(header, 4, frame.height);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  const compressed = new Uint8Array(deflateSync(raw));
  return concat(
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array())
  );
}
async function writePngAtomic(outputPath, bytes) {
  const previousWrite = pendingWrites2.get(outputPath) ?? Promise.resolve();
  const currentWrite = previousWrite.catch(() => void 0).then(() => writePngAtomicNow(outputPath, bytes));
  pendingWrites2.set(outputPath, currentWrite);
  try {
    await currentWrite;
  } finally {
    if (pendingWrites2.get(outputPath) === currentWrite) pendingWrites2.delete(outputPath);
  }
}
async function writePngAtomicNow(outputPath, bytes) {
  const outputDirectory = dirname3(outputPath);
  const temporaryPath = join2(
    outputDirectory,
    `.${basename2(outputPath)}.${process.pid}.${randomUUID2()}.tmp`
  );
  await mkdir2(outputDirectory, { recursive: true });
  try {
    await writeFile2(temporaryPath, bytes);
    await rename2(temporaryPath, outputPath);
  } catch (error) {
    await rm2(temporaryPath, { force: true });
    throw error;
  }
}
function chunk(type, data) {
  const result = new Uint8Array(12 + data.length);
  writeUint32(result, 0, data.length);
  for (let index = 0; index < 4; index += 1) result[4 + index] = type.charCodeAt(index);
  result.set(data, 8);
  writeUint32(result, 8 + data.length, crc32(result.subarray(4, 8 + data.length)));
  return result;
}
function crc32(bytes) {
  let crc = 4294967295;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
    }
  }
  return (crc ^ 4294967295) >>> 0;
}
function writeUint32(target, offset, value) {
  target[offset] = value >>> 24 & 255;
  target[offset + 1] = value >>> 16 & 255;
  target[offset + 2] = value >>> 8 & 255;
  target[offset + 3] = value & 255;
}
function concat(...parts) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function validateFrame3(frame) {
  if (!Number.isInteger(frame.width) || frame.width < 1 || !Number.isInteger(frame.height) || frame.height < 1) {
    throw new Error("PNG frame dimensions must be positive integers");
  }
  if (frame.pixels.length !== frame.width * frame.height) {
    throw new Error("PNG frame pixel count does not match its dimensions");
  }
  if (frame.palette.length < 1 || frame.palette.length > 256) {
    throw new Error("PNG palette must contain between 1 and 256 colors");
  }
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

// src/experience/metrics.ts
var RECENT_ACTIVITY_DAYS = 14;
function calculateActivityMetrics(calendar) {
  const days = flattenDays(calendar);
  const currentStreak = countCurrentStreak(days);
  const displayedTotal = days.reduce((total, day) => total + day.count, 0);
  const endYear = Number(calendar.endDate.slice(0, 4));
  const calendarYearTotal = days.filter((day) => day.date.startsWith(`${endYear}-`)).reduce((total, day) => total + day.count, 0);
  const recentDays = days.slice(-RECENT_ACTIVITY_DAYS);
  const recentActivityRatio = recentDays.length === 0 ? 0 : recentDays.filter((day) => day.count > 0).length / recentDays.length;
  return {
    currentStreak,
    displayedTotal,
    calendarYearTotal,
    recentActivityRatio
  };
}
function flattenDays(calendar) {
  return calendar.weeks.flatMap((week) => [...week]);
}
function countCurrentStreak(days) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((days[index]?.count ?? 0) === 0) break;
    streak += 1;
  }
  return streak;
}

// src/experience/season.ts
function seasonForDate(date, hemisphere) {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const northern = northernSeason(month, day);
  if (hemisphere === "north") return northern;
  return invertSeason(northern);
}
function northernSeason(month, day) {
  const monthDay = month * 100 + day;
  if (monthDay >= 321 && monthDay < 621) return "spring";
  if (monthDay >= 621 && monthDay < 923) return "summer";
  if (monthDay >= 923 && monthDay < 1221) return "autumn";
  return "winter";
}
function invertSeason(season) {
  if (season === "spring") return "autumn";
  if (season === "summer") return "winter";
  if (season === "autumn") return "spring";
  return "summer";
}

// src/experience/planner.ts
var ENGINE_VERSION = "moonlit-garden-1";
function planScene(calendar, config) {
  const experience = config.experience ?? createDefaultExperience();
  const metrics = calculateActivityMetrics(calendar);
  const seed = hashSeed([
    config.github.username,
    calendar.endDate,
    experience.habitat,
    experience.calendar.timezone,
    experience.calendar.hemisphere,
    ENGINE_VERSION
  ].join("|"));
  const restMode = metrics.recentActivityRatio < 0.15;
  const weather = chooseWeather(seed, metrics.recentActivityRatio, restMode);
  const vignette = chooseVignette(seed, metrics, restMode, weather);
  return Object.freeze({
    season: seasonForDate(calendar.endDate, experience.calendar.hemisphere),
    weather,
    vignette,
    metrics,
    identity: experience.identity,
    seed
  });
}
function chooseWeather(seed, activityRatio, restMode) {
  if (restMode) return seed % 2 === 0 ? "clouds" : "mist";
  if (activityRatio > 0.65) return seed % 4 === 0 ? "clear" : "clouds";
  return seed % 3 === 0 ? "rain" : "clouds";
}
function chooseVignette(seed, metrics, restMode, weather) {
  if (metrics.currentStreak > 0 && metrics.currentStreak % 7 === 0) {
    return "celebrate";
  }
  if (restMode) return seed % 2 === 0 ? "nap" : "read";
  if (weather === "rain") return seed % 2 === 0 ? "rain-watch" : "water";
  if (metrics.recentActivityRatio > 0.65) {
    return ["fireflies", "puddle-hop", "water"][seed % 3];
  }
  return seed % 2 === 0 ? "read" : "fireflies";
}
function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

// src/render/font.ts
var GLYPH_WIDTH = 3;
var GLYPH_GAP = 1;
var GLYPHS = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10101", "10101"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10101", "10101", "10101", "11011", "10001"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  ":": ["000", "010", "000", "010", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "-": ["000", "000", "111", "000", "000"],
  "/": ["001", "001", "010", "100", "100"],
  "'": ["010", "010", "000", "000", "000"],
  "?": ["110", "001", "010", "000", "010"]
};
function drawText(buffer, palette, text, x, y, paletteIndex, scale) {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("text scale must be a positive integer");
  }
  void palette;
  let cursorX = x;
  for (const character of text.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS["?"];
    const glyphWidth = glyph[0]?.length ?? GLYPH_WIDTH;
    for (let row = 0; row < glyph.length; row += 1) {
      const pattern = glyph[row];
      for (let column = 0; column < pattern.length; column += 1) {
        if (pattern[column] !== "1") continue;
        buffer.fillRect(
          cursorX + column * scale,
          y + row * scale,
          scale,
          scale,
          paletteIndex
        );
      }
    }
    cursorX += (glyphWidth + GLYPH_GAP) * scale;
  }
  return Math.max(0, cursorX - x - GLYPH_GAP * scale);
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
var SIGN_HEIGHT = 54;
var SIGN_MARGIN = 14;
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
      const plan = planScene(calendar, config);
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
      drawBackground(buffer, palette, config, plan, frameIndex, frameCount);
      drawBaseline(buffer, palette, config, layout);
      drawCalendar(buffer, palette, config, layout, calendar, sample.wakeColumn);
      drawGardenProps(buffer, palette, config, layout, plan, frameIndex, frameCount);
      drawCharacter(
        buffer,
        palette,
        character,
        chooseFrame(character, sample.pose, sample.blink),
        sample.x,
        layout.baselineY + sample.bob
      );
      drawVignette(buffer, palette, config, layout, plan, sample.x, frameIndex, frameCount);
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
    baselineY: gridTop - CHARACTER_GRAPH_GAP,
    gridWidth
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
  for (const color of [
    "#f5dca1",
    "#eee9ff",
    "#87dba8",
    "#8ee9ad",
    "#65b96f",
    "#96e6a5",
    "#684c2e",
    "#8b6840",
    "#5a4027",
    "#d9c79d",
    "#fff3ce",
    "#8da8b5",
    "#496c76",
    "#a7d9df",
    "#273e53",
    "#6f52ca",
    "#c7a0ef"
  ]) palette.index(color);
  for (const color of Object.values(character.palette)) palette.index(color);
  return palette;
}
function drawBackground(buffer, palette, config, plan, frameIndex, frameCount) {
  const topColor = palette.index(seasonSkyColor(config.theme.background, plan.season));
  const middleColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.04)
  );
  const topHeight = Math.floor(buffer.height * 0.32);
  const middleHeight = Math.floor(buffer.height * 0.24);
  buffer.fillRect(0, 0, buffer.width, topHeight, topColor);
  buffer.fillRect(0, topHeight, buffer.width, middleHeight, middleColor);
  const moonX = Math.max(26, buffer.width - 90);
  const moonY = 34 + Math.round(Math.sin(frameIndex / frameCount * Math.PI * 2) * 2);
  const moon = palette.index("#f5dca1");
  const shadow = topColor;
  buffer.fillRect(moonX, moonY, 22, 22, moon);
  buffer.fillRect(moonX + 7, moonY - 3, 22, 22, shadow);
  drawStars(buffer, palette, plan.seed);
  drawWeather(buffer, palette, plan.weather, frameIndex, frameCount);
}
function drawStars(buffer, palette, seed) {
  const color = palette.index("#8ee9ad");
  const softColor = palette.index("#c7a0ef");
  const stars = [
    [0.08, 0.18],
    [0.17, 0.29],
    [0.27, 0.14],
    [0.39, 0.24],
    [0.52, 0.12],
    [0.63, 0.27],
    [0.74, 0.16],
    [0.86, 0.25],
    [0.93, 0.12]
  ];
  for (const [index, [relativeX, relativeY]] of stars.entries()) {
    const x = Math.floor(buffer.width * relativeX);
    const y = Math.floor(buffer.height * relativeY);
    const paletteIndex = (seed + index) % 3 === 0 ? softColor : color;
    buffer.fillRect(x, y, 2, 2, paletteIndex);
  }
}
function drawWeather(buffer, palette, weather, frameIndex, frameCount) {
  if (weather === "clear") return;
  const phase = Math.floor(frameIndex / frameCount * 8);
  if (weather === "clouds") {
    const cloud = palette.index("#273e53");
    for (const x of [0.14, 0.55, 0.78]) {
      const left = Math.floor(buffer.width * x) + phase % 2 * 2;
      const top = Math.floor(buffer.height * (0.24 + x * 0.03));
      buffer.fillRect(left, top, 32, 5, cloud);
      buffer.fillRect(left + 8, top - 4, 20, 5, cloud);
      buffer.fillRect(left + 15, top - 7, 10, 4, cloud);
    }
    return;
  }
  const mist = palette.index(weather === "mist" ? "#a7d9df" : "#8da8b5");
  const lineCount = weather === "mist" ? 6 : 12;
  for (let index = 0; index < lineCount; index += 1) {
    const x = (index * 83 + phase * 7) % Math.max(1, buffer.width - 4);
    const y = 54 + (index * 29 + phase * 3) % Math.max(1, Math.floor(buffer.height * 0.35));
    buffer.fillRect(x, y, weather === "mist" ? 9 : 2, weather === "mist" ? 1 : 8, mist);
  }
}
function drawGardenProps(buffer, palette, config, layout, plan, frameIndex, frameCount) {
  const groundY = layout.baselineY - 1;
  const plantColor = palette.index(plan.season === "autumn" ? "#d09b67" : "#65b96f");
  const leafColor = palette.index(plan.season === "winter" ? "#8da8b5" : "#96e6a5");
  for (const offset of [26, 118, 242, 348]) {
    const x = layout.gridLeft + offset;
    buffer.fillRect(x, groundY - 13, 2, 13, plantColor);
    buffer.fillRect(x - 5, groundY - 15, 7, 4, leafColor);
    buffer.fillRect(x + 2, groundY - 20, 7, 4, leafColor);
  }
  drawGardenSign(buffer, palette, config, layout, plan);
  if (plan.identity.enabled && (plan.identity.name || plan.identity.role)) {
    drawIdentity(buffer, palette, config, plan, layout);
  }
  drawLantern(buffer, palette, layout, frameIndex, frameCount);
}
function drawGardenSign(buffer, palette, config, layout, plan) {
  const signWidth = Math.min(204, Math.max(132, Math.floor(buffer.width * 0.22)));
  const signHeight = SIGN_HEIGHT;
  const signLeft = buffer.width - signWidth - SIGN_MARGIN;
  const signTop = Math.max(8, layout.baselineY - signHeight - 18);
  const wood = palette.index("#684c2e");
  const woodLight = palette.index("#8b6840");
  const post = palette.index("#5a4027");
  const label = palette.index("#d9c79d");
  const value = palette.index("#fff3ce");
  buffer.fillRect(signLeft, signTop, signWidth, signHeight, wood);
  buffer.fillRect(signLeft + 5, signTop + 5, signWidth - 10, signHeight - 10, woodLight);
  buffer.fillRect(signLeft + 14, signTop + signHeight, 10, 20, post);
  buffer.fillRect(signLeft + signWidth - 24, signTop + signHeight, 10, 20, post);
  const statsPeriod = config.experience.stats.period;
  const total = statsPeriod === "calendar-year" ? plan.metrics.calendarYearTotal : plan.metrics.displayedTotal;
  const width = signWidth - 28;
  const showStreak = config.experience.stats.showStreak;
  const showTotal = config.experience.stats.showTotal;
  const columnWidth = Math.floor(width / ((showStreak ? 1 : 0) + (showTotal ? 1 : 0) || 1));
  let cursor = signLeft + 14;
  if (showStreak) {
    drawText(buffer, palette, "STREAK", cursor, signTop + 12, label, 1);
    drawText(buffer, palette, `${plan.metrics.currentStreak} DAYS`, cursor, signTop + 27, value, 1);
    cursor += columnWidth;
  }
  if (showTotal) {
    drawText(buffer, palette, statsPeriod === "calendar-year" ? "YEAR" : "53 WEEKS", cursor, signTop + 12, label, 1);
    drawText(buffer, palette, `${total}`, cursor, signTop + 27, value, 1);
  }
}
function drawIdentity(buffer, palette, config, plan, layout) {
  const name = plan.identity.name.trim().toUpperCase();
  const role = plan.identity.role.trim().toUpperCase();
  const textColor = palette.index("#eee9ff");
  const roleColor = palette.index("#87dba8");
  if (plan.identity.style === "combined-sign") {
    const signLeft = Math.max(10, buffer.width - Math.min(246, Math.floor(buffer.width * 0.27)) - SIGN_MARGIN);
    const signTop = Math.max(8, layout.baselineY - SIGN_HEIGHT - 84);
    buffer.fillRect(signLeft, signTop, Math.min(246, Math.floor(buffer.width * 0.27)), 39, palette.index("#684c2e"));
    drawText(buffer, palette, name.slice(0, 14), signLeft + 10, signTop + 7, textColor, 1);
    drawText(buffer, palette, role.slice(0, 22), signLeft + 10, signTop + 22, roleColor, 1);
    return;
  }
  const left = Math.max(10, Math.floor(buffer.width * 0.07));
  const top = Math.max(8, Math.floor(buffer.height * 0.12));
  drawText(buffer, palette, name.slice(0, 16), left, top, textColor, 1);
  drawText(buffer, palette, role.slice(0, 24), left, top + 9, roleColor, 1);
}
function drawLantern(buffer, palette, layout, frameIndex, frameCount) {
  const x = layout.gridLeft + layout.gridWidth - 28;
  const y = layout.baselineY - 34;
  const glow = palette.index("#f5dca1");
  const phase = Math.floor(frameIndex / frameCount * 4) % 2;
  buffer.fillRect(x + 4, y - 7, 6, 3, glow);
  buffer.fillRect(x + 2, y - 4, 10, 13, palette.index(phase === 0 ? "#8b6840" : "#684c2e"));
  buffer.fillRect(x + 5, y - 1, 4, 7, glow);
  buffer.fillRect(x + 4, y + 9, 6, 2, palette.index("#5a4027"));
}
function drawVignette(buffer, palette, config, layout, plan, characterX, frameIndex, frameCount) {
  const x = Math.max(6, Math.min(buffer.width - 24, characterX + 36));
  const y = layout.baselineY - 5;
  const green = palette.index("#96e6a5");
  const purple = palette.index("#c7a0ef");
  const warm = palette.index("#f5dca1");
  const phase = Math.floor(frameIndex / frameCount * 6) % 2;
  if (plan.vignette === "water") {
    buffer.fillRect(x, y - 12, 5, 12, palette.index("#8da8b5"));
    buffer.fillRect(x - 2, y - 15, 9, 4, palette.index("#496c76"));
    buffer.fillRect(x + 8, y - 2, 13, 2, palette.index("#a7d9df"));
    return;
  }
  if (plan.vignette === "read") {
    buffer.fillRect(x, y - 12, 12, 8, warm);
    buffer.fillRect(x + 5, y - 13, 2, 10, palette.index("#8b6840"));
    return;
  }
  if (plan.vignette === "nap") {
    drawText(buffer, palette, phase === 0 ? "Z" : "Z Z", x, y - 23, purple, 1);
    return;
  }
  if (plan.vignette === "rain-watch") {
    buffer.fillRect(x, y - 26, 18, 3, palette.index("#273e53"));
    buffer.fillRect(x + 5, y - 29, 9, 3, palette.index("#273e53"));
    buffer.fillRect(x + 2, y - 20, 2, 7, palette.index("#a7d9df"));
    buffer.fillRect(x + 12, y - 17, 2, 7, palette.index("#a7d9df"));
    return;
  }
  if (plan.vignette === "puddle-hop") {
    buffer.fillRect(x, y, 22, 2, palette.index("#a7d9df"));
    buffer.fillRect(x + 5, y + 3, 12, 1, palette.index("#8da8b5"));
    return;
  }
  if (plan.vignette === "celebrate") {
    const sparkles = [[0, -20], [12, -27], [24, -17], [9, -8]];
    for (const [offsetX, offsetY] of sparkles) {
      buffer.fillRect(x + offsetX, y + offsetY, 3, 3, phase === 0 ? warm : purple);
    }
    return;
  }
  const fireflies = [[0, -18], [14, -26], [28, -14]];
  for (const [offsetX, offsetY] of fireflies) {
    buffer.fillRect(x + offsetX, y + offsetY, 3, 3, phase === 0 ? green : warm);
  }
  void config;
}
function seasonSkyColor(background, season) {
  const seasonTint = {
    spring: "#275b52",
    summer: "#2d4569",
    autumn: "#68433e",
    winter: "#283b59"
  };
  return mixHex(background, seasonTint[season], 0.28);
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
  const outputPath = options.outputPath ? resolve3(options.outputPath) : config.outputPath;
  const budgeted = selectFramesWithinBudget(
    frames,
    (candidate) => encodeGif(candidate, animationDelay(config.output.durationSeconds, candidate.length)),
    config.experience.budget
  );
  const delayMs = animationDelay(config.output.durationSeconds, budgeted.frames.length);
  const bytes = budgeted.bytes.length > 0 ? budgeted.bytes : encodeGif(budgeted.frames, delayMs);
  const staticPath = createStaticPath(outputPath);
  const staticFrame = budgeted.frames[Math.floor(budgeted.frames.length / 2)];
  await Promise.all([
    writeGifAtomic(outputPath, bytes),
    writePngAtomic(staticPath, encodePng(staticFrame))
  ]);
  return {
    path: outputPath,
    staticPath,
    frames: budgeted.frames.length,
    width: config.output.width,
    height: config.output.height
  };
}
function animationDelay(durationSeconds, frameCount) {
  return Math.max(10, Math.round(durationSeconds * 1e3 / frameCount));
}
function createStaticPath(outputPath) {
  return outputPath.replace(/\.[^.\\/]+$/, ".png");
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

// src/cli.ts
var DEFAULT_RUNTIME = {
  env: process.env,
  writeOut: (message) => console.log(message),
  writeError: (message) => console.error(message)
};
async function runCli(args, runtime = DEFAULT_RUNTIME) {
  try {
    const parsed = parseArguments(args);
    if (parsed.command === "validate") {
      const config = await loadConfig(parsed.configPath);
      const character = await loadCharacter(config.characterPath);
      runtime.writeOut(`Valid Ube config for ${character.name}: ${config.configPath}`);
      return 0;
    }
    const result = await generate({
      configPath: parsed.configPath,
      ...parsed.fixturePath ? { fixturePath: parsed.fixturePath } : {},
      ...parsed.outputPath ? { outputPath: parsed.outputPath } : {},
      ...runtime.env.GITHUB_TOKEN ? { token: runtime.env.GITHUB_TOKEN } : {}
    });
    runtime.writeOut(
      `Generated ${result.frames} frames at ${result.path} and ${result.staticPath} (${result.width}x${result.height})`
    );
    return 0;
  } catch (error) {
    runtime.writeError(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
function parseArguments(args) {
  const [command, ...flagArguments] = args;
  if (command !== "generate" && command !== "validate") {
    throw new Error("usage: ube <generate|validate> [--config path] [--fixture path] [--output path]");
  }
  const flags = /* @__PURE__ */ new Map();
  for (let index = 0; index < flagArguments.length; index += 2) {
    const flag = flagArguments[index];
    const value = flagArguments[index + 1];
    if (flag === void 0 || !["--config", "--fixture", "--output"].includes(flag)) {
      throw new Error(`unknown option '${flag ?? ""}'`);
    }
    if (value === void 0 || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    if (flags.has(flag)) {
      throw new Error(`${flag} may only be provided once`);
    }
    flags.set(flag, value);
  }
  if (command === "validate" && (flags.has("--fixture") || flags.has("--output"))) {
    throw new Error("validate only accepts --config");
  }
  return {
    command,
    configPath: flags.get("--config") ?? "ube.config.json",
    ...flags.has("--fixture") ? { fixturePath: flags.get("--fixture") } : {},
    ...flags.has("--output") ? { outputPath: flags.get("--output") } : {}
  };
}

// src/cli-entry.ts
process.exitCode = await runCli(process.argv.slice(2));
//# sourceMappingURL=cli.js.map
