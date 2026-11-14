"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roles = exports.TradeRole = exports.DiplomacyRole = exports.SettleRole = exports.TransportRole = exports.AirSuperiorityRole = exports.NavalSuperiorityRole = exports.DefendRole = exports.AttackRole = void 0;
const UnitRole_1 = require("./UnitRole");
// The eight roles. Each name says what a type is for, not what it can do: a defensive type may still attack. The
//  names end in `Role` so none reads as a yield (`Attack`, `Defence`) or an advance (`Trade`).
/** Types built to attack: to take cities and destroy units. */
class AttackRole extends UnitRole_1.default {
}
exports.AttackRole = AttackRole;
/** Types built to defend: to hold cities and squares. */
class DefendRole extends UnitRole_1.default {
}
exports.DefendRole = DefendRole;
/** Naval types built to control the sea: to fight other ships. */
class NavalSuperiorityRole extends UnitRole_1.default {
}
exports.NavalSuperiorityRole = NavalSuperiorityRole;
/** Air types built to control the air: to fight other aircraft. */
class AirSuperiorityRole extends UnitRole_1.default {
}
exports.AirSuperiorityRole = AirSuperiorityRole;
/** Types built to carry other units. */
class TransportRole extends UnitRole_1.default {
}
exports.TransportRole = TransportRole;
/** Types built to found cities and to work the land. */
class SettleRole extends UnitRole_1.default {
}
exports.SettleRole = SettleRole;
/** Types built for diplomacy and espionage. */
class DiplomacyRole extends UnitRole_1.default {
}
exports.DiplomacyRole = DiplomacyRole;
/** Types built to trade: to set up trade routes and help build wonders. */
class TradeRole extends UnitRole_1.default {
}
exports.TradeRole = TradeRole;
/**
 * All eight, in a stable order a game's rules may number them by (0 to 7). The order never changes: a new role would
 *  go at the end.
 */
exports.roles = Object.freeze([
    AttackRole,
    DefendRole,
    NavalSuperiorityRole,
    AirSuperiorityRole,
    TransportRole,
    SettleRole,
    DiplomacyRole,
    TradeRole,
]);
//# sourceMappingURL=Roles.js.map