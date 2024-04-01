import { ReactElement, useEffect, useRef, useState } from "react";
import { Coord, PieceType } from "../shared/lib/types";
import king from "../assets/king.png";
import pawn from "../assets/pawn.png";
import invariant from "tiny-invariant";
import { css } from "@emotion/react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type PieceProps = {
  location: Coord;
  pieceType: PieceType;
  image: string;
  alt: string;
};

export const pieceLookup: {
  [Key in PieceType]: (location: Coord) => ReactElement;
} = {
  king: (location) => (
    <King location={location}/>
  ),
  pawn: (location) => (
    <Pawn location={location} />
  ),
  bishop: () => <></>,
  queen: () => <></>,
  rook: () => <></>,
};

export function King({location}: {location :Coord}) {
  return <Piece image={king} alt="King" location={location} pieceType="king" />;
}

export function Pawn({location}: {location :Coord}) {
  return <Piece image={pawn} alt="Pawn" location={location} pieceType="pawn"/>;
}

export function Piece({ location, pieceType, image, alt }: PieceProps) {
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

const hidePieceStyles = css({
  opacity: 0.4,
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
