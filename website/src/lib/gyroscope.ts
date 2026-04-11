/**
 * gyroscope.ts — Device orientation for parallax star field
 *
 * Wraps the DeviceOrientationEvent API with:
 *   - iOS permission request (DeviceOrientationEvent.requestPermission)
 *   - Low-pass filter (lerp 0.04) for buttery smooth values
 *   - Normalized output suitable for driving camera rotation
 *
 * Usage:
 *   const gyro = createGyroscope((state) => {
 *     camera.rotation.x = state.beta * 0.01;
 *     camera.rotation.y = state.gamma * 0.01;
 *   });
 *   await gyro.start();
 *   // later:
 *   gyro.stop();
 */

export interface GyroState {
  /** Z-axis rotation, 0-360 (compass heading) */
  alpha: number;
  /** X-axis tilt, -180 to 180 (front-back) */
  beta: number;
  /** Y-axis tilt, -90 to 90 (left-right) */
  gamma: number;
  /** Whether gyroscope data is being received */
  enabled: boolean;
}

const LERP_FACTOR = 0.04;

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function createGyroscope(onUpdate: (state: GyroState) => void): {
  start: () => Promise<boolean>;
  stop: () => void;
} {
  const state: GyroState = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    enabled: false,
  };

  let listening = false;

  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;

    state.alpha = lerp(state.alpha, e.alpha, LERP_FACTOR);
    state.beta = lerp(state.beta, e.beta, LERP_FACTOR);
    state.gamma = lerp(state.gamma, e.gamma, LERP_FACTOR);
    state.enabled = true;

    onUpdate(state);
  };

  const start = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("DeviceOrientationEvent" in window)) return false;
    if (listening) return true;

    // iOS 13+ requires explicit permission request
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DOE.requestPermission === "function") {
      try {
        const permission = await DOE.requestPermission();
        if (permission !== "granted") return false;
      } catch {
        return false;
      }
    }

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    listening = true;
    return true;
  };

  const stop = () => {
    if (!listening) return;
    window.removeEventListener("deviceorientation", handleOrientation);
    listening = false;
    state.enabled = false;
  };

  return { start, stop };
}
