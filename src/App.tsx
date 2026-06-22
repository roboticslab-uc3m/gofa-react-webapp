import { useEffect, useRef, useState } from 'react';
import './App.css';
import type { Pose } from './services/rosApi';
import GoFa3D from "./components/robot_3d/GoFa_3d";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useTranslation } from 'react-i18next';

import {
  publishPoseCommand,
  subscribeToPose,
  // publishJointCommand,
  subscribeToJointState,
  publishMoveL,
  // publishMoveJ,
  // publishJointTrajectory,
  applyRelativeAxisAngleXYZRotation,
} from './services/rosApi';

import { RobotStatePanel } from './components/RobotStatePanel';
import { CartesianControl } from './components/CartesianControl';
import { JointControl } from './components/JointControl';
import { computeForwardKinematics } from './utils/forwardKinematics';
// import { computeInverseKinematics } from "./utils/inverseKinematics";
import { publishToolDO } from "./services/rosApi";

import uc3mLogo from "./assets/uc3m.jpg";
import RoboticsLabLogo from "./assets/roboticslab-banner-350px.png";

import { motorsOn, motorsOff, setManualMode, setAutoMode } from "./services/robotApi";

const CARTESIAN_LIMIT_M = 0.2; // ±200 mm

const HOME_JOINTS = [
  0,
  0,
  0,
  0,
  Math.PI / 6,
  0,
];

function App() {
  const { t, i18n } = useTranslation();

  const [activeLanguage, setActiveLanguage] = useState(i18n.language);
  const [activePanel, setActivePanel] = useState<'cartesian' | 'joint' | 'rws'>('cartesian');
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [referencePose, setReferencePose] = useState<Pose | null>(null);
  const [targetPose, setTargetPose] = useState<Pose | null>(null);
  const [, setPreviousPose] = useState<Pose | null>(null);

  const [currentJoints, setCurrentJoints] = useState<number[]>([]);
  const [referenceJoints, setReferenceJoints] = useState<number[]>([]);
  const [targetJoints, setTargetJoints] = useState<number[]>([]);
  const [, setPreviousJoints] = useState<number[]>([]);

  const [activeControlMode, setActiveControlMode] = useState<'cartesian' | 'joint'>('cartesian');
  const [cameraActive, setCameraActive] = useState(false);
  const [toolOn, setToolOn] = useState(false);
  // const [leftPanel, setLeftPanel] = useState<"robot" | "rws">("robot");

  const syncJointTargetWithStateRef = useRef(false);

  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [rz, setRz] = useState(0);

  // const fkMatrix = computeForwardKinematics(currentJoints);
  // const fkPose = currentJoints.length === 6
  //   ? computeForwardKinematics(currentJoints): null;

  const handleToolSwitch = (checked: boolean) => {
    setToolOn(checked);
    publishToolDO(checked);
  };

  const [message, setMessage] = useState(
    t('logger.awaiting_state')
  );

  const handleRwsCommand = async (command: () => Promise<any>) => {
    try {
      const result = await command();
      console.log("RWS response:", result);
    } catch (error) {
      console.error("Error executing RWS command:", error);
    }
  };

  const handleLanguageChange = (language: string) => {
    setActiveLanguage(language);
    i18n.changeLanguage(language);
  }

  useEffect(() => {
    const unsubscribe = subscribeToPose((pose) => {
      setCurrentPose(pose);

      if (referencePose === null) {
        setReferencePose(pose);
        setTargetPose(pose);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [referencePose]);

  useEffect(() => {
    const unsubscribe = subscribeToJointState((joints) => {

      setCurrentJoints(joints);

      if (activeControlMode === 'cartesian') {
        setTargetJoints(joints);
      }

      if (referenceJoints.length === 0) {
        setReferenceJoints(joints);
        setTargetJoints(joints);
      }

    });

    return () => {
      unsubscribe();
    };
  }, [referenceJoints, activeControlMode]);

  //   useEffect(() => {
  //   if (!currentJoints || currentJoints.length !== 6) return;

  //   setTargetJoints((prev) => {
  //     if (prev && prev.length === 6) return prev;
  //     return [...currentJoints];
  //   });
  // }, [currentJoints]);

  //   useEffect(() => {
  //   if (activePanel !== "cartesian") return;
  //   if (!targetPose) return;
  //   if (!currentJoints || currentJoints.length !== 6) return;

  //   const seedJoints = lastValidIK.current ?? referenceJoints ?? currentJoints;

  //   const ikJoints = computeInverseKinematics(targetPose, seedJoints);

  //   if (!ikJoints || ikJoints.length !== 6) return;
  //   if (ikJoints.some((j) => !Number.isFinite(j))) return;

  //   lastValidIK.current = [...ikJoints];
  //   setTargetJoints([...ikJoints]);
  // }, [targetPose, activePanel, currentJoints]);

  function updateTargetPosition(axis: 'x' | 'y' | 'z', value: number) {
    if (!targetPose) return;

    setTargetPose({
      ...targetPose,
      position: {
        ...targetPose.position,
        [axis]: value,
      },
    });
  }

  function updateTargetJoint(
    index: number,
    value: number
  ) {
    setActiveControlMode('joint');
    const updatedJoints = [...targetJoints];
    updatedJoints[index] = value;
    setTargetJoints(updatedJoints);
  }

  function moveRobotPose() {
    if (!targetPose || !referencePose) return;

    if (currentPose) {
      setPreviousPose(currentPose);
    }

    const nextPose = {
      ...targetPose,
      orientation: applyRelativeAxisAngleXYZRotation(
        referencePose.orientation,
        rx,
        ry,
        rz
      ),
    };

    syncJointTargetWithStateRef.current = true;
    setActiveControlMode('cartesian');
    publishMoveL(nextPose);

    setMessage(
      t('logger.cartesian_command_success', { rx, ry, rz })
    );
  }

  function isPoseInsideCartesianLimits(pose: Pose, reference: Pose) {
    return (
      Math.abs(pose.position.x - reference.position.x) <= CARTESIAN_LIMIT_M &&
      Math.abs(pose.position.y - reference.position.y) <= CARTESIAN_LIMIT_M &&
      Math.abs(pose.position.z - reference.position.z) <= CARTESIAN_LIMIT_M
    );
  }

  function moveRobotJoints() {
    if (targetJoints.length === 0 || !referencePose) return;

    setPreviousJoints(currentJoints);

    const fkPose = computeForwardKinematics(targetJoints);

    const poseFromFk = {
      position: fkPose.position,
      orientation: fkPose.orientation,
    };

    if (!isPoseInsideCartesianLimits(poseFromFk, referencePose)) {
      setTargetJoints(currentJoints);

      if (currentPose) {
        setTargetPose(currentPose);
      }

      setRx(0);
      setRy(0);
      setRz(0);

      setMessage(
        t('logger.cartesian_command_out_of_limits', { limit: CARTESIAN_LIMIT_M * 1000 })
      );

      return;
    }

    setTargetPose(poseFromFk);
    publishMoveL(poseFromFk);

    setMessage(t('logger.joint_command_converted'));
  }

  function returnToReferencePose() {
    if (!referencePose) return;

    setTargetPose(referencePose);

    publishMoveL(referencePose);

    setRx(0);
    setRy(0);
    setRz(0);

    setMessage(t('logger.returning_to_reference'));
  }

  function returnToReferenceJoints() {
    if (!referenceJoints || referenceJoints.length !== 6) return;

    const joints = [...referenceJoints];

    setTargetJoints(joints);

    const fk = computeForwardKinematics(joints);

    const poseFromJoints = {
      position: { ...fk.position },
      orientation: { ...fk.orientation },
    };

    setTargetPose(poseFromJoints);
    publishMoveL(poseFromJoints);

    setRx(0);
    setRy(0);
    setRz(0);

    setMessage(t('logger.returning_to_reference'));
  }

  function captureCurrentPoseAsReference() {
    if (!currentPose) return;
    if (!currentJoints || currentJoints.length !== 6) return;

    const poseRef = {
      position: { ...currentPose.position },
      orientation: { ...currentPose.orientation },
    };

    setReferencePose(poseRef);
    setTargetPose(poseRef);

    setReferenceJoints([...currentJoints]);
    setTargetJoints([...currentJoints]);

    setRx(0);
    setRy(0);
    setRz(0);

    setMessage(t('logger.reference_updated_from_current_pose'));
  }

  function captureCurrentJointsAsReference() {
    if (currentJoints.length === 0) return;

    setReferenceJoints([...currentJoints]);
    setTargetJoints([...currentJoints]);

    if (currentPose) {
      setReferencePose(currentPose);
      setTargetPose(currentPose);

      setRx(0);
      setRy(0);
      setRz(0);
    }

    setMessage(t('logger.reference_updated_from_current_pose'));
  }

  function moveRobotPoseDirect(
    updatedPose: Pose,
    newRx: number = rx,
    newRy: number = ry,
    newRz: number = rz
  ) {
    const baseReferencePose =
      referencePose ?? currentPose ?? updatedPose;

    const nextPose = {
      ...updatedPose,
      orientation: applyRelativeAxisAngleXYZRotation(
        baseReferencePose.orientation,
        newRx,
        newRy,
        newRz
      ),
    };

    setTargetPose(updatedPose);

    publishPoseCommand(nextPose);

    setMessage(t('logger.cartesian_command_direct'));
  }

  function moveRobotJointsDirect(joints: number[]) {
    if (joints.length === 0 || !referencePose) return;

    setPreviousJoints(currentJoints);

    const fkPose = computeForwardKinematics(joints);

    const poseFromFk = {
      position: fkPose.position,
      orientation: fkPose.orientation,
    };

    if (!isPoseInsideCartesianLimits(poseFromFk, referencePose)) {
      setMessage(
        t('logger.cartesian_command_out_of_limits', { limit: CARTESIAN_LIMIT_M * 1000 })
      );

      return;
    }

    setTargetJoints(joints);
    setTargetPose(poseFromFk);
    publishPoseCommand(poseFromFk);

    setMessage(t('logger.joint_command_direct'));
  }

  function moveToHome() {
    const fkPose = computeForwardKinematics(HOME_JOINTS);

    const homePose = {
      position: fkPose.position,
      orientation: fkPose.orientation,
    };

    setPreviousJoints(currentJoints);
    setTargetJoints(HOME_JOINTS);

    setTargetPose(homePose);

    setRx(0);
    setRy(0);
    setRz(0);

    publishMoveL(homePose);

    setMessage(t('logger.returning_to_home'));
  };

  return (
    <main className="app">
      <section className="card">
        <div className="title-container">
          <img src={uc3mLogo} alt="UC3M" className="title-logo" />
          <h1>GoFa React WebApp</h1>
          <img src={RoboticsLabLogo} alt="ROBOTICSLAB" className="title-logo" />
        </div>
        <div className="control-layout">
          <div className="control-column robot-column">
            <section className="controls robot-viewer-placeholder">
              <div className="robot-header">
                <h2>
                  {cameraActive ? t('header.camera_title') : t('header.visualizer_title')}
                </h2>
                <div className="robot-header-buttons">
                  <button
                    className={`tool-toggle ${toolOn ? "active" : ""}`}
                    onClick={() => handleToolSwitch(!toolOn)}
                  >
                    {toolOn ? "Tool ON" : "Tool OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraActive(!cameraActive)}
                    className="header-home-button"
                  >
                    {cameraActive ? t('header.visualizer_button') : t('header.camera_button')}
                  </button>
                  <button
                    type="button"
                    onClick={moveToHome}
                    className="header-home-button"
                  >
                    {t('header.home_button')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange(activeLanguage === 'en' ? 'es' : 'en')}
                  >
                    {activeLanguage.toUpperCase()}
                  </button>
                </div>
              </div>
              <div className="robot-viewer-box">
                {cameraActive ? (
                  <div className="camera-viewer">
                    <img
                      src="http://localhost:8080/stream?topic=/image_raw"
                      className="camera-stream"
                      alt="Webcam stream"
                    />
                    <div className="mini-robot-viewer">
                      <Canvas camera={{ position: [4, 2, 4], fov: 40 }}>
                        <ambientLight intensity={10} />
                        <directionalLight position={[0, 10, 0]} intensity={5} />
                        <GoFa3D joints={currentJoints} />
                        <GoFa3D joints={targetJoints} transparent />
                      </Canvas>
                    </div>
                  </div>
                ) : (
                  <Canvas camera={{ position: [4, 2, 4], fov: 40 }}>
                    <ambientLight intensity={10} />
                    <directionalLight position={[10, 10, 0.5]} intensity={5} /> {/*//como son cosas de blender, Y es el eje de altura */}
                    <GoFa3D joints={currentJoints} />
                    <GoFa3D joints={targetJoints} transparent />
                    <GizmoHelper alignment="bottom-left" margin={[70, 30]}>
                      <group rotation={[-Math.PI / 2, 0, 0]}>
                        <GizmoViewport
                          axisColors={["red", "green", "blue"]}
                          labelColor="white"
                          hideNegativeAxes
                        />
                      </group>
                    </GizmoHelper>
                  </Canvas>
                )}
                {!cameraActive && (
                  <div className="robot-status-message">
                    {message}
                  </div>
                )}
              </div>
              {currentPose && (
                <>
                  <div className="robot-status-grid">
                    <RobotStatePanel
                      title={t('header.current_pose')}
                      values={[
                        {
                          label: 'X',
                          value: currentPose.position.x * 1000,
                        },
                        {
                          label: 'Y',
                          value: currentPose.position.y * 1000,
                        },
                        {
                          label: 'Z',
                          value: currentPose.position.z * 1000,
                        },
                      ]}
                    />
                    <RobotStatePanel
                      title={t('header.current_joints')}
                      values={currentJoints.map((joint, index) => ({
                        label: `J${index + 1}`,
                        value: joint * 180 / Math.PI,
                      }))}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
          <div className="control-column slider-column">
            <div className="tabs">
              <button
                className={activePanel === 'cartesian' ? 'tab active' : 'tab'}
                onClick={() => setActivePanel('cartesian')}
              >
                {t('header.cartesian')}
              </button>
              <button
                className={activePanel === 'joint' ? 'tab active' : 'tab'}
                onClick={() => setActivePanel('joint')}
              >
                {t('header.joint')}
              </button>
              <button
                className={activePanel === "rws" ? "active" : ""}
                onClick={() => setActivePanel("rws")}
              >
                {t('header.rws')}
              </button>
            </div>
            {activePanel === 'cartesian' &&
              currentPose &&
              targetPose &&
              referencePose && (
                <CartesianControl
                  targetPose={targetPose}
                  currentPose={currentPose}
                  referencePose={referencePose}
                  rx={rx}
                  ry={ry}
                  rz={rz}
                  setRx={setRx}
                  setRy={setRy}
                  setRz={setRz}
                  updateTargetPosition={updateTargetPosition}
                  moveRobotPose={moveRobotPose}
                  captureCurrentPoseAsReference={captureCurrentPoseAsReference}
                  moveRobotPoseDirect={moveRobotPoseDirect}
                  returnToReferencePose={returnToReferencePose}
                />
              )}
            {activePanel === 'joint' && (
              <JointControl
                currentJoints={currentJoints}
                referenceJoints={referenceJoints}
                targetJoints={targetJoints}
                updateTargetJoint={updateTargetJoint}
                moveRobotJoints={moveRobotJoints}
                returnToReferenceJoints={returnToReferenceJoints}
                captureCurrentJointsAsReference={captureCurrentJointsAsReference}
                moveRobotJointsDirect={moveRobotJointsDirect}
                moveToHome={moveToHome}
              />
            )}
            {activePanel === "rws" && (
              <div className="rws-panel">
                <div className="rws-box">
                  <button onClick={() => handleRwsCommand(setManualMode)}>
                    {t('header.manual')}
                  </button>
                  <button onClick={() => handleRwsCommand(setAutoMode)}>
                    {t('header.auto')}
                  </button>
                </div>
                <div className="rws-box">
                  <button onClick={() => handleRwsCommand(motorsOn)}>
                    {t('header.motors_on')}
                  </button>
                  <button onClick={() => handleRwsCommand(motorsOff)}>
                    {t('header.motors_off')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
