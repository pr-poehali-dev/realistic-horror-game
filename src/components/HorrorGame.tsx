import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Icon from '@/components/ui/icon';

interface PlayerProps {
  flashlightOn: boolean;
  moveDirection: { x: number; y: number };
}

function Player({ flashlightOn, moveDirection }: PlayerProps) {
  const { camera } = useThree();
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const positionRef = useRef(new THREE.Vector3(0, 1.6, 10));

  useFrame((state, delta) => {
    const moveSpeed = 3 * delta;
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    positionRef.current.addScaledVector(forward, moveDirection.y * moveSpeed);
    positionRef.current.addScaledVector(right, moveDirection.x * moveSpeed);

    camera.position.copy(positionRef.current);

    if (spotLightRef.current) {
      spotLightRef.current.position.copy(camera.position);
      const target = camera.position.clone().add(forward.multiplyScalar(5));
      spotLightRef.current.target.position.copy(target);
      spotLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <spotLight
      ref={spotLightRef}
      intensity={flashlightOn ? 50 : 0}
      angle={0.4}
      penumbra={0.5}
      distance={15}
      color="#FFD700"
      castShadow
    />
  );
}

function Room() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      <mesh receiveShadow position={[0, 0, -15]}>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#0f0f1e" />
      </mesh>

      <mesh receiveShadow position={[0, 0, 15]}>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#0f0f1e" />
      </mesh>

      <mesh receiveShadow position={[-15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#0f0f1e" />
      </mesh>

      <mesh receiveShadow position={[15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#0f0f1e" />
      </mesh>

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 8;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius]}
          >
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial color="#2a2a3e" />
          </mesh>
        );
      })}

      <mesh castShadow receiveShadow position={[5, 1, -5]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#3a3a4e" />
      </mesh>

      <mesh castShadow receiveShadow position={[-6, 0.5, 6]}>
        <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
        <meshStandardMaterial color="#4a4a5e" />
      </mesh>
    </group>
  );
}

function SceneSetup() {
  const { gl, scene } = useThree();
  
  useEffect(() => {
    gl.setClearColor(new THREE.Color('#000000'));
    scene.background = new THREE.Color('#0a0a0f');
    scene.fog = new THREE.Fog('#000000', 3, 18);
  }, [gl, scene]);
  
  return null;
}

function VirtualJoystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging) {
      updatePosition(clientX, clientY);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 40;
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    setPosition({ x: dx, y: dy });
    onMove(dx / maxDistance, -dy / maxDistance);
  };

  return (
    <div
      ref={joystickRef}
      className="absolute left-8 bottom-8 w-32 h-32 bg-white/10 rounded-full border-4 border-white/20 backdrop-blur-sm"
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div
        className="absolute w-16 h-16 bg-white/30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        }}
      />
    </div>
  );
}

export default function HorrorGame() {
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = () => {
      if (window.screen.orientation) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    };
    handleOrientation();
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 10] }}
        gl={{ antialias: true }}
      >
        <SceneSetup />
        <ambientLight intensity={0.05} />
        <Player flashlightOn={flashlightOn} moveDirection={moveDirection} />
        <Room />
      </Canvas>

      <VirtualJoystick onMove={(x, y) => setMoveDirection({ x, y })} />

      <button
        onClick={() => setFlashlightOn(!flashlightOn)}
        className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-yellow-500/20 border-4 border-yellow-400/40 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-yellow-500/30 active:scale-95"
      >
        <Icon
          name={flashlightOn ? "Lightbulb" : "LightbulbOff"}
          size={32}
          className={flashlightOn ? "text-yellow-300" : "text-gray-400"}
        />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full">
        Джойстик для движения • Свайп для осмотра • Кнопка фонарика справа
      </div>

      <div className="absolute top-4 right-4 text-white/60 text-xs backdrop-blur-sm bg-black/30 px-3 py-1 rounded">
        FPS: 60
      </div>
    </div>
  );
}
