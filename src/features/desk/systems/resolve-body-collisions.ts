import { Not, type Entity, type World } from 'koota';
import {
  AngularVelocity,
  BoundingBox,
  Desk,
  Dragging,
  IsEnteringDesk,
  IsOpen,
  IsResting,
  IsStackable,
  KinematicBody,
  Position,
  Rotation,
  StackIndex,
  Velocity,
} from '../traits/index.js';
import { applyBounceSpin, getBounceSpinBias, invertSpinBias } from '../utils/barrier-bounce.js';
import { clamp, dot, perpendicular, scale, type Vector2 } from '../utils/math.js';
import { getOBBCollision, type OrientedBox } from '../utils/obb-collision.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';

type Body = OrientedBox & {
  entity: Entity;
  position: Vector2 & { z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { z: number };
  stackIndex: number;
  restingHeight: number;
  resting: boolean;
  stackable: boolean;
  inverseMass: number;
  positionDirty: boolean;
  velocityDirty: boolean;
  angularVelocityDirty: boolean;
};

const MIN_MASS = 0.001;
const RESTING_EPSILON_M = 0.001;
const POSITION_SLOP = cssPixelsToMeters(0.5);
const POSITION_CORRECTION = 0.9;
const PENETRATION_BIAS_SECONDS = 0.08;
const MAX_PENETRATION_BIAS_SPEED = cssPixelsToMeters(900);

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
      Not(Dragging),
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
        inverseMass: 1 / Math.max(body.mass, MIN_MASS),
        positionDirty: false,
        velocityDirty: false,
        angularVelocityDirty: false,
      });
    });

  for (let aIndex = 0; aIndex < bodies.length; aIndex++) {
    for (let bIndex = aIndex + 1; bIndex < bodies.length; bIndex++) {
      resolveBodyPair(bodies[aIndex], bodies[bIndex], desk.wallBounce, desk.wallFriction);
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

  world
    .query(Position, Velocity, AngularVelocity, Not(Dragging), Not(IsEnteringDesk), Not(IsOpen))
    .updateEach(([position, velocity, angularVelocity], entity) => {
      const next = resolved.get(entity);
      if (!next) return;

      entity.remove(IsResting);

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

  applyCollisionImpulse(a, b, collision.normal, collision.overlap, bounce, friction);
}

function shouldResolveCollision(a: Body, b: Body) {
  if (a.stackIndex === b.stackIndex) {
    return !a.stackable || !b.stackable || isActive(a) || isActive(b);
  }

  const upper = a.stackIndex > b.stackIndex ? a : b;
  const lower = upper === a ? b : a;
  return !lower.stackable;
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
  friction: number
) {
  const inverseMassSum = a.inverseMass + b.inverseMass;
  if (overlap <= 0 || inverseMassSum <= 0) return;

  const correction = (Math.max(overlap - POSITION_SLOP, 0) * POSITION_CORRECTION) / inverseMassSum;
  if (correction > 0) {
    a.position.x += normal.x * correction * a.inverseMass;
    a.position.y += normal.y * correction * a.inverseMass;
    b.position.x -= normal.x * correction * b.inverseMass;
    b.position.y -= normal.y * correction * b.inverseMass;
    a.positionDirty = true;
    b.positionDirty = true;
  }

  const velocityBeforeA = { x: a.velocity.x, y: a.velocity.y };
  const velocityBeforeB = { x: b.velocity.x, y: b.velocity.y };
  const relativeVelocity = {
    x: a.velocity.x - b.velocity.x,
    y: a.velocity.y - b.velocity.y,
  };
  const normalSpeed = dot(relativeVelocity, normal);
  const bounceSpeed = normalSpeed < 0 ? -normalSpeed * bounce : 0;
  const penetrationBias = Math.min(overlap / PENETRATION_BIAS_SECONDS, MAX_PENETRATION_BIAS_SPEED);
  const targetNormalSpeed = Math.max(bounceSpeed, penetrationBias);
  const normalImpulse = Math.max(targetNormalSpeed - normalSpeed, 0) / inverseMassSum;

  if (normalImpulse <= 0) return;

  applyImpulse(a, normal, normalImpulse * a.inverseMass);
  applyImpulse(b, normal, -normalImpulse * b.inverseMass);

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
  applyBounceSpin(
    a.angularVelocity,
    normal,
    velocityBeforeA,
    normalImpulse * a.inverseMass,
    spinBias
  );
  applyBounceSpin(
    b.angularVelocity,
    scale(normal, -1),
    velocityBeforeB,
    normalImpulse * b.inverseMass,
    invertSpinBias(spinBias)
  );
  a.velocityDirty = true;
  b.velocityDirty = true;
  a.angularVelocityDirty = true;
  b.angularVelocityDirty = true;
}

function applyImpulse(body: Body, normal: Vector2, speedDelta: number) {
  body.velocity.x += normal.x * speedDelta;
  body.velocity.y += normal.y * speedDelta;
}
