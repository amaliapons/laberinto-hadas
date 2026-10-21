import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();


export async function loadModel({ path, size }, { verticalAlign = 'center' } = {}) { //esperar
  const gltf = await loader.loadAsync(path);
  const model = gltf.scene;

  const box = new THREE.Box3().setFromObject(model);
  const modelSize = box.getSize(new THREE.Vector3());
  const modelCenter = box.getCenter(new THREE.Vector3());
  const scaleFactor = size / Math.max(modelSize.x, modelSize.y, modelSize.z);

  model.scale.setScalar(scaleFactor);
  model.position.set(
    -modelCenter.x * scaleFactor,
    verticalAlign === 'bottom' ? -box.min.y * scaleFactor : -modelCenter.y * scaleFactor, //no lo uso de momento
    -modelCenter.z * scaleFactor
  );

  model.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = obj.receiveShadow = true;
  });

  const wrapperGroup = new THREE.Group();
  wrapperGroup.add(model);
  return wrapperGroup;
}