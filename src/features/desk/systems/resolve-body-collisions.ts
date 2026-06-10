import { Not, type Entity, type World } from 'koota';
import {
  AngularVelocity,
  BoundingBox,
  Desk,
  IsBoundary,
  IsControlled,
  IsDroppedFromDragging,
  IsEnteringDesk,
  IsOpen,
  IsResting,
  IsStackable,
  KinematicBody,
  PolaroidFocusMotion,
  Position,
  Rotation,
  StackIndex,
  Velocity,
} from '../traits/index.js';
import { applyBounceSpin, getBounceSpinBias, invertSpinBias } from '../utils/barrier-bounce.js';
import { clamp, dot, perpendicular, scale, type Vector2 } from '../utils/math.js';
import { getOBBCollision, type OrientedBox } from '../utils/obb-collision.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

type SpinBias = 1 | -1;

type Body = OrientedBox & {
  entity: Entity;
  position: Vector2 & { z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { z: number };
  stackIndex: number;
  restingHeight: number;
  resting: boolean;
  stackable: boolean;
  boundary: boolean;
  droppedFromDragging: boolean;
  activeDropCollision: boolean;
  inverseMass: number;
  positionDirty: boolean;
  velocityDirty: boolean;
  angularVelocityDirty: boolean;
};

const MIN_MASS = 0.001;
const RESTING_EPSILON_M = 0.001;
const POSITION_SLOP = 0;
const POSITION_CORRECTION = 1;
const DROP_POSITION_SLOP = cssPixelsToMeters(0.5);
const DROP_POSITION_CORRECTION = 0.18;
const MAX_DROP_POSITION_CORRECTION = cssPixelsToMeters(14);
const PENETRATION_BIAS_SECONDS = 0.08;
const MAX_PENETRATION_BIAS_SPEED = cssPixelsToMeters(900);
const DROP_PENETRATION_BIAS_SECONDS = 0.045;
const MAX_DROP_PENETRATION_BIAS_SPEED = cssPixelsToMeters(1300);

type CollisionResponse = {
  positionSlop: number;
  positionCorrection: number;
  maxPositionCorrection: number;
  penetrationBiasSeconds: number;
  maxPenetrationBiasSpeed: number;
};

const DEFAULT_COLLISION_RESPONSE: CollisionResponse = {
  positionSlop: POSITION_SLOP,
  positionCorrection: POSITION_CORRECTION,
  maxPositionCorrection: Number.POSITIVE_INFINITY,
  penetrationBiasSeconds: PENETRATION_BIAS_SECONDS,
  maxPenetrationBiasSpeed: MAX_PENETRATION_BIAS_SPEED,
};

const DROP_COLLISION_RESPONSE: CollisionResponse = {
  positionSlop: DROP_POSITION_SLOP,
  positionCorrection: DROP_POSITION_CORRECTION,
  maxPositionCorrection: MAX_DROP_POSITION_CORRECTION,
  penetrationBiasSeconds: DROP_PENETRATION_BIAS_SECONDS,
  maxPenetrationBiasSpeed: MAX_DROP_PENETRATION_BIAS_SPEED,
};

export function resolveBodyCollisions(world: World) {
  const desk = world.queryFirst(Desk)?.get(Desk);
  if (!desk) return;

  const bodies: Body[] = [];

  world
    .query(
      Position,
      Rotation,
      Velocity,
      AngularVelocity,
      BoundingBox,
      StackIndex,
      KinematicBody,
      Not(IsControlled),
      Not(IsEnteringDesk),
      Not(IsOpen)
    )
    .readEach(([position, rotation, velocity, angularVelocity, box, stackIndex, body], entity) => {
      if (box.width <= 0 || box.height <= 0) return;

      bodies.push({
        entity,
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { z: rotation.z },
        velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
        angularVelocity: { z: angularVelocity.z },
        box: { width: cssPixelsToMeters(box.width), height: cssPixelsToMeters(box.height) },
        stackIndex: stackIndex.value,
        restingHeight: 0,
        resting: entity.has(IsResting),
        stackable: entity.has(IsStackable),
        boundary: entity.has(IsBoundary),
        droppedFromDragging: entity.has(IsDroppedFromDragging),
        activeDropCollision: false,
        inverseMass: getInverseMass(body.mass),
        positionDirty: false,
        velocityDirty: false,
        angularVelocityDirty: false,
      });
    });

  // Polaroids closing from focus keep IsControlled while the close spring
  // drives them, so the query above skips them. Once they descend into the
  // desk plane (past the restack threshold) they become collidable again; a
  // hit interrupts the close and hands them back to physics below.
  world
    .query(
      Position,
      Rotation,
      Velocity,
      AngularVelocity,
      BoundingBox,
      StackIndex,
      KinematicBody,
      PolaroidFocusMotion,
      Not(IsEnteringDesk),
      Not(IsOpen)
    )
    .readEach(
      ([position, rotation, velocity, angularVelocity, box, stackIndex, body, motion], entity) => {
        if (motion.phase !== 'closing') return;
        if (!entity.has(IsControlled)) return;
        if (desk.restackThreshold <= 0 || position.z > desk.restackThreshold) return;
        if (box.width <= 0 || box.height <= 0) return;

        bodies.push({
          entity,
          position: { x: position.x, y: position.y, z: position.z },
          rotation: { z: rotation.z },
          velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
          angularVelocity: { z: angularVelocity.z },
          box: { width: cssPixelsToMeters(box.width), height: cssPixelsToMeters(box.height) },
          stackIndex: stackIndex.value,
          restingHeight: 0,
          resting: false,
          stackable: entity.has(IsStackable),
          boundary: entity.has(IsBoundary),
          droppedFromDragging: false,
          activeDropCollision: false,
          inverseMass: getInverseMass(body.mass),
          positionDirty: false,
          velocityDirty: false,
          angularVelocityDirty: false,
        });
      }
    );

  for (let aIndex = 0; aIndex < bodies.length; aIndex++) {
    for (let bIndex = aIndex + 1; bIndex < bodies.length; bIndex++) {
      resolveBodyPair(bodies[aIndex], bodies[bIndex], desk.wallBounce, desk.wallFriction);
    }
  }

  for (const body of bodies) {
    if (body.droppedFromDragging && !body.activeDropCollision) {
      body.entity.remove(IsDroppedFromDragging);
    }
  }

  const resolved = new Map<
    Entity,
    {
      position: { x: number; y: number; z: number };
      velocity: { x: number; y: number; z: number };
      angularVelocity: { z: number };
      positionDirty: boolean;
      velocityDirty: boolean;
      angularVelocityDirty: boolean;
    }
  >();
  for (const body of bodies) {
    if (!body.positionDirty && !body.velocityDirty && !body.angularVelocityDirty) continue;
    resolved.set(body.entity, {
      position: body.position,
      velocity: body.velocity,
      angularVelocity: body.angularVelocity,
      positionDirty: body.positionDirty,
      velocityDirty: body.velocityDirty,
      angularVelocityDirty: body.angularVelocityDirty,
    });
  }

  if (resolved.size === 0) return;

  // A collision interrupts a focus close: release the spring and control so
  // the write-back below applies the impulse and physics takes over.
  for (const entity of resolved.keys()) {
    if (entity.get(PolaroidFocusMotion)?.phase !== 'closing') continue;
    entity.remove(PolaroidFocusMotion, IsControlled);
  }

  world
    .query(Position, Velocity, AngularVelocity, Not(IsControlled), Not(IsEnteringDesk), Not(IsOpen))
    .updateEach(([position, velocity, angularVelocity], entity) => {
      const next = resolved.get(entity);
      if (!next) return;

      if (next.positionDirty || next.velocityDirty || next.angularVelocityDirty) {
        entity.remove(IsResting);
      }

      if (next.positionDirty) {
        position.x = next.position.x;
        position.y = next.position.y;
        position.z = next.position.z;
      }

      if (next.velocityDirty) {
        velocity.x = next.velocity.x;
        velocity.y = next.velocity.y;
        velocity.z = next.velocity.z;
      }

      if (next.angularVelocityDirty) {
        angularVelocity.z = next.angularVelocity.z;
      }
    });
}

function resolveBodyPair(a: Body, b: Body, bounce: number, friction: number) {
  if (a.resting && b.resting) return;

  const collision = getOBBCollision(a, b);
  if (!collision) return;

  if (!shouldResolveCollision(a, b)) {
    return;
  }

  const dropBody = getDroppedSolidCollisionBody(a, b);
  const response = dropBody ? DROP_COLLISION_RESPONSE : DEFAULT_COLLISION_RESPONSE;
  if (dropBody) {
    dropBody.activeDropCollision = true;
  }

  applyCollisionImpulse(a, b, collision.normal, collision.overlap, bounce, friction, response);
}

function getInverseMass(mass: number) {
  if (mass === Number.POSITIVE_INFINITY) return 0;
  return 1 / Math.max(mass, MIN_MASS);
}

function shouldResolveCollision(a: Body, b: Body) {
  if (a.boundary || b.boundary) return true;

  if (a.stackIndex === b.stackIndex) {
    return !a.stackable || !b.stackable || isActive(a) || isActive(b);
  }

  const upper = a.stackIndex > b.stackIndex ? a : b;
  const lower = upper === a ? b : a;
  return !lower.stackable;
}

function getDroppedSolidCollisionBody(a: Body, b: Body) {
  if (a.droppedFromDragging && isSolidDropTarget(b)) return a;
  if (b.droppedFromDragging && isSolidDropTarget(a)) return b;

  return undefined;
}

function isSolidDropTarget(body: Body) {
  return body.boundary || !body.stackable;
}

function isActive(body: Body) {
  return body.position.z > body.restingHeight + RESTING_EPSILON_M;
}

function applyCollisionImpulse(
  a: Body,
  b: Body,
  normal: Vector2,
  overlap: number,
  bounce: number,
  friction: number,
  response: CollisionResponse
) {
  const inverseMassSum = a.inverseMass + b.inverseMass;
  if (overlap <= 0 || inverseMassSum <= 0) return;

  const correctionDistance = Math.min(
    Math.max(overlap - response.positionSlop, 0) * response.positionCorrection,
    response.maxPositionCorrection
  );
  const correction = correctionDistance / inverseMassSum;
  if (correction > 0) {
    applyPositionCorrection(
      a,
      normal.x * correction * a.inverseMass,
      normal.y * correction * a.inverseMass
    );
    applyPositionCorrection(
      b,
      -normal.x * correction * b.inverseMass,
      -normal.y * correction * b.inverseMass
    );
  }

  const velocityBeforeA = { x: a.velocity.x, y: a.velocity.y };
  const velocityBeforeB = { x: b.velocity.x, y: b.velocity.y };
  const relativeVelocity = {
    x: a.velocity.x - b.velocity.x,
    y: a.velocity.y - b.velocity.y,
  };
  const normalSpeed = dot(relativeVelocity, normal);
  const bounceSpeed = normalSpeed < 0 ? -normalSpeed * bounce : 0;
  const penetrationBias = Math.min(
    overlap / response.penetrationBiasSeconds,
    response.maxPenetrationBiasSpeed
  );
  const targetNormalSpeed = Math.max(bounceSpeed, penetrationBias);
  const normalImpulse = Math.max(targetNormalSpeed - normalSpeed, 0) / inverseMassSum;

  if (normalImpulse <= 0) return;

  const normalImpulseA = normalImpulse * a.inverseMass;
  const normalImpulseB = -normalImpulse * b.inverseMass;
  applyImpulse(a, normal, normalImpulseA);
  applyImpulse(b, normal, normalImpulseB);

  const tangent = perpendicular(normal);
  const nextRelativeVelocity = {
    x: a.velocity.x - b.velocity.x,
    y: a.velocity.y - b.velocity.y,
  };
  const tangentSpeed = dot(nextRelativeVelocity, tangent);
  const frictionImpulse = clamp(
    (-tangentSpeed * (1 - friction)) / inverseMassSum,
    -normalImpulse * (1 - friction),
    normalImpulse * (1 - friction)
  );

  if (frictionImpulse !== 0) {
    applyImpulse(a, tangent, frictionImpulse * a.inverseMass);
    applyImpulse(b, tangent, -frictionImpulse * b.inverseMass);
  }

  const spinBias = getBounceSpinBias(normal);
  applySpinImpulse(a, normal, velocityBeforeA, normalImpulseA, spinBias);
  applySpinImpulse(b, scale(normal, -1), velocityBeforeB, -normalImpulseB, invertSpinBias(spinBias));
}

function applyPositionCorrection(body: Body, dx: number, dy: number) {
  if (dx === 0 && dy === 0) return;

  body.position.x += dx;
  body.position.y += dy;
  body.positionDirty = true;
}

function applyImpulse(body: Body, normal: Vector2, speedDelta: number) {
  if (speedDelta === 0) return;

  body.velocity.x += normal.x * speedDelta;
  body.velocity.y += normal.y * speedDelta;
  body.velocityDirty = true;
}

function applySpinImpulse(
  body: Body,
  normal: Vector2,
  velocityBefore: Vector2,
  normalImpulse: number,
  spinBias: SpinBias
) {
  if (normalImpulse === 0) return;

  applyBounceSpin(body.angularVelocity, normal, velocityBefore, normalImpulse, spinBias);
  body.angularVelocityDirty = true;
}
