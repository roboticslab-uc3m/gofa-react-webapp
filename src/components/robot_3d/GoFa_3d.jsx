import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export default function GoFa3D({ joints = [0, 0, 0, 0, 0, 0], transparent = false, }) {
  const { scene } = useGLTF("/models/gofa_test.glb");

  const base = scene.getObjectByName("base_link");
  const link1 = scene.getObjectByName("link_1");
  const link2 = scene.getObjectByName("link_2");
  const link3 = scene.getObjectByName("link_3");
  const link4 = scene.getObjectByName("link_4");
  const link5 = scene.getObjectByName("link_5");
  const link6 = scene.getObjectByName("link_6");

  const q = joints;

  function renderPart(part) {
    if (!part) return null;

    const cloned = part.clone();

    if (transparent) {
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.35;
          child.material.depthWrite = false;
        }
      });
    }

    return <primitive object={cloned} />;
  }

  return (
  <>
    <group position={[-0.1, -0.7, 0]} scale={1.4}>
      {renderPart(base)}

      <group position={[0, 0.265, 0]} rotation={[0, q[0], 0]}>
        {renderPart(link1)}

        <group position={[0, 0, 0]} rotation={[0, 0, -q[1]]}>
          {renderPart(link2)}

          <group position={[0, 0.444, 0]} rotation={[0, 0, -q[2]]}>
            {renderPart(link3)}

            <group position={[0, 0.110, 0]} rotation={[q[3], 0, 0]}>
              {renderPart(link4)}

              <group position={[0.470, 0, 0]} rotation={[0, 0, -q[4]]}>
                {renderPart(link5)}

                <group position={[0.101, 0.080, 0]} rotation={[q[5], 0, 0]}>
                  {renderPart(link6)}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>

    <OrbitControls />
  </>
);
}
