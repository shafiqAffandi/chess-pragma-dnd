export const pieceTypes = ["bishop", "king", "pawn", "queen", "rook"] as const;
export type PieceType = (typeof pieceTypes)[number];

export type Coord = [number, number];

export type PieceRecord = {
  type: PieceType;
  location: Coord;
};
