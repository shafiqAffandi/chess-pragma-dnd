import { ReactNode, useEffect, useRef, useState } from "react";
import { Coord, PieceRecord } from "../shared/lib/types";
import invariant from "tiny-invariant";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  canMove,
  isCoord,
  isEqualCoord,
  isPieceType,
} from "../shared/lib/utils";
import { css } from "@emotion/react";
import { pieceLookup } from "./piece";

type HoveredState = "idle" | "validMove" | "invalidMove";

type SquareProps = {
  pieces: PieceRecord[];
  location: Coord;
  children: ReactNode;
};

function getColor(state: HoveredState, isDark: boolean): string {
  if (state === "validMove") {
    return "lightgreen";
  } else if (state === "invalidMove") {
    return "pink";
  }
  return isDark ? "lightgrey" : "white";
}

function Square({ pieces, location, children }: SquareProps) {
  const ref = useRef(null);
  const [state, setState] = useState<HoveredState>("idle");

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return dropTargetForElements({
      element: el,
      getData: () => ({ location }),
      onDragEnter: ({ source }) => {
        if (
          // type guards
          !isCoord(source.data.location) ||
          !isPieceType(source.data.pieceType)
        ) {
          return;
        }

        const tryAMove = canMove(
          source.data.location,
          location,
          source.data.pieceType,
          pieces
        );
        if (tryAMove[0]) {
          setState("validMove");
        } else {
          setState("invalidMove");
        }
      },
      onDragLeave: () => setState("idle"),
      onDrop: () => setState("idle"),
    });
  }, [location, pieces]);

  const isDark = (location[0] + location[1]) % 2 === 1;

  return (
    <div
      css={squareStyles}
      style={{ backgroundColor: getColor(state, isDark) }}
      ref={ref}
    >
      {children}
    </div>
  );
}

export default function renderSquares(pieces: PieceRecord[]) {
  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareCoord: Coord = [row, col];

      const piece = pieces.find((piece) =>
        isEqualCoord(piece.location, squareCoord)
      );

      squares.push(
        <Square pieces={pieces} location={squareCoord}>
          {piece && pieceLookup[piece.type](piece.location)}
        </Square>
      );
    }
  }
  return squares;
}

const squareStyles = css({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});
