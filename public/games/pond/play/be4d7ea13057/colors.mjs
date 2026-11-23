export function rgb(hex) {
  const color = Number.parseInt(hex.slice(1), 16);
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}

export function rgbHex(color) {
  return '#' + color.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('');
}

export function hueColor(hue, saturation, lightness) {
  const amplitude = saturation * Math.min(lightness, 1 - lightness);
  return [0, 8, 4].map((offset) => {
    const sector = (offset + hue / 30) % 12;
    const channel = Math.max(-1, Math.min(sector - 3, 9 - sector, 1));
    return 255 * (lightness - amplitude * channel);
  });
}
