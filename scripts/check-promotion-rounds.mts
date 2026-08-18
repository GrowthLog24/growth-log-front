import assert from "node:assert/strict";
import { postingRoundsFromValues } from "../src/infrastructure/external/knouBoards/boardSheetSource.ts";

assert.deepEqual(
  postingRoundsFromValues(
    [["1차 게시", "5차 게시", "5차 게시 제목"]],
    [["3차 게시", "6차 게시", "6차 링크"]],
  ),
  [1, 3, 5, 6],
);
