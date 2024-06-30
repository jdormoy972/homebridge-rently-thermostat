const axios = require('axios');

module.exports = (api) => {
    api.registerAccessory('Thermostat', Thermostat);
};

class Thermostat {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;

        this.thermostatService = new this.Service.Thermostat(this.config.name);

        this.thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature)
            .onGet(this.handleCurrentTemperatureGet.bind(this));

        this.thermostatService.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
            .onGet(this.handleCurrentHeatingCoolingState.bind(this));

        this.thermostatService.getCharacteristic(this.Characteristic.CoolingThresholdTemperature)
            .onGet(this.handleCoolingThresholdTemperatureGet.bind(this))
            .onSet(this.handleCoolingThresholdTemperatureSet.bind(this));

        this.thermostatService.getCharacteristic(this.Characteristic.HeatingThresholdTemperature)
            .onGet(this.handleHeatingThresholdTemperatureGet.bind(this))
            .onSet(this.handleHeatingThresholdTemperatureSet.bind(this));

        this.thermostatService.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
            .onGet(this.handleTargetHeatingCoolingStateGet.bind(this))
            .onSet(this.handleTargetHeatingCoolingStateSet.bind(this));

        this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature)
            .onGet(this.handleTargetTemperatureGet.bind(this))
            .onSet(this.handleTargetTemperatureSet.bind(this));
    }

    getServices() {
        return [this.thermostatService];
    }

    async login() {
        const { email, password } = this.config;
        const response = await axios.post('https://remotapp.rently.com/oauth/token', {
            email: email,
            password: password
        });
        this.token = response.data.access_token;
    }

    async handleCurrentTemperatureGet() {
        const response = await this.getStatus();
        return (response.roomTemp - 32) * 5 / 9
    }
    async handleCoolingThresholdTemperatureGet() {
        const response = await this.getStatus();
        return (response.coolingSetpoint - 32) * 5 / 9
    }
    async handleHeatingThresholdTemperatureGet() {
        const response = await this.getStatus();
        return (response.heatingSetpoint - 32) * 5 / 9
    }
    async handleTargetHeatingCoolingStateGet() {
        const response = await this.getStatus();
        const mode = response.currentMode
        switch (mode) {
            case 'off':
                return this.Characteristic.TargetHeatingCoolingState.OFF;
            case 'heat':
                return this.Characteristic.TargetHeatingCoolingState.HEAT;
            case 'cool':
                return this.Characteristic.TargetHeatingCoolingState.COOL;
            case 'auto':
                return this.Characteristic.TargetHeatingCoolingState.AUTO;
            default:
                throw new Error('Invalid mode');
        }
    }

    async handleTargetTemperatureGet() {
        const mode = await this.handleTargetHeatingCoolingStateGet();

        switch (mode) {
            case this.Characteristic.CurrentHeatingCoolingState.HEAT:
                return this.handleHeatingThresholdTemperatureGet();
            case this.Characteristic.CurrentHeatingCoolingState.COOL:
                return this.handleCoolingThresholdTemperatureGet();
            default:
                const heatingSetpointCelsius = await this.handleHeatingThresholdTemperatureGet();
                const coolingSetpointCelsius = await this.handleCoolingThresholdTemperatureGet();
                return (heatingSetpointCelsius + coolingSetpointCelsius) / 2;
        }
    }

    async handleTargetTemperatureSet(value) {
        value = Math.round(value * 9 / 5 + 32);
        const mode = await this.handleTargetHeatingCoolingStateGet();

        this.log('Setting target temperature to', value, '°f in mode', mode)

        let payload;
        switch (mode) {
            case this.Characteristic.CurrentHeatingCoolingState.COOL:
                payload = {
                    commands: {
                        mode: 'cool',
                        cooling_setpoint: value
                    }
                };
                break;
            case this.Characteristic.CurrentHeatingCoolingState.HEAT:
                payload = {
                    commands: {
                        mode: 'heat',
                        heating_setpoint: value
                    }
                };
                break;
            case this.Characteristic.CurrentHeatingCoolingState.AUTO:
                payload = {
                    commands: {
                        mode: 'auto',
                        heating_setpoint: 60,
                        cooling_setpoint: 80
                    }
                };
                break;
        }

        await axios.put('https://app2.keyless.rocks/api/devices/thermostat-device-id', payload, {
            headers: { authorization: `${this.token}` }
        });
    }

    async handleHeatingThresholdTemperatureSet(value) {
        value = Math.round(value * 9 / 5 + 32);
        const mode = await this.handleTargetHeatingCoolingStateGet();

        this.log('Setting target temperature to', value, '°f in mode', mode)

        const payload = {
            commands: {
                mode: 'auto',
                heating_setpoint: value
            }
        };
        await axios.put('https://app2.keyless.rocks/api/devices/thermostat-device-id', payload, {
            headers: { authorization: `${this.token}` }
        });
    }

    async handleCoolingThresholdTemperatureSet(value) {
        value = Math.round(value * 9 / 5 + 32);
        const mode = await this.handleTargetHeatingCoolingStateGet();

        this.log('Setting target temperature to', value, '°f in mode', mode)

        const payload = {
            commands: {
                mode: 'auto',
                cooling_setpoint: value
            }
        };
        await axios.put('https://app2.keyless.rocks/api/devices/thermostat-device-id', payload, {
            headers: { authorization: `${this.token}` }
        });
    }

    async handleTargetHeatingCoolingStateSet(value) {
        let mode;
        switch (value) {
            case this.Characteristic.TargetHeatingCoolingState.HEAT:
                mode = 'heat';
                break;
            case this.Characteristic.TargetHeatingCoolingState.COOL:
                mode = 'cool';
                break;
            case this.Characteristic.TargetHeatingCoolingState.AUTO:
                mode = 'auto';
                break;
            case this.Characteristic.TargetHeatingCoolingState.OFF:
                mode = 'off';
                break;
        }
        const payload = {
            commands: {
                mode: mode
            }
        };
        await axios.put('https://app2.keyless.rocks/api/devices/thermostat-device-id', payload, {
            headers: { authorization: `${this.token}` }
        });
    }

    async handleCurrentHeatingCoolingState() {
        const response = await this.getStatus();
        const operatingState = response.operatingState;
        switch (operatingState) {
            case 'Off':
                return this.Characteristic.CurrentHeatingCoolingState.OFF;
            case 'Heating':
                return this.Characteristic.CurrentHeatingCoolingState.HEAT;
            case 'Cooling':
                return this.Characteristic.CurrentHeatingCoolingState.COOL;
            default:
                throw new Error('Invalid mode');
        }
    }


    async getStatus() {
        await this.login();
        const response = await axios.get('https://app2.keyless.rocks/api/devices/thermostat-device-id', {
            headers: { authorization: `${this.token}` }
        });
        return {
            roomTemp: response.data.status.room_temp,
            coolingSetpoint: response.data.status.cooling_setpoint,
            heatingSetpoint: response.data.status.heating_setpoint,
            currentMode: response.data.status.mode,
            operatingState: response.data.status.operating_state
        };
    }
}
