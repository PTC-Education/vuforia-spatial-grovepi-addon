# vuforia-spatial-grovepi-addon

This repoository contains a hardware interface for the [GrovePi shield](https://www.dexterindustries.com/grovepi/). If you have [installed the Vuforia Spatial Edge Server on a Raspberry Pi with these instructions](https://spatialtoolbox.vuforia.com/docs/vuforia-spatial-edge-server/raspberry-pi), you should be able to install this repo into your addons folder and be ready to use the GrovePi.

## Read First
The Vuforia Spatial Toolbox and Vuforia Spatial Edge Server make up a shared research platform for exploring spatial computing as a community. This research platform is not an out of the box production-ready enterprise solution. Please read the [MPL 2.0 license](LICENSE) before use.

Join the conversations in our [discourse forum](https://forum.spatialtoolbox.vuforia.com) if you have questions, ideas want to collaborate or just say hi.

## Supported hardware

- [Philips Hue](./interfaces/philipsHue/README.md)
- Arduino: Documentation coming soon
- LEGO WeDo / Boost: Activate the Hardware interface and push the green button on your Lego Wedo / Boost.

## Install
Once you have installed the Vuforia Spatial Edge Server, clone this repo into the ```addons``` folder

```bash
cd addons
git clone https://github.com/ptc-education/vuforia-spatial-grovepi-addon.git
```

Next, enter the vuforia-spatial-basic-interfaces-addon directory and install all dependencies.

```bash
cd vuforia-spatial-basic-interfaces-addon
npm install
```

## Prerequisites (for compiling the dependencies)

#### OS X

 * Install [Xcode](https://itunes.apple.com/ca/app/xcode/id497799835?mt=12)
 
 #### Windows

```cmd
npm install --global --production windows-build-tools
```
 
##### Ubuntu, Debian, Raspbian

```sh
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```
