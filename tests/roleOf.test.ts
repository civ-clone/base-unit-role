import {
  AirSuperiorityRole,
  AttackRole,
  DefendRole,
  DiplomacyRole,
  NavalSuperiorityRole,
  SettleRole,
  TradeRole,
  TransportRole,
  roles,
} from '../Roles';
import { RoleType, UnitRole, isRoleType } from '../UnitRole';
import {
  UnitRoleConflictError,
  UnitRoleCycleError,
  hasRole,
  roleCriterion,
  roleOf,
} from '../roleOf';
import { UnitRoles, unitRole } from '../Rules/UnitRoles';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Rule from '@civ-clone/core-rule/Rule';
import RuleRegistry, {
  DuplicateRuleIdError,
  instance as defaultRuleRegistry,
} from '@civ-clone/core-rule/RuleRegistry';
import RuleSet from '@civ-clone/core-rule/RuleSet';
import RuleSetRegistry from '@civ-clone/core-rule/RuleSetRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class Land extends Unit {}
class Naval extends Unit {}
class Air extends Unit {}
class Spearman extends Land {}
class Swordman extends Land {}
class Settlers extends Land {}
class Diplomat extends Land {}
class Caravan extends Land {}
class Galleon extends Naval {}
class Destroyer extends Naval {}
class Fighter extends Air {}

// A unit, without the world a real one needs: only its class matters here.
const unitOf = <T extends Unit>(UnitType: new (...args: any[]) => T): T =>
  Object.create(UnitType.prototype);

const prefix = 'test:unit/role';

const declarations = (): UnitRoles[] => [
  unitRole(prefix, Spearman, DefendRole),
  unitRole(prefix, Swordman, AttackRole),
  unitRole(prefix, Settlers, SettleRole),
  unitRole(prefix, Diplomat, DiplomacyRole),
  unitRole(prefix, Caravan, TradeRole),
  unitRole(prefix, Galleon, TransportRole),
  unitRole(prefix, Destroyer, NavalSuperiorityRole),
  unitRole(prefix, Fighter, AirSuperiorityRole),
];

describe('unit roles', (): void => {
  describe('the roles', (): void => {
    it('should be eight distinct role classes, in index order', (): void => {
      expect(roles).to.have.length(8);
      expect(new Set(roles).size).to.equal(8);
      expect(roles[0]).to.equal(AttackRole);
      expect(roles[1]).to.equal(DefendRole);
      expect(roles[4]).to.equal(TransportRole);
      expect(roles[7]).to.equal(TradeRole);
      roles.forEach((Role: RoleType): void => {
        expect(Object.getPrototypeOf(Role)).to.equal(UnitRole);
        expect(isRoleType(Role)).to.be.true;
      });
      expect(isRoleType(UnitRole)).to.be.true;
      expect(isRoleType(Spearman)).to.be.false;
      expect(isRoleType(null)).to.be.false;
      expect(Object.isFrozen(roles)).to.be.true;
    });
  });

  describe('declaring', (): void => {
    it('should make one rule per type, with an id of prefix and class', (): void => {
      const rule = unitRole(prefix, Spearman, DefendRole);

      expect(rule).to.be.instanceOf(UnitRoles);
      expect(rule.id()).to.equal('test:unit/role/Spearman');
    });

    it('should apply to the class and its subclasses, and nothing else', (): void => {
      const rule = unitRole(prefix, Land, DefendRole);

      expect(rule.validate(Land)).to.be.true;
      expect(rule.validate(Spearman)).to.be.true;
      expect(rule.validate(Galleon)).to.be.false;
      expect(rule.validate(Unit)).to.be.false;
    });
  });

  describe('querying', (): void => {
    const ruleRegistry = new RuleRegistry();

    ruleRegistry.register(...declarations());

    it('should answer for a class', (): void => {
      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
      expect(roleOf(Galleon, ruleRegistry)).to.equal(TransportRole);
      expect(roleOf(Fighter, ruleRegistry)).to.equal(AirSuperiorityRole);
      expect(hasRole(Settlers, SettleRole, ruleRegistry)).to.be.true;
      expect(hasRole(Settlers, DefendRole, ruleRegistry)).to.be.false;
    });

    it('should answer for an instance, from the registry given', (): void => {
      expect(roleOf(unitOf(Diplomat), ruleRegistry)).to.equal(DiplomacyRole);
      expect(hasRole(unitOf(Caravan), TradeRole, ruleRegistry)).to.be.true;
      expect(hasRole(unitOf(Caravan), DiplomacyRole, ruleRegistry)).to.be.false;
    });

    it('should give no role to an undeclared type, and cache that too', (): void => {
      expect(roleOf(Land, ruleRegistry)).to.be.null;
      expect(roleOf(Unit, ruleRegistry)).to.be.null;
      expect(hasRole(Land, UnitRole, ruleRegistry)).to.be.false;
      expect(roleOf(Land, ruleRegistry)).to.be.null;
    });

    it('should match a subclass of the role asked for', (): void => {
      class CoastalDefendRole extends DefendRole {}
      class Pikeman extends Land {}

      const local = new RuleRegistry();

      local.register(unitRole(prefix, Pikeman, CoastalDefendRole));

      expect(roleOf(Pikeman, local)).to.equal(CoastalDefendRole);
      expect(hasRole(Pikeman, CoastalDefendRole, local)).to.be.true;
      expect(hasRole(Pikeman, DefendRole, local)).to.be.true;
      expect(hasRole(Pikeman, UnitRole, local)).to.be.true;
      expect(hasRole(Pikeman, AttackRole, local)).to.be.false;
    });

    it('should give a role declared on a parent class to its subclasses', (): void => {
      const local = new RuleRegistry();

      local.register(unitRole(prefix, Naval, NavalSuperiorityRole));

      expect(roleOf(Galleon, local)).to.equal(NavalSuperiorityRole);
      expect(roleOf(Destroyer, local)).to.equal(NavalSuperiorityRole);
      expect(roleOf(Spearman, local)).to.be.null;
    });

    it('should provide a criterion', (): void => {
      const criterion = roleCriterion(DefendRole, ruleRegistry);

      expect(criterion).to.be.instanceOf(Criterion);
      expect(criterion.validate(unitOf(Spearman))).to.be.true;
      expect(criterion.validate(unitOf(Swordman))).to.be.false;
    });
  });

  describe('mistakes', (): void => {
    it('should accept the same role declared twice, on a parent and a leaf', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(
        unitRole('a', Land, DefendRole),
        unitRole('b', Spearman, DefendRole)
      );

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
    });

    it('should refuse two different roles for one type, naming both rules', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(
        unitRole('a', Land, DefendRole),
        unitRole('b', Swordman, AttackRole)
      );

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
      expect((): RoleType | null => roleOf(Swordman, ruleRegistry)).to.throw(
        UnitRoleConflictError,
        /Swordman has two roles: DefendRole \(a\/Land\) and AttackRole \(b\/Swordman\)/
      );
      // And again: a conflict is never cached as an answer.
      expect((): RoleType | null => roleOf(Swordman, ruleRegistry)).to.throw(
        UnitRoleConflictError
      );
    });

    it('should refuse two classes of one name under one prefix, as a duplicate rule id', (): void => {
      const ruleRegistry = new RuleRegistry(),
        [First, Second] = [0, 1].map(() => class extends Land {});

      expect((): void =>
        ruleRegistry.register(
          unitRole(prefix, First, DefendRole),
          unitRole(prefix, Second, AttackRole)
        )
      ).to.throw(DuplicateRuleIdError);
    });

    it('should ignore an effect that is not a role class', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(
        new UnitRoles(new Effect((): any => Spearman)),
        unitRole(prefix, Spearman, DefendRole)
      );

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
    });

    it('should throw, not recurse, when a declaration asks for the role of its own class', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(
        new UnitRoles(
          new Criterion((UnitType: typeof Unit): boolean =>
            hasRole(UnitType, DefendRole, ruleRegistry)
          ),
          new Effect((): RoleType => AttackRole)
        )
      );

      expect((): RoleType | null => roleOf(Spearman, ruleRegistry)).to.throw(
        UnitRoleCycleError
      );
      // And again, not a cached half-answer.
      expect((): RoleType | null => roleOf(Spearman, ruleRegistry)).to.throw(
        UnitRoleCycleError
      );
    });
  });

  describe('the cache', (): void => {
    it('should ask the rules once per class, until they change', (): void => {
      const ruleRegistry = new RuleRegistry();
      let asked = 0;

      ruleRegistry.register(
        new UnitRoles(
          'test:counted',
          new Criterion((UnitType: typeof Unit): boolean => {
            asked++;

            return UnitType === Spearman;
          }),
          new Effect((): RoleType => DefendRole)
        )
      );

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
      expect(hasRole(unitOf(Spearman), DefendRole, ruleRegistry)).to.be.true;
      expect(roleOf(Swordman, ruleRegistry)).to.be.null;
      expect(roleOf(Swordman, ruleRegistry)).to.be.null;
      expect(asked).to.equal(2);

      ruleRegistry.register(unitRole(prefix, Settlers, SettleRole));

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
      expect(asked).to.equal(3);
    });

    it('should see a role rule registered after a query', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(unitRole(prefix, Settlers, SettleRole));

      expect(roleOf(Diplomat, ruleRegistry)).to.be.null;

      ruleRegistry.register(unitRole(prefix, Diplomat, DiplomacyRole));

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);
      expect(roleOf(Settlers, ruleRegistry)).to.equal(SettleRole);
    });

    it('should forget a role rule unregistered or replaced', (): void => {
      const ruleRegistry = new RuleRegistry(),
        rule = unitRole(prefix, Diplomat, DiplomacyRole);

      ruleRegistry.register(rule);

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);

      ruleRegistry.unregister(rule);

      expect(roleOf(Diplomat, ruleRegistry)).to.be.null;

      ruleRegistry.register(rule);
      ruleRegistry.replace(
        'test:unit/role/Diplomat',
        unitRole(prefix, Diplomat, TradeRole)
      );

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(TradeRole);
    });

    it('should follow a role rule switched off and on, by the registry or by the rule', (): void => {
      const ruleRegistry = new RuleRegistry(),
        rule = unitRole(prefix, Diplomat, DiplomacyRole);

      ruleRegistry.register(rule);

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);

      ruleRegistry.disableById('test:unit/role/Diplomat');

      expect(roleOf(Diplomat, ruleRegistry)).to.be.null;

      rule.enable();

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);

      rule.disable();

      expect(roleOf(Diplomat, ruleRegistry)).to.be.null;

      ruleRegistry.enableById('test:unit/role/Diplomat');

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);
    });

    it('should follow a rule set that supersedes a role', (): void => {
      const ruleRegistry = new RuleRegistry(),
        sets = new RuleSetRegistry(ruleRegistry);

      ruleRegistry.register(...declarations());
      ruleRegistry.register(unitRole('variant:unit/role', Diplomat, TradeRole));

      sets.register(
        new RuleSet(
          'variant',
          { supersedes: ['test:unit/role/Diplomat'] },
          'variant:unit/role/Diplomat'
        )
      );

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(TradeRole);

      sets.set('variant', false);

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(DiplomacyRole);

      sets.set('variant', true);

      expect(roleOf(Diplomat, ruleRegistry)).to.equal(TradeRole);
    });

    it('should keep its answers when an unrelated rule changes', (): void => {
      class Other extends Rule<[], void> {}

      const ruleRegistry = new RuleRegistry(),
        other = new Other('test:other');

      ruleRegistry.register(...declarations(), other);

      // `get` hands back the same array while no `UnitRoles` rule changes: that is what the cache keys on.
      const before = ruleRegistry.get(UnitRoles);

      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);

      other.disable();
      ruleRegistry.register(new Other());

      expect(ruleRegistry.get(UnitRoles)).to.equal(before);
      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);

      ruleRegistry.disableById('test:unit/role/Settlers');

      expect(ruleRegistry.get(UnitRoles)).to.not.equal(before);
      expect(roleOf(Settlers, ruleRegistry)).to.be.null;
      expect(roleOf(Spearman, ruleRegistry)).to.equal(DefendRole);
    });

    it('should keep two registries apart', (): void => {
      const one = new RuleRegistry(),
        two = new RuleRegistry();

      one.register(unitRole('one', Diplomat, DiplomacyRole));
      two.register(unitRole('two', Diplomat, TradeRole));

      expect(roleOf(Diplomat, one)).to.equal(DiplomacyRole);
      expect(roleOf(Diplomat, two)).to.equal(TradeRole);
      expect(roleOf(unitOf(Diplomat), one)).to.equal(DiplomacyRole);
      expect(roleOf(Spearman, two)).to.be.null;
    });
  });

  describe('the package', (): void => {
    it('should be a library that registers nothing', (): void => {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      );

      ['main', 'module', 'exports', 'bin'].forEach((field: string): void => {
        expect(packageJson).not.to.have.property(field);
      });
      expect(existsSync(join(process.cwd(), 'index.ts'))).to.be.false;
      expect(existsSync(join(process.cwd(), 'index.js'))).to.be.false;

      const before = defaultRuleRegistry.entries(),
        paths = [
          '../UnitRole',
          '../Roles',
          '../Rules/UnitRoles',
          '../roleOf',
        ].map((module: string): string => require.resolve(module));

      // Load every module afresh, as a plugin loader importing them would.
      paths.forEach((path: string): void => {
        delete require.cache[path];
      });
      paths.forEach((path: string): void => {
        require(path);
      });

      expect(defaultRuleRegistry.entries()).to.have.ordered.members(before);
    });
  });
});
