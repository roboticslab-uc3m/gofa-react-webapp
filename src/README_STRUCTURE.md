# Estructura del proyecto

## App.tsx
Coordina el estado global de la aplicación y conecta los componentes principales.

## services/rosApi.ts
Gestiona la comunicación entre React y ROS 2 mediante rosbridge.

## components/CartesianControl.tsx
Contiene la interfaz de control cartesiano del robot.

## components/JointControl.tsx
Contiene la interfaz de control articular del robot.

## components/RobotStatePanel.tsx
Muestra valores del estado real del robot y referencias.

## components/AxisSlider.tsx
Slider reutilizable con referencia, objetivo y trayectoria.

## Flujo general

React genera objetivos de movimiento a partir de sliders.
rosApi.ts publica esos objetivos en topics ROS.
abb_egm_driver traduce los mensajes ROS a EGM.
El controlador ABB ejecuta el movimiento.
El estado real vuelve por /state/pose y /state/joint.
