import SceneThreshold from './SceneThresholdInterface';

interface SceneInterface {
  /** Pourcentage entre 0 et 100 */
  range: SceneThreshold;

  onEnter(): void;
  onExit(): void;
}

export default SceneInterface;
