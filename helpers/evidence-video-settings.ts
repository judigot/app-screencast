export function evidenceVideoSize() {
  return {
    width: Number(process.env.EVIDENCE_VIDEO_WIDTH ?? "1920"),
    height: Number(process.env.EVIDENCE_VIDEO_HEIGHT ?? "1080"),
  };
}

export function evidenceScreencastQuality(): number {
  const raw = process.env.EVIDENCE_SCREencast_QUALITY ?? "100";
  return Math.min(100, Math.max(0, Number(raw)));
}

export function evidenceOutputFps(): number {
  return Number(process.env.EVIDENCE_OUTPUT_FPS ?? "60");
}

export function evidenceOutputCrf(): number {
  return Number(process.env.EVIDENCE_OUTPUT_CRF ?? "8");
}

export function evidenceRecordDurationMs(): number {
  return Number(process.env.EVIDENCE_RECORD_MS ?? "10000");
}
