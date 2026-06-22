import { AxisSlider } from './AxisSlider';
import { useTranslation } from 'react-i18next';
import type { Pose } from '../services/rosApi';

const metersToMm = (meters: number) => meters * 1000;
const mmToMeters = (mm: number) => mm / 1000;

type CartesianControlProps = {
  targetPose: Pose;
  currentPose: Pose;
  referencePose: Pose;
  rx: number;
  ry: number;
  rz: number;
  setRx: (value: number) => void;
  setRy: (value: number) => void;
  setRz: (value: number) => void;
  updateTargetPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  moveRobotPose: () => void;
  captureCurrentPoseAsReference: () => void;
  moveRobotPoseDirect: (pose: Pose, rx?: number, ry?: number, rz?: number) => void;
  returnToReferencePose: () => void;
};

export function CartesianControl({
  targetPose,
  currentPose,
  referencePose,
  rx,
  ry,
  rz,
  setRx,
  setRy,
  setRz,
  updateTargetPosition,
  moveRobotPose,
  captureCurrentPoseAsReference,
  moveRobotPoseDirect,
  returnToReferencePose,
}: CartesianControlProps) {
  const { t } = useTranslation();

  if (!targetPose || !referencePose) {
    return <p>{t('cartesian_control.awaiting_pose')}</p>;
  }

  return (
    <section className="controls">
      <h2>{t('cartesian_control.translation_title')}</h2>

      <AxisSlider
        label={t('cartesian_control.x_label')}
        value={metersToMm(targetPose.position.x)}
        current={metersToMm(currentPose.position.x)}
        reference={metersToMm(referencePose.position.x)}
        min={metersToMm(referencePose.position.x) - 200}
        max={metersToMm(referencePose.position.x) + 200}
        step={5}
        showReference={true}
        onChange={(value) => updateTargetPosition('x', mmToMeters(value))}
        onStepMove={(newValue) => {
          const updatedPose = {
            ...targetPose,
            position: {
              ...targetPose.position,
              x: newValue / 1000,
            },
          };
          updateTargetPosition('x', newValue / 1000);
          moveRobotPoseDirect(updatedPose);
        }}
      />

      <AxisSlider
        label={t('cartesian_control.y_label')}
        value={metersToMm(targetPose.position.y)}
        current={metersToMm(currentPose.position.y)}
        reference={metersToMm(referencePose.position.y)}
        min={metersToMm(referencePose.position.y) - 200}
        max={metersToMm(referencePose.position.y) + 200}
        step={5}
        showReference={true}
        onChange={(value) => updateTargetPosition('y', mmToMeters(value))}
        onStepMove={(newValue) => {
          const updatedPose = {
            ...targetPose,
            position: {
              ...targetPose.position,
              y: newValue / 1000,
            },
          };
          updateTargetPosition('y', newValue / 1000);
          moveRobotPoseDirect(updatedPose);
        }}
      />

      <AxisSlider
        label={t('cartesian_control.z_label')}
        value={metersToMm(targetPose.position.z)}
        current={metersToMm(currentPose.position.z)}
        reference={metersToMm(referencePose.position.z)}
        min={metersToMm(referencePose.position.z) - 200}
        max={metersToMm(referencePose.position.z) + 200}
        step={5}
        showReference={true}
        onChange={(value) => updateTargetPosition('z', mmToMeters(value))}
        onStepMove={(newValue) => {
          const updatedPose = {
            ...targetPose,
            position: {
              ...targetPose.position,
              z: newValue / 1000,
            },
          };
          updateTargetPosition('z', newValue / 1000);
          moveRobotPoseDirect(updatedPose);
        }}
      />

      <h2>{t('cartesian_control.orientation_title')}</h2>

      <AxisSlider
        label={t('cartesian_control.rx_label')}
        value={rx}
        // current={currentRx}
        reference={0}
        min={-10}
        max={10}
        step={1}
        showReference={false}
        //showCurrent={true}
        onChange={setRx}
        onStepMove={(newValue) => {
          setRx(newValue);
          moveRobotPoseDirect(targetPose, newValue, ry, rz);
        }}
      />

      <AxisSlider
        label={t('cartesian_control.ry_label')}
        value={ry}
        //current={currentRy}
        reference={0}
        min={-10}
        max={10}
        step={1}
        showReference={false}
        //showCurrent={true}
        onChange={setRy}
        onStepMove={(newValue) => {
          setRy(newValue);
          moveRobotPoseDirect(targetPose, newValue, rx, rz);
        }}
      />

      <AxisSlider
        label={t('cartesian_control.rz_label')}
        value={rz}
        //current={currentRz}
        reference={0}
        min={-10}
        max={10}
        step={1}
        showReference={false}
        //showCurrent={true}
        onChange={setRz}
        onStepMove={(newValue) => {
          setRz(newValue);
          moveRobotPoseDirect(targetPose, newValue, rx, ry);
        }}
      />

      <button onClick={moveRobotPose}>{t('cartesian_control.send_button')}</button>
      <button onClick={returnToReferencePose}>{t('cartesian_control.return_button')}</button>
      <button onClick={captureCurrentPoseAsReference}>{t('cartesian_control.update_reference')}</button>
    </section>
  );
}
