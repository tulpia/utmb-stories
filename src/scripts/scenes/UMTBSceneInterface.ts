import SceneThreshold from './UTMBSceneThresholdInterface';

interface UMTBSceneInterface {
  /** Pourcentage entre 0 et 100 */
  range: SceneThreshold;

  onEnter(): void;
  onExit(): void;
}

export default UMTBSceneInterface;
