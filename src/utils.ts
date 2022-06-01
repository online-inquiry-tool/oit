// SPDX-License-Identifier: BSD-2-Clause
// Copyright (c) 2022, Jari Hämäläinen, Carita Kiili and Julie Coiro
import {Parser} from 'htmlparser2';
import {Handler} from 'htmlparser2/lib/Parser';
import {
  Argument,
  getDefaultArgument,
  getDefaultPerspective,
  IdStore,
  Model,
  Perspective,
  stringToReliability,
} from './model';

export function isHtmlTextareaElement(o: any): o is HTMLTextAreaElement {
  return !!o && typeof o === 'object' && o.tagName === 'TEXTAREA';
}

interface ParserTagData {
  name: string;
  attribs: Record<string, string>;
  implied: boolean;
}
interface TagProps {
  clazz: string[];
  data: Record<string, string>;
}
type HtmlStackEntry = ParserTagData & TagProps;

class OitHtmlParserContext implements Partial<Handler> {
  private p: Perspective | null = null;
  private af: Argument | null = null; // for
  private aa: Argument | null = null; // against
  private readText = false;
  private text = '';
  private stack: HtmlStackEntry[] = [];

  constructor(
    private readonly data: Model,
    private readonly idStore?: IdStore,
  ) {}

  onopentag(
    name: string,
    attribs: {
      [s: string]: string;
    },
    implied: boolean,
  ) {
    const current: HtmlStackEntry = {
      ...OitHtmlParserContext.getClassesAndData(attribs),
      name,
      attribs,
      implied,
    };
    this.stack.push(current);

    if (current.clazz.includes('oit-claim')) {
      this.data.claim = current.data.text || '';
    }
    if (current.clazz.includes('oit-conclusion')) {
      this.data.conclusion = current.data.text || '';
    }
    if (current.clazz.includes('oit-perspective')) {
      this.p = getDefaultPerspective(this.idStore, true);
    }
    if (current.clazz.includes('oit-perspective-name') && this.p) {
      this.p.name = current.data.text || '';
    }
    if (current.clazz.includes('oit-perspective-questions') && this.p) {
      this.p.questions = current.data.text || '';
    }
    if (current.clazz.includes('oit-perspective-synthesis') && this.p) {
      this.p.synthesis = current.data.text || '';
    }
    if (
      current.clazz.includes('oit-argument') &&
      !current.clazz.includes('oit-empty')
    ) {
      if (current.clazz.includes('oit-argument-for')) {
        this.af = getDefaultArgument(this.idStore);
      }
      if (current.clazz.includes('oit-argument-against')) {
        this.aa = getDefaultArgument(this.idStore);
      }
    }
    if (current.clazz.includes('oit-argument-for-argument') && this.af) {
      this.af.argument = current.data.text || '';
    }
    if (current.clazz.includes('oit-argument-against-argument') && this.aa) {
      this.aa.argument = current.data.text || '';
    }
    if (current.clazz.includes('oit-argument-for-source') && this.af) {
      this.af.source = current.data.text || '';
    }
    if (current.clazz.includes('oit-argument-against-source') && this.aa) {
      this.aa.source = current.data.text || '';
    }
    if (current.clazz.includes('oit-argument-for-justification') && this.af) {
      this.af.justification = current.data.text || '';
    }
    if (
      current.clazz.includes('oit-argument-against-justification') &&
      this.aa
    ) {
      this.aa.justification = current.data.text || '';
    }

    if (current.clazz.includes('oit-text')) {
      this.readText = true;
      this.text = '';
    }
  }

  onclosetag(name: string, isImplied: boolean) {
    const current = this.stack.pop();
    if (!current) return;

    if (current.clazz.includes('oit-perspective')) {
      if (this.p) {
        this.data.perspectives.push(this.p);
      }
      this.p = null;
    }
    if (current.clazz.includes('oit-argument')) {
      if (current.clazz.includes('oit-argument-for')) {
        if (this.p && this.af) this.p.argumentsFor.push(this.af);
        this.af = null;
      }
      if (current.clazz.includes('oit-argument-against')) {
        if (this.p && this.aa) this.p.argumentsAgainst.push(this.aa);
        this.aa = null;
      }
    }

    if (current.clazz.includes('oit-argument-for-reliability') && this.af) {
      this.af.reliability = stringToReliability(this.text.trim());
    }
    if (current.clazz.includes('oit-argument-against-reliability') && this.aa) {
      this.aa.reliability = stringToReliability(this.text.trim());
    }

    if (current.clazz.includes('oit-text')) this.readText = false;
  }

  ontext(text: string) {
    if (this.readText) this.text += text;
  }

  static getClassesAndData(attribs: Record<string, string>): TagProps {
    const p: TagProps = {
      clazz:
        attribs && typeof attribs.class === 'string'
          ? attribs.class
              .split(/\s+/)
              .map((c) => c.trim())
              .filter((c) => !!c)
          : [],
      data: attribs
        ? Object.fromEntries(
            Object.entries(attribs)
              .filter(([k, v]) => k.startsWith('data-'))
              .map(([k, v]) => [k.replace(/^data-/, ''), v]),
          )
        : {},
    };
    return p;
  }
}

export function parseHtmlAsModel(source: string, idStore?: IdStore): Model {
  const data: Model = {
    claim: '',
    perspectives: [],
    conclusion: '',
  };

  const parser = new Parser(new OitHtmlParserContext(data, idStore));
  parser.write(source);
  parser.end();
  console.log('parsed:', data);

  return data;
}
