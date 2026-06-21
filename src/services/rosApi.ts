import * as ROSLIB from 'roslib';
import * as THREE from 'three';

export type Pose = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  orientation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
};

export type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export function axisAngleDegreesToQuaternion(
  axisX: number,
  axisY: number,
  axisZ: number,
  angleDeg: number
): Quaternion {
  /*
    Pasamos de eje-angulo a quaternión. Devolvemos el quaternión que representa la rotación especifica.
    Es simplemente una conversión matemática.

    Convierte una rotación eje-ángulo a quaternion.

    Eje-ángulo significa:
      - axisX, axisY, axisZ indican alrededor de qué eje se gira.
      - angleDeg indica cuánto se gira alrededor de ese eje.

    Ejemplo:
      eje = (0, 0, 1)
      ángulo = 90°
      significa rotar 90° alrededor de Z.

    Three.js necesita:
      - eje normalizado
      - ángulo en radianes
  */

  // Creamos el vector eje con los valores recibidos.
  const axis = new THREE.Vector3(axisX, axisY, axisZ);

  // Si el eje es cero, no hay dirección de giro válida.
  // Devolvemos quaternion identidad: no rotación.
  if (axis.length() === 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    };
  }

  // Normalizar = hacer que el eje tenga longitud 1.
  // setFromAxisAngle exige que el eje esté normalizado.
  axis.normalize();

  // La UI trabaja en grados, pero Three.js usa radianes.
  const angleRad = THREE.MathUtils.degToRad(angleDeg);

  // Aquí ocurre la conversión eje-ángulo → quaternion.
  // Matemáticamente:
  // qx = ux · sin(angle/2)
  // qy = uy · sin(angle/2)
  // qz = uz · sin(angle/2)
  // qw = cos(angle/2)
  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(axis, angleRad); // esta es la nueva función que hemos cambiado, en vez de la de Euler.

  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

export function applyRelativeAxisAngleRotation(
  baseOrientation: Quaternion,
  axisX: number,
  axisY: number,
  axisZ: number,
  angleDeg: number
): Quaternion {
  /*
    Esta función aplica una rotación relativa a una orientación base.
    La base ya viene en formato quaternión y le aplicamos una rotación que esta en formato eje-ángulo,
    por lo que tenemos que convertirla con la misma fórmula usada en la función anterior.

    La orientación base viene del robot en formato quaternion: baseOrientation = { x, y, z, w }

    La rotación relativa se define en formato eje-ángulo: eje = (axisX, axisY, axisZ), ángulo = angleDeg

    Matemáticamente:
      q_relativo = axis-angle → quaternion
      q_final = q_base · q_relativo
  */

  // 1. Creamos el quaternion base a partir de la orientación actual/de referencia del robot.
  const baseQuaternion = new THREE.Quaternion(
    baseOrientation.x,
    baseOrientation.y,
    baseOrientation.z,
    baseOrientation.w
  );

  // 2. Creamos el eje de rotación que indica alrededor de qué dirección queremos rotar.
  const axis = new THREE.Vector3(axisX, axisY, axisZ);

  // 3. Si el eje es cero, no se puede normalizar. En ese caso devolvemos la orientación base sin cambios.
  if (axis.length() === 0) {
    return {
      x: baseQuaternion.x,
      y: baseQuaternion.y,
      z: baseQuaternion.z,
      w: baseQuaternion.w,
    };
  }

  // 4. El eje debe estar normalizado para usar setFromAxisAngle. Normalizar significa convertirlo en un vector de módulo 1.
  axis.normalize();

  // 5. La interfaz usa grados, pero Three.js necesita radianes.
  const angleRad = THREE.MathUtils.degToRad(angleDeg);

  // 6. Convertimos eje-ángulo a quaternion.
  // Esto internamente aplica:
  // qx = ux * sin(angle/2)
  // qy = uy * sin(angle/2)
  // qz = uz * sin(angle/2)
  // qw = cos(angle/2)
  const relativeQuaternion = new THREE.Quaternion();
  relativeQuaternion.setFromAxisAngle(axis, angleRad);

  // 7. Multiplicamos quaternion base por quaternion relativo.
  // Esto significa: orientación final = orientación base + rotación relativa.
  const finalQuaternion = baseQuaternion.multiply(relativeQuaternion);

  // 8. Devolvemos el quaternion final en el formato usado por ROS.
  return {
    x: finalQuaternion.x,
    y: finalQuaternion.y,
    z: finalQuaternion.z,
    w: finalQuaternion.w,
  };
}

export function applyRelativeAxisAngleXYZRotation(
  baseOrientation: Quaternion,
  rxDeg: number,
  ryDeg: number,
  rzDeg: number
): Quaternion {
  /*
    Esta función aplica tres rotaciones relativas:
      - Rx alrededor del eje X
      - Ry alrededor del eje Y
      - Rz alrededor del eje Z

    Cada slider representa una rotación eje-ángulo independiente.

    Flujo:
      orientación base
      + rotación X
      + rotación Y
      + rotación Z
      = orientación final
  */

  let orientation = baseOrientation;

  // Rotación relativa alrededor del eje X.
  orientation = applyRelativeAxisAngleRotation(
    orientation,
    1,
    0,
    0,
    rxDeg
  );

  // Rotación relativa alrededor del eje Y.
  orientation = applyRelativeAxisAngleRotation(
    orientation,
    0,
    1,
    0,
    ryDeg
  );

  // Rotación relativa alrededor del eje Z.
  orientation = applyRelativeAxisAngleRotation(
    orientation,
    0,
    0,
    1,
    rzDeg
  );

  return orientation;
}

const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090',
});

const poseCommandTopic = new ROSLIB.Topic({
  ros,
  name: '/command/pose',
  messageType: 'geometry_msgs/msg/Pose',
});

const poseStateTopic = new ROSLIB.Topic({
  ros,
  name: '/state/pose',
  messageType: 'geometry_msgs/msg/Pose',
});

const jointCommandTopic = new ROSLIB.Topic({
  ros,
  name: '/command/joint',
  messageType: 'std_msgs/msg/Float32MultiArray',
});

const jointStateTopic = new ROSLIB.Topic({
  ros,
  name: '/state/joint',
  messageType: 'sensor_msgs/msg/JointState',
});

const movelTrajectoryTopic = new ROSLIB.Topic({
  ros,
  name: '/trajectory/movel',
  messageType: 'trajectory_msgs/msg/Pose',
});

const movejTrajectoryTopic = new ROSLIB.Topic({
  ros,
  name: '/trajectory/movej',
  messageType: 'trajectory_msgs/msg/Pose',
});

const jointTrajectoryTopic = new ROSLIB.Topic({
  ros,
  name: '/trajectory/joint',
  messageType: 'std_msgs/msg/Float32MultiArray',
});

export function publishPoseCommand(pose: Pose) {
  poseCommandTopic.publish(pose);
}

export function subscribeToPose(callback: (pose: Pose) => void) {
  const handler = (message: unknown) => {
    callback(message as Pose);
  };

  poseStateTopic.subscribe(handler);

  return () => {
    poseStateTopic.unsubscribe(handler);
  };
}

// export function publishJointCommand(joints: number[]) {
//   jointCommandTopic.publish({
//     data: joints,
//   });
// }

export function subscribeToJointState(
  callback: (joints: number[]) => void
) {
  const handler = (message: any) => {
    callback(message.position);
  };

  jointStateTopic.subscribe(handler);

  return () => {
    jointStateTopic.unsubscribe(handler);
  };
}

export function publishMoveL(pose: Pose) {
  movelTrajectoryTopic.publish(pose);
}

// export function publishMoveJ(pose: Pose) {
//   movejTrajectoryTopic.publish(pose);
// }

// export function publishJointTrajectory(joints: number[]) {
//   jointTrajectoryTopic.publish({
//     data: joints,
//   });
// }

export function publishToolDO(value: boolean) {
  const topic = new ROSLIB.Topic({
    ros,
    name: "/command/do",
    messageType: "std_msgs/msg/Bool",
  });

  topic.publish({
    data: value,
  });
}
