# Homebridge Rently Thermostat Plugin

This Homebridge plugin allows you to control your thermostat controled the Rently app using HomeKit.

## Completion

**This plugin is still in development.**

## Features

- Seamless thermostat integration with the HomeKit
- Control your thermostat directly from the Home app

## Installation

To install the plugin, use the following command:

- Add this directory to /var/lib/homebridge/node_modules on your HomeBridge device.
- Update the config file as described below in **Basic Configuration**

## Basic Configuration

To configure the plugin, you need to use your email and password for the Rently app. Add the following configuration to the Homebridge Config Editor:

```json
{
  "accessories": [
    {
      "accessory": "Thermostat",
      "name": "My Thermostat",
      "email": "your-email@email.com",
      "password": "your-password"
    }
  ]
}
```

Replace `"your-email@email.com"` and `"your-password"` with your actual Rently app email and password.

## Usage

Once configured, you can control your thermostat using the Home app on your iOS device. Adjust the temperature, set to Off, Cool, Heat or Auto, and monitor your home's climate with ease.

## TODO List

- [ ] Fetch the thermostat device ID automatically
- [ ] Publish the plugin to npm
- [ ] Add support for multiple thermostats
- [ ] Improve error handling and logging
- [ ] Add unit tests

## Contributing

We welcome contributions! Please fork the repository and submit pull requests with your improvements.

## License

This project is licensed under the MIT License.

---

Feel free to reach out if you have any questions or need further assistance. Enjoy controlling your thermostat with Homebridge and the Rently app!
