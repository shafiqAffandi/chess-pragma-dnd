import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { css } from "@emotion/react";

import king from "../assets/king.png";
import pawn from "../assets/pawn.png";
import invariant from "tiny-invariant";
import { atom, useAtom } from "jotai";

export type Coord = [number, number];

export type PieceRecord = {
  type: PieceType;
  location: Coord;
};

type HoveredState = "idle" | "validMove" | "invalidMove";

export type PieceType = "king" | "pawn";

type PieceProps = {
  location: Coord;
  pieceType: PieceType;
  image: string;
  alt: string;
};

const chessPieces: PieceRecord[] = [
  { type: "king", location: [3, 2] },
  { type: "pawn", location: [3, 4] },
];

const eatenPiecesAtom = atom<PieceType[]>([]);

export function isEqualCoord(c1: Coord, c2: Coord): boolean {
  return c1[0] === c2[0] && c1[1] === c2[1];
}

export const pieceLookup: {
  [Key in PieceType]: (location: Coord) => ReactElement;
} = {
  king: (location) => <King location={location} />,
  pawn: (location) => <Pawn location={location} />,
};

interface SquareProps {
  pieces: PieceRecord[];
  location: Coord;
  children: ReactNode;
}

export function isCoord(token: unknown): token is Coord {
  return (
    Array.isArray(token) &&
    token.length === 2 &&
    token.every((val) => typeof val === "number")
  );
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

const pieceTypes: PieceType[] = ["king", "pawn"];

export function isPieceType(value: unknown): value is PieceType {
  return typeof value === "string" && pieceTypes.includes(value as PieceType);
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

function getColor(state: HoveredState, isDark: boolean): string {
  if (state === "validMove") {
    return "lightgreen";
  } else if (state === "invalidMove") {
    return "pink";
  }
  return isDark ? "lightgrey" : "white";
}

function renderSquares(pieces: PieceRecord[]) {
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

function Chessboard() {
  const [pieces, setPieces] = useState<PieceRecord[]>(chessPieces);
  const [eatenPieces, setEatenPieces] = useAtom(eatenPiecesAtom);

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) {
          // if dropped outside of any drop targets
          return;
        }
        const destinationLocation = destination.data.location;
        const sourceLocation = source.data.location;
        const pieceType = source.data.pieceType;

        if (
          // type guarding
          !isCoord(destinationLocation) ||
          !isCoord(sourceLocation) ||
          !isPieceType(pieceType)
        ) {
          return;
        }

        console.log("destination--=", destination);
        console.log("source--=", source);
        console.log("destinationLocation==", destinationLocation);
        console.log("sourceLocation==", sourceLocation);
        console.log("pieceType==", pieceType);

        const piece = pieces.find((p) =>
          isEqualCoord(p.location, sourceLocation)
        );
        const restOfPieces = pieces.filter((p) => p !== piece);

        const tryAMove = canMove(
          sourceLocation,
          destinationLocation,
          pieceType,
          pieces
        );

        if (tryAMove[0] && piece !== undefined) {
          if (tryAMove[1] !== null) {
            const _piece = tryAMove[1];
            setEatenPieces((data) => {
              return [...data, _piece];
            });
          }
          // moving the piece!
          setPieces([
            { type: piece.type, location: destinationLocation },
            ...restOfPieces,
          ]);
        }
      },
    });
  }, [pieces]);

  return (
    <>
      <div css={chessboardStyles}>{renderSquares(pieces)}</div>
      <div>
        <p>eaten piece</p>
        <p>{eatenPieces}</p>
        <button
          onClick={() => {
            setPieces(() => chessPieces);
            setEatenPieces(() => []);
          }}
        >
          refresh board
        </button>
      </div>
    </>
  );
}

function Piece({ location, pieceType, image, alt }: PieceProps) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return draggable({
      element: el,
      getInitialData: () => ({ location, pieceType }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, []);

  return (
    <img
      css={[dragging && hidePieceStyles, imageStyles]}
      src={image}
      alt={alt}
      ref={ref}
    />
  ); // draggable set to false to prevent dragging of the images
}

export function King({ location }: { location: Coord }) {
  return <Piece image={king} alt="King" location={location} pieceType="king" />;
}

export function Pawn({ location }: { location: Coord }) {
  return <Piece image={pawn} alt="Pawn" location={location} pieceType="pawn" />;
}

const chessboardStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gridTemplateRows: "repeat(8, 1fr)",
  width: "500px",
  height: "500px",
  border: "3px solid lightgrey",
});

const squareStyles = css({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const imageStyles = css({
  width: 45,
  height: 45,
  padding: 4,
  borderRadius: 6,
  boxShadow:
    "1px 3px 3px rgba(9, 30, 66, 0.25),0px 0px 1px rgba(9, 30, 66, 0.31)",
  "&:hover": {
    backgroundColor: "rgba(168, 168, 168, 0.25)",
  },
});

const hidePieceStyles = css({
  opacity: 0.4,
});

export default Chessboard;
