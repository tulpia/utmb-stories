import * as THREE from 'three';
import './styles/main.scss';
import CameraControls from 'camera-controls';
import UTMBMap from './scripts/UTMBMap';

CameraControls.install({ THREE });

// eslint-disable-next-line no-new
new UTMBMap();
