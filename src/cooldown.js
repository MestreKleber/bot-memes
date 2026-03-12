const cooldowns = new Map();

function isOnCooldown(userId, command, seconds) {
  const key = `${userId}:${command}`;
  const last = cooldowns.get(key);
  if (!last) return false;
  return (Date.now() - last) < seconds * 1000;
}

function setCooldown(userId, command) {
  cooldowns.set(`${userId}:${command}`, Date.now());
}

function getRemainingTime(userId, command, seconds) {
  const key = `${userId}:${command}`;
  const last = cooldowns.get(key);
  if (!last) return 0;
  return Math.ceil(seconds - (Date.now() - last) / 1000);
}

module.exports = { isOnCooldown, setCooldown, getRemainingTime };
