import * as THREE from 'three';
import './styles/main.scss';
import CameraControls from 'camera-controls';
import UTMB from './scripts/UTMB';

CameraControls.install({ THREE });

// eslint-disable-next-line no-new
new UTMB();
