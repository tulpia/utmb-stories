interface UMTBSceneInterface {
  /** Pourcentage entre 0 et 100 */
  pathPosition: number;
  cameraPosition: number;

  onEnter(): void;
  onExit(): void;
}

export default UMTBSceneInterface;
