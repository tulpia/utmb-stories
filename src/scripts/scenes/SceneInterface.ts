interface Scene {
  pathPosition: number;
  cameraPosition: number;

  onEnter(): void;
  onExit(): void;
}

export default Scene;
