import * as THREE from 'three';

export const gofaDhParams = [
  { thetaOffsetDeg: 0, d: 0.265, a: 0.000, alphaDeg: -90 },
  { thetaOffsetDeg: -90, d: 0.000, a: 0.444, alphaDeg: 0 },
  { thetaOffsetDeg: 0, d: 0.000, a: 0.110, alphaDeg: -90 },
  { thetaOffsetDeg: 0, d: 0.470, a: 0.000, alphaDeg: 90 },
  { thetaOffsetDeg: 0, d: 0.000, a: 0.080, alphaDeg: -90 },
  { thetaOffsetDeg: 180, d: 0.101, a: 0.000, alphaDeg: 0 },
];

export function computeForwardKinematics(jointsRad: number[]) {
  let transform = new THREE.Matrix4().identity();

  for (let i = 0; i < gofaDhParams.length; i++) {
    const dh = gofaDhParams[i];

    const thetaDeg = THREE.MathUtils.radToDeg(jointsRad[i])+ dh.thetaOffsetDeg;

    const jointTransform = dhToMatrix(
      thetaDeg,
      dh.d,
      dh.a,
      dh.alphaDeg
    );
    transform.multiply(jointTransform);

  }

  const tcpPosition = new THREE.Vector3();
  const tcpQuaternion = new THREE.Quaternion();

  tcpPosition.setFromMatrixPosition(transform);
  tcpQuaternion.setFromRotationMatrix(transform);

  if (tcpQuaternion.w < 0) {
  tcpQuaternion.x *= -1;
  tcpQuaternion.y *= -1;
  tcpQuaternion.z *= -1;
  tcpQuaternion.w *= -1;
}

  return {
    position: {
      x: tcpPosition.x,
      y: tcpPosition.y,
      z: tcpPosition.z,
    },
    orientation: {
      x: tcpQuaternion.x,
      y: tcpQuaternion.y,
      z: tcpQuaternion.z,
      w: tcpQuaternion.w,
    },
    matrix: transform,
  };
}

function dhToMatrix(
  thetaDeg: number,
  d: number,
  a: number,
  alphaDeg: number
) {
  const theta = THREE.MathUtils.degToRad(thetaDeg);
  const alpha = THREE.MathUtils.degToRad(alphaDeg);

  const ct = Math.cos(theta);
  const st = Math.sin(theta);

  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return new THREE.Matrix4().set(
    ct, -st * ca, st * sa, a * ct,
    st, ct * ca, -ct * sa, a * st,
    0, sa, ca, d,
    0, 0, 0, 1
  );
}
