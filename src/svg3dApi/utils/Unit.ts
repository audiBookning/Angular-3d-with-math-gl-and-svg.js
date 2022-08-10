export interface IUnit {
  quantity: number;
  type: 'meter' | 'centimeter' | 'millimeter';
}

// INFO: default unit is meter.
export class Unit {
  private _quantity!: number;
  public get quantity(): IUnit {
    return {
      quantity: this._quantity,
      type: 'meter',
    };
  }
  public setQuantity(input: IUnit) {
    switch (input.type) {
      case 'meter':
        this._quantity = this.getMeter(input.quantity);
        break;
      case 'centimeter':
        this._quantity = this.getCentimeter(input.quantity);
        break;
      case 'millimeter':
        this._quantity = this.getMillimeter(input.quantity);
        break;
      default:
        throw new Error('Unknown unit type: ' + input.type);
    }
  }

  constructor(input: IUnit) {
    this.setQuantity(input);
  }

  // CONVERT TO METER.
  private getMeter(input: number) {
    return input;
  }

  private getCentimeter(input: number) {
    return input / 100;
  }

  private getMillimeter(input: number) {
    return input / 1000;
  }

  // OPERATIONS.s
  public add(input: IUnit) {
    switch (input.type) {
      case 'meter':
        this._quantity += input.quantity;
        break;
      case 'centimeter':
        this._quantity += this.getCentimeter(input.quantity);
        break;
      case 'millimeter':
        this._quantity += this.getMillimeter(input.quantity);
        break;
      default:
        throw new Error('Unknown unit type: ' + input.type);
    }
  }

  public subtract(input: IUnit) {
    switch (input.type) {
      case 'meter':
        this._quantity -= input.quantity;
        break;
      case 'centimeter':
        this._quantity -= this.getCentimeter(input.quantity);
        break;
      case 'millimeter':
        this._quantity -= this.getMillimeter(input.quantity);
        break;
      default:
        throw new Error('Unknown unit type: ' + input.type);
    }
  }

  public multiply(input: IUnit) {
    switch (input.type) {
      case 'meter':
        this._quantity *= input.quantity;
        break;
      case 'centimeter':
        this._quantity *= this.getCentimeter(input.quantity);
        break;
      case 'millimeter':
        this._quantity *= this.getMillimeter(input.quantity);
        break;
      default:
        throw new Error('Unknown unit type: ' + input.type);
    }
  }

  public divide(input: IUnit) {
    switch (input.type) {
      case 'meter':
        this._quantity /= input.quantity;
        break;
      case 'centimeter':
        this._quantity /= this.getCentimeter(input.quantity);
        break;
      case 'millimeter':
        this._quantity /= this.getMillimeter(input.quantity);
        break;
      default:
        throw new Error('Unknown unit type: ' + input.type);
    }
  }
}
