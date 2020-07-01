import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from 'homebridge';
import { Gpio } from 'onoff';

import { DoorPlatform } from './platform';

export interface AccessoryConfig {
  name: string;
  gpioA: number;
  gpioB: number;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class DoorAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private doorStates = {
    On: false,
  };

  private config: AccessoryConfig;
  private readonly relayA: Gpio;
  private readonly relayB: Gpio;

  constructor(
    private readonly platform: DoorPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.config = accessory.context.device as AccessoryConfig;
    this.relayA = new Gpio(this.config.gpioA, 'out');
    this.relayB = new Gpio(this.config.gpioB, 'out');

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Default-Manufacturer',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        'Default-Serial',
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.name,
    );

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .on('get', this.getOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    // implement your own code to turn your device on/off
    this.doorStates.On = value as boolean;

    this.platform.log.debug('Set Characteristic On ->', value);

    this.relayA.writeSync(1);

    setTimeout(() => {
      this.relayA.writeSync(0);
    }, 300);

    setTimeout(() => {
      this.relayB.writeSync(1);
    }, 500);

    setTimeout(() => {
      this.relayB.writeSync(0);
    }, 800);

    setTimeout(() => {
      this.doorStates.On = false;
      this.service.updateCharacteristic(
        this.platform.Characteristic.On,
        this.doorStates.On,
      );
    }, 1000);

    // you must call the callback function
    callback(null);
  }

  getOn(callback: CharacteristicGetCallback) {
    const isOn = this.doorStates.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    callback(null, isOn);
  }
}
