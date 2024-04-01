import { useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { css } from "@emotion/react";
import { atom, useAtom } from "jotai";
import renderSquares from "./square";
import {
  canMove,
  isCoord,
  isEqualCoord,
  isPieceType,
} from "../shared/lib/utils";
import { Coord, PieceRecord, PieceType } from "../shared/lib/types";

const chessPieces: PieceRecord[] = [
  { type: "king", location: [3, 3] },
  { type: "pawn", location: [3, 4] },
  { type: "pawn", location: [3, 5] },
];

const eatenPiecesAtom = atom<PieceType[]>([]);

function Chessboard() {
  const [pieces, setPieces] = useState<PieceRecord[]>([...chessPieces]);
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
        const sourceLocation = source.data.location as Coord;
        const pieceType = source.data.pieceType;

        if (
          // type guarding
          !isCoord(destinationLocation) ||
          !isCoord(sourceLocation) ||
          !isPieceType(pieceType)
        ) {
          return;
        }

        const piece = pieces.find((p) =>
          isEqualCoord(p.location, sourceLocation)
        );

        const tryAMove = canMove(
          sourceLocation,
          destinationLocation,
          pieceType,
          pieces
        );

        if (tryAMove[0] && piece !== undefined) {
          if (tryAMove[1] !== null) {
            const _piece = tryAMove[1];
            const pieceIdxToRemove = pieces.findIndex((p) =>
              isEqualCoord(p.location, destinationLocation)
            );
            pieces.splice(pieceIdxToRemove, 1);
            setEatenPieces((data) => {
              return [...data, _piece];
            });
            
          }
          const restOfPieces = pieces.filter((p) => p !== piece);
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
        <p>{JSON.stringify(eatenPieces)}</p>
        <button
          onClick={() => {
            setPieces(() => [...chessPieces]);
            setEatenPieces(() => []);
          }}
        >
          refresh board
        </button>
      </div>
    </>
  );
}

const chessboardStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gridTemplateRows: "repeat(8, 1fr)",
  width: "500px",
  height: "500px",
  border: "3px solid lightgrey",
});

export default Chessboard;
