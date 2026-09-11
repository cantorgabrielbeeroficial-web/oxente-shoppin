const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i;

export function isVideoUrl(url: string | null | undefined) {
  return Boolean(url && VIDEO_EXTENSIONS.test(url));
}
