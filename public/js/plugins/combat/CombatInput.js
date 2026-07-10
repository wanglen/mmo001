import { facingFromTarget } from '/shared/aim.js';
import { findMonsterAt, isInRange, ATTACK_COOLDOWN_MS } from '/shared/combat.js';
import {
  getSkill,
  getSkillFxDuration,
  resolveProjectileImpact,
  canUseSkill,
  clampToSkillRange,
} from '/shared/skills.js';
import { getSummonCastRange } from '/shared/summons.js';
import { CONSUMABLE_KIND, canQuickUsePotion } from '/shared/consumables.js';
import { CAMERA_ZOOM_STEP } from '../../config.js';
import { MOVE_INTERVAL } from '../core/CoreInput.js';
import { trySetPath, logClientGameEvent } from '../../debug/clientEventLog.js';

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
    game.worldState.npcs ?? [],
    game.worldState.map,
    game.worldState.player?.openedChests ?? []
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
    if (game.attackTargetId) {
      logClientGameEvent('attack_target_lost', {
        targetId: game.attackTargetId,
        reason: target ? 'dead' : 'missing',
      });
    }
    game.attackTargetId = null;
    return;
  }

  const origin = game.worldState.player ?? game.displayPlayer;
  if (!origin) return;

  const px = origin.x;
  const py = origin.y;

  if (isInRange(px, py, target.x, target.y)) {
    game.pathFollower.clear();
    if (timestamp - game.lastAttackTime >= ATTACK_COOLDOWN_MS) {
      game.socketClient.sendAttack(target.id);
      game.audio.playSfx('swing', { minIntervalMs: 120 });
      game.lastAttackTime = timestamp;
    }
    return;
  }

  if (timestamp - game.lastChasePathTime >= MOVE_INTERVAL) {
    trySetPath(game, game.worldState.map, px, py, target.x, target.y, 'attack_chase');
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

  const monsters = game.worldState.monsters ?? [];
  const shot = buildSkillShot(skillDef, px, py, aim, monsters, serverPlayer.level ?? 1);

  game.fxBuffer.addSkillFx({
    skillId: skill.id,
    x: px,
    y: py,
    targetX: shot.targetX ?? shot.impactX,
    targetY: shot.targetY ?? shot.impactY,
    impactX: shot.impactX,
    impactY: shot.impactY,
    missed: shot.missed,
    durationMs: getSkillFxDuration(skillDef, px, py, shot.impactX, shot.impactY),
  });

  game.gameParticles.onLocalSkill(shot.impactX, shot.impactY, skill.id);

  game.socketClient.sendUseSkill({
    skillId: skill.id,
    targetX: aim.x,
    targetY: aim.y,
    targetId: shot.monster?.id,
  });
  game.audio.playSfx('skill', { minIntervalMs: 100 });

  if (!serverPlayer.skillCooldowns) serverPlayer.skillCooldowns = {};
  serverPlayer.skillCooldowns[skill.id] = skillDef.cooldownMs;
}

/**
 * Client-side skill impact point for VFX preview (mirrors server aim clamping).
 * @param {import('/shared/plugins/combat/skills.js').SkillDef} skillDef
 */
function buildSkillShot(skillDef, px, py, aim, monsters, level = 1) {
  if (skillDef.type === 'summon') {
    const clamped = clampToSkillRange(px, py, aim.x, aim.y, getSummonCastRange(level));
    return {
      impactX: clamped.x,
      impactY: clamped.y,
      targetX: clamped.x,
      targetY: clamped.y,
      missed: false,
    };
  }

  if (skillDef.type === 'projectile') {
    return resolveProjectileImpact(
      monsters,
      px,
      py,
      aim.x,
      aim.y,
      skillDef.range ?? 200,
      skillDef.radius ?? 24
    );
  }

  if (skillDef.type === 'ground_aoe') {
    const clamped = clampToSkillRange(px, py, aim.x, aim.y, skillDef.range ?? 200);
    return {
      impactX: clamped.x,
      impactY: clamped.y,
      targetX: clamped.x,
      targetY: clamped.y,
      missed: false,
    };
  }

  if (skillDef.type === 'melee_aoe' || skillDef.type === 'dash') {
    if (skillDef.aoeShape === 'spin' || skillDef.aoeShape === 'self_pulse') {
      return {
        impactX: px,
        impactY: py,
        targetX: px,
        targetY: py,
        missed: false,
      };
    }

    const maxR = skillDef.range ?? skillDef.dashDistance ?? 96;
    const clamped = clampToSkillRange(px, py, aim.x, aim.y, maxR);
    return {
      impactX: clamped.x,
      impactY: clamped.y,
      targetX: clamped.x,
      targetY: clamped.y,
      missed: false,
    };
  }

  const target = findMonsterAt(monsters, aim.x, aim.y);
  const impactX = target?.x ?? aim.x;
  const impactY = target?.y ?? aim.y;
  return {
    impactX,
    impactY,
    targetX: impactX,
    targetY: impactY,
    missed: !target,
    monster: target,
  };
}
