# FROM jrei/systemd-ubuntu:latest
FROM ubuntu:latest

ENV DEBIAN_FRONTEND noninteractive
ENV FONT_DIR=/usr/share/fonts/noto

RUN /usr/bin/apt-get update \
    && /usr/bin/apt-get upgrade -y \
    && /usr/bin/apt-get install -y \
    xvfb \
    ffmpeg \
    xdotool \
    socat \
    curl \
    wget \
    unzip \
    gnupg \
    dbus-x11         \
    dbus \
    rtkit            \
    pipewire pulseaudio \
    pipewire-audio-client-libraries \
    pipewire-pulse \
    wireplumber pipewire-media-session- \
    pamix \
    alsa-utils \
    debhelper-compat \
    findutils        \
    git              \
    libasound2-dev   \
    libdbus-1-dev    \
    libglib2.0-dev   \
    libsbc-dev       \
    libsdl2-dev      \
    libudev-dev      \
    libva-dev        \
    libv4l-dev       \
    libx11-dev       \
    ninja-build      \
    pkg-config       \
    python3-docutils \
    python3-pip      \
    meson            \
    gconf-service libasound2 libatk1.0-0 libc6 \
    libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
    libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 \
    libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    ca-certificates fonts-liberation libappindicator1 libnss3 

# Install emoji's
RUN mkdir -p $FONT_DIR
RUN cd $FONT_DIR &&\
    wget https://github.com/emojione/emojione-assets/releases/download/3.1.2/emojione-android.ttf &&\
    fc-cache -f -v

# Build PipeWire
# ARG PW_VERSION=0.3.60
# ENV PW_ARCHIVE_URL="https://gitlab.freedesktop.org/pipewire/pipewire/-/archive"
# ENV PW_TAR_FILE="pipewire-${PW_VERSION}.tar"
# ENV PW_TAR_URL="${PW_ARCHIVE_URL}/${PW_VERSION}/${PW_TAR_FILE}"

# ENV BUILD_DIR_BASE="/root"
# ENV BUILD_DIR="${BUILD_DIR_BASE}/build-$PW_VERSION"

# RUN curl -LJO $PW_TAR_URL \
#     && tar -C $BUILD_DIR_BASE -xvf $PW_TAR_FILE

# RUN cd $BUILD_DIR_BASE/pipewire-${PW_VERSION} \
#     && meson setup $BUILD_DIR \
#     && meson configure $BUILD_DIR -Dprefix=/usr \
#     && meson compile -C $BUILD_DIR \
#     && meson install -C $BUILD_DIR

# Install node
# RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
#     && apt-get install -y nodejs \
#     && npm install -g yarn
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=20
# not used, just bump to re-image docker
ENV NODE_MINOR=8 
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && apt-get install nodejs -y
RUN npm install -g yarn

# RUN export uid=1000 gid=1000 && \
#     mkdir -p /home/node && \
#     echo "node:x:${uid}:${gid}:Node,,,:/home/node:/bin/bash" >> /etc/passwd && \
#     echo "node:x:${uid}:" >> /etc/group && \
#     echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && \
#     chmod 0440 /etc/sudoers.d/node && \
#     chown ${uid}:${gid} -R /home/node

# Install Chrome
RUN apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list.d/google.list
RUN apt-get update && apt-get install -y google-chrome-stable
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

COPY ["package.json","yarn.lock", "./"]
# ENV PUPPETEER_PRODUCT=firefox
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
RUN yarn install
COPY ["app.mjs", "./"]
COPY ["app-scripts", "./app-scripts"]
COPY ["preload.js", "./"]
COPY ["chrome/block-policy.json", "chrome/allow-policy.json", "/etc/opt/chrome/policies/managed/"]
COPY ["run.sh", "/"]
COPY ["modules.conf", "/etc/modules-load.d/"]
# WORKDIR /root
ENV XDG_RUNTIME_DIR=/tmp
# ENV PULSE_SERVER=$XDG_RUNTIME_DIR/pulse/native
COPY ["pipewire.conf", "/etc/pipewire/"]
COPY ["pipewire-pulse.conf", "/etc/pipewire/"]
COPY ["wireplumber.conf", "/etc/wireplumber/"]
ENV WIREPLUMBER_CONFIG_DIR=/etc/wireplumber
# ENV PIPEWIRE_RUNTIME_DIR=/root
# ENV PULSE_RUNTIME_DIR=$XDG_RUNTIME_DIR/pulse
# COPY ["pulse/default.pa","$PULSE_RUNTIME_DIR"]
ENV DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"
RUN adduser root pulse-access
RUN mkdir -p /dev/snd 
RUN chmod +x /run.sh
# USER node
ENTRYPOINT  ["/run.sh"]
