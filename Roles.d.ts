import UnitRole from './UnitRole';
/** Types built to attack: to take cities and destroy units. */
export declare class AttackRole extends UnitRole {}
/** Types built to defend: to hold cities and squares. */
export declare class DefendRole extends UnitRole {}
/** Naval types built to control the sea: to fight other ships. */
export declare class NavalSuperiorityRole extends UnitRole {}
/** Air types built to control the air: to fight other aircraft. */
export declare class AirSuperiorityRole extends UnitRole {}
/** Types built to carry other units. */
export declare class TransportRole extends UnitRole {}
/** Types built to found cities and to work the land. */
export declare class SettleRole extends UnitRole {}
/** Types built for diplomacy and espionage. */
export declare class DiplomacyRole extends UnitRole {}
/** Types built to trade: to set up trade routes and help build wonders. */
export declare class TradeRole extends UnitRole {}
/**
 * All eight, in a stable order a game's rules may number them by (0 to 7). The order never changes: a new role would
 *  go at the end.
 */
export declare const roles: readonly [
  typeof AttackRole,
  typeof DefendRole,
  typeof NavalSuperiorityRole,
  typeof AirSuperiorityRole,
  typeof TransportRole,
  typeof SettleRole,
  typeof DiplomacyRole,
  typeof TradeRole
];
