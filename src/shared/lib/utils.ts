import { Coord, PieceRecord, PieceType, pieceTypes } from "../lib/types";

export function isPieceType(value: unknown): value is PieceType {
  return typeof value === "string" && pieceTypes.includes(value as PieceType);
}

export function isCoord(token: unknown): token is Coord {
  return (
    Array.isArray(token) &&
    token.length === 2 &&
    token.every((val) => typeof val === "number")
  );
}

export function isEqualCoord(c1: Coord, c2: Coord): boolean {
  return c1[0] === c2[0] && c1[1] === c2[1];
}

export function canMove(
  start: Coord,
  destination: Coord,
  pieceType: PieceType,
  pieces: PieceRecord[]
): [boolean, PieceType | null] {
  const rowDist = Math.abs(start[0] - destination[0]);
  const colDist = Math.abs(start[1] - destination[1]);

  let caughtPiece = null;
  const possiblePieceOnCoord = pieces.find((piece) =>
    isEqualCoord(piece.location, destination)
  );

  if (possiblePieceOnCoord) {
    caughtPiece = possiblePieceOnCoord.type;
  }

  switch (pieceType) {
    case "king":
      return [
        [0, 1].includes(rowDist) && [0, 1].includes(colDist),
        caughtPiece,
      ];
    case "pawn":
      return [colDist === 0 && start[0] - destination[0] === -1, caughtPiece];
    default:
      return [false, null];
  }
}
