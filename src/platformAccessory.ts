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

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.name,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .on('get', this.getOn.bind(this)); // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    // this.service
    //   .getCharacteristic(this.platform.Characteristic.Brightness)
    //   .on('set', this.setBrightness.bind(this)); // SET - bind to the 'setBrightness` method below

    // EXAMPLE ONLY
    // Example showing how to update the state of a Characteristic asynchronously instead
    // of using the `on('get')` handlers.
    //
    // Here we change update the brightness to a random value every 5 seconds using
    // the `updateCharacteristic` method.
    // setInterval(() => {
    //   // assign the current brightness a random value between 0 and 100
    //   const currentBrightness = Math.floor(Math.random() * 100);

    //   // push the new value to HomeKit
    //   this.service.updateCharacteristic(
    //     this.platform.Characteristic.Brightness,
    //     currentBrightness,
    //   );

    //   this.platform.log.debug(
    //     'Pushed updated current Brightness state to HomeKit:',
    //     currentBrightness,
    //   );
    // }, 10000);
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

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   * 
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   * 
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getOn(callback: CharacteristicGetCallback) {
    // implement your own code to check if the device is on
    const isOn = this.doorStates.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, isOn);
  }
}
