import UnitRole from './UnitRole';

// The eight roles. Each name says what a type is for, not what it can do: a defensive type may still attack. The
//  names end in `Role` so none reads as a yield (`Attack`, `Defence`) or an advance (`Trade`).

/** Types built to attack: to take cities and destroy units. */
export class AttackRole extends UnitRole {}

/** Types built to defend: to hold cities and squares. */
export class DefendRole extends UnitRole {}

/** Naval types built to control the sea: to fight other ships. */
export class NavalSuperiorityRole extends UnitRole {}

/** Air types built to control the air: to fight other aircraft. */
export class AirSuperiorityRole extends UnitRole {}

/** Types built to carry other units. */
export class TransportRole extends UnitRole {}

/** Types built to found cities and to work the land. */
export class SettleRole extends UnitRole {}

/** Types built for diplomacy and espionage. */
export class DiplomacyRole extends UnitRole {}

/** Types built to trade: to set up trade routes and help build wonders. */
export class TradeRole extends UnitRole {}

/**
 * All eight, in a stable order a game's rules may number them by (0 to 7). The order never changes: a new role would
 *  go at the end.
 */
export const roles = Object.freeze([
  AttackRole,
  DefendRole,
  NavalSuperiorityRole,
  AirSuperiorityRole,
  TransportRole,
  SettleRole,
  DiplomacyRole,
  TradeRole,
] as const);
