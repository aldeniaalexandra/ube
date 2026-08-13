export type SpriteFrame = readonly string[];

export interface CharacterPack {
  version: 1;
  name: string;
  cellSize: number;
  anchor: { x: number; y: number };
  palette: Readonly<Record<string, string>>;
  frames: {
    idle: SpriteFrame;
    blink: SpriteFrame;
    walk: readonly [SpriteFrame, SpriteFrame, SpriteFrame, SpriteFrame];
  };
}
