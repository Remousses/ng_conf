import { Creneau } from './generic/Creneau.model';
import { Conference } from './generic/Conference.model';
import { Thematique } from './generic/Thematique.model';

export class CfConf extends Conference {
  public theme: Thematique; // Array ?

  deserialize(input: any): this {
    Object.assign(this, input);

    this.theme = new Thematique().deserialize(input.theme);

    return this;
  }
}

export class CfCreneau extends Creneau {
  public conferences: Array<CfConf>;

  deserialize(input: any): this {
    Object.assign(this, input);

    this.conferences = input.conferences.map(conf => new CfConf().deserialize(conf));

    return this;
  }
}
