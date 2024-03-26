#!/bin/bash

export SCREEN_RESOLUTION=1280x720
export COLOR_DEPTH=24
X_SERVER_NUM=99
USE_PIPEWIRE=0

export DISABLE_RTKIT=y


export DISPLAY=:${X_SERVER_NUM}.0

# Start X11 virtual framebuffer so the browser will have somewhere to draw
Xvfb :${X_SERVER_NUM} -ac -screen 0 ${SCREEN_RESOLUTION}x${COLOR_DEPTH} -nolisten tcp -nolisten unix > /dev/null 2>&1 &

# Start PulseAudio server so browser will have somewhere to which to send audio 
# Add a user to the pulse-access group
rm -rf /var/run/pulse /var/lib/pulse /root/.config/pulse /tmp/pulse
# mkdir -p /run/dbus
echo Should I use pipewire? ${USE_PIPEWIRE}
if [ "${USE_PIPEWIRE}" == 1 ]
then
    # Start Pipewire

    # dbus-daemon --system --fork
    # export $(dbus-launch)
    # export DBUS_SESSION_BUS_ADDRESS=$(dbus-daemon --system --fork --print-address)
    # dbus-daemon --system --fork --print-address
    # echo ${DBUS_SESSION_BUS_ADDRESS}
    # mkdir -p /dev/snd
    mkdir -p /var/run/pulse
    EXPORT PIPEWIRE_RUNTIME_DIR=/var/run/pulse
    EXPORT PULSE_SERVER=${PIPEWIRE_RUNTIME_DIR}/native
    echo "Starting Pipewire"
    pipewire &
    echo "Starting Wireplumber"
    wireplumber &
    echo "Starting Pipewire Pulse"
    pipewire-pulse &
else
    echo "Starting Pulse Audio"
    pulseaudio -D --realtime=1 --verbose --exit-idle-time=-1 --system --disallow-exit -vvvv --log-target=newfile:/tmp/pulseverbose.log --log-time=1
fi

# sleep 2  # Ensure pulseaudio has started before moving on




# sleep 2  # Ensure display has started before moving on


# Create a virtual audio source; fixed by adding source master and format
echo "Creating virtual audio sources: ";
# pactl load-module module-virtual-source master=auto_null.monitor rate=48000 channels=2 format=s16le source_name=VirtualCableA

## Channel A : For RTMP stream (out) via FFMPEG
pactl load-module module-null-sink sink_name=virtual-cable-a sink_properties=device.description=VirtualCableA_Speaker rate=48000 channels=2 format=s16le
pactl load-module module-remap-source source_name=virtual-cable-a-mic master=virtual-cable-a.monitor source_properties=device.description=VirtualCableA_Microphone

## Channel B : For browser WebRTC
pactl load-module module-null-sink sink_name=virtual-cable-b sink_properties=device.description=VirtualCableB_Speaker rate=48000 channels=2 format=s16le
pactl load-module module-remap-source source_name=virtual-cable-b-mic master=virtual-cable-b.monitor source_properties=device.description=VirtualCableB_Microphone

## Channel C : Spare channel
pactl load-module module-null-sink sink_name=virtual-cable-c sink_properties=device.description=VirtualCableC_Speaker rate=48000 channels=2 format=s16le
pactl load-module module-remap-source source_name=virtual-cable-c-mic master=virtual-cable-c.monitor source_properties=device.description=VirtualCableC_Microphone

## Channel C : Spare channel
pactl load-module module-null-sink sink_name=virtual-cable-c sink_properties=device.description=VirtualCableC_Speaker rate=48000 channels=2 format=s16le
pactl load-module module-remap-source source_name=virtual-cable-c-mic master=virtual-cable-c.monitor source_properties=device.description=VirtualCableC_Microphone

# # loopback setup like a crossover cable
# pactl load-module module-loopback source=virtual-cable-a.monitor sink=virtual-cable-b
# pactl load-module module-loopback source=virtual-cable-b.monitor sink=virtual-cable-a

pactl set-default-sink virtual-cable-c
pactl set-default-source virtual-cable-a-mic

# pactl load-module module-loopback latency_msec=1 source=virtual-cable-a.monitor sink=virtual-cable-b

pactl info
pactl list sources
wpctl status

# virtual webcam -requires kernel module
# sudo modprobe v4l2loopback

#Display IP address
hostname --ip-address

yarn start --silent
