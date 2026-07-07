import { facingFromTarget } from '/shared/aim.js';
import { findMonsterAt, isInRange, ATTACK_COOLDOWN_MS } from '/shared/combat.js';
import { getSkill, getSkillFxDuration, resolveProjectileImpact, canUseSkill } from '/shared/skills.js';
import { CONSUMABLE_KIND, canQuickUsePotion } from '/shared/consumables.js';
import { CAMERA_ZOOM_STEP } from '../../config.js';
import { MOVE_INTERVAL } from '../core/CoreInput.js';

export const AIM_INTERVAL = 50;

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handleAim(game, timestamp) {
  if (game.gamePaused) return;
  const mouse = game.input.getMouseScreen();
  if (!mouse || !game.displayPlayer) return;

  const world = game.camera.screenToWorld(mouse.screenX, mouse.screenY);
  game.aimTarget = world;
  game.cursorManager.update(
    world,
    game.worldState.monsters ?? [],
    game.pickableLoot(),
    game.worldState.map?.portals ?? [],
    game.worldState.npcs ?? []
  );

  const facing = facingFromTarget(game.displayPlayer.x, game.displayPlayer.y, world.x, world.y);
  if (facing) game.displayPlayer.facing = facing;

  if (timestamp - game.lastAimTime >= AIM_INTERVAL) {
    game.socketClient.sendAim({ x: world.x, y: world.y });
    game.lastAimTime = timestamp;
  }
}

/** @param {import('../../game/Game.js').Game} game */
export function handleZoom(game) {
  const steps = game.input.consumeZoomDelta();
  if (steps === 0) return;
  game.camera.adjustZoom(steps * CAMERA_ZOOM_STEP);
}

/** @param {import('../../game/Game.js').Game} game @param {number} timestamp */
export function handleAttackChase(game, timestamp) {
  if (!game.attackTargetId || !game.displayPlayer || !game.worldState) return;

  const target = (game.worldState.monsters ?? []).find((m) => m.id === game.attackTargetId);
  if (!target || target.hp <= 0) {
    game.attackTargetId = null;
    return;
  }

  const px = game.displayPlayer.x;
  const py = game.displayPlayer.y;

  if (isInRange(px, py, target.x, target.y)) {
    game.pathFollower.clear();
    if (timestamp - game.lastAttackTime >= ATTACK_COOLDOWN_MS) {
      game.socketClient.sendAttack(target.id);
      game.lastAttackTime = timestamp;
    }
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    game.pathFollower.setPath(game.worldState.map, px, py, target.x, target.y);
    game.lastChasePathTime = timestamp;
  }
}

/** @param {import('../../game/Game.js').Game} game */
export function handlePotionHotkeys(game) {
  if (game.gamePaused || game.isDead || !game.worldState?.player) return;

  const kind = game.input.consumePotionHotkey();
  if (!kind) return;

  const consumableKind = kind === 'health' ? CONSUMABLE_KIND.HEALTH : CONSUMABLE_KIND.MANA;
  const check = canQuickUsePotion(game.worldState.player, consumableKind);
  if (!check.ok) return;

  game.socketClient.sendUseConsumable(check.index);
}

/** @param {import('../../game/Game.js').Game} game */
export function handleSkills(game) {
  if (game.gamePaused) return;
  const slot = game.input.consumeSkillSlot();
  if (slot === null || !game.worldState?.player || !game.displayPlayer) return;

  const skill = game.worldState.player.skillBar?.[slot];
  if (!skill) return;

  const serverPlayer = game.worldState.player;
  const check = canUseSkill(serverPlayer, skill.id);
  if (!check.ok) return;

  const px = serverPlayer.x;
  const py = serverPlayer.y;
  const aim = game.aimTarget ?? {
    x: serverPlayer.aimX ?? px + 1,
    y: serverPlayer.aimY ?? py,
  };
  const skillDef = getSkill(skill.id);
  if (!skillDef) return;

  let shot;
  if (skillDef.type === 'projectile') {
    shot = resolveProjectileImpact(
      game.worldState.monsters ?? [],
      px,
      py,
      aim.x,
      aim.y,
      skillDef.range ?? 200,
      skillDef.radius ?? 24
    );
  } else {
    const target = findMonsterAt(game.worldState.monsters ?? [], aim.x, aim.y);
    shot = {
      impactX: aim.x,
      impactY: aim.y,
      missed: !target,
      monster: target,
    };
  }

  game.fxBuffer.addSkillFx({
    skillId: skill.id,
    x: px,
    y: py,
    impactX: shot.impactX,
    impactY: shot.impactY,
    missed: shot.missed,
    durationMs: getSkillFxDuration(skillDef, px, py, shot.impactX, shot.impactY),
  });

  game.socketClient.sendUseSkill({
    skillId: skill.id,
    targetX: aim.x,
    targetY: aim.y,
    targetId: shot.monster?.id,
  });
}
