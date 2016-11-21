const {expect} = require('chai');
const {Namespace, DataElement, Concept, Group, Value, CodeFromValueSetValue, RefValue, OrValues, QuantifiedValue, PrimitiveIdentifier, Identifier} = require('../lib/models');

function commonTests(expectedFn, exportFn) {
  return () => {
    it('should correctly export a simple entry', () => {
      const ns = new Namespace('shr.test');
      addSimpleElement(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('Simple');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a simple entry in a different namespace', () => {
      const otherNS = new Namespace('shr.other.test');
      addSimpleElement(otherNS);
      const actual = exportFn(otherNS);
      const expected = expectedFn('ForeignSimple');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a coded entry', () => {
      const ns = new Namespace('shr.test');
      addCodedElement(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('Coded');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a reference entry', () => {
      const ns = new Namespace('shr.test');
      addSimpleReference(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('SimpleReference');
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with an element value', () => {
      // NOTE: This is an entry where the value is not a primitive, e.g. "Value: SomeOtherDataElement"
      const ns = new Namespace('shr.test');
      addElementValue(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('ElementValue');
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with an element value in a different namespace', () => {
      // NOTE: This is an entry where the value is not a primitive, e.g. "Value: SomeOtherDataElement"
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addForeignElementValue(ns, otherNS);
      const actual = exportFn(ns, otherNS);
      const expected = expectedFn('ForeignElementValue');
      expect(actual).to.eql(expected);
    });

    it('should correctly export an entry with two-deep element value', () => {
      // NOTE: This is an entry where the value is a non-primitive, that itself has a value that is a non-primitive
      const ns = new Namespace('shr.test');
      addTwoDeepElementValue(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('TwoDeepElementValue');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a choice', () => {
      const ns = new Namespace('shr.test');
      addChoice(ns);
      const actual = exportFn(ns);
      const expected = expectedFn('Choice');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a group', () => {
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addGroup(ns, otherNS);
      const actual = exportFn(ns, otherNS);
      const expected = expectedFn('Group');
      expect(actual).to.eql(expected);
    });

    it('should correctly export a group with name clashes', () => {
      const ns = new Namespace('shr.test');
      const otherNS = new Namespace('shr.other.test');
      addGroupPathClash(ns, otherNS);
      const actual = exportFn(ns, otherNS);
      const expected = expectedFn('GroupPathClash');
      expect(actual).to.eql(expected);
    });
  };
}

function addGroup(ns, otherNS, addSubElements=true) {
  let gr = new Group(new Identifier(ns.namespace, 'Group'), true);
  gr.description = 'It is a group of elements';
  gr.addConcept(new Concept('http://foo.org', 'bar'));
  gr.addConcept(new Concept('http://boo.org', 'far'));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Simple')), 1, 1));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Coded')), 0, 1));
  let or = new OrValues();
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.other.test', 'Simple')), 1, 1));
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'ForeignElementValue')), 1));
  gr.addElement(new QuantifiedValue(or, 0, 2));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'ElementValue')), 0));
  ns.addDefinition(gr);
  if (addSubElements) {
    addSimpleElement(ns);
    addCodedElement(ns);
    addSimpleElement(otherNS);
    addForeignElementValue(ns, otherNS);
    addElementValue(ns);
  }
  return gr;
}

function addGroupPathClash(ns, nsOther, addSubElements=true) {
  let gr = new Group(new Identifier(ns.namespace, 'GroupPathClash'), true);
  gr.description = 'It is a group of elements with clashing names';
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.test', 'Simple')), 1, 1));
  gr.addElement(new QuantifiedValue(new Value(new Identifier('shr.other.test', 'Simple')), 0, 1));
  ns.addDefinition(gr);
  if (addSubElements) {
    addSimpleElement(ns);
    addSimpleElement(nsOther);
  }
  return gr;
}

function addSimpleElement(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'Simple'), true);
  de.description = 'It is a simple element';
  de.addConcept(new Concept('http://foo.org', 'bar'));
  de.value = new Value(new PrimitiveIdentifier('string'));
  ns.addDefinition(de);
  return de;
}

function addCodedElement(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'Coded'), true);
  de.description = 'It is a coded element';
  de.value = new CodeFromValueSetValue('http://standardhealthrecord.org/test/vs/Coded');
  ns.addDefinition(de);
  return de;
}

function addSimpleReference(ns) {
  let de = new DataElement(new Identifier(ns.namespace, 'SimpleReference'), true);
  de.description = 'It is a reference to a simple element';
  de.value = new RefValue(new Identifier(ns.namespace, 'Simple'));
  ns.addDefinition(de);
  return de;
}

function addTwoDeepElementValue(ns, addSubElement=true) {
  let de = new DataElement(new Identifier(ns.namespace, 'TwoDeepElementValue'), true);
  de.description = 'It is an element with a two-deep element value';
  de.value = new Value(new Identifier(ns.namespace, 'ElementValue'));
  ns.addDefinition(de);
  if (addSubElement) {
    addElementValue(ns, true);
  }
  return de;
}

function addElementValue(ns, addSubElement=true) {
  let de = new DataElement(new Identifier(ns.namespace, 'ElementValue'), true);
  de.description = 'It is an element with an element value';
  de.value = new Value(new Identifier(ns.namespace, 'Simple'));
  ns.addDefinition(de);
  if (addSubElement) {
    addSimpleElement(ns);
  }
  return de;
}

function addForeignElementValue(ns, otherNS) {
  let de = new DataElement(new Identifier(ns.namespace, 'ForeignElementValue'), true);
  de.description = 'It is an element with a foreign element value';
  de.value = new Value(new Identifier(otherNS.namespace, 'Simple'));
  ns.addDefinition(de);
  addSimpleElement(otherNS);
  return de;
}

function addChoice(ns, addSubElements=true) {
  let ch = new DataElement(new Identifier(ns.namespace, 'Choice'), true);
  ch.description = 'It is an element with a choice';
  let or = new OrValues();
  or.addValue(new Value(new PrimitiveIdentifier('string')));
  or.addValue(new QuantifiedValue(new CodeFromValueSetValue('http://standardhealthrecord.org/test/vs/CodeChoice'), 0));
  or.addValue(new QuantifiedValue(new Value(new Identifier('shr.test', 'Coded')), 1, 1));
  ch.value = or;
  ns.addDefinition(ch);
  if (addSubElements) {
    addCodedElement(ns);
  }
  return ch;
}

module.exports = {commonTests};