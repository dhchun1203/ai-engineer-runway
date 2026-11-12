import type { ComponentType } from "react";
import {
  Blueprint,
  Boxes,
  DictView,
  FanOut,
  Figure,
  GateFlow,
  Hint,
  Inherit,
  Layers,
  Note,
  Relay,
  Seq,
  SharedRef,
  Trail,
} from "@/components/lesson-figures/figures";
import { CartSimulator } from "@/components/lesson-figures/cart-simulator";
import { BranchMergeSimulator } from "@/components/lesson-figures/branch-merge-simulator";
import { ConflictSimulator } from "@/components/lesson-figures/conflict-simulator";
import { SliceExplorer } from "@/components/lesson-figures/slice-explorer";
import { GuessInputChecker } from "@/components/lesson-figures/guess-input-checker";
import { PgVolumeSimulator } from "@/components/lesson-figures/pg-volume-simulator";
import { RpsSimulator } from "@/components/lesson-figures/rps-simulator";
import { CallSimulator } from "@/components/lesson-figures/call-simulator";
import { InstanceSimulator } from "@/components/lesson-figures/instance-simulator";
import { GitAreasSimulator } from "@/components/lesson-figures/git-areas-simulator";
import { PetSimulator } from "@/components/lesson-figures/pet-simulator";

// 레슨 본문 그림 부품 맵. 리더 페이지가 <MDXContent components={lessonFigureComponents} />로
// 넘긴다. MDX에서 부르는 이름과 키가 정확히 같아야 한다. 레슨 전용 시뮬레이터(CartSimulator
// 같은)도 여기에 더한다.
export const lessonFigureComponents: Record<string, ComponentType> = {
  Figure: Figure as ComponentType,
  Hint: Hint as ComponentType,
  Boxes: Boxes as ComponentType,
  Layers: Layers as ComponentType,
  Trail: Trail as ComponentType,
  Blueprint: Blueprint as ComponentType,
  GateFlow: GateFlow as ComponentType,
  DictView: DictView as ComponentType,
  Relay: Relay as ComponentType,
  Seq: Seq as ComponentType,
  SharedRef: SharedRef as ComponentType,
  Inherit: Inherit as ComponentType,
  FanOut: FanOut as ComponentType,
  Note: Note as ComponentType,
  CartSimulator: CartSimulator as ComponentType,
  BranchMergeSimulator: BranchMergeSimulator as ComponentType,
  ConflictSimulator: ConflictSimulator as ComponentType,
  SliceExplorer: SliceExplorer as ComponentType,
  GuessInputChecker: GuessInputChecker as ComponentType,
  PgVolumeSimulator: PgVolumeSimulator as ComponentType,
  RpsSimulator: RpsSimulator as ComponentType,
  CallSimulator: CallSimulator as ComponentType,
  InstanceSimulator: InstanceSimulator as ComponentType,
  GitAreasSimulator: GitAreasSimulator as ComponentType,
  PetSimulator: PetSimulator as ComponentType,
};
